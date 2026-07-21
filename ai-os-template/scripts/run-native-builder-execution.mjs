#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  changedPaths,
  ignoredStateSha256,
  pathAllowed,
  repositoryIdentity,
  repositoryState,
  safeEnvironment,
  workingStateSha256,
} from "./builder-execution-contract.mjs";
import { nativeCodexCapabilityProbeContract, nativeCodexExecContract, parseNativeCodexTranscript } from "./native-codex-exec-contract.mjs";

const PRODUCER_VERSION = "native-codex-exec-producer-v5";
const FINALIZER_VERSION = "native-codex-exec-finalizer-v5";

function sha256(value) {
  return `sha256:${crypto.createHash("sha256").update(value).digest("hex")}`;
}

function fail(message) {
  throw new Error(message);
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

function controlsSha256(packet) {
  return sha256(Buffer.from(JSON.stringify({
    allowed_paths: packet.allowed_paths,
    allowed_ignored_paths: packet.allowed_ignored_paths,
    environment_names: packet.environment_names,
    timeout_ms: packet.timeout_ms,
    check_timeout_ms: packet.check_timeout_ms,
    intervention_budget: packet.intervention_budget,
    remediation_generation_budget: packet.remediation_generation_budget,
    remediation_generation: packet.remediation_generation,
    visible_checks: packet.visible_checks,
    held_out_checks: packet.held_out_checks,
    held_out_evaluator_self_tests: packet.held_out_evaluator_self_tests.map((row) => row.command),
    execution_manifest_sha256: packet.execution_manifest_sha256,
    environment_sha256: packet.environment_sha256,
  })));
}

function resolveExecutable(executable, environment) {
  const candidates = path.isAbsolute(executable)
    ? [executable]
    : String(environment.PATH ?? "").split(path.delimiter).filter(Boolean).map((entry) => path.join(entry, executable));
  const found = candidates.find((candidate) => {
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      return fs.statSync(candidate).isFile();
    } catch {
      return false;
    }
  });
  if (!found) fail(`cannot resolve native Codex executable: ${executable}`);
  return fs.realpathSync(found);
}

const NATIVE_CODEX_TARGETS = Object.freeze({
  "darwin:arm64": ["codex-darwin-arm64", "aarch64-apple-darwin"],
  "darwin:x64": ["codex-darwin-x64", "x86_64-apple-darwin"],
  "linux:arm64": ["codex-linux-arm64", "aarch64-unknown-linux-musl"],
  "linux:x64": ["codex-linux-x64", "x86_64-unknown-linux-musl"],
  "win32:arm64": ["codex-win32-arm64", "aarch64-pc-windows-msvc"],
  "win32:x64": ["codex-win32-x64", "x86_64-pc-windows-msvc"],
});

export function resolveNativeCodexExecutable(resolvedExecutablePath) {
  const launcher = fs.realpathSync(resolvedExecutablePath);
  if (path.basename(launcher) !== "codex.js" || path.basename(path.dirname(launcher)) !== "bin") return launcher;
  const target = NATIVE_CODEX_TARGETS[`${process.platform}:${process.arch}`];
  if (!target) fail(`unsupported native Codex platform: ${process.platform}/${process.arch}`);
  const [platformPackage, targetTriple] = target;
  const packageRoot = path.dirname(path.dirname(launcher));
  const executableName = process.platform === "win32" ? "codex.exe" : "codex";
  const candidates = [
    path.join(packageRoot, "node_modules", "@openai", platformPackage, "vendor", targetTriple, "bin", executableName),
    path.join(packageRoot, "vendor", targetTriple, "bin", executableName),
  ];
  for (const candidate of candidates) {
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      if (fs.statSync(candidate).isFile()) return fs.realpathSync(candidate);
    } catch {
      // Continue to the next package-layout candidate.
    }
  }
  fail(`cannot resolve native Codex runtime behind launcher: ${launcher}`);
}

async function runProcess(executable, args, stdin, options) {
  return await new Promise((resolve) => {
    const startedAt = Date.now();
    const child = spawn(executable, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: ["pipe", "pipe", "pipe"],
    });
    const stdout = [];
    const stderr = [];
    let timedOut = false;
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve({ ...value, timed_out: timedOut, duration_ms: Date.now() - startedAt, stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr) });
    };
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 2000).unref();
    }, options.timeoutMs);
    child.on("error", (error) => {
      clearTimeout(timer);
      stderr.push(Buffer.from(error.message));
      finish({ status: null, signal: null });
    });
    child.on("close", (status, signal) => {
      clearTimeout(timer);
      finish({ status, signal });
    });
    child.stdin.end(stdin);
  });
}

export async function runNativeBuilderExecution(
  invocationPacketPath,
  approvedInvocationPacketSha256,
  testOverrides = {},
) {
  const packetPath = fs.realpathSync(path.resolve(invocationPacketPath));
  const packetBytes = fs.readFileSync(packetPath);
  if (sha256(packetBytes) !== approvedInvocationPacketSha256) fail("invocation packet hash mismatch");
  const packet = JSON.parse(packetBytes.toString("utf8"));
  if (packet.packet_type !== "native-codex-exec-invocation-v5") fail("invocation packet type is invalid");
  if (packet.producer_version !== PRODUCER_VERSION || packet.finalizer_version !== FINALIZER_VERSION) fail("native Codex exec producer/finalizer version mismatch");
  if (packetPath !== path.resolve(packet.invocation_packet_path ?? "")) fail("invocation packet path does not match its prepared identity");

  const environment = safeEnvironment();
  const requestedExecutable = testOverrides.codexExecutable ?? packet.codex_executable_path;
  const executablePath = resolveNativeCodexExecutable(resolveExecutable(requestedExecutable, environment));
  if (executablePath !== packet.codex_executable_path) fail("launch does not use the approved Codex executable path");
  const executableSha256 = sha256(fs.readFileSync(executablePath));
  if (executableSha256 !== packet.codex_executable_sha256) fail("launch does not use the approved Codex executable SHA-256 identity");
  const prefix = testOverrides.codexPrefixArgs ?? [];
  const versionResult = testOverrides.codexVersion === undefined
    ? spawnSync(executablePath, [...prefix, "--version"], { encoding: "utf8", env: environment })
    : null;
  if (versionResult && versionResult.status !== 0) fail("native Codex version preflight failed");
  const codexVersion = testOverrides.codexVersion ?? String(versionResult.stdout ?? "").trim();
  if (codexVersion === "") fail("native Codex version preflight returned no version");
  if (codexVersion !== packet.codex_version) fail("launch does not use the approved Codex version identity");

  const evidenceDirectory = fs.realpathSync(path.resolve(packet.evidence_directory));
  const transcriptPath = path.join(evidenceDirectory, "native-codex.stdout.jsonl");
  const stderrPath = path.join(evidenceDirectory, "native-codex.stderr.log");
  const completionPath = path.join(evidenceDirectory, "native-completion.json");
  const attestationPath = path.join(evidenceDirectory, "native-attestation.json");
  const executionClaimPath = path.join(evidenceDirectory, "native-execution-claim.json");
  const capabilityProbePath = path.join(evidenceDirectory, "native-capability-probe.json");
  const capabilityProbeStdoutPath = path.join(evidenceDirectory, "native-capability-probe.stdout.log");
  const capabilityProbeStderrPath = path.join(evidenceDirectory, "native-capability-probe.stderr.log");
  const featureInventoryStdoutPath = path.join(evidenceDirectory, "native-feature-inventory.stdout.log");
  const featureInventoryStderrPath = path.join(evidenceDirectory, "native-feature-inventory.stderr.log");
  if ([transcriptPath, stderrPath, completionPath, attestationPath, executionClaimPath, capabilityProbePath, capabilityProbeStdoutPath, capabilityProbeStderrPath, featureInventoryStdoutPath, featureInventoryStderrPath, packet.result_path, packet.finalize_receipt_path].some((target) => fs.existsSync(target))) {
    fail("native invocation identity has already produced execution evidence");
  }
  const executionClaimSha256 = writeExclusiveClaim(executionClaimPath, {
    schema_version: 1,
    claim_type: "native-codex-execution-claim-v1",
    invocation_packet_sha256: approvedInvocationPacketSha256,
    invocation_id: packet.invocation_id,
    experiment_id: packet.experiment_id,
    arm_id: packet.arm_id,
    run_nonce: packet.run_nonce,
  }, "native invocation identity");

  const workerPacketBytes = fs.readFileSync(path.resolve(packet.worker_packet_path));
  if (sha256(workerPacketBytes) !== packet.worker_packet_sha256) fail("worker packet content identity mismatch");
  const launchContract = nativeCodexExecContract(workerPacketBytes, packet.worker_packet_sha256);
  const repository = fs.realpathSync(path.resolve(packet.repository));
  const identity = repositoryIdentity(repository);
  if (identity.repository !== packet.repository || identity.git_common_dir !== packet.git_common_dir || identity.git_dir !== packet.git_dir) {
    fail("native Codex repository identity changed after prepare");
  }
  const startState = repositoryState(repository, packet.baseline_commit, packet.allowed_ignored_paths);
  if (
    startState.head !== packet.start_head ||
    startState.index_tree !== packet.start_index_tree ||
    startState.ref !== packet.start_ref ||
    startState.ref_target !== packet.start_ref_target ||
    startState.status_sha256 !== packet.start_status_sha256 ||
    startState.working_state_sha256 !== packet.start_working_state_sha256
  ) fail("native Codex repository state changed after prepare");

  const visibleExecutablePath = packet.execution_manifest?.checks?.[0]?.executable_path;
  const heldOutExecutablePath = packet.execution_manifest?.checks?.[packet.visible_checks.length]?.executable_path;
  if (typeof visibleExecutablePath !== "string" || typeof heldOutExecutablePath !== "string") {
    fail("native capability probe requires at least one visible and one held-out executable");
  }
  const probeContract = nativeCodexCapabilityProbeContract(launchContract, {
    repository,
    visible_command_path: packet.visible_checks[0][0],
    visible_executable_path: visibleExecutablePath,
    held_out_executable_path: heldOutExecutablePath,
    root_evidence_path: packet.invocation_packet_path,
    codex_executable_path: executablePath,
  });
  const featureArgs = ["features", "list", ...launchContract.disabled_features.flatMap((feature) => ["--disable", feature])];
  const featureResult = spawnSync(executablePath, [...prefix, ...featureArgs], { encoding: null, env: environment, maxBuffer: 16 * 1024 * 1024 });
  const featureStdout = Buffer.from(featureResult.stdout ?? "");
  const featureStderr = Buffer.from(featureResult.stderr ?? "");
  fs.writeFileSync(featureInventoryStdoutPath, featureStdout, { flag: "wx" });
  fs.writeFileSync(featureInventoryStderrPath, featureStderr, { flag: "wx" });
  if (featureResult.status !== 0) fail("native Codex effective feature inventory failed");
  const effectiveFeatures = new Map(Buffer.from(featureStdout).toString("utf8").split("\n").filter(Boolean).map((line) => {
    const columns = line.trim().split(/\s+/);
    return [columns[0], columns.at(-1)];
  }));
  for (const feature of launchContract.disabled_features) {
    if (effectiveFeatures.get(feature) !== "false") fail(`native Codex feature ${feature} is not observed disabled`);
  }
  const probeTmpPath = path.join(os.tmpdir(), `native-capability-probe-${packet.invocation_id.slice("sha256:".length)}`);
  const probeResult = spawnSync(executablePath, [...prefix, ...probeContract.argv], {
    encoding: null,
    env: { ...environment, ...probeContract.environment, PROOF_PROBE_TMP_PATH: probeTmpPath },
    maxBuffer: 16 * 1024 * 1024,
    timeout: 30_000,
  });
  const probeStdout = Buffer.from(probeResult.stdout ?? "");
  const probeStderr = Buffer.from(probeResult.stderr ?? "");
  fs.writeFileSync(capabilityProbeStdoutPath, probeStdout, { flag: "wx" });
  fs.writeFileSync(capabilityProbeStderrPath, probeStderr, { flag: "wx" });
  if (probeResult.status !== 0) fail("native Codex capability probe process failed");
  const observations = {};
  for (const line of probeStdout.toString("utf8").split("\n").filter(Boolean)) {
    const [label, rawStatus, ...extra] = line.split("\t");
    if (!(label in probeContract.expected) || extra.length > 0 || !/^\d+$/.test(rawStatus ?? "") || label in observations) {
      fail("native Codex capability probe output is invalid");
    }
    observations[label] = { status: Number(rawStatus) };
  }
  for (const [label, expected] of Object.entries(probeContract.expected)) {
    const status = observations[label]?.status;
    if (status === undefined || (expected === 0 ? status !== 0 : status === 0)) fail(`native Codex capability probe failed: ${label}`);
  }
  if (!fs.existsSync(probeTmpPath)) {
    fail("native Codex capability probe did not write to the temporary directory");
  }
  fs.rmSync(probeTmpPath, { force: true });
  const capabilityProbeEvidence = {
    schema_version: 1,
    evidence_type: "native-codex-capability-probe-v1",
    invocation_packet_sha256: approvedInvocationPacketSha256,
    codex_executable_path: executablePath,
    codex_executable_sha256: executableSha256,
    codex_version: codexVersion,
    launch_contract_sha256: launchContract.sha256,
    capability_probe_contract_sha256: probeContract.sha256,
    feature_inventory_stdout_path: featureInventoryStdoutPath,
    feature_inventory_stdout_sha256: sha256(featureStdout),
    feature_inventory_stderr_path: featureInventoryStderrPath,
    feature_inventory_stderr_sha256: sha256(featureStderr),
    capability_probe_stdout_path: capabilityProbeStdoutPath,
    capability_probe_stdout_sha256: sha256(probeStdout),
    capability_probe_stderr_path: capabilityProbeStderrPath,
    capability_probe_stderr_sha256: sha256(probeStderr),
    disabled_features: launchContract.disabled_features,
    observations,
    passed: true,
  };
  const capabilityProbeBytes = Buffer.from(`${JSON.stringify(capabilityProbeEvidence, null, 2)}\n`);
  fs.writeFileSync(capabilityProbePath, capabilityProbeBytes, { flag: "wx" });
  const capabilityProbeEvidenceSha256 = sha256(capabilityProbeBytes);

  const startedAt = new Date().toISOString();
  const processResult = await runProcess(
    executablePath,
    [...prefix, ...launchContract.argv],
    launchContract.stdin,
    { cwd: repository, env: environment, timeoutMs: packet.timeout_ms },
  );
  const finishedAt = new Date().toISOString();
  fs.writeFileSync(transcriptPath, processResult.stdout, { flag: "wx" });
  fs.writeFileSync(stderrPath, processResult.stderr, { flag: "wx" });
  if (processResult.status !== 0 || processResult.timed_out) fail("native Codex exec failed or timed out");
  const transcript = parseNativeCodexTranscript(processResult.stdout);

  const endState = repositoryState(repository, packet.baseline_commit, packet.allowed_ignored_paths);
  if (endState.head !== packet.baseline_commit) fail("native Codex exec moved HEAD");
  if (endState.index_tree !== packet.start_index_tree) fail("native Codex exec mutated the Git index");
  if (endState.ref !== packet.start_ref || endState.ref_target !== packet.start_ref_target) fail("native Codex exec changed the checked-out ref");
  if (endState.ignored_state_sha256 !== packet.ignored_baseline_sha256) fail("native Codex exec changed ignored-file state");
  const paths = changedPaths(repository, packet.baseline_commit);
  const outside = paths.filter((target) => !pathAllowed(target, packet.allowed_paths));
  if (outside.length > 0) fail(`native Codex exec changed paths outside allowed paths: ${outside.join(", ")}`);
  const workingState = workingStateSha256(repository, paths);
  const expectedControlsSha256 = controlsSha256(packet);
  if (packet.controls_sha256 !== expectedControlsSha256) fail("invocation packet controls identity is invalid");

  const completion = {
    schema_version: 1,
    evidence_type: "codex-exec-completion-v5",
    invocation_packet_sha256: approvedInvocationPacketSha256,
    invocation_id: packet.invocation_id,
    experiment_id: packet.experiment_id,
    arm_id: packet.arm_id,
    native_session_id: transcript.sessionId,
    run_id: transcript.sessionId,
    model: packet.model,
    reasoning_effort: packet.reasoning_effort,
    status: "completed",
    controls_sha256: expectedControlsSha256,
    worker_packet_sha256: packet.worker_packet_sha256,
    observed_prompt_sha256: packet.prompt_sha256,
    changed_paths: paths,
    observed_working_state_sha256: workingState,
    returned_completion: transcript.returnedCompletion,
  };
  const completionBytes = Buffer.from(`${JSON.stringify(completion, null, 2)}\n`);
  fs.writeFileSync(completionPath, completionBytes, { flag: "wx" });

  const attestation = {
    schema_version: 1,
    attestation_type: "codex-exec-builder-attestation-v5",
    producer_version: PRODUCER_VERSION,
    finalizer_version: FINALIZER_VERSION,
    invocation_packet_sha256: approvedInvocationPacketSha256,
    invocation_id: packet.invocation_id,
    experiment_id: packet.experiment_id,
    arm_id: packet.arm_id,
    run_nonce: packet.run_nonce,
    native_session_id: transcript.sessionId,
    run_id: transcript.sessionId,
    model: packet.model,
    reasoning_effort: packet.reasoning_effort,
    execution_surface: "codex-exec",
    platform_version: codexVersion,
    codex_executable_path: executablePath,
    codex_executable_sha256: executableSha256,
    launch_contract_sha256: launchContract.sha256,
    capability_probe_contract_sha256: probeContract.sha256,
    capability_probe_evidence_path: capabilityProbePath,
    capability_probe_evidence_sha256: capabilityProbeEvidenceSha256,
    worker_packet_delivery: launchContract.worker_packet_delivery,
    multi_agent_enabled: launchContract.multi_agent_enabled,
    network_access: launchContract.network_access,
    writable_tmp: launchContract.writable_tmp,
    sandbox_mode: launchContract.sandbox_mode,
    permission_profile: launchContract.permission_profile,
    filesystem_read_scope: launchContract.filesystem_read_scope,
    transcript_path: transcriptPath,
    transcript_sha256: sha256(processResult.stdout),
    stderr_path: stderrPath,
    stderr_sha256: sha256(processResult.stderr),
    status: "completed",
    agent_exit_status: processResult.status,
    agent_signal: processResult.signal,
    agent_timed_out: processResult.timed_out,
    started_at: startedAt,
    finished_at: finishedAt,
    repository,
    baseline_commit: packet.baseline_commit,
    baseline_tree: packet.baseline_tree,
    start_head: packet.start_head,
    end_head: endState.head,
    start_index_tree: packet.start_index_tree,
    end_index_tree: endState.index_tree,
    start_ref: packet.start_ref,
    end_ref: endState.ref,
    start_ref_target: packet.start_ref_target,
    end_ref_target: endState.ref_target,
    start_status_sha256: packet.start_status_sha256,
    prompt_sha256: packet.prompt_sha256,
    runner_config_sha256: packet.runner_config_sha256,
    controls_sha256: expectedControlsSha256,
    worker_packet_sha256: packet.worker_packet_sha256,
    observed_prompt_sha256: packet.prompt_sha256,
    completion_evidence_path: completionPath,
    completion_evidence_sha256: sha256(completionBytes),
    intervention_events: [],
    manual_edits: false,
  };
  const attestationBytes = Buffer.from(`${JSON.stringify(attestation, null, 2)}\n`);
  fs.writeFileSync(attestationPath, attestationBytes, { flag: "wx" });
  return {
    attestation_path: attestationPath,
    attestation_sha256: sha256(attestationBytes),
    completion_evidence_path: completionPath,
    completion_evidence_sha256: sha256(completionBytes),
    transcript_path: transcriptPath,
    transcript_sha256: sha256(processResult.stdout),
    stderr_path: stderrPath,
    stderr_sha256: sha256(processResult.stderr),
    native_session_id: transcript.sessionId,
    launch_contract_sha256: launchContract.sha256,
    capability_probe_evidence_path: capabilityProbePath,
    capability_probe_evidence_sha256: capabilityProbeEvidenceSha256,
    execution_claim_path: executionClaimPath,
    execution_claim_sha256: executionClaimSha256,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [packetPath, packetSha256] = process.argv.slice(2);
  if (!packetPath || !packetSha256) {
    console.error("usage: run-native-builder-execution.mjs <native-invocation-packet.json> <approved-packet-sha256>");
    process.exit(2);
  }
  try {
    console.log(JSON.stringify(await runNativeBuilderExecution(packetPath, packetSha256), null, 2));
  } catch (error) {
    console.error(`native Codex execution failed: ${error.message}`);
    process.exit(1);
  }
}
