#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { nativeCodexExecContract, parseNativeCodexTranscript } from "./native-codex-exec-contract.mjs";

const CONTROL_FIELDS = [
  "baseline_commit",
  "baseline_tree",
  "prompt_sha256",
  "allowed_paths",
  "allowed_ignored_paths",
  "ignored_baseline_sha256",
  "timeout_ms",
  "check_timeout_ms",
  "intervention_budget",
  "remediation_generation_budget",
  "environment_names",
  "environment_sha256",
  "execution_manifest_sha256",
];
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const OBJECT_ID = /^[a-f0-9]{40}$/;
const RUNNERS_BY_MODEL = new Map([
  ["composer-2.5", "cursor-agent-paired-builder-v1"],
  ["gpt-5.6-sol", "codex-exec-builder-v4"],
]);

function fail(message) {
  throw new Error(message);
}

function checkCommands(result, field, label) {
  if (!Array.isArray(result[field]) || result[field].length === 0) fail(`${label}.${field} is missing or empty`);
  return result[field].map((row, index) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) fail(`${label}.${field}[${index}] is invalid`);
    requireStringArray(row.command, `${label}.${field}[${index}].command`, { nonEmpty: true });
    if (row.status !== 0) fail(`${label}.${field}[${index}].status must be 0`);
    return row.command;
  });
}

function requireString(value, label) {
  if (typeof value !== "string" || value.trim() === "") fail(`${label} is required`);
}

function requireStringArray(value, label, { nonEmpty = false } = {}) {
  if (!Array.isArray(value) || (nonEmpty && value.length === 0) || value.some((row) => typeof row !== "string" || row === "")) {
    fail(`${label} must be ${nonEmpty ? "a non-empty" : "an"} string array`);
  }
}

function readBoundJson(target, expectedSha256, label) {
  requireString(target, `${label}_path`);
  const bytes = fs.readFileSync(path.resolve(target));
  const actual = `sha256:${crypto.createHash("sha256").update(bytes).digest("hex")}`;
  if (actual !== expectedSha256) fail(`${label} hash mismatch`);
  return JSON.parse(bytes.toString("utf8"));
}

function requireOutside(repository, target, label) {
  const relative = path.relative(fs.realpathSync(repository), fs.realpathSync(path.resolve(target)));
  if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) {
    fail(`${label} must be outside the builder repository`);
  }
}

function validateResult(result, label, resultPath) {
  if (result?.schema_version !== 1) fail(`${label}.schema_version must be 1`);
  for (const field of ["experiment_id", "arm_id", "run_nonce", "model", "runner", "agent_version", "repository", "git_common_dir", "git_dir", "result_path"]) {
    requireString(result[field], `${label}.${field}`);
  }
  if (path.resolve(result.result_path) !== path.resolve(resultPath) || fs.realpathSync(result.result_path) !== fs.realpathSync(resultPath)) {
    fail(`${label}.result_path does not match the canonical validator input`);
  }
  if (result.status !== "completed") fail(`${label}.status must be completed`);
  const expectedRunner = RUNNERS_BY_MODEL.get(result.model);
  if (!expectedRunner) fail(`${label}.model is not an installed paired route`);
  if (result.runner !== expectedRunner) fail(`${label}.runner must be ${expectedRunner}`);
  if (!SHA256.test(result.runner_config_sha256 ?? "")) fail(`${label}.runner_config_sha256 is invalid`);
  if (!OBJECT_ID.test(result.baseline_commit ?? "")) fail(`${label}.baseline_commit is invalid`);
  if (!OBJECT_ID.test(result.baseline_tree ?? "")) fail(`${label}.baseline_tree is invalid`);
  for (const field of ["prompt_sha256", "ignored_baseline_sha256", "environment_sha256", "execution_manifest_sha256"]) {
    if (!SHA256.test(result[field] ?? "")) fail(`${label}.${field} is invalid`);
  }
  requireStringArray(result.allowed_paths, `${label}.allowed_paths`, { nonEmpty: true });
  requireStringArray(result.allowed_ignored_paths, `${label}.allowed_ignored_paths`);
  requireStringArray(result.environment_names, `${label}.environment_names`);
  for (const field of ["timeout_ms", "check_timeout_ms"]) {
    if (!Number.isInteger(result[field]) || result[field] < 1000) fail(`${label}.${field} is invalid`);
  }
  for (const field of ["intervention_budget", "remediation_generation_budget"]) {
    if (!Number.isInteger(result[field]) || result[field] < 0) fail(`${label}.${field} is invalid`);
  }
  checkCommands(result, "visible_checks", label);
  checkCommands(result, "held_out_checks", label);
  if (!result.execution_manifest || typeof result.execution_manifest !== "object" || Array.isArray(result.execution_manifest)) fail(`${label}.execution_manifest is required`);
  const manifestSha256 = `sha256:${crypto.createHash("sha256").update(Buffer.from(JSON.stringify(result.execution_manifest))).digest("hex")}`;
  if (manifestSha256 !== result.execution_manifest_sha256) fail(`${label}.execution_manifest hash mismatch`);
  const expectedCommands = [...result.visible_checks, ...result.held_out_checks].map((row) => row.command);
  if (JSON.stringify(result.execution_manifest.checks?.map((row) => row.command)) !== JSON.stringify(expectedCommands)) fail(`${label}.execution_manifest command binding mismatch`);
  for (const [index, row] of (result.execution_manifest.checks ?? []).entries()) {
    requireString(row.executable_path, `${label}.execution_manifest.checks[${index}].executable_path`);
    if (!SHA256.test(row.executable_sha256 ?? "")) fail(`${label}.execution_manifest.checks[${index}].executable_sha256 is invalid`);
    const executablePath = fs.realpathSync(path.resolve(row.executable_path));
    const executableSha256 = `sha256:${crypto.createHash("sha256").update(fs.readFileSync(executablePath)).digest("hex")}`;
    if (executablePath !== row.executable_path || executableSha256 !== row.executable_sha256) fail(`${label}.execution_manifest executable content identity drift`);
  }
  const currentEnvironment = result.environment_names.map((name) => [name, process.env[name]]);
  if (currentEnvironment.some(([, value]) => typeof value !== "string")) fail(`${label}.execution environment is unavailable`);
  const currentEnvironmentSha256 = `sha256:${crypto.createHash("sha256").update(Buffer.from(JSON.stringify(currentEnvironment))).digest("hex")}`;
  if (currentEnvironmentSha256 !== result.environment_sha256) fail(`${label}.execution environment identity drift`);

  if (result.model === "composer-2.5") {
    if (result.producer_version !== "cursor-agent-producer-v1") fail(`${label}.producer_version must be cursor-agent-producer-v1`);
    if (result.cursor_filesystem_policy !== "trusted-host-external-reads-allowed") fail(`${label}.cursor_filesystem_policy must explicitly allow trusted-host external reads`);
    if (result.filesystem_read_scope !== "host-readable") fail(`${label}.filesystem_read_scope must be host-readable for the trusted-host Composer route`);
    for (const field of ["result_receipt_path", "agent_stdout_sha256", "agent_stderr_sha256", "execution_claim_path", "execution_claim_sha256"]) requireString(result[field], `${label}.${field}`);
    requireOutside(result.repository, result.result_receipt_path, `${label}.Composer result receipt`);
    requireOutside(result.repository, result.execution_claim_path, `${label}.Composer execution claim`);
    const claim = readBoundJson(result.execution_claim_path, result.execution_claim_sha256, `${label}.Composer execution claim`);
    const expectedClaim = {
      schema_version: 1,
      claim_type: "cursor-agent-execution-claim-v1",
      runner_config_sha256: result.runner_config_sha256,
      experiment_id: result.experiment_id,
      arm_id: result.arm_id,
      run_nonce: result.run_nonce,
    };
    if (JSON.stringify(claim) !== JSON.stringify(expectedClaim)) fail(`${label}.Composer execution claim is cross-wired`);
    const receipt = JSON.parse(fs.readFileSync(path.resolve(result.result_receipt_path), "utf8"));
    for (const field of ["producer_version", "experiment_id", "arm_id", "run_nonce", "runner_config_sha256", "agent_stdout_sha256", "agent_stderr_sha256", "execution_claim_sha256"]) {
      if (receipt[field] !== result[field]) fail(`${label}.Composer result receipt is cross-wired: ${field}`);
    }
    const resultSha256 = `sha256:${crypto.createHash("sha256").update(fs.readFileSync(path.resolve(resultPath))).digest("hex")}`;
    if (receipt.result_sha256 !== resultSha256) fail(`${label}.Composer result receipt hash mismatch`);
  }

  if (result.model === "gpt-5.6-sol") {
    if (result.reasoning_effort !== "high") fail(`${label}.reasoning_effort must be high for native Sol`);
    for (const field of ["native_invocation_packet_sha256", "native_attestation_sha256", "completion_evidence_sha256", "launch_contract_sha256", "capability_probe_contract_sha256", "capability_probe_evidence_sha256", "transcript_sha256", "execution_claim_sha256", "finalization_claim_sha256"]) {
      if (!SHA256.test(result[field] ?? "")) fail(`${label}.${field} producer packet identity is required`);
    }
    if (result.producer_version !== "native-codex-exec-producer-v4") fail(`${label}.producer_version must be native-codex-exec-producer-v4`);
    if (result.finalizer_version !== "native-codex-exec-finalizer-v4") fail(`${label}.finalizer_version must be native-codex-exec-finalizer-v4`);
    requireString(result.native_run_id, `${label}.native_run_id`);
    requireString(result.native_session_id, `${label}.native_session_id`);
    if (result.native_run_id !== result.native_session_id) fail(`${label}.native run/session identity is cross-wired`);
    if (result.worker_packet_delivery !== "stdin-bytes" || result.multi_agent_enabled !== false || result.network_access !== false || result.writable_tmp !== true || result.sandbox_mode !== "permission-profile" || result.permission_profile !== "native-proof-builder" || result.filesystem_read_scope !== "minimal+workspace+approved-toolchain") {
      fail(`${label}.native Codex execution controls are invalid`);
    }
    const packet = readBoundJson(result.native_invocation_packet_path, result.native_invocation_packet_sha256, `${label}.native invocation packet`);
    if (packet.packet_type !== "native-codex-exec-invocation-v4") fail(`${label}.native invocation packet type is invalid`);
    requireString(packet.repository, `${label}.native invocation packet repository`);
    const repository = fs.realpathSync(path.resolve(packet.repository));
    if (path.resolve(packet.result_path ?? "") !== path.resolve(resultPath)) fail(`${label}.native result path is not the prepared canonical result path`);
    for (const [artifactLabel, artifactPath] of [
      ["native invocation packet", result.native_invocation_packet_path],
      ["native attestation", result.native_attestation_path],
      ["completion evidence", result.completion_evidence_path],
      ["capability probe evidence", result.capability_probe_evidence_path],
      ["native transcript", result.transcript_path],
      ["native finalize receipt", result.native_finalize_receipt_path],
      ["native execution claim", result.execution_claim_path],
      ["native finalization claim", result.finalization_claim_path],
      ["native result", resultPath],
    ]) requireOutside(repository, artifactPath, `${label}.${artifactLabel}`);
    const executionClaim = readBoundJson(result.execution_claim_path, result.execution_claim_sha256, `${label}.native execution claim`);
    const expectedExecutionClaim = {
      schema_version: 1,
      claim_type: "native-codex-execution-claim-v1",
      invocation_packet_sha256: result.native_invocation_packet_sha256,
      invocation_id: packet.invocation_id,
      experiment_id: result.experiment_id,
      arm_id: result.arm_id,
      run_nonce: result.run_nonce,
    };
    if (JSON.stringify(executionClaim) !== JSON.stringify(expectedExecutionClaim)) fail(`${label}.native execution claim is cross-wired`);
    const finalizationClaim = readBoundJson(result.finalization_claim_path, result.finalization_claim_sha256, `${label}.native finalization claim`);
    const expectedFinalizationClaim = {
      schema_version: 1,
      claim_type: "native-codex-finalization-claim-v1",
      invocation_packet_sha256: result.native_invocation_packet_sha256,
      native_attestation_sha256: result.native_attestation_sha256,
      invocation_id: packet.invocation_id,
      experiment_id: result.experiment_id,
      arm_id: result.arm_id,
      run_nonce: result.run_nonce,
    };
    if (JSON.stringify(finalizationClaim) !== JSON.stringify(expectedFinalizationClaim)) fail(`${label}.native finalization claim is cross-wired`);
    for (const field of ["experiment_id", "arm_id", "run_nonce", "model", "reasoning_effort", "repository", "git_common_dir", "git_dir", "baseline_commit", "baseline_tree", "prompt_sha256", "runner_config_sha256", "worker_packet_sha256", ...CONTROL_FIELDS]) {
      if (JSON.stringify(packet[field]) !== JSON.stringify(result[field])) fail(`${label}.native invocation packet cross-wiring: ${field}`);
    }
    for (const field of ["visible_checks", "held_out_checks"]) {
      if (JSON.stringify(packet[field]) !== JSON.stringify(checkCommands(result, field, label))) {
        fail(`${label}.native invocation packet cross-wiring: ${field}`);
      }
    }
    const attestation = readBoundJson(result.native_attestation_path, result.native_attestation_sha256, `${label}.native attestation`);
    if (attestation.attestation_type !== "codex-exec-builder-attestation-v4") fail(`${label}.native attestation type is invalid`);
    if (attestation.invocation_packet_sha256 !== result.native_invocation_packet_sha256 || attestation.run_id !== result.native_run_id || attestation.native_session_id !== result.native_session_id) {
      fail(`${label}.native attestation is cross-wired`);
    }
    for (const field of ["experiment_id", "arm_id", "model", "reasoning_effort", "producer_version", "finalizer_version", "prompt_sha256", "runner_config_sha256"]) {
      if (attestation[field] !== (field in result ? result[field] : packet[field])) fail(`${label}.native attestation cross-wiring: ${field}`);
    }
    if (attestation.controls_sha256 !== packet.controls_sha256) fail(`${label}.native attestation cross-wiring: controls_sha256`);
    if (attestation.worker_packet_sha256 !== packet.worker_packet_sha256 || attestation.observed_prompt_sha256 !== packet.prompt_sha256) fail(`${label}.native attestation worker/prompt binding is invalid`);
    if (attestation.status !== "completed" || attestation.agent_exit_status !== 0 || attestation.agent_signal !== null || attestation.agent_timed_out !== false) fail(`${label}.native attestation did not complete`);
    if (attestation.launch_contract_sha256 !== result.launch_contract_sha256 || attestation.worker_packet_delivery !== "stdin-bytes" || attestation.multi_agent_enabled !== false || attestation.network_access !== false || attestation.writable_tmp !== true || attestation.sandbox_mode !== "permission-profile" || attestation.permission_profile !== "native-proof-builder" || attestation.filesystem_read_scope !== "minimal+workspace+approved-toolchain") {
      fail(`${label}.native attestation launch controls are invalid`);
    }
    if (attestation.capability_probe_contract_sha256 !== result.capability_probe_contract_sha256 || attestation.capability_probe_evidence_sha256 !== result.capability_probe_evidence_sha256 || path.resolve(attestation.capability_probe_evidence_path) !== path.resolve(result.capability_probe_evidence_path)) {
      fail(`${label}.native capability probe evidence is cross-wired`);
    }
    const capabilityProbe = readBoundJson(result.capability_probe_evidence_path, result.capability_probe_evidence_sha256, `${label}.native capability probe`);
    if (capabilityProbe.passed !== true || capabilityProbe.invocation_packet_sha256 !== result.native_invocation_packet_sha256 || capabilityProbe.codex_executable_path !== result.codex_executable_path || capabilityProbe.codex_executable_sha256 !== result.codex_executable_sha256) {
      fail(`${label}.native capability probe did not pass or is cross-wired`);
    }
    const transcriptBytes = fs.readFileSync(path.resolve(result.transcript_path));
    if (`sha256:${crypto.createHash("sha256").update(transcriptBytes).digest("hex")}` !== result.transcript_sha256) fail(`${label}.native transcript hash mismatch`);
    if (parseNativeCodexTranscript(transcriptBytes).sessionId !== result.native_session_id) fail(`${label}.native transcript session identity is cross-wired`);
    const completion = readBoundJson(result.completion_evidence_path, result.completion_evidence_sha256, `${label}.completion evidence`);
    if (completion.evidence_type !== "codex-exec-completion-v4" || completion.invocation_packet_sha256 !== result.native_invocation_packet_sha256 || completion.run_id !== result.native_run_id || completion.native_session_id !== result.native_session_id || completion.status !== "completed") {
      fail(`${label}.completion evidence is incomplete or cross-wired`);
    }
    for (const field of ["experiment_id", "arm_id", "model", "reasoning_effort"]) {
      if (completion[field] !== result[field]) fail(`${label}.completion evidence cross-wiring: ${field}`);
    }
    if (completion.controls_sha256 !== packet.controls_sha256) fail(`${label}.completion evidence cross-wiring: controls_sha256`);
    if (completion.worker_packet_sha256 !== packet.worker_packet_sha256 || completion.observed_prompt_sha256 !== packet.prompt_sha256) fail(`${label}.completion worker/prompt binding is invalid`);
    const workerPacket = readBoundJson(packet.worker_packet_path, packet.worker_packet_sha256, `${label}.native worker packet`);
    if (workerPacket.packet_type !== "native-codex-exec-worker-invocation-v4" || "held_out_checks" in workerPacket || "evidence_directory" in workerPacket || "result_path" in workerPacket) {
      fail(`${label}.native worker packet exposes root-only fields`);
    }
    if (nativeCodexExecContract(fs.readFileSync(path.resolve(packet.worker_packet_path)), packet.worker_packet_sha256).sha256 !== result.launch_contract_sha256) {
      fail(`${label}.native launch contract is not reproducible`);
    }
    const receipt = JSON.parse(fs.readFileSync(path.resolve(result.native_finalize_receipt_path), "utf8"));
    for (const field of ["native_invocation_packet_sha256", "native_attestation_sha256", "completion_evidence_sha256", "capability_probe_evidence_sha256", "execution_claim_sha256", "finalization_claim_sha256"]) {
      const receiptField = field === "native_invocation_packet_sha256" ? "invocation_packet_sha256" : field;
      if (receipt[receiptField] !== result[field]) fail(`${label}.native finalize receipt is cross-wired: ${receiptField}`);
    }
    const resultBytes = fs.readFileSync(path.resolve(resultPath));
    const resultSha256 = `sha256:${crypto.createHash("sha256").update(resultBytes).digest("hex")}`;
    if (receipt.result_sha256 !== resultSha256) fail(`${label}.native finalize receipt result hash mismatch`);
  }
}

export function validatePairedControls(leftPath, rightPath) {
  const left = JSON.parse(fs.readFileSync(path.resolve(leftPath), "utf8"));
  const right = JSON.parse(fs.readFileSync(path.resolve(rightPath), "utf8"));
  validateResult(left, "left", leftPath);
  validateResult(right, "right", rightPath);
  if (left.experiment_id !== right.experiment_id) fail("paired results must use the same experiment_id");
  const models = new Set([left.model, right.model]);
  if (models.size !== 2 || !models.has("composer-2.5") || !models.has("gpt-5.6-sol")) {
    fail("paired results must contain the exact Composer 2.5 and native Sol routes");
  }
  if (left.arm_id === right.arm_id) fail("paired results must use distinct arm IDs");
  if (left.run_nonce === right.run_nonce) fail("paired results must use distinct run nonces");
  if (fs.realpathSync(left.repository) === fs.realpathSync(right.repository)) fail("paired results must use distinct canonical worktrees");
  if (fs.realpathSync(left.git_dir) === fs.realpathSync(right.git_dir)) fail("paired results must use distinct Git worktree identities");
  if (left.runner_config_sha256 === right.runner_config_sha256) {
    fail("paired results must bind distinct route-specific runner_config_sha256 values");
  }
  for (const field of CONTROL_FIELDS) {
    if (JSON.stringify(left[field]) !== JSON.stringify(right[field])) fail(`paired control drift: ${field}`);
  }
  for (const field of ["visible_checks", "held_out_checks"]) {
    if (JSON.stringify(checkCommands(left, field, "left")) !== JSON.stringify(checkCommands(right, field, "right"))) {
      fail(`paired control drift: ${field}`);
    }
  }
  return {
    comparable: true,
    models: [...models].sort(),
    route_bindings: Object.fromEntries(RUNNERS_BY_MODEL),
    controlled_fields: [...CONTROL_FIELDS, "visible_checks.command", "held_out_checks.command"],
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [leftPath, rightPath] = process.argv.slice(2);
  if (!leftPath || !rightPath) {
    console.error("usage: validate-paired-builder-controls.mjs <arm-a-result.json> <arm-b-result.json>");
    process.exit(2);
  }
  try {
    console.log(JSON.stringify(validatePairedControls(leftPath, rightPath), null, 2));
  } catch (error) {
    console.error(`paired builder controls invalid: ${error.message}`);
    process.exit(1);
  }
}
