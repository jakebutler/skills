#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { assertPathOutsideRepository, changedPaths, executionManifest, repositoryIdentity, repositoryState, runGuardedChecks, safeEnvironment, workingStateSha256 } from "./builder-execution-contract.mjs";

const PRODUCER_VERSION = "native-codex-exec-producer-v5";
const FINALIZER_VERSION = "native-codex-exec-finalizer-v5";
const ALLOWED_CONFIG_KEYS = new Set([
  "schema_version", "experiment_id", "arm_id", "run_nonce", "model", "reasoning_effort",
  "repository", "baseline_commit", "prompt_path", "allowed_paths", "allowed_ignored_paths",
  "output_directory", "timeout_ms", "check_timeout_ms", "intervention_budget",
  "remediation_generation_budget", "visible_checks", "held_out_checks",
  "codex_executable_path", "codex_executable_sha256", "codex_version",
  "remediation_generation", "remediation_parent_result_path", "remediation_parent_result_sha256",
  "held_out_evaluator_self_tests",
]);

function sha256(value) {
  return `sha256:${crypto.createHash("sha256").update(value).digest("hex")}`;
}

function fail(message) {
  throw new Error(message);
}

function git(repository, args, encoding = "utf8", allowFailure = false) {
  const result = spawnSync("git", ["-C", repository, ...args], { encoding, maxBuffer: 128 * 1024 * 1024 });
  if (result.status !== 0 && !allowFailure) fail(`git ${args.join(" ")} failed: ${result.error?.message ?? String(result.stderr).trim()}`);
  return result;
}

function nulPaths(value) {
  return String(value).split("\0").filter(Boolean);
}

function validateRelativePath(value, label) {
  if (typeof value !== "string" || value === "" || path.isAbsolute(value)) fail(`${label} must be repo-relative`);
  const normalized = path.posix.normalize(value.replaceAll("\\", "/"));
  if (normalized !== value.replaceAll("\\", "/") || normalized === "." || normalized === ".." || normalized.startsWith("../") || normalized === ".git" || normalized.startsWith(".git/")) {
    fail(`${label} is not a safe normalized repository path`);
  }
}

function validateCommands(value, label) {
  if (!Array.isArray(value)) fail(`${label} must be an array`);
  for (const [index, command] of value.entries()) {
    if (!Array.isArray(command) || command.length === 0 || command.some((part) => typeof part !== "string" || part === "")) {
      fail(`${label}[${index}] must be a non-empty string argv array`);
    }
  }
}

function pathAllowed(target, allowed) {
  return allowed.some((entry) => target === entry || (entry.endsWith("/") && target.startsWith(entry)));
}

function ignoredState(repository, allowedIgnoredPaths) {
  const rows = [];
  for (const relative of nulPaths(git(repository, ["ls-files", "--others", "--ignored", "--exclude-standard", "-z"]).stdout)) {
    if (pathAllowed(relative, allowedIgnoredPaths)) continue;
    const target = path.join(repository, relative);
    const stat = fs.lstatSync(target);
    const content = stat.isSymbolicLink() ? Buffer.from(fs.readlinkSync(target)) : fs.readFileSync(target);
    rows.push(`${relative}\0${stat.mode.toString(8)}\0${sha256(content)}`);
  }
  return sha256(rows.sort().join("\n"));
}

export async function prepareNativeBuilderArm(configPath, approvedConfigSha256) {
  const resolvedConfigPath = path.resolve(configPath);
  const configBytes = fs.readFileSync(resolvedConfigPath);
  if (sha256(configBytes) !== approvedConfigSha256) {
    fail("native builder config hash does not match the separately approved identity");
  }
  const config = JSON.parse(configBytes.toString("utf8"));
  if (config.model !== "gpt-5.6-sol") fail("native model must be gpt-5.6-sol");
  if (config.reasoning_effort !== "high") fail("native reasoning effort must be high");
  if (config.schema_version !== 1) fail("native builder schema_version must be 1");
  for (const key of Object.keys(config)) if (!ALLOWED_CONFIG_KEYS.has(key)) fail(`unsupported config field: ${key}`);
  for (const key of ["experiment_id", "arm_id", "run_nonce", "repository", "baseline_commit", "prompt_path", "output_directory"]) {
    if (typeof config[key] !== "string" || config[key] === "") fail(`${key} is required`);
  }
  for (const key of ["experiment_id", "arm_id", "run_nonce"]) {
    if (!/^[A-Za-z0-9._-]+$/.test(config[key])) fail(`${key} must be filesystem-safe`);
  }
  if (!/^[a-f0-9]{40}$/.test(config.baseline_commit)) fail("baseline_commit must be a full Git object ID");
  const codexIdentityKeys = ["codex_executable_path", "codex_executable_sha256", "codex_version"];
  for (const key of codexIdentityKeys) if (typeof config[key] !== "string" || config[key] === "") fail(`${key} is required`);
  if (!/^sha256:[a-f0-9]{64}$/.test(config.codex_executable_sha256)) fail("codex_executable_sha256 must be a SHA-256 identity");
  if (!Array.isArray(config.allowed_paths) || config.allowed_paths.length === 0) fail("allowed_paths must not be empty");
  if (!Array.isArray(config.allowed_ignored_paths)) fail("allowed_ignored_paths must be an array");
  config.allowed_paths.forEach((entry, index) => validateRelativePath(entry, `allowed_paths[${index}]`));
  config.allowed_ignored_paths.forEach((entry, index) => validateRelativePath(entry, `allowed_ignored_paths[${index}]`));
  validateCommands(config.visible_checks, "visible_checks");
  validateCommands(config.held_out_checks, "held_out_checks");
  const heldOutEvaluatorSelfTests = config.held_out_evaluator_self_tests ?? [];
  validateCommands(heldOutEvaluatorSelfTests, "held_out_evaluator_self_tests");
  if (heldOutEvaluatorSelfTests.length > 0) {
    if (heldOutEvaluatorSelfTests.length !== config.held_out_checks.length) {
      fail("held_out_evaluator_self_tests must map one-to-one to held_out_checks");
    }
    heldOutEvaluatorSelfTests.forEach((command, index) => {
      if (command[0] !== config.held_out_checks[index][0] || !command.includes("--proof-harness-self-test")) {
        fail(`held_out_evaluator_self_tests[${index}] must invoke the same evaluator with --proof-harness-self-test`);
      }
    });
  }
  for (const key of ["timeout_ms", "check_timeout_ms"]) {
    if (!Number.isInteger(config[key]) || config[key] < 1000) fail(`${key} must be an integer of at least 1000`);
  }
  for (const key of ["intervention_budget", "remediation_generation_budget"]) {
    if (!Number.isInteger(config[key]) || config[key] < 0) fail(`${key} must be a non-negative integer`);
  }
  const remediationGeneration = config.remediation_generation ?? 0;
  if (!Number.isInteger(remediationGeneration) || remediationGeneration < 0 || remediationGeneration > config.remediation_generation_budget) {
    fail("remediation_generation must be within the approved remediation budget");
  }
  const remediationFields = [config.remediation_parent_result_path, config.remediation_parent_result_sha256];
  if (remediationGeneration === 0 && remediationFields.some((value) => value !== undefined)) {
    fail("initial native builder runs must not declare remediation parent evidence");
  }
  if (remediationGeneration > 0 && remediationFields.some((value) => typeof value !== "string" || value === "")) {
    fail("native remediation requires an exact parent result path and SHA-256 identity");
  }

  const repository = fs.realpathSync(path.resolve(config.repository));
  assertPathOutsideRepository(repository, resolvedConfigPath, "arm config");
  const requestedCodexExecutablePath = path.resolve(config.codex_executable_path);
  const codexExecutablePath = fs.realpathSync(requestedCodexExecutablePath);
  if (requestedCodexExecutablePath !== codexExecutablePath) fail("codex_executable_path must be canonical");
  const codexExecutableStat = fs.statSync(codexExecutablePath);
  if (!codexExecutableStat.isFile() || (codexExecutableStat.mode & 0o111) === 0) fail("codex_executable_path must identify an executable file");
  if (sha256(fs.readFileSync(codexExecutablePath)) !== config.codex_executable_sha256) {
    fail("codex executable content does not match the approved SHA-256 identity");
  }
  const outputDirectory = assertPathOutsideRepository(repository, path.resolve(config.output_directory), "output_directory");
  for (const [index, command] of config.visible_checks.entries()) {
    if (!path.isAbsolute(command[0])) fail(`visible_checks[${index}] executable must be an absolute external path`);
    assertPathOutsideRepository(repository, path.resolve(command[0]), `visible_checks[${index}] executable`);
    for (const [argumentIndex, argument] of command.slice(1).entries()) {
      if (path.isAbsolute(argument)) fail(`visible_checks[${index}][${argumentIndex + 1}] must not expose an absolute path`);
    }
  }
  for (const [index, command] of config.held_out_checks.entries()) {
    if (!path.isAbsolute(command[0])) fail(`held_out_checks[${index}] executable must be an absolute external path`);
    assertPathOutsideRepository(repository, path.resolve(command[0]), `held_out_checks[${index}] executable`);
  }

  const head = git(repository, ["rev-parse", "HEAD"]).stdout.trim();
  if (head !== config.baseline_commit) fail(`baseline mismatch: expected ${config.baseline_commit}, got ${head}`);
  const baselineTree = git(repository, ["show", "-s", "--format=%T", config.baseline_commit]).stdout.trim();
  const indexTree = git(repository, ["write-tree"]).stdout.trim();
  const statusBytes = git(repository, ["status", "--porcelain=v1", "-z"], null).stdout;
  if (indexTree !== baselineTree) fail("native builder index must match the baseline tree at prepare");
  const refResult = git(repository, ["symbolic-ref", "-q", "HEAD"], "utf8", true);
  const ref = refResult.status === 0 ? refResult.stdout.trim() : "DETACHED";
  const refTarget = ref === "DETACHED" ? head : git(repository, ["rev-parse", ref]).stdout.trim();
  const startPaths = changedPaths(repository, config.baseline_commit);
  const startWorkingStateSha256 = workingStateSha256(repository, startPaths);
  const currentIgnoredStateSha256 = ignoredState(repository, config.allowed_ignored_paths);
  let remediationParent = null;
  let remediationParentPath = null;
  if (remediationGeneration === 0) {
    if (statusBytes.length > 0 || startPaths.length > 0) fail("native builder worktree must be clean at prepare");
  } else {
    remediationParentPath = assertPathOutsideRepository(
      repository,
      path.resolve(config.remediation_parent_result_path),
      "native remediation parent result",
    );
    const parentBytes = fs.readFileSync(remediationParentPath);
    if (sha256(parentBytes) !== config.remediation_parent_result_sha256) fail("native remediation parent result hash mismatch");
    remediationParent = JSON.parse(parentBytes.toString("utf8"));
    if (path.resolve(remediationParent.result_path ?? "") !== remediationParentPath) fail("native remediation parent result path is not canonical");
    const parentReceiptPath = assertPathOutsideRepository(
      repository,
      path.resolve(remediationParent.native_finalize_receipt_path ?? ""),
      "native remediation parent receipt",
    );
    const parentReceipt = JSON.parse(fs.readFileSync(parentReceiptPath, "utf8"));
    if (
      parentReceipt.result_sha256 !== sha256(parentBytes) ||
      parentReceipt.invocation_packet_sha256 !== remediationParent.native_invocation_packet_sha256 ||
      parentReceipt.native_attestation_sha256 !== remediationParent.native_attestation_sha256 ||
      parentReceipt.completion_evidence_sha256 !== remediationParent.completion_evidence_sha256 ||
      parentReceipt.execution_claim_sha256 !== remediationParent.execution_claim_sha256 ||
      parentReceipt.finalization_claim_sha256 !== remediationParent.finalization_claim_sha256 ||
      parentReceipt.remediation_generation !== remediationParent.remediation_generation ||
      parentReceipt.remediation_parent_result_sha256 !== remediationParent.remediation_parent_result_sha256
    ) {
      fail("native remediation parent receipt is invalid or cross-wired");
    }
    if (remediationParent.model !== "gpt-5.6-sol" || remediationParent.runner !== "codex-exec-builder-v5") fail("native remediation parent route is invalid");
    if (remediationParent.status !== "checks-failed") fail("only a checks-failed terminal native result may be remediated");
    if (remediationParent.remediation_generation !== remediationGeneration - 1) fail("native remediation generation is not the direct successor of its parent");
    if (remediationParent.run_nonce === config.run_nonce) fail("native remediation run_nonce must differ from its parent");
    for (const field of ["experiment_id", "arm_id", "baseline_commit", "remediation_generation_budget"]) {
      if (JSON.stringify(remediationParent[field]) !== JSON.stringify(config[field])) fail(`native remediation parent control mismatch: ${field}`);
    }
    if (remediationParent.repository !== repository) fail("native remediation parent control mismatch: repository");
    for (const field of ["allowed_paths", "allowed_ignored_paths"]) {
      if (JSON.stringify(remediationParent[field]) !== JSON.stringify(config[field])) fail(`native remediation parent control mismatch: ${field}`);
    }
    for (const field of ["visible_checks", "held_out_checks", "held_out_evaluator_self_tests"]) {
      const parentCommands = (remediationParent[field] ?? []).map((row) => row.command);
      if (JSON.stringify(parentCommands) !== JSON.stringify(config[field] ?? [])) fail(`native remediation parent control mismatch: ${field}`);
    }
    if (
      remediationParent.final_head !== head ||
      remediationParent.final_index_tree !== indexTree ||
      remediationParent.final_ref !== ref ||
      remediationParent.final_ref_target !== refTarget ||
      remediationParent.working_state_sha256 !== startWorkingStateSha256 ||
      remediationParent.ignored_final_sha256 !== currentIgnoredStateSha256 ||
      JSON.stringify(remediationParent.changed_paths) !== JSON.stringify(startPaths)
    ) {
      fail("dirty native remediation worktree does not match the exact terminal parent state");
    }
  }
  const prompt = fs.readFileSync(path.resolve(config.prompt_path));
  const environment = safeEnvironment();
  const environmentNames = Object.keys(environment).sort();
  const allApprovedChecks = [...config.visible_checks, ...config.held_out_checks, ...heldOutEvaluatorSelfTests];
  const fullExecution = executionManifest(allApprovedChecks, environment);
  const visibleExecution = executionManifest(config.visible_checks, environment);
  const identity = repositoryIdentity(repository);
  const ignoredBaselineSha256 = remediationParent?.ignored_baseline_sha256 ?? currentIgnoredStateSha256;
  const configSha256 = sha256(configBytes);
  const invocationId = sha256(Buffer.from(`${configSha256}\0${config.run_nonce}\0${repository}\0${head}\0${sha256(prompt)}`));
  const controlsSha256 = sha256(Buffer.from(JSON.stringify({
    allowed_paths: config.allowed_paths,
    allowed_ignored_paths: config.allowed_ignored_paths,
    environment_names: environmentNames,
    timeout_ms: config.timeout_ms,
    check_timeout_ms: config.check_timeout_ms,
    intervention_budget: config.intervention_budget,
    remediation_generation_budget: config.remediation_generation_budget,
    remediation_generation: remediationGeneration,
    visible_checks: config.visible_checks,
    held_out_checks: config.held_out_checks,
    held_out_evaluator_self_tests: heldOutEvaluatorSelfTests,
    execution_manifest_sha256: fullExecution.sha256,
    environment_sha256: fullExecution.manifest.environment_sha256,
  })));
  const evidenceDirectory = assertPathOutsideRepository(
    repository,
    path.join(outputDirectory, config.arm_id, remediationGeneration === 0 ? "" : `remediation-${remediationGeneration}`),
    "native evidence directory",
  );
  fs.mkdirSync(evidenceDirectory, { recursive: true });
  const canonicalEvidenceDirectory = assertPathOutsideRepository(repository, fs.realpathSync(evidenceDirectory), "native evidence directory");
  const oracleState = repositoryState(repository, config.baseline_commit, config.allowed_ignored_paths);
  const heldOutEvaluatorSelfTestResults = runGuardedChecks({
    checks: heldOutEvaluatorSelfTests,
    repository,
    baseline: config.baseline_commit,
    allowedIgnoredPaths: config.allowed_ignored_paths,
    timeoutMs: config.check_timeout_ms,
    evidenceDirectory: canonicalEvidenceDirectory,
    prefix: "held-out-evaluator-self-test",
    environment,
    expectedState: oracleState,
    allChecks: allApprovedChecks,
    expectedExecutionManifestSha256: fullExecution.sha256,
  });
  if (heldOutEvaluatorSelfTestResults.some((check) => check.status !== 0)) {
    fail("held-out evaluator semantic self-test failed");
  }
  const workerCapabilityDirectory = assertPathOutsideRepository(
    repository,
    path.join(path.dirname(outputDirectory), ".native-builder-worker-capabilities", invocationId.slice("sha256:".length)),
    "native worker capability directory",
  );
  fs.mkdirSync(workerCapabilityDirectory, { recursive: true });
  const canonicalWorkerCapabilityDirectory = assertPathOutsideRepository(
    repository,
    fs.realpathSync(workerCapabilityDirectory),
    "native worker capability directory",
  );
  const workerPacketPath = path.join(canonicalWorkerCapabilityDirectory, "native-worker-packet.json");
  const invocationPacketPath = path.join(canonicalEvidenceDirectory, "native-invocation-packet.json");
  const resultPath = path.join(canonicalEvidenceDirectory, "native-result.json");
  const finalizeReceiptPath = path.join(canonicalEvidenceDirectory, "native-finalize-receipt.json");
  if ([workerPacketPath, invocationPacketPath, resultPath, finalizeReceiptPath].some((target) => fs.existsSync(target))) {
    fail("native invocation run identity already has producer or finalization evidence");
  }
  const workerPacket = {
    schema_version: 1,
    packet_type: "native-codex-exec-worker-invocation-v5",
    producer_version: PRODUCER_VERSION,
    invocation_id: invocationId,
    experiment_id: config.experiment_id,
    arm_id: config.arm_id,
    run_nonce: config.run_nonce,
    model: config.model,
    reasoning_effort: config.reasoning_effort,
    execution_surface: "codex-exec",
    repository,
    baseline_commit: config.baseline_commit,
    baseline_tree: baselineTree,
    prompt_sha256: sha256(prompt),
    prompt_base64: prompt.toString("base64"),
    allowed_paths: config.allowed_paths,
    allowed_ignored_paths: config.allowed_ignored_paths,
    timeout_ms: config.timeout_ms,
    intervention_budget: config.intervention_budget,
    remediation_generation: remediationGeneration,
    ...(remediationParent && {
      remediation_parent_result_sha256: config.remediation_parent_result_sha256,
    }),
    visible_checks: config.visible_checks,
    visible_execution_manifest: visibleExecution.manifest,
    visible_execution_manifest_sha256: visibleExecution.sha256,
  };
  const workerPacketBytes = Buffer.from(`${JSON.stringify(workerPacket, null, 2)}\n`);
  fs.writeFileSync(workerPacketPath, workerPacketBytes, { flag: "wx" });
  const workerPacketSha256 = sha256(workerPacketBytes);
  const packet = {
    schema_version: 1,
    packet_type: "native-codex-exec-invocation-v5",
    producer_version: PRODUCER_VERSION,
    finalizer_version: FINALIZER_VERSION,
    invocation_id: invocationId,
    experiment_id: config.experiment_id,
    arm_id: config.arm_id,
    run_nonce: config.run_nonce,
    model: config.model,
    reasoning_effort: config.reasoning_effort,
    execution_surface: "codex-exec",
    codex_executable_path: codexExecutablePath,
    codex_executable_sha256: config.codex_executable_sha256,
    codex_version: config.codex_version,
    repository,
    git_common_dir: identity.git_common_dir,
    git_dir: identity.git_dir,
    baseline_commit: config.baseline_commit,
    baseline_tree: baselineTree,
    start_head: head,
    start_index_tree: indexTree,
    start_ref: ref,
    start_ref_target: refTarget,
    start_status_sha256: sha256(statusBytes),
    start_working_state_sha256: startWorkingStateSha256,
    prompt_path: path.resolve(config.prompt_path),
    prompt_sha256: sha256(prompt),
    worker_packet_path: workerPacketPath,
    worker_packet_sha256: workerPacketSha256,
    runner_config_sha256: configSha256,
    controls_sha256: controlsSha256,
    allowed_paths: config.allowed_paths,
    allowed_ignored_paths: config.allowed_ignored_paths,
    ignored_baseline_sha256: ignoredBaselineSha256,
    environment_names: environmentNames,
    environment_sha256: fullExecution.manifest.environment_sha256,
    execution_manifest: fullExecution.manifest,
    execution_manifest_sha256: fullExecution.sha256,
    timeout_ms: config.timeout_ms,
    check_timeout_ms: config.check_timeout_ms,
    intervention_budget: config.intervention_budget,
    remediation_generation_budget: config.remediation_generation_budget,
    remediation_generation: remediationGeneration,
    ...(remediationParent && {
      remediation_parent_result_path: remediationParentPath,
      remediation_parent_result_sha256: config.remediation_parent_result_sha256,
    }),
    visible_checks: config.visible_checks,
    held_out_checks: config.held_out_checks,
    held_out_evaluator_self_tests: heldOutEvaluatorSelfTestResults,
  };
  packet.evidence_directory = canonicalEvidenceDirectory;
  packet.invocation_packet_path = invocationPacketPath;
  packet.result_path = resultPath;
  packet.finalize_receipt_path = finalizeReceiptPath;
  const packetBytes = Buffer.from(`${JSON.stringify(packet, null, 2)}\n`);
  fs.writeFileSync(invocationPacketPath, packetBytes, { flag: "wx" });
  return {
    invocation_packet_path: invocationPacketPath,
    invocation_packet_sha256: sha256(packetBytes),
    worker_packet_path: workerPacketPath,
    worker_packet_sha256: workerPacketSha256,
    worker_packet: workerPacket,
    result_path: resultPath,
    finalize_receipt_path: finalizeReceiptPath,
    packet,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [configPath, approvedConfigSha256] = process.argv.slice(2);
  if (!configPath || !approvedConfigSha256) {
    console.error("usage: prepare-native-builder-arm.mjs <arm-config.json> <approved-config-sha256>");
    process.exit(2);
  }
  try {
    console.log(JSON.stringify(await prepareNativeBuilderArm(configPath, approvedConfigSha256), null, 2));
  } catch (error) {
    console.error(`native builder prepare failed: ${error.message}`);
    process.exit(1);
  }
}
