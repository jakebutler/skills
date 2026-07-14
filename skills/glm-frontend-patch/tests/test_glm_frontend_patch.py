import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock


SCRIPT = Path(__file__).parents[1] / "scripts" / "glm_frontend_patch.py"
SPEC = importlib.util.spec_from_file_location("glm_frontend_patch", SCRIPT)
runner = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules[SPEC.name] = runner
SPEC.loader.exec_module(runner)


def packet(**overrides):
    value = {
        "version": 1,
        "goal": "Update the status card",
        "read_files": ["index.html"],
        "write_files": ["index.html"],
        "acceptance_criteria": ["Status is visible"],
        "design_constraints": ["No dependencies"],
        "avoid": ["Do not change unrelated content"],
        "verification_commands": ["python3 -m unittest"],
    }
    value.update(overrides)
    return value


class PacketTests(unittest.TestCase):
    def test_rejects_unknown_fields(self):
        with self.assertRaisesRegex(runner.RunnerError, "Unknown packet fields"):
            runner.validate_packet(packet(typo=True))

    def test_rejects_secret_and_traversal_paths(self):
        for unsafe in ("../outside", ".env", "config/private.key", ".git/config"):
            with self.subTest(unsafe=unsafe):
                with self.assertRaises(runner.RunnerError):
                    runner.validate_relative_path(unsafe)

    def test_existing_write_file_must_be_readable(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory)
            (target / "index.html").write_text("old", encoding="utf-8")
            value = runner.validate_packet(packet(read_files=[]))
            with self.assertRaisesRegex(runner.RunnerError, "must also appear"):
                runner.read_context(value, target)

    def test_rejects_symlink_escape(self):
        with tempfile.TemporaryDirectory() as directory, tempfile.TemporaryDirectory() as outside:
            target = Path(directory)
            (target / "link").symlink_to(Path(outside), target_is_directory=True)
            with self.assertRaisesRegex(runner.RunnerError, "escapes target"):
                runner.safe_path(target, "link/new.html", must_exist=False)

    def test_rejects_credential_redirect_without_explicit_override(self):
        with self.assertRaisesRegex(runner.RunnerError, "non-Z.ai host"):
            runner.validate_provider_url("https://example.com/chat", allow_custom=False)
        runner.validate_provider_url("https://example.com/chat", allow_custom=True)


class ResponseTests(unittest.TestCase):
    def test_parses_exact_allowlisted_files(self):
        response = (
            '<<<AI_OS_FILE path="index.html">>>\n'
            '<main>ready</main>\n'
            '<<<AI_OS_END_FILE>>>\n'
            '<<<AI_OS_END_RESPONSE>>>\n'
        )
        self.assertEqual(
            runner.parse_response(response, ("index.html",)),
            {"index.html": "<main>ready</main>\n"},
        )

    def test_rejects_extra_or_missing_files(self):
        extra = (
            '<<<AI_OS_FILE path="other.html">>>\nno\n<<<AI_OS_END_FILE>>>\n'
            '<<<AI_OS_END_RESPONSE>>>\n'
        )
        with self.assertRaisesRegex(runner.RunnerError, "out-of-scope"):
            runner.parse_response(extra, ("index.html",))
        missing = "<<<AI_OS_END_RESPONSE>>>\n"
        with self.assertRaisesRegex(runner.RunnerError, "omitted"):
            runner.parse_response(missing, ("index.html",))


class GenerationTests(unittest.TestCase):
    def test_continues_from_accumulated_checkpoint(self):
        calls = []

        def fake_stream(**kwargs):
            calls.append(kwargs["messages"])
            if len(calls) == 1:
                yield '<<<AI_OS_FILE path="index.html">>>\npartial'
            else:
                yield '\n<<<AI_OS_END_FILE>>>\n<<<AI_OS_END_RESPONSE>>>\n'

        with mock.patch.object(runner, "stream_completion", side_effect=fake_stream):
            result = runner.generate(
                messages=[{"role": "system", "content": "rules"}],
                url=runner.DEFAULT_URL,
                api_key="test-key",
                model=runner.DEFAULT_MODEL,
                timeout=1,
                max_continuations=2,
                max_seconds=10,
                heartbeat_seconds=10,
            )
        self.assertEqual(result.continuations, 1)
        self.assertEqual(result.retries, 0)
        self.assertEqual(calls[1][-2]["role"], "assistant")
        self.assertEqual(calls[1][-2]["content"], calls[0] and '<<<AI_OS_FILE path="index.html">>>\npartial')

    def test_retries_one_transient_failure(self):
        attempts = 0

        def fake_stream(**kwargs):
            nonlocal attempts
            attempts += 1
            if attempts == 1:
                raise runner.TransientProviderError("temporary")
            yield "<<<AI_OS_END_RESPONSE>>>\n"

        with mock.patch.object(runner, "stream_completion", side_effect=fake_stream):
            result = runner.generate(
                messages=[],
                url=runner.DEFAULT_URL,
                api_key="test-key",
                model=runner.DEFAULT_MODEL,
                timeout=1,
                max_continuations=0,
                max_seconds=10,
                heartbeat_seconds=10,
            )
        self.assertEqual(result.retries, 1)
        self.assertEqual(attempts, 2)

    def test_deadline_marks_provider_unavailable_and_checkpoints_partial(self):
        checkpoints = []

        def fake_stream(**kwargs):
            yield "partial"

        with mock.patch.object(runner, "stream_completion", side_effect=fake_stream):
            with self.assertRaisesRegex(runner.ProviderUnavailable, "route deadline"):
                runner.generate(
                    messages=[],
                    url=runner.DEFAULT_URL,
                    api_key="test-key",
                    model=runner.DEFAULT_MODEL,
                    timeout=1,
                    max_continuations=0,
                    max_seconds=0,
                    heartbeat_seconds=10,
                    checkpoint_callback=lambda response, continuations, retries: checkpoints.append(response),
                )
        self.assertEqual(checkpoints, ["partial"])


class CliTests(unittest.TestCase):
    def test_preview_does_not_mutate_and_apply_does(self):
        response = (
            '<<<AI_OS_FILE path="index.html">>>\nnew\n<<<AI_OS_END_FILE>>>\n'
            '<<<AI_OS_END_RESPONSE>>>\n'
        )
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            target = root / "target"
            target.mkdir()
            (target / "index.html").write_text("old", encoding="utf-8")
            packet_path = root / "packet.json"
            packet_path.write_text(json.dumps(packet()), encoding="utf-8")
            response_path = root / "response.txt"
            response_path.write_text(response, encoding="utf-8")
            artifacts = root / "artifacts"
            code = runner.main(
                [
                    "--packet", str(packet_path),
                    "--target", str(target),
                    "--response-file", str(response_path),
                    "--artifact-root", str(artifacts),
                ]
            )
            self.assertEqual(code, 0)
            self.assertEqual((target / "index.html").read_text(), "old")
            code = runner.main(
                [
                    "--packet", str(packet_path),
                    "--target", str(target),
                    "--response-file", str(response_path),
                    "--artifact-root", str(artifacts),
                    "--apply",
                ]
            )
            self.assertEqual(code, 0)
            self.assertEqual((target / "index.html").read_text(), "new\n")
            manifests = [json.loads(path.read_text()) for path in artifacts.glob("*/run.json")]
            self.assertIn(["index.html"], [item["files_changed"] for item in manifests])


if __name__ == "__main__":
    unittest.main()
