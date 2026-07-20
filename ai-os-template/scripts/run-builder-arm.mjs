#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { assertPathOutsideRepository, executionManifest, repositoryIdentity, repositoryState, runGuardedChecks, safeEnvironment as contractEnvironment } from "./builder-execution-contract.mjs";

function fail(message) {
  throw new Error(message);
}

function sha256(value) {
  return `sha256:${crypto.createHash("sha256").update(value).digest("hex")}`;
}

function writeExclusiveClaim(target, value, label) {
  const bytes = Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
  try {
    fs.writeFileSync(target, bytes, { flag: "wx" });
  } catch (error) {
    if (error?.code === "EEXIST") fail(`${label} is already claimed`);
    throw error;
  }
  return sha256(bytes);
}

function git(repo, args, encoding = "utf8") {
  const result = spawnSync("git", ["-C", repo, ...args], { encoding, maxBuffer: 128 * 1024 * 1024 });
  if (result.status !== 0) fail(`git ${args.join(" ")} failed: ${result.error?.message ?? String(result.stderr).trim()}`);
  return result.stdout;
}

function nulPaths(value) {
  return String(value).split("\0").filter(Boolean);
}

const ALLOWED_MODELS = new Set(["composer-2.5"]);
function changedPaths(repo, baseline = "HEAD") {
  return [...new Set([
    ...nulPaths(git(repo, ["diff", "--name-only", "-z", baseline])),
    ...nulPaths(git(repo, ["ls-files", "--others", "--exclude-standard", "-z"])),
  ])].sort();
}

function ignoredState(repo, allowedIgnoredPaths) {
  const state = new Map();
  for (const relative of nulPaths(git(repo, ["ls-files", "--others", "--ignored", "--exclude-standard", "-z"]))) {
    if (pathAllowed(relative, allowedIgnoredPaths)) continue;
    const target = path.join(repo, relative);
    const stat = fs.lstatSync(target);
    const content = stat.isSymbolicLink() ? Buffer.from(fs.readlinkSync(target)) : fs.readFileSync(target);
    state.set(relative, `${stat.mode.toString(8)}:${sha256(content)}`);
  }
  return state;
}

function stateHash(state) {
  return sha256([...state.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([file, value]) => `${file}\0${value}`).join("\n"));
}

function changedStatePaths(before, after) {
  return [...new Set([...before.keys(), ...after.keys()])]
    .filter((file) => before.get(file) !== after.get(file))
    .sort();
}

function pathAllowed(target, allowed) {
  return allowed.some((entry) => target === entry || (entry.endsWith("/") && target.startsWith(entry)));
}

function validateRelativePath(value, label) {
  if (typeof value !== "string" || value === "" || path.isAbsolute(value)) fail(`${label} must be repo-relative`);
  const normalized = path.posix.normalize(value.replaceAll("\\", "/"));
  if (normalized !== value.replaceAll("\\", "/") || normalized === "." || normalized === ".." || normalized.startsWith("../") || normalized.startsWith(".git/") || normalized === ".git") {
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

function workingStateHash(repo, paths) {
  const rows = paths.map((relative) => {
    const target = path.join(repo, relative);
    if (!fs.existsSync(target)) return `${relative}\0deleted`;
    const stat = fs.lstatSync(target);
    const content = stat.isSymbolicLink() ? Buffer.from(fs.readlinkSync(target)) : fs.readFileSync(target);
    return `${relative}\0${stat.mode.toString(8)}\0${sha256(content)}`;
  });
  return sha256(rows.join("\n"));
}

async function runProcess(executable, args, options) {
  return await new Promise((resolve) => {
    const startedAt = Date.now();
    const child = spawn(executable, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const stdout = [];
    const stderr = [];
    let timedOut = false;
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 2000).unref();
    }, options.timeoutMs);
    child.on("error", (error) => {
      clearTimeout(timer);
      resolve({ status: null, signal: null, timed_out: timedOut, duration_ms: Date.now() - startedAt, stdout: Buffer.concat(stdout), stderr: Buffer.concat([...stderr, Buffer.from(error.message)]) });
    });
    child.on("close", (status, signal) => {
      clearTimeout(timer);
      resolve({ status, signal, timed_out: timedOut, duration_ms: Date.now() - startedAt, stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr) });
    });
  });
}

export async function runBuilderArm(configPath, testOverrides = {}) {
  const resolvedConfigPath = path.resolve(configPath);
  const configBytes = fs.readFileSync(resolvedConfigPath);
  const configHash = sha256(configBytes);
  if (testOverrides.expectedConfigSha256 !== configHash) {
    fail("builder arm config hash does not match the separately approved identity");
  }
  const config = JSON.parse(configBytes.toString("utf8"));
  if (config.schema_version !== 1) fail("builder arm schema_version must be 1");
  for (const key of ["experiment_id", "arm_id", "run_nonce", "model", "repository", "baseline_commit", "prompt_path", "output_directory"]) {
    if (typeof config[key] !== "string" || config[key] === "") fail(`${key} is required`);
  }
  const allowedConfigKeys = new Set([
    "schema_version", "experiment_id", "arm_id", "run_nonce", "model", "repository", "baseline_commit",
    "prompt_path", "allowed_paths", "allowed_ignored_paths", "output_directory", "timeout_ms", "check_timeout_ms",
    "intervention_budget", "remediation_generation_budget", "visible_checks", "held_out_checks",
  ]);
  for (const key of Object.keys(config)) if (!allowedConfigKeys.has(key)) fail(`unsupported config field: ${key}`);
  if (![config.experiment_id, config.arm_id, config.run_nonce].every((value) => /^[A-Za-z0-9._-]+$/.test(value))) {
    fail("experiment_id, arm_id, and run_nonce must be filesystem-safe identifiers");
  }
  if (!ALLOWED_MODELS.has(config.model)) fail(`unsupported experiment model: ${config.model}`);
  if (!/^[a-f0-9]{40}$/.test(config.baseline_commit)) fail("baseline_commit must be a full Git object ID");
  if (!Array.isArray(config.allowed_paths) || config.allowed_paths.length === 0) fail("allowed_paths must not be empty");
  config.allowed_paths.forEach((entry, index) => validateRelativePath(entry, `allowed_paths[${index}]`));
  if (!Array.isArray(config.allowed_ignored_paths)) fail("allowed_ignored_paths must be an array");
  config.allowed_ignored_paths.forEach((entry, index) => validateRelativePath(entry, `allowed_ignored_paths[${index}]`));
  validateCommands(config.visible_checks, "visible_checks");
  validateCommands(config.held_out_checks, "held_out_checks");
  for (const field of ["timeout_ms", "check_timeout_ms"]) {
    if (!Number.isInteger(config[field]) || config[field] < 1000) fail(`${field} must be an integer of at least 1000`);
  }
  for (const field of ["intervention_budget", "remediation_generation_budget"]) {
    if (!Number.isInteger(config[field]) || config[field] < 0) fail(`${field} must be a non-negative integer`);
  }
  if (config.agent_executable !== undefined || config.agent_prefix_args !== undefined || config.agent_environment !== undefined) {
    fail("agent executable, prefix arguments, and environment are runner-owned, not config-controlled");
  }
  const testDoubleIsolation = testOverrides.isolationBoundary?.enforcement === "test-double"
    && testOverrides.agentExecutable === process.execPath
    && typeof testOverrides.agentVersion === "string"
    && testOverrides.agentVersion.startsWith("fixture-");
  if (!testDoubleIsolation) {
    fail("Composer requires a verified workspace-only isolation boundary; host Cursor execution is prohibited because held-out and root evidence reads are not denied");
  }
  const repo = fs.realpathSync(path.resolve(config.repository));
  const repoIdentity = repositoryIdentity(repo);
  assertPathOutsideRepository(repo, resolvedConfigPath, "arm config");
  for (const [index, command] of config.held_out_checks.entries()) {
    if (!path.isAbsolute(command[0])) fail(`held_out_checks[${index}] executable must be an absolute external path`);
    assertPathOutsideRepository(repo, path.resolve(command[0]), `held_out_checks[${index}] executable`);
  }
  const head = git(repo, ["rev-parse", "HEAD"]).trim();
  if (head !== config.baseline_commit) fail(`baseline mismatch: expected ${config.baseline_commit}, got ${head}`);
  if (changedPaths(repo, config.baseline_commit).length > 0) fail("builder worktree must be clean at start");
  const startIndexTree = git(repo, ["write-tree"]).trim();
  const startRefResult = spawnSync("git", ["-C", repo, "symbolic-ref", "-q", "HEAD"], { encoding: "utf8" });
  const startRef = startRefResult.status === 0 ? startRefResult.stdout.trim() : "DETACHED";
  const startRefTarget = startRef === "DETACHED" ? head : git(repo, ["rev-parse", startRef]).trim();
  const initialIgnoredState = ignoredState(repo, config.allowed_ignored_paths);

  const prompt = fs.readFileSync(path.resolve(config.prompt_path));
  const outputDirectory = assertPathOutsideRepository(repo, path.resolve(config.output_directory), "output_directory");
  const requestedEvidenceDirectory = assertPathOutsideRepository(repo, path.join(outputDirectory, config.arm_id), "Composer evidence directory");
  fs.mkdirSync(requestedEvidenceDirectory, { recursive: true });
  const evidenceDirectory = assertPathOutsideRepository(repo, fs.realpathSync(requestedEvidenceDirectory), "Composer evidence directory");
  const resultPath = path.join(evidenceDirectory, "result.json");
  const receiptPath = path.join(evidenceDirectory, "result-receipt.json");
  const executionClaimPath = path.join(evidenceDirectory, "execution-claim.json");
  if (fs.existsSync(resultPath) || fs.existsSync(receiptPath) || fs.existsSync(executionClaimPath)) {
    fail("Composer run identity has already produced result evidence");
  }
  const executionClaimSha256 = writeExclusiveClaim(executionClaimPath, {
    schema_version: 1,
    claim_type: "cursor-agent-execution-claim-v1",
    runner_config_sha256: configHash,
    experiment_id: config.experiment_id,
    arm_id: config.arm_id,
    run_nonce: config.run_nonce,
  }, "Composer run identity");
  const executable = testOverrides.agentExecutable ?? "cursor-agent";
  const prefix = testOverrides.agentPrefixArgs ?? [];
  const checkEnvironment = contractEnvironment();
  const agentEnvironment = { ...checkEnvironment, ...(testOverrides.agentEnvironment ?? {}) };
  const approvedExecution = executionManifest([...config.visible_checks, ...config.held_out_checks], checkEnvironment);
  const versionPreflight = testOverrides.agentVersion === undefined
    ? spawnSync(executable, [...prefix, "--version"], { encoding: "utf8", env: agentEnvironment })
    : null;
  if (versionPreflight && versionPreflight.status !== 0) fail("builder agent version preflight failed");
  const agentVersion = testOverrides.agentVersion ?? String(versionPreflight.stdout ?? "").trim();
  if (agentVersion === "") fail("builder agent version preflight failed");
  const agentArgs = [
    ...prefix,
    "--print",
    "--output-format", "stream-json",
    "--stream-partial-output",
    "--force",
    "--sandbox", "enabled",
    "--trust",
    "--workspace", repo,
    "--model", config.model,
    prompt.toString("utf8"),
  ];
  const startedAt = new Date().toISOString();
  const agent = await runProcess(executable, agentArgs, {
    cwd: repo,
    timeoutMs: config.timeout_ms ?? 3_600_000,
    env: agentEnvironment,
  });
  fs.writeFileSync(path.join(evidenceDirectory, "agent.stdout.jsonl"), agent.stdout, { flag: "wx" });
  fs.writeFileSync(path.join(evidenceDirectory, "agent.stderr.log"), agent.stderr, { flag: "wx" });
  const finalHead = git(repo, ["rev-parse", "HEAD"]).trim();
  const finalIndexTree = git(repo, ["write-tree"]).trim();
  const finalRefResult = spawnSync("git", ["-C", repo, "symbolic-ref", "-q", "HEAD"], { encoding: "utf8" });
  const finalRef = finalRefResult.status === 0 ? finalRefResult.stdout.trim() : "DETACHED";
  const finalRefTarget = finalRef === "DETACHED" ? finalHead : git(repo, ["rev-parse", finalRef]).trim();
  const stagedPaths = nulPaths(git(repo, ["diff", "--cached", "--name-only", "-z"]));
  const paths = changedPaths(repo, config.baseline_commit);
  const finalIgnoredState = ignoredState(repo, config.allowed_ignored_paths);
  const ignoredStateChanges = changedStatePaths(initialIgnoredState, finalIgnoredState);
  const outside = paths.filter((target) => !pathAllowed(target, config.allowed_paths));
  const gitControlViolation = finalHead !== config.baseline_commit || finalIndexTree !== startIndexTree || stagedPaths.length > 0 || finalRef !== startRef || finalRefTarget !== startRefTarget;
  const preCheckState = repositoryState(repo, config.baseline_commit, config.allowed_ignored_paths);
  const checkContext = {
    repository: repo,
    baseline: config.baseline_commit,
    allowedIgnoredPaths: config.allowed_ignored_paths,
    timeoutMs: config.check_timeout_ms ?? 600_000,
    evidenceDirectory,
    environment: checkEnvironment,
    expectedState: preCheckState,
    allChecks: [...config.visible_checks, ...config.held_out_checks],
    expectedExecutionManifestSha256: approvedExecution.sha256,
  };
  const visibleChecks = outside.length === 0 && ignoredStateChanges.length === 0 && !gitControlViolation
    ? runGuardedChecks({ ...checkContext, checks: config.visible_checks ?? [], prefix: "visible" })
    : [];
  const heldOutChecks = outside.length === 0 && ignoredStateChanges.length === 0 && !gitControlViolation
    ? runGuardedChecks({ ...checkContext, checks: config.held_out_checks ?? [], prefix: "held-out" })
    : [];
  if (sha256(fs.readFileSync(path.resolve(config.prompt_path))) !== sha256(prompt)) fail("approved prompt identity changed during Cursor execution");
  const checksPassed = [...visibleChecks, ...heldOutChecks].every((check) => check.status === 0);
  const status = finalHead !== config.baseline_commit
    ? "invalid-head-moved"
    : finalIndexTree !== startIndexTree || stagedPaths.length > 0
      ? "invalid-index-mutated"
    : finalRef !== startRef || finalRefTarget !== startRefTarget
      ? "invalid-ref-moved"
    : ignoredStateChanges.length > 0
      ? "invalid-ignored-state"
    : outside.length > 0
    ? "invalid-out-of-scope"
    : agent.status === 0 && !agent.timed_out
      ? checksPassed ? "completed" : "checks-failed"
      : "agent-failed";
  if (outside.length > 0) fail(`changed paths outside allowed paths: ${outside.join(", ")}`);
  if (finalHead !== config.baseline_commit) fail(`builder moved HEAD from baseline ${config.baseline_commit}`);
  if (finalIndexTree !== startIndexTree || stagedPaths.length > 0) fail(`builder mutated the Git index: ${stagedPaths.join(", ")}`);
  if (finalRef !== startRef || finalRefTarget !== startRefTarget) fail(`builder changed the checked-out ref from ${startRef} to ${finalRef}`);
  if (ignoredStateChanges.length > 0) fail(`builder changed ignored-file state: ${ignoredStateChanges.join(", ")}`);
  if (status !== "completed") fail(`builder agent did not complete: ${status}`);
  const result = {
    schema_version: 1,
    experiment_id: config.experiment_id,
    arm_id: config.arm_id,
    run_nonce: config.run_nonce,
    model: config.model,
    runner: "cursor-agent-paired-builder-v1",
    producer_version: "cursor-agent-producer-v1",
    runner_config_sha256: configHash,
    repository: repoIdentity.repository,
    git_common_dir: repoIdentity.git_common_dir,
    git_dir: repoIdentity.git_dir,
    agent_version: agentVersion,
    baseline_commit: config.baseline_commit,
    baseline_tree: git(repo, ["show", "-s", "--format=%T", config.baseline_commit]).trim(),
    prompt_sha256: sha256(prompt),
    allowed_paths: config.allowed_paths,
    allowed_ignored_paths: config.allowed_ignored_paths,
    ignored_baseline_sha256: stateHash(initialIgnoredState),
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    duration_ms: agent.duration_ms,
    timeout_ms: config.timeout_ms ?? 3_600_000,
    check_timeout_ms: config.check_timeout_ms ?? 600_000,
    intervention_budget: config.intervention_budget,
    remediation_generation_budget: config.remediation_generation_budget,
    status,
    agent_exit_status: agent.status,
    agent_signal: agent.signal,
    agent_timed_out: agent.timed_out,
    agent_stdout_sha256: sha256(agent.stdout),
    agent_stderr_sha256: sha256(agent.stderr),
    execution_claim_path: executionClaimPath,
    execution_claim_sha256: executionClaimSha256,
    changed_paths: paths,
    start_index_tree: startIndexTree,
    start_ref: startRef,
    start_ref_target: startRefTarget,
    final_head: finalHead,
    final_index_tree: finalIndexTree,
    final_ref: finalRef,
    final_ref_target: finalRefTarget,
    staged_paths: stagedPaths,
    outside_allowed_paths: outside,
    ignored_state_changed_paths: ignoredStateChanges,
    ignored_final_sha256: stateHash(finalIgnoredState),
    working_state_sha256: workingStateHash(repo, paths),
    visible_checks: visibleChecks,
    held_out_checks: heldOutChecks,
    environment_names: Object.keys(checkEnvironment).sort(),
    environment_sha256: approvedExecution.manifest.environment_sha256,
    execution_manifest: approvedExecution.manifest,
    execution_manifest_sha256: approvedExecution.sha256,
    intervention_events: [],
    manual_edits: false,
  };
  result.result_path = resultPath;
  result.result_receipt_path = receiptPath;
  const resultBytes = Buffer.from(`${JSON.stringify(result, null, 2)}\n`);
  fs.writeFileSync(resultPath, resultBytes, { flag: "wx" });
  fs.writeFileSync(receiptPath, `${JSON.stringify({
    schema_version: 1,
    producer_version: result.producer_version,
    experiment_id: result.experiment_id,
    arm_id: result.arm_id,
    run_nonce: result.run_nonce,
    runner_config_sha256: result.runner_config_sha256,
    agent_stdout_sha256: result.agent_stdout_sha256,
    agent_stderr_sha256: result.agent_stderr_sha256,
    execution_claim_sha256: result.execution_claim_sha256,
    result_sha256: sha256(resultBytes),
  }, null, 2)}\n`, { flag: "wx" });
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [configPath, approvedConfigSha256] = process.argv.slice(2);
  if (!configPath || !approvedConfigSha256) {
    console.error("usage: run-builder-arm.mjs <arm-config.json> <approved-config-sha256>");
    process.exit(2);
  }
  try {
    const result = await runBuilderArm(configPath, { expectedConfigSha256: approvedConfigSha256 });
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`builder arm failed: ${error.message}`);
    process.exit(1);
  }
}
