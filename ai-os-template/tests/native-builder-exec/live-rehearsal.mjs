import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { finalizeNativeBuilderArm } from "../../scripts/finalize-native-builder-arm.mjs";
import { prepareNativeBuilderArm } from "../../scripts/prepare-native-builder-arm.mjs";
import { runBuilderArm } from "../../scripts/run-builder-arm.mjs";
import { resolveNativeCodexExecutable, runNativeBuilderExecution } from "../../scripts/run-native-builder-execution.mjs";
import { validatePairedControls } from "../../scripts/validate-paired-builder-controls.mjs";

const sha256 = (value) => `sha256:${crypto.createHash("sha256").update(value).digest("hex")}`;
function writeAndVerifyManifest(root) {
  const manifestPath = path.join(root, "SHA256SUMS");
  const files = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (target === manifestPath) continue;
      if (entry.isDirectory()) visit(target);
      else if (entry.isFile()) files.push(target);
    }
  };
  visit(root);
  const rows = files.sort().map((target) => `${crypto.createHash("sha256").update(fs.readFileSync(target)).digest("hex")}  ${path.relative(root, target)}`);
  fs.writeFileSync(manifestPath, `${rows.join("\n")}\n`, { flag: "wx", mode: 0o600 });
  for (const row of fs.readFileSync(manifestPath, "utf8").trim().split("\n")) {
    const match = /^([a-f0-9]{64})  (.+)$/.exec(row);
    if (!match) throw new Error("durable rehearsal manifest is invalid");
    const target = path.join(root, match[2]);
    if (crypto.createHash("sha256").update(fs.readFileSync(target)).digest("hex") !== match[1]) {
      throw new Error(`durable rehearsal manifest verification failed: ${match[2]}`);
    }
  }
  return { path: manifestPath, sha256: sha256(fs.readFileSync(manifestPath)), files: rows.length };
}
const retentionRootInput = process.env.PROOF_HARNESS_REHEARSAL_RETENTION_DIRECTORY;
if (typeof retentionRootInput !== "string" || !path.isAbsolute(retentionRootInput)) {
  throw new Error("PROOF_HARNESS_REHEARSAL_RETENTION_DIRECTORY must be an absolute durable directory");
}
fs.mkdirSync(retentionRootInput, { recursive: true, mode: 0o700 });
const retentionRoot = fs.realpathSync(retentionRootInput);
const scratch = fs.mkdtempSync(path.join(retentionRoot, "native-codex-exec-v4-live-rehearsal-"));
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
  experiment_id: "native-codex-exec-v4-live-rehearsal",
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

const codexLauncherPath = fs.realpathSync(execFileSync("which", ["codex"], { encoding: "utf8" }).trim());
const codexExecutablePath = resolveNativeCodexExecutable(codexLauncherPath);
const codexVersion = execFileSync(codexExecutablePath, ["--version"], { encoding: "utf8" }).trim();

const nativeConfig = {
  ...common,
  arm_id: "native-sol-v4",
  run_nonce: "native-sol-v4-live-001",
  model: "gpt-5.6-sol",
  reasoning_effort: "high",
  codex_executable_path: codexExecutablePath,
  codex_executable_sha256: sha256(fs.readFileSync(codexExecutablePath)),
  codex_version: codexVersion,
  repository: nativeRepository,
};
const nativeConfigPath = path.join(scratch, "native-config.json");
fs.writeFileSync(nativeConfigPath, `${JSON.stringify(nativeConfig, null, 2)}\n`);
const prepared = await prepareNativeBuilderArm(nativeConfigPath, sha256(fs.readFileSync(nativeConfigPath)));
const execution = await runNativeBuilderExecution(prepared.invocation_packet_path, prepared.invocation_packet_sha256);
const nativeResult = await finalizeNativeBuilderArm(
  prepared.invocation_packet_path,
  prepared.invocation_packet_sha256,
  execution.attestation_path,
  execution.attestation_sha256,
);
const nativeAttestation = JSON.parse(fs.readFileSync(execution.attestation_path, "utf8"));
const capabilityProbe = JSON.parse(fs.readFileSync(nativeResult.capability_probe_evidence_path, "utf8"));

const composerConfig = {
  ...common,
  arm_id: "composer-v4",
  run_nonce: "composer-v4-live-001",
  model: "composer-2.5",
  repository: composerRepository,
};
const composerConfigPath = path.join(scratch, "composer-config.json");
fs.writeFileSync(composerConfigPath, `${JSON.stringify(composerConfig, null, 2)}\n`);
const nativeSummary = {
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
};
const permissionProfileProbe = {
    profile: nativeResult.permission_profile,
    evidence_path: nativeResult.capability_probe_evidence_path,
    evidence_sha256: nativeResult.capability_probe_evidence_sha256,
    observations: capabilityProbe.observations,
    passed: capabilityProbe.passed,
};

let composerResult;
try {
  composerResult = await runBuilderArm(composerConfigPath, {
    expectedConfigSha256: sha256(fs.readFileSync(composerConfigPath)),
  });
} catch (error) {
  const blockedRecord = {
    schema_version: 1,
    purpose: "live disposable native Codex exec v4 capability rehearsal; not Tracer 7 model-quality evidence",
    scratch_directory: scratch,
    status: "blocked-before-composer-inference",
    reason: error.message,
    native_sol: nativeSummary,
    permission_profile_probe: permissionProfileProbe,
    composer_cursor: { status: "not-launched" },
    conclusion: "Native v4 controls completed; paired rehearsal stopped because host Cursor lacks a verified workspace-only read boundary.",
  };
  fs.writeFileSync(path.join(scratch, "rehearsal-blocked.json"), `${JSON.stringify(blockedRecord, null, 2)}\n`, { flag: "wx" });
  console.error(JSON.stringify(blockedRecord, null, 2));
  process.exitCode = 1;
}

if (composerResult) {
  const paired = validatePairedControls(composerResult.result_path, nativeResult.result_path);
  const record = {
    schema_version: 1,
    purpose: "live disposable native Codex exec v4 plus isolated Cursor Composer apparatus rehearsal; not Tracer 7 model-quality evidence",
    scratch_directory: scratch,
    fixture: {
      baseline_commit: baselineCommit,
      baseline_tree: baselineTree,
      prompt_sha256: sha256(fs.readFileSync(promptPath)),
      execution_manifest_sha256: nativeResult.execution_manifest_sha256,
      working_state_sha256_equal: nativeResult.working_state_sha256 === composerResult.working_state_sha256,
    },
    native_sol: nativeSummary,
    permission_profile_probe: permissionProfileProbe,
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
    conclusion: "Both actual subscription routes completed the byte-identical disposable task under v4 controls and produced comparable results. This validates apparatus only.",
  };
  fs.writeFileSync(path.join(scratch, "rehearsal-summary.json"), `${JSON.stringify(record, null, 2)}\n`, { flag: "wx" });
  console.log(JSON.stringify(record, null, 2));
}

const manifest = writeAndVerifyManifest(scratch);
console.error(JSON.stringify({ durable_manifest: manifest }, null, 2));
