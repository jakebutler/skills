import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { prepareNativeBuilderArm } from "../../scripts/prepare-native-builder-arm.mjs";
import { finalizeNativeBuilderArm } from "../../scripts/finalize-native-builder-arm.mjs";

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "native-builder-arm-"));
const repository = path.join(scratch, "repository");
const evidence = path.join(scratch, "evidence");
fs.mkdirSync(repository);
const git = (...args) => execFileSync("git", ["-C", repository, ...args], { encoding: "utf8" }).trim();
git("init", "-q");
git("config", "user.email", "fixture@example.com");
git("config", "user.name", "Native fixture");
fs.writeFileSync(path.join(repository, "allowed.txt"), "before\n");
fs.writeFileSync(path.join(repository, ".gitignore"), "ignored.txt\n");
git("add", ".");
git("commit", "-qm", "baseline");
const baseline = git("rev-parse", "HEAD");
const promptPath = path.join(scratch, "prompt.md");
fs.writeFileSync(promptPath, "Change allowed.txt to after.\n");
const checkMutationFlag = path.join(scratch, "mutate-during-check");
const evaluatorPath = path.join(scratch, "evaluator.mjs");
const evaluatorSource = `#!/usr/bin/env node\nimport fs from "node:fs";\nimport path from "node:path";\nif (fs.existsSync(${JSON.stringify(checkMutationFlag)})) fs.writeFileSync(path.join(process.cwd(), "post-check-outside.txt"), "mutated\\n");\nprocess.exit(0);\n`;
fs.writeFileSync(evaluatorPath, evaluatorSource, { mode: 0o755 });

function config(overrides = {}) {
  return {
    schema_version: 1,
    experiment_id: "native-fixture",
    arm_id: "sol-a",
    run_nonce: "native-fixture-run-001",
    model: "gpt-5.6-sol",
    reasoning_effort: "high",
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
    ...overrides,
  };
}

function sha256(value) {
  return `sha256:${crypto.createHash("sha256").update(value).digest("hex")}`;
}

function workingStateSha256(paths) {
  const rows = paths.map((relative) => {
    const target = path.join(repository, relative);
    if (!fs.existsSync(target)) return `${relative}\0deleted`;
    const stat = fs.lstatSync(target);
    const content = stat.isSymbolicLink() ? Buffer.from(fs.readlinkSync(target)) : fs.readFileSync(target);
    return `${relative}\0${stat.mode.toString(8)}\0${sha256(content)}`;
  });
  return sha256(rows.join("\n"));
}

async function prepare(overrides = {}) {
  const value = config(overrides);
  const configPath = path.join(scratch, `config-${crypto.randomUUID()}.json`);
  fs.writeFileSync(configPath, `${JSON.stringify(value, null, 2)}\n`);
  const expectedConfigSha256 = `sha256:${crypto.createHash("sha256").update(fs.readFileSync(configPath)).digest("hex")}`;
  return prepareNativeBuilderArm(configPath, expectedConfigSha256);
}

await assert.rejects(
  () => prepare({ model: "gpt-5.6-sol-high" }),
  /native model must be gpt-5\.6-sol/i,
);
await assert.rejects(
  () => prepare({ reasoning_effort: "medium" }),
  /reasoning effort must be high/i,
);

const prepared = await prepare();
assert.equal(prepared.packet.model, "gpt-5.6-sol");
assert.equal(prepared.packet.reasoning_effort, "high");
assert.match(prepared.invocation_packet_sha256, /^sha256:[a-f0-9]{64}$/);
assert.equal(fs.existsSync(prepared.invocation_packet_path), true);
assert.match(prepared.worker_packet_sha256, /^sha256:[a-f0-9]{64}$/, "prepare must emit a source-bound worker packet");
assert.equal(fs.existsSync(prepared.worker_packet_path), true);
assert.equal("held_out_checks" in prepared.worker_packet, false, "worker packet must not expose held-out checks");
assert.equal("evidence_directory" in prepared.worker_packet, false, "worker packet must not expose root evidence paths");
assert.equal(Buffer.from(prepared.worker_packet.prompt_base64, "base64").toString("utf8"), "Change allowed.txt to after.\n");

async function finalize(attestation) {
  const attestationPath = path.join(scratch, `attestation-${crypto.randomUUID()}.json`);
  fs.writeFileSync(attestationPath, `${JSON.stringify(attestation, null, 2)}\n`);
  const attestationSha256 = `sha256:${crypto.createHash("sha256").update(fs.readFileSync(attestationPath)).digest("hex")}`;
  return finalizeNativeBuilderArm(
    prepared.invocation_packet_path,
    prepared.invocation_packet_sha256,
    attestationPath,
    attestationSha256,
  );
}

await assert.rejects(
  () => finalize({
    schema_version: 1,
    attestation_type: "codex-collaboration-subagent-builder-attestation-v1",
    invocation_packet_sha256: prepared.invocation_packet_sha256,
    model: "gpt-5.6-sol-high",
    reasoning_effort: "high",
  }),
  /attested native model must be gpt-5\.6-sol/i,
);

await assert.rejects(
  () => finalize({
    schema_version: 1,
    attestation_type: "codex-collaboration-subagent-builder-attestation-v1",
    producer_version: "native-codex-producer-v1",
    finalizer_version: "native-codex-finalizer-v1",
    invocation_packet_sha256: prepared.invocation_packet_sha256,
    invocation_id: prepared.packet.invocation_id,
    experiment_id: prepared.packet.experiment_id,
    arm_id: prepared.packet.arm_id,
    run_nonce: prepared.packet.run_nonce,
    canonical_task: "/root/native_fixture",
    run_id: "fixture-run-001",
    model: "gpt-5.6-sol",
    reasoning_effort: "high",
    execution_surface: "codex-collaboration-subagent",
    status: "completed",
  }),
  /completion evidence hash is required/i,
);

fs.writeFileSync(path.join(repository, "allowed.txt"), "after\n");
const completionPath = path.join(scratch, "completion-evidence.json");
const controlsSha256 = sha256(Buffer.from(JSON.stringify({
  allowed_paths: prepared.packet.allowed_paths,
  allowed_ignored_paths: prepared.packet.allowed_ignored_paths,
  environment_names: prepared.packet.environment_names,
  timeout_ms: prepared.packet.timeout_ms,
  check_timeout_ms: prepared.packet.check_timeout_ms,
  intervention_budget: prepared.packet.intervention_budget,
  remediation_generation_budget: prepared.packet.remediation_generation_budget,
  visible_checks: prepared.packet.visible_checks,
  held_out_checks: prepared.packet.held_out_checks,
  execution_manifest_sha256: prepared.packet.execution_manifest_sha256,
  environment_sha256: prepared.packet.environment_sha256,
})));
const completion = {
  schema_version: 1,
  evidence_type: "codex-collaboration-subagent-completion-v1",
  invocation_packet_sha256: prepared.invocation_packet_sha256,
  invocation_id: prepared.packet.invocation_id,
  experiment_id: prepared.packet.experiment_id,
  arm_id: prepared.packet.arm_id,
  canonical_task: "/root/native_fixture",
  run_id: "fixture-run-001",
  model: "gpt-5.6-sol",
  reasoning_effort: "high",
  status: "completed",
  controls_sha256: controlsSha256,
  worker_packet_sha256: prepared.worker_packet_sha256,
  observed_prompt_sha256: prepared.packet.prompt_sha256,
  changed_paths: ["allowed.txt"],
  observed_working_state_sha256: workingStateSha256(["allowed.txt"]),
  returned_completion: "Fixture edit completed.",
};
fs.writeFileSync(completionPath, `${JSON.stringify(completion, null, 2)}\n`);
const completionSha256 = sha256(fs.readFileSync(completionPath));
const attestation = {
  schema_version: 1,
  attestation_type: "codex-collaboration-subagent-builder-attestation-v1",
  producer_version: "native-codex-producer-v1",
  finalizer_version: "native-codex-finalizer-v1",
  invocation_packet_sha256: prepared.invocation_packet_sha256,
  invocation_id: prepared.packet.invocation_id,
  experiment_id: prepared.packet.experiment_id,
  arm_id: prepared.packet.arm_id,
  run_nonce: prepared.packet.run_nonce,
  canonical_task: completion.canonical_task,
  run_id: completion.run_id,
  model: completion.model,
  reasoning_effort: completion.reasoning_effort,
  execution_surface: "codex-collaboration-subagent",
  platform_version: "codex-collaboration-tool",
  status: "completed",
  agent_timed_out: false,
  started_at: "2026-07-20T00:00:00.000Z",
  finished_at: "2026-07-20T00:00:01.000Z",
  repository: prepared.packet.repository,
  baseline_commit: prepared.packet.baseline_commit,
  baseline_tree: prepared.packet.baseline_tree,
  start_head: prepared.packet.start_head,
  end_head: prepared.packet.start_head,
  start_index_tree: prepared.packet.start_index_tree,
  end_index_tree: prepared.packet.start_index_tree,
  start_ref: prepared.packet.start_ref,
  end_ref: prepared.packet.start_ref,
  start_ref_target: prepared.packet.start_ref_target,
  end_ref_target: prepared.packet.start_ref_target,
  start_status_sha256: prepared.packet.start_status_sha256,
  prompt_sha256: prepared.packet.prompt_sha256,
  runner_config_sha256: prepared.packet.runner_config_sha256,
  controls_sha256: controlsSha256,
  worker_packet_sha256: prepared.worker_packet_sha256,
  observed_prompt_sha256: prepared.packet.prompt_sha256,
  completion_evidence_path: completionPath,
  completion_evidence_sha256: completionSha256,
  intervention_events: [],
  manual_edits: false,
};

fs.writeFileSync(evaluatorPath, `${evaluatorSource}\n// drift\n`, { mode: 0o755 });
await assert.rejects(() => finalize(attestation), /evaluator|execution manifest|content identity/i);
fs.writeFileSync(evaluatorPath, evaluatorSource, { mode: 0o755 });

const copiedPacketPath = path.join(scratch, "copied-native-invocation-packet.json");
fs.copyFileSync(prepared.invocation_packet_path, copiedPacketPath);
await assert.rejects(
  () => finalizeNativeBuilderArm(
    copiedPacketPath,
    prepared.invocation_packet_sha256,
    (() => {
      const target = path.join(scratch, "copied-packet-attestation.json");
      fs.writeFileSync(target, `${JSON.stringify(attestation, null, 2)}\n`);
      return target;
    })(),
    (() => {
      const bytes = Buffer.from(`${JSON.stringify(attestation, null, 2)}\n`);
      return sha256(bytes);
    })(),
  ),
  /invocation packet path/i,
);

await assert.rejects(
  () => finalize({ ...attestation, producer_version: "native-codex-producer-v0" }),
  /producer_version/i,
);

for (const [label, mutation] of [
  ["experiment", { experiment_id: "other-experiment" }],
  ["worktree", { repository: path.join(scratch, "other-repository") }],
  ["prompt", { prompt_sha256: `sha256:${"1".repeat(64)}` }],
  ["baseline", { baseline_commit: "1".repeat(40) }],
  ["config", { runner_config_sha256: `sha256:${"2".repeat(64)}` }],
]) {
  await assert.rejects(
    () => finalize({ ...attestation, ...mutation }),
    /does not match the invocation packet/i,
    `${label} cross-wiring unexpectedly passed`,
  );
}

await assert.rejects(
  () => finalize({ ...attestation, completion_evidence_sha256: `sha256:${"3".repeat(64)}` }),
  /completion evidence hash mismatch/i,
);
await assert.rejects(
  () => finalize({ ...attestation, status: "failed" }),
  /failed or timeout native run/i,
);
await assert.rejects(
  () => finalize({ ...attestation, agent_timed_out: true }),
  /failed or timeout native run/i,
);
await assert.rejects(
  () => finalize({ ...attestation, intervention_events: [{ type: "manual-edit", detail: "operator changed output" }] }),
  /interventions exceed the approved budget/i,
);
await assert.rejects(
  () => finalize({ ...attestation, manual_edits: true }),
  /manual edits/i,
);

fs.writeFileSync(path.join(repository, "outside.txt"), "unexpected\n");
await assert.rejects(() => finalize(attestation), /outside allowed paths/i);
fs.rmSync(path.join(repository, "outside.txt"));

fs.writeFileSync(path.join(repository, "ignored.txt"), "drift\n");
await assert.rejects(() => finalize(attestation), /ignored-file state/i);
fs.rmSync(path.join(repository, "ignored.txt"));

git("add", "allowed.txt");
await assert.rejects(() => finalize(attestation), /end_index_tree|Git index/i);
git("reset", "-q", prepared.packet.baseline_commit);

git("add", "allowed.txt");
git("commit", "-qm", "forbidden native commit");
await assert.rejects(() => finalize(attestation), /end_head|moved HEAD/i);
git("reset", "-q", prepared.packet.baseline_commit);

const startBranch = prepared.packet.start_ref.replace("refs/heads/", "");
git("checkout", "-qb", "native-fixture-other-ref");
await assert.rejects(() => finalize(attestation), /end_ref|checked-out ref/i);
git("checkout", "-q", startBranch);
git("branch", "-D", "native-fixture-other-ref");

fs.writeFileSync(path.join(repository, "allowed.txt"), "manual-after-agent\n");
await assert.rejects(() => finalize(attestation), /observed_working_state_sha256/i);
fs.writeFileSync(path.join(repository, "allowed.txt"), "after\n");

fs.writeFileSync(promptPath, "swapped prompt bytes\n");
await assert.rejects(() => finalize(attestation), /prompt.*changed|prompt.*identity/i);
fs.writeFileSync(promptPath, "Change allowed.txt to after.\n");

fs.writeFileSync(checkMutationFlag, "trigger\n");
await assert.rejects(() => finalize(attestation), /check.*mutat|outside allowed paths|post-check/i);
fs.rmSync(checkMutationFlag);
fs.rmSync(path.join(repository, "post-check-outside.txt"), { force: true });

const result = await finalize(attestation);
assert.equal(result.status, "completed");
assert.equal(result.native_run_id, "fixture-run-001");
assert.equal(result.changed_paths[0], "allowed.txt");
assert.equal(result.visible_checks[0].status, 0);
assert.equal(result.held_out_checks[0].status, 0);
await assert.rejects(() => finalize(attestation), /already been finalized/i);

console.log("native builder arm fixtures passed");
