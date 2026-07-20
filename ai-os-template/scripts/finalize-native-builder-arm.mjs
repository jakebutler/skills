#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { assertStateUnchanged, executionManifest, repositoryIdentity, repositoryState } from "./builder-execution-contract.mjs";

const PRODUCER_VERSION = "native-codex-producer-v1";
const FINALIZER_VERSION = "native-codex-finalizer-v1";
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const ATTESTATION_KEYS = new Set([
  "schema_version", "attestation_type", "producer_version", "finalizer_version",
  "invocation_packet_sha256", "invocation_id", "experiment_id", "arm_id", "run_nonce",
  "canonical_task", "run_id", "model", "reasoning_effort", "execution_surface",
  "platform_version", "status", "agent_timed_out", "started_at", "finished_at",
  "repository", "baseline_commit", "baseline_tree", "start_head", "end_head",
  "start_index_tree", "end_index_tree", "start_ref", "end_ref", "start_ref_target",
  "end_ref_target", "start_status_sha256", "prompt_sha256", "runner_config_sha256",
  "controls_sha256", "worker_packet_sha256", "observed_prompt_sha256",
  "completion_evidence_path", "completion_evidence_sha256",
  "intervention_events", "manual_edits",
]);
const COMPLETION_KEYS = new Set([
  "schema_version", "evidence_type", "invocation_packet_sha256", "invocation_id",
  "experiment_id", "arm_id", "canonical_task", "run_id", "model", "reasoning_effort",
  "status", "controls_sha256", "worker_packet_sha256", "observed_prompt_sha256",
  "changed_paths", "observed_working_state_sha256",
  "returned_completion",
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

function pathAllowed(target, allowed) {
  return allowed.some((entry) => target === entry || (entry.endsWith("/") && target.startsWith(entry)));
}

function changedPaths(repository, baseline) {
  return [...new Set([
    ...nulPaths(git(repository, ["diff", "--name-only", "-z", baseline], null).stdout),
    ...nulPaths(git(repository, ["ls-files", "--others", "--exclude-standard", "-z"], null).stdout),
  ])].sort();
}

function ignoredState(repository, allowedIgnoredPaths) {
  const rows = [];
  for (const relative of nulPaths(git(repository, ["ls-files", "--others", "--ignored", "--exclude-standard", "-z"], null).stdout)) {
    if (pathAllowed(relative, allowedIgnoredPaths)) continue;
    const target = path.join(repository, relative);
    const stat = fs.lstatSync(target);
    const content = stat.isSymbolicLink() ? Buffer.from(fs.readlinkSync(target)) : fs.readFileSync(target);
    rows.push(`${relative}\0${stat.mode.toString(8)}\0${sha256(content)}`);
  }
  return sha256(rows.sort().join("\n"));
}

function workingStateSha256(repository, paths) {
  const rows = paths.map((relative) => {
    const target = path.join(repository, relative);
    if (!fs.existsSync(target)) return `${relative}\0deleted`;
    const stat = fs.lstatSync(target);
    const content = stat.isSymbolicLink() ? Buffer.from(fs.readlinkSync(target)) : fs.readFileSync(target);
    return `${relative}\0${stat.mode.toString(8)}\0${sha256(content)}`;
  });
  return sha256(rows.join("\n"));
}

function controlsSha256(packet) {
  return sha256(Buffer.from(JSON.stringify({
    allowed_paths: packet.allowed_paths,
    allowed_ignored_paths: packet.allowed_ignored_paths,
    environment_names: packet.environment_names,
    timeout_ms: packet.timeout_ms,
    check_timeout_ms: packet.check_timeout_ms,
    intervention_budget: packet.intervention_budget,
    remediation_generation_budget: packet.remediation_generation_budget,
    visible_checks: packet.visible_checks,
    held_out_checks: packet.held_out_checks,
    execution_manifest_sha256: packet.execution_manifest_sha256,
    environment_sha256: packet.environment_sha256,
  })));
}

function requireString(value, label) {
  if (typeof value !== "string" || value === "") fail(`${label} is required`);
}

function requireExact(value, expected, label) {
  if (value !== expected) fail(`${label} does not match the invocation packet`);
}

function outsidePath(repository, target, label) {
  const relative = path.relative(repository, target);
  if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) fail(`${label} must be outside the builder repository`);
}

function runChecks(checks, repository, timeoutMs, evidenceDirectory, prefix, environment) {
  return checks.map((command, index) => {
    const result = spawnSync(command[0], command.slice(1), {
      cwd: repository,
      encoding: "utf8",
      timeout: timeoutMs,
      maxBuffer: 64 * 1024 * 1024,
      env: environment,
    });
    const stdoutPath = `${prefix}-${index + 1}.stdout.log`;
    const stderrPath = `${prefix}-${index + 1}.stderr.log`;
    fs.writeFileSync(path.join(evidenceDirectory, stdoutPath), result.stdout ?? "");
    fs.writeFileSync(path.join(evidenceDirectory, stderrPath), result.stderr ?? result.error?.message ?? "");
    return {
      command,
      status: result.status,
      signal: result.signal,
      stdout_path: stdoutPath,
      stderr_path: stderrPath,
      stdout_sha256: sha256(result.stdout ?? ""),
      stderr_sha256: sha256(result.stderr ?? result.error?.message ?? ""),
    };
  });
}

export async function finalizeNativeBuilderArm(
  invocationPacketPath,
  approvedInvocationPacketSha256,
  attestationPath,
  approvedAttestationSha256,
) {
  const packetBytes = fs.readFileSync(path.resolve(invocationPacketPath));
  if (sha256(packetBytes) !== approvedInvocationPacketSha256) fail("invocation packet hash mismatch");
  const packet = JSON.parse(packetBytes.toString("utf8"));
  if (packet.packet_type !== "native-codex-collaboration-invocation-v1") fail("invocation packet type is invalid");
  if (packet.producer_version !== PRODUCER_VERSION || packet.finalizer_version !== FINALIZER_VERSION) {
    fail("producer/finalizer version mismatch in invocation packet");
  }
  if (fs.realpathSync(path.resolve(invocationPacketPath)) !== path.resolve(packet.invocation_packet_path ?? "")) {
    fail("invocation packet path does not match its prepared producer identity");
  }
  const promptBytes = fs.readFileSync(path.resolve(packet.prompt_path));
  if (sha256(promptBytes) !== packet.prompt_sha256) fail("approved prompt identity changed after prepare");
  const workerPacketBytes = fs.readFileSync(path.resolve(packet.worker_packet_path));
  if (sha256(workerPacketBytes) !== packet.worker_packet_sha256) fail("worker packet content identity mismatch");
  const workerPacket = JSON.parse(workerPacketBytes.toString("utf8"));
  if (workerPacket.packet_type !== "native-codex-worker-invocation-v1") fail("worker packet type is invalid");
  if (Buffer.from(workerPacket.prompt_base64, "base64").compare(promptBytes) !== 0) fail("worker packet prompt identity mismatch");
  for (const field of ["invocation_id", "experiment_id", "arm_id", "run_nonce", "model", "reasoning_effort", "repository", "baseline_commit", "baseline_tree", "prompt_sha256"]) {
    requireExact(workerPacket[field], packet[field], `worker packet ${field}`);
  }
  if ("held_out_checks" in workerPacket || "evidence_directory" in workerPacket || "result_path" in workerPacket) {
    fail("worker packet exposes root-only held-out or evidence fields");
  }
  const attestationBytes = fs.readFileSync(path.resolve(attestationPath));
  if (sha256(attestationBytes) !== approvedAttestationSha256) fail("native attestation hash mismatch");
  const attestation = JSON.parse(attestationBytes.toString("utf8"));
  for (const key of Object.keys(attestation)) if (!ATTESTATION_KEYS.has(key)) fail(`unsupported native attestation field: ${key}`);
  if (attestation.model !== "gpt-5.6-sol") fail("attested native model must be gpt-5.6-sol");
  if (attestation.reasoning_effort !== "high") fail("attested native reasoning effort must be high");
  if (!SHA256.test(attestation.completion_evidence_sha256 ?? "")) {
    fail("completion evidence hash is required");
  }
  if (attestation.schema_version !== 1 || attestation.attestation_type !== "codex-collaboration-subagent-builder-attestation-v1") {
    fail("native attestation type is invalid");
  }
  requireExact(attestation.producer_version, PRODUCER_VERSION, "attestation producer_version");
  requireExact(attestation.finalizer_version, FINALIZER_VERSION, "attestation finalizer_version");
  requireExact(attestation.invocation_packet_sha256, approvedInvocationPacketSha256, "attestation invocation_packet_sha256");
  for (const field of ["invocation_id", "experiment_id", "arm_id", "run_nonce", "repository", "baseline_commit", "baseline_tree", "start_head", "start_index_tree", "start_ref", "start_ref_target", "start_status_sha256", "prompt_sha256", "runner_config_sha256"]) {
    requireExact(attestation[field], packet[field], `attestation ${field}`);
  }
  requireExact(attestation.execution_surface, "codex-collaboration-subagent", "attestation execution_surface");
  requireString(attestation.canonical_task, "attestation.canonical_task");
  if (!attestation.canonical_task.startsWith("/root/")) fail("attestation.canonical_task must name a collaboration subagent task");
  requireString(attestation.run_id, "attestation.run_id");
  requireString(attestation.platform_version, "attestation.platform_version");
  if (attestation.status !== "completed" || attestation.agent_timed_out !== false) {
    fail("failed or timeout native run cannot be finalized as success");
  }
  if (attestation.manual_edits !== false) fail("manual edits must be rejected or recorded as an intervention");
  if (!Array.isArray(attestation.intervention_events)) fail("intervention_events must be an array");
  if (attestation.intervention_events.length > packet.intervention_budget) fail("recorded interventions exceed the approved budget");
  const startedAt = Date.parse(attestation.started_at);
  const finishedAt = Date.parse(attestation.finished_at);
  if (!Number.isFinite(startedAt) || !Number.isFinite(finishedAt) || finishedAt < startedAt) fail("attestation timestamps are invalid");
  const durationMs = finishedAt - startedAt;
  if (durationMs > packet.timeout_ms) fail("native run exceeded the approved timeout budget");
  const expectedControlsSha256 = controlsSha256(packet);
  requireExact(packet.controls_sha256, expectedControlsSha256, "invocation packet controls_sha256");
  requireExact(attestation.controls_sha256, expectedControlsSha256, "attestation controls_sha256");
  requireExact(attestation.worker_packet_sha256, packet.worker_packet_sha256, "attestation worker_packet_sha256");
  requireExact(attestation.observed_prompt_sha256, packet.prompt_sha256, "attestation observed_prompt_sha256");

  const repository = fs.realpathSync(path.resolve(packet.repository));
  const identity = repositoryIdentity(repository);
  requireExact(identity.repository, packet.repository, "repository identity");
  requireExact(identity.git_common_dir, packet.git_common_dir, "git common-dir identity");
  requireExact(identity.git_dir, packet.git_dir, "git worktree identity");
  requireExact(attestation.repository, repository, "attestation repository");
  outsidePath(repository, path.resolve(attestationPath), "native attestation");
  const completionPath = path.resolve(attestation.completion_evidence_path ?? "");
  outsidePath(repository, completionPath, "completion evidence");
  const completionBytes = fs.readFileSync(completionPath);
  if (sha256(completionBytes) !== attestation.completion_evidence_sha256) fail("completion evidence hash mismatch");
  const completion = JSON.parse(completionBytes.toString("utf8"));
  for (const key of Object.keys(completion)) if (!COMPLETION_KEYS.has(key)) fail(`unsupported completion evidence field: ${key}`);
  if (completion.schema_version !== 1 || completion.evidence_type !== "codex-collaboration-subagent-completion-v1") fail("completion evidence type is invalid");
  for (const field of ["invocation_id", "experiment_id", "arm_id", "model", "reasoning_effort"]) {
    requireExact(completion[field], packet[field], `completion ${field}`);
  }
  requireExact(completion.invocation_packet_sha256, approvedInvocationPacketSha256, "completion invocation_packet_sha256");
  requireExact(completion.canonical_task, attestation.canonical_task, "completion canonical_task");
  requireExact(completion.run_id, attestation.run_id, "completion run_id");
  requireExact(completion.controls_sha256, expectedControlsSha256, "completion controls_sha256");
  requireExact(completion.worker_packet_sha256, packet.worker_packet_sha256, "completion worker_packet_sha256");
  requireExact(completion.observed_prompt_sha256, packet.prompt_sha256, "completion observed_prompt_sha256");
  if (completion.status !== "completed") fail("incomplete completion evidence cannot finalize a successful native result");
  requireString(completion.returned_completion, "completion.returned_completion");
  if (!Array.isArray(completion.changed_paths) || completion.changed_paths.some((row) => typeof row !== "string")) {
    fail("completion.changed_paths must be a string array");
  }

  const finalHead = git(repository, ["rev-parse", "HEAD"]).stdout.trim();
  const finalIndexTree = git(repository, ["write-tree"]).stdout.trim();
  const refResult = git(repository, ["symbolic-ref", "-q", "HEAD"], "utf8", true);
  const finalRef = refResult.status === 0 ? refResult.stdout.trim() : "DETACHED";
  const finalRefTarget = finalRef === "DETACHED" ? finalHead : git(repository, ["rev-parse", finalRef]).stdout.trim();
  requireExact(attestation.end_head, finalHead, "attestation end_head");
  requireExact(attestation.end_index_tree, finalIndexTree, "attestation end_index_tree");
  requireExact(attestation.end_ref, finalRef, "attestation end_ref");
  requireExact(attestation.end_ref_target, finalRefTarget, "attestation end_ref_target");
  if (finalHead !== packet.baseline_commit) fail("native builder moved HEAD from the approved baseline");
  if (finalIndexTree !== packet.start_index_tree) fail("native builder mutated the Git index");
  if (finalRef !== packet.start_ref || finalRefTarget !== packet.start_ref_target) fail("native builder changed the checked-out ref");

  const paths = changedPaths(repository, packet.baseline_commit);
  const outside = paths.filter((target) => !pathAllowed(target, packet.allowed_paths));
  if (outside.length > 0) fail(`changed paths outside allowed paths: ${outside.join(", ")}`);
  if (JSON.stringify(completion.changed_paths) !== JSON.stringify(paths)) fail("completion evidence changed_paths does not match the final working state");
  const workingState = workingStateSha256(repository, paths);
  requireExact(completion.observed_working_state_sha256, workingState, "completion observed_working_state_sha256");
  const ignoredFinalSha256 = ignoredState(repository, packet.allowed_ignored_paths);
  if (ignoredFinalSha256 !== packet.ignored_baseline_sha256) fail("native builder changed ignored-file state");

  const evidenceDirectory = fs.realpathSync(path.resolve(packet.evidence_directory));
  const resultPath = path.resolve(packet.result_path);
  const receiptPath = path.resolve(packet.finalize_receipt_path);
  if (path.dirname(resultPath) !== evidenceDirectory || path.dirname(receiptPath) !== evidenceDirectory) {
    fail("native result or finalize receipt path is cross-wired");
  }
  if (fs.existsSync(resultPath) || fs.existsSync(receiptPath)) fail("native invocation attestation has already been finalized");
  const environment = Object.fromEntries(packet.environment_names.filter((name) => typeof process.env[name] === "string").map((name) => [name, process.env[name]]));
  const currentExecution = executionManifest([...packet.visible_checks, ...packet.held_out_checks], environment);
  requireExact(currentExecution.sha256, packet.execution_manifest_sha256, "execution manifest content identity");
  requireExact(currentExecution.manifest.environment_sha256, packet.environment_sha256, "execution environment identity");
  const preCheckState = repositoryState(repository, packet.baseline_commit, packet.allowed_ignored_paths);
  const visibleChecks = runChecks(packet.visible_checks, repository, packet.check_timeout_ms, evidenceDirectory, "visible", environment);
  assertStateUnchanged(repositoryState(repository, packet.baseline_commit, packet.allowed_ignored_paths), preCheckState, "visible checks");
  requireExact(executionManifest([...packet.visible_checks, ...packet.held_out_checks], environment).sha256, packet.execution_manifest_sha256, "post-visible execution manifest content identity");
  const heldOutChecks = runChecks(packet.held_out_checks, repository, packet.check_timeout_ms, evidenceDirectory, "held-out", environment);
  assertStateUnchanged(repositoryState(repository, packet.baseline_commit, packet.allowed_ignored_paths), preCheckState, "held-out checks");
  requireExact(executionManifest([...packet.visible_checks, ...packet.held_out_checks], environment).sha256, packet.execution_manifest_sha256, "post-held-out execution manifest content identity");
  if (![...visibleChecks, ...heldOutChecks].every((check) => check.status === 0)) fail("native builder checks failed");

  const result = {
    schema_version: 1,
    experiment_id: packet.experiment_id,
    arm_id: packet.arm_id,
    run_nonce: packet.run_nonce,
    model: packet.model,
    reasoning_effort: packet.reasoning_effort,
    runner: "codex-collaboration-subagent-builder-v1",
    producer_version: PRODUCER_VERSION,
    finalizer_version: FINALIZER_VERSION,
    runner_config_sha256: packet.runner_config_sha256,
    result_path: resultPath,
    repository: packet.repository,
    git_common_dir: packet.git_common_dir,
    git_dir: packet.git_dir,
    environment_sha256: packet.environment_sha256,
    execution_manifest: packet.execution_manifest,
    execution_manifest_sha256: packet.execution_manifest_sha256,
    worker_packet_path: packet.worker_packet_path,
    worker_packet_sha256: packet.worker_packet_sha256,
    native_invocation_packet_sha256: approvedInvocationPacketSha256,
    native_invocation_packet_path: packet.invocation_packet_path,
    native_attestation_sha256: approvedAttestationSha256,
    native_attestation_path: path.resolve(attestationPath),
    completion_evidence_sha256: attestation.completion_evidence_sha256,
    completion_evidence_path: completionPath,
    native_finalize_receipt_path: receiptPath,
    native_run_id: attestation.run_id,
    canonical_task: attestation.canonical_task,
    agent_version: attestation.platform_version,
    baseline_commit: packet.baseline_commit,
    baseline_tree: packet.baseline_tree,
    prompt_sha256: packet.prompt_sha256,
    allowed_paths: packet.allowed_paths,
    allowed_ignored_paths: packet.allowed_ignored_paths,
    ignored_baseline_sha256: packet.ignored_baseline_sha256,
    started_at: attestation.started_at,
    finished_at: attestation.finished_at,
    duration_ms: durationMs,
    timeout_ms: packet.timeout_ms,
    check_timeout_ms: packet.check_timeout_ms,
    intervention_budget: packet.intervention_budget,
    remediation_generation_budget: packet.remediation_generation_budget,
    status: "completed",
    agent_timed_out: false,
    changed_paths: paths,
    final_head: finalHead,
    final_index_tree: finalIndexTree,
    final_ref: finalRef,
    final_ref_target: finalRefTarget,
    staged_paths: nulPaths(git(repository, ["diff", "--cached", "--name-only", "-z"], null).stdout),
    outside_allowed_paths: outside,
    ignored_state_changed_paths: [],
    ignored_final_sha256: ignoredFinalSha256,
    working_state_sha256: workingState,
    visible_checks: visibleChecks,
    held_out_checks: heldOutChecks,
    environment_names: packet.environment_names,
    intervention_events: attestation.intervention_events,
    manual_edits: attestation.manual_edits,
    completion_return_sha256: sha256(completion.returned_completion),
    trust_boundary: "Auditable root-orchestrator attestation bound to deterministic repository evidence; no cryptographic provider signature is claimed.",
  };
  const resultBytes = Buffer.from(`${JSON.stringify(result, null, 2)}\n`);
  fs.writeFileSync(resultPath, resultBytes, { flag: "wx" });
  const receipt = {
    schema_version: 1,
    invocation_packet_sha256: approvedInvocationPacketSha256,
    native_attestation_sha256: approvedAttestationSha256,
    completion_evidence_sha256: attestation.completion_evidence_sha256,
    result_sha256: sha256(resultBytes),
  };
  fs.writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, { flag: "wx" });
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [packetPath, packetSha256, attestationPath, attestationSha256] = process.argv.slice(2);
  if (!packetPath || !packetSha256 || !attestationPath || !attestationSha256) {
    console.error("usage: finalize-native-builder-arm.mjs <invocation-packet.json> <approved-packet-sha256> <attestation.json> <approved-attestation-sha256>");
    process.exit(2);
  }
  try {
    console.log(JSON.stringify(await finalizeNativeBuilderArm(packetPath, packetSha256, attestationPath, attestationSha256), null, 2));
  } catch (error) {
    console.error(`native builder finalize failed: ${error.message}`);
    process.exit(1);
  }
}
