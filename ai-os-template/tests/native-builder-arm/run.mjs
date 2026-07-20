import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { prepareNativeBuilderArm } from "../../scripts/prepare-native-builder-arm.mjs";
import { finalizeNativeBuilderArm } from "../../scripts/finalize-native-builder-arm.mjs";
import { nativeCodexCapabilityProbeContract, nativeCodexExecContract } from "../../scripts/native-codex-exec-contract.mjs";

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
const checkRunCountPath = path.join(scratch, "check-run-count.log");
const evaluatorPath = path.join(scratch, "evaluator.mjs");
const evaluatorSource = `#!/usr/bin/env node\nimport fs from "node:fs";\nimport path from "node:path";\nfs.appendFileSync(${JSON.stringify(checkRunCountPath)}, "check\\n");\nconst target = path.join(process.cwd(), "post-check-outside.txt");\nif (fs.existsSync(${JSON.stringify(checkMutationFlag)}) && process.argv[2] === "mutate") fs.writeFileSync(target, "mutated\\n");\nif (process.argv[2] === "restore") fs.rmSync(target, { force: true });\nprocess.exit(0);\n`;
fs.writeFileSync(evaluatorPath, evaluatorSource, { mode: 0o755 });
const approvedCodexExecutablePath = fs.realpathSync(process.execPath);
const approvedCodexExecutableSha256 = `sha256:${crypto.createHash("sha256").update(fs.readFileSync(approvedCodexExecutablePath)).digest("hex")}`;

function config(overrides = {}) {
  return {
    schema_version: 1,
    experiment_id: "native-fixture",
    arm_id: "sol-a",
    run_nonce: "native-fixture-run-001",
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
    visible_checks: [[evaluatorPath, "mutate"], [evaluatorPath, "restore"]],
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
await assert.rejects(
  () => prepare({
    arm_id: "missing-codex-identity",
    run_nonce: "missing-codex-identity-001",
    codex_executable_path: undefined,
    codex_executable_sha256: undefined,
    codex_version: undefined,
  }),
  /codex_executable_path is required/i,
);
await assert.rejects(
  () => prepare({ visible_checks: [["node", "--version"]] }),
  /visible_checks\[0\] executable must be an absolute external path/i,
);
await assert.rejects(
  () => prepare({ visible_checks: [[evaluatorPath, path.join(scratch, "visible-input.txt")]] }),
  /visible_checks\[0\]\[1\] must not expose an absolute path/i,
);

const symlinkEvidence = path.join(scratch, "symlink-evidence");
fs.symlinkSync(repository, symlinkEvidence, "dir");
await assert.rejects(
  () => prepare({ output_directory: symlinkEvidence, arm_id: "symlink-arm", run_nonce: "symlink-run-001" }),
  /output_directory.*outside|resolved.*inside.*repository/i,
);
assert.equal(
  fs.existsSync(path.join(repository, "symlink-arm")),
  false,
  "prepare must reject a symlink escape before writing inside the builder repository",
);

const prepared = await prepare();
assert.equal(prepared.packet.model, "gpt-5.6-sol");
assert.equal(prepared.packet.reasoning_effort, "high");
assert.equal(prepared.packet.codex_executable_path, approvedCodexExecutablePath);
assert.equal(prepared.packet.codex_executable_sha256, approvedCodexExecutableSha256);
assert.equal(prepared.packet.codex_version, "codex-cli fixture");
assert.match(prepared.invocation_packet_sha256, /^sha256:[a-f0-9]{64}$/);
assert.equal(fs.existsSync(prepared.invocation_packet_path), true);
assert.match(prepared.worker_packet_sha256, /^sha256:[a-f0-9]{64}$/, "prepare must emit a source-bound worker packet");
assert.equal(fs.existsSync(prepared.worker_packet_path), true);
assert.notEqual(
  path.dirname(prepared.worker_packet_path),
  path.dirname(prepared.invocation_packet_path),
  "worker capability material must not share a directory with root-only evidence",
);
assert.equal("held_out_checks" in prepared.worker_packet, false, "worker packet must not expose held-out checks");
assert.equal("evidence_directory" in prepared.worker_packet, false, "worker packet must not expose root evidence paths");
assert.equal(Buffer.from(prepared.worker_packet.prompt_base64, "base64").toString("utf8"), "Change allowed.txt to after.\n");
fs.writeFileSync(path.join(prepared.packet.evidence_directory, "native-execution-claim.json"), `${JSON.stringify({
  schema_version: 1,
  claim_type: "native-codex-execution-claim-v1",
  invocation_packet_sha256: prepared.invocation_packet_sha256,
  invocation_id: prepared.packet.invocation_id,
  experiment_id: prepared.packet.experiment_id,
  arm_id: prepared.packet.arm_id,
  run_nonce: prepared.packet.run_nonce,
}, null, 2)}\n`, { flag: "wx" });

async function finalize(attestation) {
  const attestationPath = path.join(prepared.packet.evidence_directory, "native-attestation.json");
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
    attestation_type: "codex-exec-builder-attestation-v4",
    invocation_packet_sha256: prepared.invocation_packet_sha256,
    model: "gpt-5.6-sol-high",
    reasoning_effort: "high",
  }),
  /attested native model must be gpt-5\.6-sol/i,
);

await assert.rejects(
  () => finalize({
    schema_version: 1,
    attestation_type: "codex-exec-builder-attestation-v4",
    producer_version: "native-codex-exec-producer-v4",
    finalizer_version: "native-codex-exec-finalizer-v4",
    invocation_packet_sha256: prepared.invocation_packet_sha256,
    invocation_id: prepared.packet.invocation_id,
    experiment_id: prepared.packet.experiment_id,
    arm_id: prepared.packet.arm_id,
    run_nonce: prepared.packet.run_nonce,
    native_session_id: "fixture-run-001",
    run_id: "fixture-run-001",
    model: "gpt-5.6-sol",
    reasoning_effort: "high",
    execution_surface: "codex-exec",
    status: "completed",
  }),
  /completion evidence hash is required/i,
);

fs.writeFileSync(path.join(repository, "allowed.txt"), "after\n");
const completionPath = path.join(prepared.packet.evidence_directory, "native-completion.json");
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
  evidence_type: "codex-exec-completion-v4",
  invocation_packet_sha256: prepared.invocation_packet_sha256,
  invocation_id: prepared.packet.invocation_id,
  experiment_id: prepared.packet.experiment_id,
  arm_id: prepared.packet.arm_id,
  native_session_id: "fixture-run-001",
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
const transcriptPath = path.join(prepared.packet.evidence_directory, "native-codex.stdout.jsonl");
const transcriptBytes = Buffer.from([
  JSON.stringify({ type: "thread.started", thread_id: completion.native_session_id }),
  JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: completion.returned_completion } }),
  JSON.stringify({ type: "turn.completed", usage: { input_tokens: 10, output_tokens: 5 } }),
  "",
].join("\n"));
fs.writeFileSync(transcriptPath, transcriptBytes);
const stderrPath = path.join(prepared.packet.evidence_directory, "native-codex.stderr.log");
fs.writeFileSync(stderrPath, "");
const executablePath = fs.realpathSync(process.execPath);
const workerPacketBytes = fs.readFileSync(prepared.worker_packet_path);
const launchContract = nativeCodexExecContract(workerPacketBytes, prepared.worker_packet_sha256);
const capabilityProbeContract = nativeCodexCapabilityProbeContract(launchContract, {
  repository: prepared.packet.repository,
  visible_command_path: evaluatorPath,
  visible_executable_path: fs.realpathSync(evaluatorPath),
  held_out_executable_path: fs.realpathSync(evaluatorPath),
  root_evidence_path: prepared.invocation_packet_path,
  codex_executable_path: executablePath,
});
const featureInventoryStdoutPath = path.join(prepared.packet.evidence_directory, "native-feature-inventory.stdout.log");
const featureInventoryStderrPath = path.join(prepared.packet.evidence_directory, "native-feature-inventory.stderr.log");
const capabilityProbeStdoutPath = path.join(prepared.packet.evidence_directory, "native-capability-probe.stdout.log");
const capabilityProbeStderrPath = path.join(prepared.packet.evidence_directory, "native-capability-probe.stderr.log");
const capabilityProbePath = path.join(prepared.packet.evidence_directory, "native-capability-probe.json");
const featureInventoryStdout = Buffer.from(launchContract.disabled_features.map((feature) => `${feature} stable false`).join("\n") + "\n");
const capabilityProbeStdout = Buffer.from(Object.entries(capabilityProbeContract.expected).map(([label, expected]) => `${label}\t${expected === 0 ? 0 : 1}`).join("\n") + "\n");
fs.writeFileSync(featureInventoryStdoutPath, featureInventoryStdout);
fs.writeFileSync(featureInventoryStderrPath, "");
fs.writeFileSync(capabilityProbeStdoutPath, capabilityProbeStdout);
fs.writeFileSync(capabilityProbeStderrPath, "");
const capabilityProbeEvidence = {
  schema_version: 1,
  evidence_type: "native-codex-capability-probe-v1",
  invocation_packet_sha256: prepared.invocation_packet_sha256,
  codex_executable_path: executablePath,
  codex_executable_sha256: sha256(fs.readFileSync(executablePath)),
  codex_version: "codex-cli fixture",
  launch_contract_sha256: launchContract.sha256,
  capability_probe_contract_sha256: capabilityProbeContract.sha256,
  feature_inventory_stdout_path: featureInventoryStdoutPath,
  feature_inventory_stdout_sha256: sha256(featureInventoryStdout),
  feature_inventory_stderr_path: featureInventoryStderrPath,
  feature_inventory_stderr_sha256: sha256(Buffer.from("")),
  capability_probe_stdout_path: capabilityProbeStdoutPath,
  capability_probe_stdout_sha256: sha256(capabilityProbeStdout),
  capability_probe_stderr_path: capabilityProbeStderrPath,
  capability_probe_stderr_sha256: sha256(Buffer.from("")),
  disabled_features: launchContract.disabled_features,
  observations: Object.fromEntries(Object.entries(capabilityProbeContract.expected).map(([label, expected]) => [label, { status: expected === 0 ? 0 : 1 }])),
  passed: true,
};
const capabilityProbeBytes = Buffer.from(`${JSON.stringify(capabilityProbeEvidence, null, 2)}\n`);
fs.writeFileSync(capabilityProbePath, capabilityProbeBytes);
const attestation = {
  schema_version: 1,
  attestation_type: "codex-exec-builder-attestation-v4",
  producer_version: "native-codex-exec-producer-v4",
  finalizer_version: "native-codex-exec-finalizer-v4",
  invocation_packet_sha256: prepared.invocation_packet_sha256,
  invocation_id: prepared.packet.invocation_id,
  experiment_id: prepared.packet.experiment_id,
  arm_id: prepared.packet.arm_id,
  run_nonce: prepared.packet.run_nonce,
  native_session_id: completion.native_session_id,
  run_id: completion.run_id,
  model: completion.model,
  reasoning_effort: completion.reasoning_effort,
  execution_surface: "codex-exec",
  platform_version: "codex-cli fixture",
  codex_executable_path: executablePath,
  codex_executable_sha256: sha256(fs.readFileSync(executablePath)),
  launch_contract_sha256: launchContract.sha256,
  capability_probe_contract_sha256: capabilityProbeContract.sha256,
  capability_probe_evidence_path: capabilityProbePath,
  capability_probe_evidence_sha256: sha256(capabilityProbeBytes),
  worker_packet_delivery: "stdin-bytes",
  multi_agent_enabled: false,
  network_access: false,
  writable_tmp: true,
  sandbox_mode: "permission-profile",
  permission_profile: "native-proof-builder",
  filesystem_read_scope: "minimal+workspace+approved-toolchain",
  transcript_path: transcriptPath,
  transcript_sha256: sha256(transcriptBytes),
  stderr_path: stderrPath,
  stderr_sha256: sha256(Buffer.from("")),
  status: "completed",
  agent_exit_status: 0,
  agent_signal: null,
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
await assert.rejects(
  () => finalize({ ...attestation, platform_version: "unapproved-codex-version" }),
  /approved Codex version identity/i,
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
await assert.rejects(() => finalize(attestation), /already.*claim|already.*finaliz/i);
fs.rmSync(checkMutationFlag);
fs.rmSync(path.join(repository, "post-check-outside.txt"), { force: true });
for (const name of ["native-finalization-claim.json", "visible-1.stdout.log", "visible-1.stderr.log"]) {
  fs.rmSync(path.join(prepared.packet.evidence_directory, name), { force: true });
}

const checksBeforeConcurrentFinalize = fs.readFileSync(checkRunCountPath, "utf8").split("\n").filter(Boolean).length;
const concurrentFinalizations = await Promise.allSettled([finalize(attestation), finalize(attestation)]);
const successfulFinalizations = concurrentFinalizations.filter((entry) => entry.status === "fulfilled");
assert.equal(successfulFinalizations.length, 1, "exactly one concurrent finalizer may claim the invocation");
const checksAfterConcurrentFinalize = fs.readFileSync(checkRunCountPath, "utf8").split("\n").filter(Boolean).length;
assert.equal(checksAfterConcurrentFinalize - checksBeforeConcurrentFinalize, 3, "a losing concurrent finalizer must fail before running checks");
const result = successfulFinalizations[0].value;
assert.equal(result.status, "completed");
assert.equal(result.native_run_id, "fixture-run-001");
assert.equal(result.changed_paths[0], "allowed.txt");
assert.equal(result.visible_checks[0].status, 0);
assert.equal(result.held_out_checks[0].status, 0);
assert.equal(fs.existsSync(result.execution_claim_path), true);
assert.equal(fs.existsSync(result.finalization_claim_path), true);
await assert.rejects(() => finalize(attestation), /already been finalized/i);

console.log("native builder arm fixtures passed");
