import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { finalizeNativeBuilderArm } from "../../scripts/finalize-native-builder-arm.mjs";
import { prepareNativeBuilderArm } from "../../scripts/prepare-native-builder-arm.mjs";
import { runBuilderArm } from "../../scripts/run-builder-arm.mjs";
import { runNativeBuilderExecution } from "../../scripts/run-native-builder-execution.mjs";
import { validatePairedControls } from "../../scripts/validate-paired-builder-controls.mjs";

const sha256 = (value) => `sha256:${crypto.createHash("sha256").update(value).digest("hex")}`;
const root = fs.mkdtempSync(path.join(os.tmpdir(), "paired-controls-"));
const baselineRepo = path.join(root, "baseline");
const composerRepo = path.join(root, "composer-repository");
const nativeRepo = path.join(root, "native-repository");
const evidence = path.join(root, "evidence");
fs.mkdirSync(baselineRepo);
const git = (repository, ...args) => execFileSync("git", ["-C", repository, ...args], { encoding: "utf8" }).trim();
git(baselineRepo, "init", "-q");
git(baselineRepo, "config", "user.email", "fixture@example.com");
git(baselineRepo, "config", "user.name", "Paired fixture");
fs.writeFileSync(path.join(baselineRepo, "allowed.txt"), "before\n");
fs.writeFileSync(path.join(baselineRepo, ".gitignore"), "ignored.txt\n");
git(baselineRepo, "add", ".");
git(baselineRepo, "commit", "-qm", "baseline");
const baseline = git(baselineRepo, "rev-parse", "HEAD");
execFileSync("git", ["clone", "-q", baselineRepo, composerRepo]);
execFileSync("git", ["clone", "-q", baselineRepo, nativeRepo]);

const promptPath = path.join(root, "prompt.md");
fs.writeFileSync(promptPath, "Change allowed.txt to after.\n");
const evaluatorPath = path.join(root, "evaluator.mjs");
const evaluatorSource = "#!/usr/bin/env node\nprocess.exit(0);\n";
fs.writeFileSync(evaluatorPath, evaluatorSource, { mode: 0o755 });
const checks = [[evaluatorPath]];
const commonConfig = {
  schema_version: 1,
  experiment_id: "paired-fixture",
  baseline_commit: baseline,
  prompt_path: promptPath,
  allowed_paths: ["allowed.txt"],
  allowed_ignored_paths: [],
  output_directory: evidence,
  timeout_ms: 10_000,
  check_timeout_ms: 10_000,
  intervention_budget: 0,
  remediation_generation_budget: 1,
  visible_checks: checks,
  held_out_checks: checks,
  held_out_evaluator_self_tests: [[evaluatorPath, "--proof-harness-self-test"]],
};

const fakeAgent = path.join(root, "fake-agent.mjs");
fs.writeFileSync(fakeAgent, `import fs from "node:fs";import path from "node:path";const workspace=process.argv[process.argv.indexOf("--workspace")+1];fs.writeFileSync(path.join(workspace,"allowed.txt"),"after\\n");console.log(JSON.stringify({type:"result",result:"done"}));\n`);
const composerConfig = {
  ...commonConfig,
  arm_id: "composer-a",
  run_nonce: "composer-run-001",
  model: "composer-2.5",
  cursor_filesystem_policy: "trusted-host-external-reads-allowed",
  repository: composerRepo,
};
const composerConfigPath = path.join(root, "composer-config.json");
fs.writeFileSync(composerConfigPath, `${JSON.stringify(composerConfig, null, 2)}\n`);
const composer = await runBuilderArm(composerConfigPath, {
  expectedConfigSha256: sha256(fs.readFileSync(composerConfigPath)),
  agentExecutable: process.execPath,
  agentPrefixArgs: [fakeAgent],
  agentVersion: "fixture-cursor-agent",
  isolationBoundary: { enforcement: "test-double" },
});

const nativeConfig = {
  ...commonConfig,
  arm_id: "native-b",
  run_nonce: "native-run-001",
  model: "gpt-5.6-sol",
  reasoning_effort: "high",
  codex_executable_path: fs.realpathSync(process.execPath),
  codex_executable_sha256: sha256(fs.readFileSync(fs.realpathSync(process.execPath))),
  codex_version: "fixture-native-codex-cli",
  repository: nativeRepo,
};
const nativeConfigPath = path.join(root, "native-config.json");
fs.writeFileSync(nativeConfigPath, `${JSON.stringify(nativeConfig, null, 2)}\n`);
const prepared = await prepareNativeBuilderArm(nativeConfigPath, sha256(fs.readFileSync(nativeConfigPath)));
const fakeNativeAgent = path.join(root, "fake-native-agent.mjs");
fs.writeFileSync(fakeNativeAgent, `
import fs from "node:fs";
import path from "node:path";
if (process.argv.includes("features") && process.argv.includes("list")) {
  for (let index = 0; index < process.argv.length; index += 1) {
    if (process.argv[index] === "--disable") console.log(process.argv[index + 1] + " stable false");
  }
  process.exit(0);
}
if (process.argv.includes("sandbox")) {
  fs.writeFileSync(process.env.PROOF_PROBE_TMP_PATH, "probe\\n");
  for (const [label, status] of [["workspace_read",0],["visible_command_read",0],["visible_executable_read",0],["held_out_executable_read",1],["root_evidence_read",1],["tmp_write",0],["network_connect",1],["descendant_codex_agent",1]]) console.log(label + "\\t" + status);
  process.exit(0);
}
process.stdin.resume();
process.stdin.on("end", () => {
  const workspace = process.argv[process.argv.indexOf("--cd") + 1];
  fs.writeFileSync(path.join(workspace, "allowed.txt"), "after\\n");
  console.log(JSON.stringify({ type: "thread.started", thread_id: "paired-fixture-native-run" }));
  console.log(JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: "Fixture edit completed." } }));
  console.log(JSON.stringify({ type: "turn.completed", usage: { input_tokens: 10, output_tokens: 5 } }));
});
`);
const execution = await runNativeBuilderExecution(prepared.invocation_packet_path, prepared.invocation_packet_sha256, {
  codexExecutable: process.execPath,
  codexPrefixArgs: [fakeNativeAgent],
  codexVersion: "fixture-native-codex-cli",
});
const native = await finalizeNativeBuilderArm(
  prepared.invocation_packet_path,
  prepared.invocation_packet_sha256,
  execution.attestation_path,
  execution.attestation_sha256,
);

const leftPath = composer.result_path;
const rightPath = native.result_path;
const leftBytes = fs.readFileSync(leftPath);
const rightBytes = fs.readFileSync(rightPath);
const leftReceiptBytes = fs.readFileSync(composer.result_receipt_path);
const good = validatePairedControls(leftPath, rightPath);
assert.equal(good.comparable, true);

function rejected(label, targetPath, mutation, pattern) {
  const original = fs.readFileSync(targetPath);
  const value = JSON.parse(original);
  mutation(value);
  fs.writeFileSync(targetPath, `${JSON.stringify(value, null, 2)}\n`);
  assert.throws(() => validatePairedControls(leftPath, rightPath), pattern, label);
  fs.writeFileSync(targetPath, original);
}

function rejectedArtifact(label, targetPath, mutation, pattern) {
  const original = fs.readFileSync(targetPath);
  const value = JSON.parse(original);
  mutation(value);
  fs.writeFileSync(targetPath, `${JSON.stringify(value, null, 2)}\n`);
  assert.throws(() => validatePairedControls(leftPath, rightPath), pattern, label);
  fs.writeFileSync(targetPath, original);
}

rejected("nonzero check status", rightPath, (value) => { value.visible_checks[0].status = 1; }, /completed result contains a failed check/i);
rejected("missing check status", rightPath, (value) => { delete value.held_out_checks[0].status; }, /status must be an integer/i);
rejected("wrong native reasoning", rightPath, (value) => { value.reasoning_effort = "medium"; }, /reasoning_effort/i);
rejected("Sol through Cursor", rightPath, (value) => { value.runner = "cursor-agent-paired-builder-v2"; }, /runner/i);
rejected("Composer through native", leftPath, (value) => { value.runner = "codex-exec-builder-v5"; }, /runner/i);
rejected("missing Composer filesystem policy", leftPath, (value) => { delete value.cursor_filesystem_policy; }, /cursor_filesystem_policy/i);
rejected("misstated Composer filesystem scope", leftPath, (value) => { value.filesystem_read_scope = "workspace-only"; }, /filesystem_read_scope/i);
rejected("execution manifest drift", rightPath, (value) => { value.execution_manifest_sha256 = `sha256:${"1".repeat(64)}`; }, /execution_manifest/i);
rejected("stale run nonce", rightPath, (value) => { value.run_nonce = composer.run_nonce; }, /run_nonce|cross-wir/i);
rejected("missing producer evidence", rightPath, (value) => { delete value.native_invocation_packet_sha256; }, /producer packet/i);
rejectedArtifact("tampered Composer execution claim", composer.execution_claim_path, (value) => { value.run_nonce = "tampered"; }, /execution claim.*hash/i);
rejectedArtifact("tampered native execution claim", native.execution_claim_path, (value) => { value.run_nonce = "tampered"; }, /execution claim.*hash/i);
rejectedArtifact("tampered native finalization claim", native.finalization_claim_path, (value) => { value.run_nonce = "tampered"; }, /finalization claim.*hash/i);

const alternateRightPath = path.join(root, "copied-native-result.json");
fs.copyFileSync(rightPath, alternateRightPath);
assert.throws(() => validatePairedControls(leftPath, alternateRightPath), /result_path|canonical/i);

const leftValue = JSON.parse(leftBytes);
leftValue.repository = native.repository;
leftValue.git_dir = native.git_dir;
fs.writeFileSync(leftPath, `${JSON.stringify(leftValue, null, 2)}\n`);
const leftReceipt = JSON.parse(leftReceiptBytes);
leftReceipt.result_sha256 = sha256(fs.readFileSync(leftPath));
fs.writeFileSync(composer.result_receipt_path, `${JSON.stringify(leftReceipt, null, 2)}\n`);
assert.throws(() => validatePairedControls(leftPath, rightPath), /distinct canonical worktrees|distinct Git worktree/i);
fs.writeFileSync(leftPath, leftBytes);
fs.writeFileSync(composer.result_receipt_path, leftReceiptBytes);

fs.writeFileSync(evaluatorPath, `${evaluatorSource}// drift\n`, { mode: 0o755 });
assert.throws(() => validatePairedControls(leftPath, rightPath), /executable content identity drift/i);
fs.writeFileSync(evaluatorPath, evaluatorSource, { mode: 0o755 });

assert.equal(validatePairedControls(leftPath, rightPath).comparable, true);

function rewriteAsTimedOutCheckFailure(resultPath, receiptPath) {
  const value = JSON.parse(fs.readFileSync(resultPath, "utf8"));
  value.status = "checks-failed";
  value.held_out_checks[0] = {
    ...value.held_out_checks[0],
    status: null,
    signal: "SIGTERM",
    timed_out: true,
    skipped: false,
  };
  fs.writeFileSync(resultPath, `${JSON.stringify(value, null, 2)}\n`);
  const receipt = JSON.parse(fs.readFileSync(receiptPath, "utf8"));
  receipt.result_sha256 = sha256(fs.readFileSync(resultPath));
  fs.writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
}

rewriteAsTimedOutCheckFailure(leftPath, composer.result_receipt_path);
const timedOutTerminal = validatePairedControls(leftPath, rightPath);
assert.equal(timedOutTerminal.comparable, false);
assert.deepEqual(timedOutTerminal.arm_statuses, { left: "checks-failed", right: "completed" });
fs.writeFileSync(leftPath, leftBytes);
fs.writeFileSync(composer.result_receipt_path, leftReceiptBytes);

function rewriteAsSignaledCheckFailure(resultPath, receiptPath) {
  const value = JSON.parse(fs.readFileSync(resultPath, "utf8"));
  value.status = "checks-failed";
  value.held_out_checks[0] = {
    ...value.held_out_checks[0],
    status: null,
    signal: "SIGTERM",
    timed_out: false,
    skipped: false,
  };
  fs.writeFileSync(resultPath, `${JSON.stringify(value, null, 2)}\n`);
  const receipt = JSON.parse(fs.readFileSync(receiptPath, "utf8"));
  receipt.result_sha256 = sha256(fs.readFileSync(resultPath));
  fs.writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
}

rewriteAsSignaledCheckFailure(leftPath, composer.result_receipt_path);
const signaledTerminal = validatePairedControls(leftPath, rightPath);
assert.equal(signaledTerminal.comparable, false);
assert.deepEqual(signaledTerminal.arm_statuses, { left: "checks-failed", right: "completed" });
fs.writeFileSync(leftPath, leftBytes);
fs.writeFileSync(composer.result_receipt_path, leftReceiptBytes);

function rewriteAsInvalidTerminal(resultPath, receiptPath) {
  const value = JSON.parse(fs.readFileSync(resultPath, "utf8"));
  value.status = "invalid-out-of-scope";
  value.visible_checks = value.visible_checks.map((row) => ({ ...row, status: null, signal: null, timed_out: false, skipped: true }));
  value.held_out_checks = value.held_out_checks.map((row) => ({ ...row, status: null, signal: null, timed_out: false, skipped: true }));
  fs.writeFileSync(resultPath, `${JSON.stringify(value, null, 2)}\n`);
  const receipt = JSON.parse(fs.readFileSync(receiptPath, "utf8"));
  receipt.result_sha256 = sha256(fs.readFileSync(resultPath));
  fs.writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
}

rewriteAsInvalidTerminal(leftPath, composer.result_receipt_path);
const invalidTerminal = validatePairedControls(leftPath, rightPath);
assert.equal(invalidTerminal.comparable, false);
assert.equal(invalidTerminal.disposition, "terminal-arm-outcome-not-eligible-for-blinded-scoring");
assert.deepEqual(invalidTerminal.arm_statuses, { left: "invalid-out-of-scope", right: "completed" });
fs.writeFileSync(leftPath, leftBytes);
fs.writeFileSync(composer.result_receipt_path, leftReceiptBytes);

function rewriteAsTerminalCheckFailure(resultPath, receiptPath) {
  const value = JSON.parse(fs.readFileSync(resultPath, "utf8"));
  value.status = "checks-failed";
  value.held_out_checks[0].status = 1;
  fs.writeFileSync(resultPath, `${JSON.stringify(value, null, 2)}\n`);
  const receipt = JSON.parse(fs.readFileSync(receiptPath, "utf8"));
  receipt.result_sha256 = sha256(fs.readFileSync(resultPath));
  fs.writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
}

rewriteAsTerminalCheckFailure(leftPath, composer.result_receipt_path);
const mixedTerminal = validatePairedControls(leftPath, rightPath);
assert.equal(mixedTerminal.comparable, false);
assert.equal(mixedTerminal.disposition, "terminal-arm-outcome-not-eligible-for-blinded-scoring");
assert.deepEqual(mixedTerminal.arm_statuses, { left: "checks-failed", right: "completed" });

rewriteAsTerminalCheckFailure(rightPath, native.native_finalize_receipt_path);
const failedPair = validatePairedControls(leftPath, rightPath);
assert.equal(failedPair.comparable, false);
assert.deepEqual(failedPair.arm_statuses, { left: "checks-failed", right: "checks-failed" });
console.log("paired control fixtures passed");
