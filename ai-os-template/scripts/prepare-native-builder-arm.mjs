#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { executionManifest, repositoryIdentity, safeEnvironment } from "./builder-execution-contract.mjs";

const PRODUCER_VERSION = "native-codex-producer-v1";
const FINALIZER_VERSION = "native-codex-finalizer-v1";
const ALLOWED_CONFIG_KEYS = new Set([
  "schema_version", "experiment_id", "arm_id", "run_nonce", "model", "reasoning_effort",
  "repository", "baseline_commit", "prompt_path", "allowed_paths", "allowed_ignored_paths",
  "output_directory", "timeout_ms", "check_timeout_ms", "intervention_budget",
  "remediation_generation_budget", "visible_checks", "held_out_checks",
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

function outsidePath(container, target, label) {
  const relative = path.relative(container, target);
  if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) fail(`${label} must be outside the builder repository`);
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
  if (!Array.isArray(config.allowed_paths) || config.allowed_paths.length === 0) fail("allowed_paths must not be empty");
  if (!Array.isArray(config.allowed_ignored_paths)) fail("allowed_ignored_paths must be an array");
  config.allowed_paths.forEach((entry, index) => validateRelativePath(entry, `allowed_paths[${index}]`));
  config.allowed_ignored_paths.forEach((entry, index) => validateRelativePath(entry, `allowed_ignored_paths[${index}]`));
  validateCommands(config.visible_checks, "visible_checks");
  validateCommands(config.held_out_checks, "held_out_checks");
  for (const key of ["timeout_ms", "check_timeout_ms"]) {
    if (!Number.isInteger(config[key]) || config[key] < 1000) fail(`${key} must be an integer of at least 1000`);
  }
  for (const key of ["intervention_budget", "remediation_generation_budget"]) {
    if (!Number.isInteger(config[key]) || config[key] < 0) fail(`${key} must be a non-negative integer`);
  }

  const repository = fs.realpathSync(path.resolve(config.repository));
  outsidePath(repository, resolvedConfigPath, "arm config");
  const outputDirectory = path.resolve(config.output_directory);
  outsidePath(repository, outputDirectory, "output_directory");
  for (const [index, command] of config.held_out_checks.entries()) {
    if (!path.isAbsolute(command[0])) fail(`held_out_checks[${index}] executable must be an absolute external path`);
    outsidePath(repository, path.resolve(command[0]), `held_out_checks[${index}] executable`);
  }

  const head = git(repository, ["rev-parse", "HEAD"]).stdout.trim();
  if (head !== config.baseline_commit) fail(`baseline mismatch: expected ${config.baseline_commit}, got ${head}`);
  const baselineTree = git(repository, ["show", "-s", "--format=%T", config.baseline_commit]).stdout.trim();
  const indexTree = git(repository, ["write-tree"]).stdout.trim();
  const statusBytes = git(repository, ["status", "--porcelain=v1", "-z"], null).stdout;
  if (statusBytes.length > 0) fail("native builder worktree must be clean at prepare");
  if (indexTree !== baselineTree) fail("native builder index must match the baseline tree at prepare");
  const refResult = git(repository, ["symbolic-ref", "-q", "HEAD"], "utf8", true);
  const ref = refResult.status === 0 ? refResult.stdout.trim() : "DETACHED";
  const refTarget = ref === "DETACHED" ? head : git(repository, ["rev-parse", ref]).stdout.trim();
  const prompt = fs.readFileSync(path.resolve(config.prompt_path));
  const environment = safeEnvironment();
  const environmentNames = Object.keys(environment).sort();
  const fullExecution = executionManifest([...config.visible_checks, ...config.held_out_checks], environment);
  const visibleExecution = executionManifest(config.visible_checks, environment);
  const identity = repositoryIdentity(repository);
  const ignoredBaselineSha256 = ignoredState(repository, config.allowed_ignored_paths);
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
    visible_checks: config.visible_checks,
    held_out_checks: config.held_out_checks,
    execution_manifest_sha256: fullExecution.sha256,
    environment_sha256: fullExecution.manifest.environment_sha256,
  })));
  const evidenceDirectory = path.join(outputDirectory, config.arm_id);
  fs.mkdirSync(evidenceDirectory, { recursive: true });
  const canonicalEvidenceDirectory = fs.realpathSync(evidenceDirectory);
  const workerPacketPath = path.join(canonicalEvidenceDirectory, "native-worker-packet.json");
  const invocationPacketPath = path.join(canonicalEvidenceDirectory, "native-invocation-packet.json");
  const resultPath = path.join(canonicalEvidenceDirectory, "native-result.json");
  const finalizeReceiptPath = path.join(canonicalEvidenceDirectory, "native-finalize-receipt.json");
  if ([workerPacketPath, invocationPacketPath, resultPath, finalizeReceiptPath].some((target) => fs.existsSync(target))) {
    fail("native invocation run identity already has producer or finalization evidence");
  }
  const workerPacket = {
    schema_version: 1,
    packet_type: "native-codex-worker-invocation-v1",
    producer_version: PRODUCER_VERSION,
    invocation_id: invocationId,
    experiment_id: config.experiment_id,
    arm_id: config.arm_id,
    run_nonce: config.run_nonce,
    model: config.model,
    reasoning_effort: config.reasoning_effort,
    execution_surface: "codex-collaboration-subagent",
    repository,
    baseline_commit: config.baseline_commit,
    baseline_tree: baselineTree,
    prompt_sha256: sha256(prompt),
    prompt_base64: prompt.toString("base64"),
    allowed_paths: config.allowed_paths,
    allowed_ignored_paths: config.allowed_ignored_paths,
    timeout_ms: config.timeout_ms,
    intervention_budget: config.intervention_budget,
    visible_checks: config.visible_checks,
    visible_execution_manifest: visibleExecution.manifest,
    visible_execution_manifest_sha256: visibleExecution.sha256,
  };
  const workerPacketBytes = Buffer.from(`${JSON.stringify(workerPacket, null, 2)}\n`);
  fs.writeFileSync(workerPacketPath, workerPacketBytes, { flag: "wx" });
  const workerPacketSha256 = sha256(workerPacketBytes);
  const packet = {
    schema_version: 1,
    packet_type: "native-codex-collaboration-invocation-v1",
    producer_version: PRODUCER_VERSION,
    finalizer_version: FINALIZER_VERSION,
    invocation_id: invocationId,
    experiment_id: config.experiment_id,
    arm_id: config.arm_id,
    run_nonce: config.run_nonce,
    model: config.model,
    reasoning_effort: config.reasoning_effort,
    execution_surface: "codex-collaboration-subagent",
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
    visible_checks: config.visible_checks,
    held_out_checks: config.held_out_checks,
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
