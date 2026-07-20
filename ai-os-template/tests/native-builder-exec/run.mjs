import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { prepareNativeBuilderArm } from "../../scripts/prepare-native-builder-arm.mjs";
import { resolveNativeCodexExecutable, runNativeBuilderExecution } from "../../scripts/run-native-builder-execution.mjs";
import { finalizeNativeBuilderArm } from "../../scripts/finalize-native-builder-arm.mjs";

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "native-builder-exec-"));

const nativeTargets = {
  "darwin:arm64": ["codex-darwin-arm64", "aarch64-apple-darwin"],
  "darwin:x64": ["codex-darwin-x64", "x86_64-apple-darwin"],
  "linux:arm64": ["codex-linux-arm64", "aarch64-unknown-linux-musl"],
  "linux:x64": ["codex-linux-x64", "x86_64-unknown-linux-musl"],
  "win32:arm64": ["codex-win32-arm64", "aarch64-pc-windows-msvc"],
  "win32:x64": ["codex-win32-x64", "x86_64-pc-windows-msvc"],
};
const [nativePackage, nativeTarget] = nativeTargets[`${process.platform}:${process.arch}`];
const fakePackageRoot = path.join(scratch, "codex-package");
const fakeLauncher = path.join(fakePackageRoot, "bin", "codex.js");
const fakeNative = path.join(fakePackageRoot, "node_modules", "@openai", nativePackage, "vendor", nativeTarget, "bin", process.platform === "win32" ? "codex.exe" : "codex");
fs.mkdirSync(path.dirname(fakeLauncher), { recursive: true });
fs.mkdirSync(path.dirname(fakeNative), { recursive: true });
fs.writeFileSync(fakeLauncher, "#!/usr/bin/env node\n", { mode: 0o755 });
fs.writeFileSync(fakeNative, "fixture native runtime\n", { mode: 0o755 });
assert.equal(resolveNativeCodexExecutable(fakeLauncher), fs.realpathSync(fakeNative));

const repository = path.join(scratch, "repository");
const evidence = path.join(scratch, "evidence");
fs.mkdirSync(repository);
const git = (...args) => execFileSync("git", ["-C", repository, ...args], { encoding: "utf8" }).trim();
git("init", "-q");
git("config", "user.email", "fixture@example.com");
git("config", "user.name", "Native exec fixture");
fs.writeFileSync(path.join(repository, "allowed.txt"), "before\n");
git("add", ".");
git("commit", "-qm", "baseline");
const baseline = git("rev-parse", "HEAD");
const promptPath = path.join(scratch, "prompt.md");
fs.writeFileSync(promptPath, "Change allowed.txt to after.\n");
const evaluatorPath = path.join(scratch, "evaluator.mjs");
fs.writeFileSync(evaluatorPath, "#!/usr/bin/env node\nprocess.exit(0);\n", { mode: 0o755 });
const configPath = path.join(scratch, "config.json");
const approvedCodexExecutablePath = fs.realpathSync(process.execPath);
const approvedCodexExecutableSha256 = `sha256:${crypto.createHash("sha256").update(fs.readFileSync(approvedCodexExecutablePath)).digest("hex")}`;
const config = {
  schema_version: 1,
  experiment_id: "native-exec-fixture",
  arm_id: "sol-a",
  run_nonce: "native-exec-run-001",
  model: "gpt-5.6-sol",
  reasoning_effort: "high",
  codex_executable_path: approvedCodexExecutablePath,
  codex_executable_sha256: approvedCodexExecutableSha256,
  codex_version: "codex-cli fixture",
  repository,
  baseline_commit: baseline,
  prompt_path: promptPath,
  allowed_paths: ["allowed.txt"],
  allowed_ignored_paths: [],
  output_directory: evidence,
  timeout_ms: 10_000,
  check_timeout_ms: 10_000,
  intervention_budget: 0,
  remediation_generation_budget: 1,
  visible_checks: [[evaluatorPath]],
  held_out_checks: [[evaluatorPath]],
};
fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
const configSha256 = `sha256:${crypto.createHash("sha256").update(fs.readFileSync(configPath)).digest("hex")}`;
const prepared = await prepareNativeBuilderArm(configPath, configSha256);

const fakeCodex = path.join(scratch, "fake-codex.mjs");
const nativeLaunchCountPath = path.join(scratch, "native-launch-count.log");
fs.writeFileSync(fakeCodex, `
import fs from "node:fs";
import path from "node:path";
if (process.argv.includes("features") && process.argv.includes("list")) {
  for (let index = 0; index < process.argv.length; index += 1) {
    if (process.argv[index] === "--disable") console.log(process.argv[index + 1] + " stable false");
  }
  process.exit(0);
}
if (process.argv.includes("sandbox")) {
  const permissive = process.env.PROOF_PROBE_ROOT_EVIDENCE.includes("permissive-capability");
  fs.writeFileSync(process.env.PROOF_PROBE_TMP_PATH, "probe\\n");
  for (const [label, status] of [
    ["workspace_read", 0],
    ["visible_command_read", 0],
    ["visible_executable_read", 0],
    ["held_out_executable_read", permissive ? 0 : 1],
    ["root_evidence_read", 1],
    ["tmp_write", 0],
    ["network_connect", 1],
    ["descendant_codex_agent", 1],
  ]) console.log(label + "\\t" + status);
  process.exit(0);
}
fs.appendFileSync(${JSON.stringify(nativeLaunchCountPath)}, "launch\\n");
let stdin = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => { stdin += chunk; });
process.stdin.on("end", () => {
  const workspace = process.argv[process.argv.indexOf("--cd") + 1];
  fs.writeFileSync(path.join(workspace, "allowed.txt"), "after\\n");
  console.log(JSON.stringify({ type: "thread.started", thread_id: "fixture-thread-001" }));
  console.log(JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: "Fixture native edit completed." } }));
  console.log(JSON.stringify({ type: "turn.completed", usage: { input_tokens: 10, output_tokens: 5 } }));
});
`);

const mismatchedConfigPath = path.join(scratch, "mismatched-config.json");
const mismatchedConfig = {
  ...config,
  arm_id: "sol-mismatched-runtime",
  run_nonce: "native-exec-mismatched-runtime-001",
  codex_executable_path: fs.realpathSync(fakeNative),
  codex_executable_sha256: `sha256:${crypto.createHash("sha256").update(fs.readFileSync(fakeNative)).digest("hex")}`,
};
fs.writeFileSync(mismatchedConfigPath, `${JSON.stringify(mismatchedConfig, null, 2)}\n`);
const mismatchedConfigSha256 = `sha256:${crypto.createHash("sha256").update(fs.readFileSync(mismatchedConfigPath)).digest("hex")}`;
const mismatchedPrepared = await prepareNativeBuilderArm(mismatchedConfigPath, mismatchedConfigSha256);
await assert.rejects(
  () => runNativeBuilderExecution(mismatchedPrepared.invocation_packet_path, mismatchedPrepared.invocation_packet_sha256, {
    codexExecutable: process.execPath,
    codexPrefixArgs: [fakeCodex],
    codexVersion: "codex-cli fixture",
  }),
  /approved Codex executable path/i,
);
assert.equal(fs.existsSync(nativeLaunchCountPath), false, "runtime identity mismatch must fail before model launch");

const permissiveConfigPath = path.join(scratch, "permissive-capability-config.json");
const permissiveConfig = {
  ...config,
  arm_id: "permissive-capability",
  run_nonce: "native-exec-permissive-capability-001",
};
fs.writeFileSync(permissiveConfigPath, `${JSON.stringify(permissiveConfig, null, 2)}\n`);
const permissiveConfigSha256 = `sha256:${crypto.createHash("sha256").update(fs.readFileSync(permissiveConfigPath)).digest("hex")}`;
const permissivePrepared = await prepareNativeBuilderArm(permissiveConfigPath, permissiveConfigSha256);
await assert.rejects(
  () => runNativeBuilderExecution(permissivePrepared.invocation_packet_path, permissivePrepared.invocation_packet_sha256, {
    codexExecutable: process.execPath,
    codexPrefixArgs: [fakeCodex],
    codexVersion: "codex-cli fixture",
  }),
  /capability probe failed: held_out_executable_read/i,
);
assert.equal(fs.existsSync(nativeLaunchCountPath), false, "permissive capability probe must fail before model launch");

const concurrentExecutions = await Promise.allSettled([
  runNativeBuilderExecution(prepared.invocation_packet_path, prepared.invocation_packet_sha256, {
    codexExecutable: process.execPath,
    codexPrefixArgs: [fakeCodex],
    codexVersion: "codex-cli fixture",
  }),
  runNativeBuilderExecution(prepared.invocation_packet_path, prepared.invocation_packet_sha256, {
    codexExecutable: process.execPath,
    codexPrefixArgs: [fakeCodex],
    codexVersion: "codex-cli fixture",
  }),
]);
const successfulExecutions = concurrentExecutions.filter((entry) => entry.status === "fulfilled");
assert.equal(successfulExecutions.length, 1, "exactly one concurrent native start may claim the run identity");
assert.equal(fs.readFileSync(nativeLaunchCountPath, "utf8"), "launch\n", "a losing concurrent native start must fail before model launch");
const execution = successfulExecutions[0].value;
const attestation = JSON.parse(fs.readFileSync(execution.attestation_path, "utf8"));
assert.equal(attestation.attestation_type, "codex-exec-builder-attestation-v4");
assert.equal(attestation.execution_surface, "codex-exec");
assert.equal(attestation.native_session_id, "fixture-thread-001");
assert.equal(attestation.multi_agent_enabled, false);
assert.equal(attestation.network_access, false);
assert.equal(attestation.writable_tmp, true);
assert.equal(attestation.sandbox_mode, "permission-profile");
assert.equal(attestation.permission_profile, "native-proof-builder");
assert.equal(attestation.filesystem_read_scope, "minimal+workspace+approved-toolchain");
assert.equal(attestation.worker_packet_delivery, "stdin-bytes");
assert.match(attestation.launch_contract_sha256, /^sha256:[a-f0-9]{64}$/);
assert.match(attestation.capability_probe_contract_sha256, /^sha256:[a-f0-9]{64}$/);
assert.match(attestation.capability_probe_evidence_sha256, /^sha256:[a-f0-9]{64}$/);
assert.equal(fs.existsSync(attestation.capability_probe_evidence_path), true);
const capabilityProbe = JSON.parse(fs.readFileSync(attestation.capability_probe_evidence_path, "utf8"));
assert.equal(capabilityProbe.observations.descendant_codex_agent.status, 1);
assert.equal(capabilityProbe.observations.held_out_executable_read.status, 1);
assert.equal(capabilityProbe.observations.root_evidence_read.status, 1);
assert.equal(capabilityProbe.passed, true);
assert.equal(fs.readFileSync(path.join(repository, "allowed.txt"), "utf8"), "after\n");
assert.equal(fs.existsSync(execution.completion_evidence_path), true);
assert.equal(fs.existsSync(execution.transcript_path), true);
assert.equal(fs.existsSync(execution.stderr_path), true);
assert.equal(fs.existsSync(execution.execution_claim_path), true);
assert.match(execution.execution_claim_sha256, /^sha256:[a-f0-9]{64}$/);
const result = await finalizeNativeBuilderArm(
  prepared.invocation_packet_path,
  prepared.invocation_packet_sha256,
  execution.attestation_path,
  execution.attestation_sha256,
);
assert.equal(result.status, "completed");
assert.equal(result.runner, "codex-exec-builder-v4");
assert.equal(result.native_session_id, "fixture-thread-001");
assert.equal(result.multi_agent_enabled, false);
assert.equal(fs.existsSync(result.execution_claim_path), true);
assert.equal(fs.existsSync(result.finalization_claim_path), true);

await assert.rejects(
  () => runNativeBuilderExecution(
    prepared.invocation_packet_path,
    prepared.invocation_packet_sha256,
    { codexExecutable: process.execPath, codexPrefixArgs: [fakeCodex], codexVersion: "codex-cli fixture" },
  ),
  /already produced execution evidence/i,
);

console.log("native builder Codex exec fixtures passed");
