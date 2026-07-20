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
};

const fakeAgent = path.join(root, "fake-agent.mjs");
fs.writeFileSync(fakeAgent, `import fs from "node:fs";import path from "node:path";const workspace=process.argv[process.argv.indexOf("--workspace")+1];fs.writeFileSync(path.join(workspace,"allowed.txt"),"after\\n");console.log(JSON.stringify({type:"result",result:"done"}));\n`);
const composerConfig = {
  ...commonConfig,
  arm_id: "composer-a",
  run_nonce: "composer-run-001",
  model: "composer-2.5",
  repository: composerRepo,
};
const composerConfigPath = path.join(root, "composer-config.json");
fs.writeFileSync(composerConfigPath, `${JSON.stringify(composerConfig, null, 2)}\n`);
const composer = await runBuilderArm(composerConfigPath, {
  expectedConfigSha256: sha256(fs.readFileSync(composerConfigPath)),
  agentExecutable: process.execPath,
  agentPrefixArgs: [fakeAgent],
  agentVersion: "fixture-cursor-agent",
});

const nativeConfig = {
  ...commonConfig,
  arm_id: "native-b",
  run_nonce: "native-run-001",
  model: "gpt-5.6-sol",
  reasoning_effort: "high",
  repository: nativeRepo,
};
const nativeConfigPath = path.join(root, "native-config.json");
fs.writeFileSync(nativeConfigPath, `${JSON.stringify(nativeConfig, null, 2)}\n`);
const prepared = await prepareNativeBuilderArm(nativeConfigPath, sha256(fs.readFileSync(nativeConfigPath)));
const fakeNativeAgent = path.join(root, "fake-native-agent.mjs");
fs.writeFileSync(fakeNativeAgent, `
import fs from "node:fs";
import path from "node:path";
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

rejected("nonzero check status", rightPath, (value) => { value.visible_checks[0].status = 1; }, /status must be 0/i);
rejected("missing check status", rightPath, (value) => { delete value.held_out_checks[0].status; }, /status must be 0/i);
rejected("wrong native reasoning", rightPath, (value) => { value.reasoning_effort = "medium"; }, /reasoning_effort/i);
rejected("Sol through Cursor", rightPath, (value) => { value.runner = "cursor-agent-paired-builder-v1"; }, /runner/i);
rejected("Composer through native", leftPath, (value) => { value.runner = "codex-exec-builder-v3"; }, /runner/i);
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
console.log("paired control fixtures passed");
