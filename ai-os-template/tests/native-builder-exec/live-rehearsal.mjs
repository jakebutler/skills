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
import { nativeCodexExecContract } from "../../scripts/native-codex-exec-contract.mjs";

const sha256 = (value) => `sha256:${crypto.createHash("sha256").update(value).digest("hex")}`;
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "native-codex-exec-live-rehearsal-"));
const baselineRepository = path.join(scratch, "baseline");
const nativeRepository = path.join(scratch, "native");
const composerRepository = path.join(scratch, "composer");
const evidenceDirectory = path.join(scratch, "evidence");
fs.mkdirSync(baselineRepository);
const git = (repository, ...args) => execFileSync("git", ["-C", repository, ...args], { encoding: "utf8" }).trim();
git(baselineRepository, "init", "-q");
git(baselineRepository, "config", "user.email", "rehearsal@example.com");
git(baselineRepository, "config", "user.name", "Proof harness rehearsal");
fs.writeFileSync(path.join(baselineRepository, "math.mjs"), "export function add(left, right) {\n  return left - right;\n}\n");
fs.writeFileSync(path.join(baselineRepository, ".gitignore"), "node_modules/\n");
git(baselineRepository, "add", ".");
git(baselineRepository, "commit", "-qm", "baseline");
const baselineCommit = git(baselineRepository, "rev-parse", "HEAD");
const baselineTree = git(baselineRepository, "show", "-s", "--format=%T", "HEAD");
execFileSync("git", ["clone", "-q", baselineRepository, nativeRepository]);
execFileSync("git", ["clone", "-q", baselineRepository, composerRepository]);

const promptPath = path.join(scratch, "builder-prompt.md");
fs.writeFileSync(promptPath, [
  "Edit only math.mjs.",
  "Fix add(left, right) so it returns left + right.",
  "Do not stage, commit, change refs, or modify any other file.",
  "",
].join("\n"));
const visibleEvaluator = path.join(scratch, "visible-check.mjs");
fs.writeFileSync(visibleEvaluator, `#!/usr/bin/env node\nimport fs from "node:fs";\nconst source = fs.readFileSync("math.mjs", "utf8");\nprocess.exit(source.includes("return left + right;") ? 0 : 1);\n`, { mode: 0o755 });
const heldOutEvaluator = path.join(scratch, "held-out-check.mjs");
fs.writeFileSync(heldOutEvaluator, `#!/usr/bin/env node\nimport path from "node:path";\nimport { pathToFileURL } from "node:url";\nconst module = await import(pathToFileURL(path.join(process.cwd(), "math.mjs")));\nprocess.exit(module.add(19, 23) === 42 ? 0 : 1);\n`, { mode: 0o755 });

const common = {
  schema_version: 1,
  experiment_id: "native-codex-exec-v3-live-rehearsal",
  baseline_commit: baselineCommit,
  prompt_path: promptPath,
  allowed_paths: ["math.mjs"],
  allowed_ignored_paths: [],
  output_directory: evidenceDirectory,
  timeout_ms: 600_000,
  check_timeout_ms: 30_000,
  intervention_budget: 0,
  remediation_generation_budget: 1,
  visible_checks: [[visibleEvaluator]],
  held_out_checks: [[heldOutEvaluator]],
};

const nativeConfig = {
  ...common,
  arm_id: "native-sol-v3",
  run_nonce: "native-sol-v3-live-001",
  model: "gpt-5.6-sol",
  reasoning_effort: "high",
  repository: nativeRepository,
};
const nativeConfigPath = path.join(scratch, "native-config.json");
fs.writeFileSync(nativeConfigPath, `${JSON.stringify(nativeConfig, null, 2)}\n`);
const prepared = await prepareNativeBuilderArm(nativeConfigPath, sha256(fs.readFileSync(nativeConfigPath)));
const launchContract = nativeCodexExecContract(fs.readFileSync(prepared.worker_packet_path), prepared.worker_packet_sha256);
const permissionConfigArgs = [];
for (let index = 0; index < launchContract.argv.length; index += 1) {
  if (launchContract.argv[index] === "--config") permissionConfigArgs.push("--config", launchContract.argv[index + 1]);
}
const permissionProbeCommand = [
  `test -r ${JSON.stringify(path.join(nativeRepository, "math.mjs"))}`,
  `test -w ${JSON.stringify(path.join(nativeRepository, "math.mjs"))}`,
  `test -r ${JSON.stringify(visibleEvaluator)}`,
  `test ! -r ${JSON.stringify(heldOutEvaluator)}`,
  `test ! -r ${JSON.stringify(prepared.invocation_packet_path)}`,
].join(" && ");
execFileSync("codex", [
  "sandbox",
  ...permissionConfigArgs,
  "-P", launchContract.permission_profile,
  "-C", nativeRepository,
  "/bin/sh", "-c", permissionProbeCommand,
]);
const execution = await runNativeBuilderExecution(prepared.invocation_packet_path, prepared.invocation_packet_sha256);
const nativeResult = await finalizeNativeBuilderArm(
  prepared.invocation_packet_path,
  prepared.invocation_packet_sha256,
  execution.attestation_path,
  execution.attestation_sha256,
);
const nativeAttestation = JSON.parse(fs.readFileSync(execution.attestation_path, "utf8"));

const composerConfig = {
  ...common,
  arm_id: "composer-v3",
  run_nonce: "composer-v3-live-001",
  model: "composer-2.5",
  repository: composerRepository,
};
const composerConfigPath = path.join(scratch, "composer-config.json");
fs.writeFileSync(composerConfigPath, `${JSON.stringify(composerConfig, null, 2)}\n`);
const composerResult = await runBuilderArm(composerConfigPath, {
  expectedConfigSha256: sha256(fs.readFileSync(composerConfigPath)),
});
const paired = validatePairedControls(composerResult.result_path, nativeResult.result_path);

const record = {
  schema_version: 1,
  purpose: "live disposable native Codex exec v3 permission-profile plus Cursor Composer apparatus rehearsal; not Tracer 7 model-quality evidence",
  scratch_directory: scratch,
  fixture: {
    baseline_commit: baselineCommit,
    baseline_tree: baselineTree,
    prompt_sha256: sha256(fs.readFileSync(promptPath)),
    execution_manifest_sha256: nativeResult.execution_manifest_sha256,
    working_state_sha256_equal: nativeResult.working_state_sha256 === composerResult.working_state_sha256,
  },
  native_sol: {
    status: nativeResult.status,
    model: nativeResult.model,
    reasoning_effort: nativeResult.reasoning_effort,
    runner: nativeResult.runner,
    producer_version: nativeResult.producer_version,
    finalizer_version: nativeResult.finalizer_version,
    agent_version: nativeResult.agent_version,
    codex_executable_path: nativeAttestation.codex_executable_path,
    codex_executable_sha256: nativeAttestation.codex_executable_sha256,
    native_session_id: nativeResult.native_session_id,
    launch_contract_sha256: nativeResult.launch_contract_sha256,
    transcript_sha256: nativeResult.transcript_sha256,
    invocation_packet_sha256: nativeResult.native_invocation_packet_sha256,
    worker_packet_sha256: nativeResult.worker_packet_sha256,
    attestation_sha256: nativeResult.native_attestation_sha256,
    completion_evidence_sha256: nativeResult.completion_evidence_sha256,
    execution_claim_sha256: nativeResult.execution_claim_sha256,
    finalization_claim_sha256: nativeResult.finalization_claim_sha256,
    duration_ms: nativeResult.duration_ms,
    changed_paths: nativeResult.changed_paths,
    visible_checks_passed: nativeResult.visible_checks.length,
    held_out_checks_passed: nativeResult.held_out_checks.length,
    multi_agent_enabled: nativeResult.multi_agent_enabled,
    network_access: nativeResult.network_access,
    writable_tmp: nativeResult.writable_tmp,
    permission_profile: nativeResult.permission_profile,
    filesystem_read_scope: nativeResult.filesystem_read_scope,
    interventions: nativeResult.intervention_events,
  },
  permission_profile_probe: {
    profile: launchContract.permission_profile,
    workspace_read_write: true,
    visible_executable_read: true,
    held_out_executable_denied: true,
    root_invocation_packet_denied: true,
  },
  composer_cursor: {
    status: composerResult.status,
    model: composerResult.model,
    runner: composerResult.runner,
    producer_version: composerResult.producer_version,
    agent_version: composerResult.agent_version,
    execution_claim_sha256: composerResult.execution_claim_sha256,
    duration_ms: composerResult.duration_ms,
    changed_paths: composerResult.changed_paths,
    visible_checks_passed: composerResult.visible_checks.length,
    held_out_checks_passed: composerResult.held_out_checks.length,
    interventions: composerResult.intervention_events,
  },
  paired_validation: paired,
  conclusion: "Both actual subscription routes completed the byte-identical disposable task under v3 controls and produced comparable results. This validates apparatus only.",
};
console.log(JSON.stringify(record, null, 2));
