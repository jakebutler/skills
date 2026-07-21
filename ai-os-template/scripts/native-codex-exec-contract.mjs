import crypto from "node:crypto";
import os from "node:os";
import path from "node:path";

const SHA256 = /^sha256:[a-f0-9]{64}$/;
const DISABLED_FEATURES = Object.freeze([
  "multi_agent",
  "multi_agent_v2",
  "enable_fanout",
  "apps",
  "enable_mcp_apps",
  "browser_use",
  "browser_use_external",
  "computer_use",
  "in_app_browser",
  "image_generation",
  "memories",
  "plugins",
  "plugin_sharing",
  "remote_plugin",
  "tool_search",
  "standalone_web_search",
  "search_tool",
]);

const PERMISSION_PROFILE = "native-proof-builder";
const WORKER_PACKET_KEYS = new Set([
  "schema_version", "packet_type", "producer_version", "invocation_id",
  "experiment_id", "arm_id", "run_nonce", "model", "reasoning_effort",
  "execution_surface", "repository", "baseline_commit", "baseline_tree",
  "prompt_sha256", "prompt_base64", "allowed_paths", "allowed_ignored_paths",
  "timeout_ms", "intervention_budget", "remediation_generation",
  "remediation_parent_result_sha256", "visible_checks",
  "visible_execution_manifest", "visible_execution_manifest_sha256",
]);

function sha256(value) {
  return `sha256:${crypto.createHash("sha256").update(value).digest("hex")}`;
}

function fail(message) {
  throw new Error(message);
}

function approvedToolchainReadPaths(commandPaths, executablePaths) {
  const approved = new Set([...commandPaths, ...executablePaths]);
  for (const commandPath of commandPaths) {
    if (path.basename(commandPath) !== "pnpm") continue;
    const prefix = path.dirname(path.dirname(commandPath));
    approved.add(path.join(prefix, "bin"));
    approved.add(path.join(prefix, "Cellar"));
    approved.add(path.join(prefix, "opt"));
    approved.add(path.join(prefix, "etc", "openssl@3"));
    approved.add(
      path.join(os.homedir(), ".cache", "node", "corepack", "v1", "pnpm"),
    );
  }
  return [...approved].sort();
}

export function nativeCodexExecContract(workerPacketBytes, approvedWorkerPacketSha256) {
  if (!SHA256.test(approvedWorkerPacketSha256 ?? "") || sha256(workerPacketBytes) !== approvedWorkerPacketSha256) {
    fail("worker packet hash does not match the approved identity");
  }
  const workerPacket = JSON.parse(Buffer.from(workerPacketBytes).toString("utf8"));
  for (const key of Object.keys(workerPacket)) {
    if (!WORKER_PACKET_KEYS.has(key)) fail(`unsupported worker packet field: ${key}`);
  }
  if (workerPacket.packet_type !== "native-codex-exec-worker-invocation-v5") fail("worker packet type is invalid");
  if (workerPacket.producer_version !== "native-codex-exec-producer-v5") fail("worker packet producer version is invalid");
  if (workerPacket.execution_surface !== "codex-exec") fail("worker packet execution surface is invalid");
  if (workerPacket.model !== "gpt-5.6-sol") fail("native Codex exec model must be gpt-5.6-sol");
  if (workerPacket.reasoning_effort !== "high") fail("native Codex exec reasoning effort must be high");
  if (!Array.isArray(workerPacket.visible_execution_manifest?.checks)) fail("visible execution manifest checks are invalid");
  if (workerPacket.visible_execution_manifest.checks.length !== workerPacket.visible_checks.length) fail("visible execution manifest check count mismatch");
  const visibleCommandPaths = [];
  const visibleExecutablePaths = [];
  for (const [index, check] of workerPacket.visible_execution_manifest.checks.entries()) {
    if (JSON.stringify(check.command) !== JSON.stringify(workerPacket.visible_checks[index])) fail(`visible execution manifest command ${index} mismatch`);
    if (typeof check.command?.[0] !== "string" || !check.command[0].startsWith("/")) fail(`visible execution manifest command path ${index} is invalid`);
    if (typeof check.executable_path !== "string" || !check.executable_path.startsWith("/")) fail(`visible execution manifest executable ${index} is invalid`);
    visibleCommandPaths.push(check.command[0]);
    visibleExecutablePaths.push(check.executable_path);
  }
  const approvedToolchainPaths = approvedToolchainReadPaths(
    visibleCommandPaths,
    visibleExecutablePaths,
  );
  const stdin = [
    "You are the sole native builder process for a proof-gated experiment.",
    "The parent runner has disabled multi-agent, web, browser, app, plugin, user-configuration, project-instruction, and network capabilities and has restricted filesystem reads to minimal runtime paths, this repository, and the approved visible-check toolchain.",
    "Treat the exact JSON packet below as your complete task capability. Do not search for producer, sibling-arm, held-out, result, receipt, or orchestration evidence.",
    "Decode prompt_base64 and implement only that prompt. Modify only allowed_paths in repository. Do not stage, commit, change refs, push, deploy, migrate, access production, use secrets, or write outside repository except transient toolchain scratch created by visible checks.",
    "Run only visible_checks from the packet. If the task is ambiguous or needs an intervention, stop and report failure without expanding scope.",
    `APPROVED_WORKER_PACKET_SHA256 ${approvedWorkerPacketSha256}`,
    "BEGIN_EXACT_WORKER_PACKET",
    Buffer.from(workerPacketBytes).toString("utf8").trimEnd(),
    "END_EXACT_WORKER_PACKET",
    "Return a concise completion; the parent independently measures repository state and check evidence.",
    "",
  ].join("\n");

  const argv = [
    "exec",
    "--ignore-user-config",
    "--ignore-rules",
    "--strict-config",
    "--ephemeral",
    "--json",
    "--model", workerPacket.model,
    "--config", `model_reasoning_effort=${JSON.stringify(workerPacket.reasoning_effort)}`,
    "--config", "approval_policy=\"never\"",
    "--config", `default_permissions=${JSON.stringify(PERMISSION_PROFILE)}`,
    "--config", `permissions.${PERMISSION_PROFILE}.extends=\":workspace\"`,
    "--config", `permissions.${PERMISSION_PROFILE}.filesystem={${[
      `"/"="deny"`,
      `\":minimal\"=\"read\"`,
      `\":workspace_roots\"={\".\"=\"write\",\".git\"=\"read\"}`,
      ...approvedToolchainPaths.map((target) => `${JSON.stringify(target)}=\"read\"`),
    ].join(",")}}`,
    "--config", `permissions.${PERMISSION_PROFILE}.network.enabled=false`,
    "--config", "project_doc_max_bytes=0",
    "--config", "web_search=\"disabled\"",
    "--config", "mcp_servers={}",
  ];
  for (const feature of DISABLED_FEATURES) argv.push("--disable", feature);
  argv.push("--cd", workerPacket.repository, "-");

  const contract = {
    schema_version: 1,
    contract_type: "native-codex-exec-launch-v5",
    argv,
    stdin_sha256: sha256(stdin),
    worker_packet_sha256: approvedWorkerPacketSha256,
    worker_packet_delivery: "stdin-bytes",
    sandbox_mode: "permission-profile",
    permission_profile: PERMISSION_PROFILE,
    filesystem_read_scope: "minimal+workspace+approved-toolchain",
    network_access: false,
    writable_tmp: true,
    multi_agent_enabled: false,
    ignored_user_config: true,
    ignored_project_rules: true,
    ephemeral: true,
    disabled_features: [...DISABLED_FEATURES],
  };
  return {
    ...contract,
    stdin,
    sha256: sha256(Buffer.from(JSON.stringify(contract))),
  };
}

export function nativeCodexCapabilityProbeContract(launchContract, paths) {
  if (launchContract?.contract_type !== "native-codex-exec-launch-v5") fail("native launch contract is invalid for capability probing");
  for (const key of ["repository", "visible_command_path", "visible_executable_path", "held_out_executable_path", "root_evidence_path", "codex_executable_path"]) {
    if (typeof paths?.[key] !== "string" || paths[key] === "") fail(`capability probe ${key} is required`);
  }
  const inheritedArgs = [];
  for (let index = 0; index < launchContract.argv.length; index += 1) {
    if (launchContract.argv[index] === "--config" || launchContract.argv[index] === "--disable") {
      inheritedArgs.push(launchContract.argv[index], launchContract.argv[index + 1]);
      index += 1;
    }
  }
  const expected = {
    workspace_read: 0,
    visible_command_read: 0,
    visible_executable_read: 0,
    held_out_executable_read: "nonzero",
    root_evidence_read: "nonzero",
    tmp_write: 0,
    network_connect: "nonzero",
    descendant_codex_agent: "nonzero",
  };
  const script = [
    "observe() {",
    "  label=\"$1\"",
    "  shift",
    "  output=$(\"$@\" 2>&1)",
    "  status=$?",
    "  printf '%s\\t%s\\n' \"$label\" \"$status\"",
    "  printf 'PROBE_COMMAND_OUTPUT\\t%s\\t' \"$label\" >&2",
    "  printf '%s' \"$output\" | /usr/bin/base64 >&2",
    "  printf '\\n' >&2",
    "}",
    "observe workspace_read /bin/ls \"$PROOF_PROBE_REPOSITORY\"",
    "observe visible_command_read /bin/cat \"$PROOF_PROBE_VISIBLE_COMMAND\"",
    "observe visible_executable_read /bin/cat \"$PROOF_PROBE_VISIBLE_EXECUTABLE\"",
    "observe held_out_executable_read /bin/cat \"$PROOF_PROBE_HELD_OUT_EXECUTABLE\"",
    "observe root_evidence_read /bin/cat \"$PROOF_PROBE_ROOT_EVIDENCE\"",
    "observe tmp_write /usr/bin/touch \"$PROOF_PROBE_TMP_PATH\"",
    "observe network_connect /usr/bin/curl --connect-timeout 2 --max-time 3 https://api.openai.com/",
    "observe descendant_codex_agent \"$PROOF_PROBE_CODEX_EXECUTABLE\" exec --ignore-user-config --ignore-rules --strict-config --ephemeral --json --model gpt-5.6-sol --config 'approval_policy=\"never\"' 'Return exactly NESTED_AGENT_UNEXPECTEDLY_RAN'",
  ].join("\n");
  const environment = {
    PROOF_PROBE_REPOSITORY: paths.repository,
    PROOF_PROBE_VISIBLE_COMMAND: paths.visible_command_path,
    PROOF_PROBE_VISIBLE_EXECUTABLE: paths.visible_executable_path,
    PROOF_PROBE_HELD_OUT_EXECUTABLE: paths.held_out_executable_path,
    PROOF_PROBE_ROOT_EVIDENCE: paths.root_evidence_path,
    PROOF_PROBE_CODEX_EXECUTABLE: paths.codex_executable_path,
  };
  const argv = [
    "sandbox",
    ...inheritedArgs,
    "-P", launchContract.permission_profile,
    "-C", paths.repository,
    "--log-denials",
    "/bin/sh", "-c", script,
  ];
  const contract = {
    schema_version: 1,
    contract_type: "native-codex-capability-probe-v1",
    argv,
    environment,
    expected,
  };
  return { ...contract, sha256: sha256(Buffer.from(JSON.stringify(contract))) };
}

export function parseNativeCodexTranscript(stdout) {
  const events = [];
  for (const [index, line] of Buffer.from(stdout).toString("utf8").split("\n").entries()) {
    if (line.trim() === "") continue;
    try {
      events.push(JSON.parse(line));
    } catch {
      fail(`native Codex JSONL transcript line ${index + 1} is invalid`);
    }
  }
  const started = events.find((event) => event?.type === "thread.started" && typeof event.thread_id === "string" && event.thread_id !== "");
  const completions = events.filter((event) => event?.type === "item.completed" && event.item?.type === "agent_message" && typeof event.item.text === "string" && event.item.text !== "");
  const turnCompleted = events.some((event) => event?.type === "turn.completed");
  if (!started) fail("native Codex transcript is missing a thread.started identity");
  if (!turnCompleted) fail("native Codex transcript is missing turn.completed evidence");
  if (completions.length === 0) fail("native Codex transcript is missing a returned agent completion");
  return { sessionId: started.thread_id, returnedCompletion: completions.at(-1).item.text };
}
