import crypto from "node:crypto";

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

function sha256(value) {
  return `sha256:${crypto.createHash("sha256").update(value).digest("hex")}`;
}

function fail(message) {
  throw new Error(message);
}

export function nativeCodexExecContract(workerPacketBytes, approvedWorkerPacketSha256) {
  if (!SHA256.test(approvedWorkerPacketSha256 ?? "") || sha256(workerPacketBytes) !== approvedWorkerPacketSha256) {
    fail("worker packet hash does not match the approved identity");
  }
  const workerPacket = JSON.parse(Buffer.from(workerPacketBytes).toString("utf8"));
  if (workerPacket.packet_type !== "native-codex-exec-worker-invocation-v3") fail("worker packet type is invalid");
  if (workerPacket.producer_version !== "native-codex-exec-producer-v3") fail("worker packet producer version is invalid");
  if (workerPacket.execution_surface !== "codex-exec") fail("worker packet execution surface is invalid");
  if (workerPacket.model !== "gpt-5.6-sol") fail("native Codex exec model must be gpt-5.6-sol");
  if (workerPacket.reasoning_effort !== "high") fail("native Codex exec reasoning effort must be high");
  if (!Array.isArray(workerPacket.visible_execution_manifest?.checks)) fail("visible execution manifest checks are invalid");
  if (workerPacket.visible_execution_manifest.checks.length !== workerPacket.visible_checks.length) fail("visible execution manifest check count mismatch");
  const visibleExecutablePaths = [];
  for (const [index, check] of workerPacket.visible_execution_manifest.checks.entries()) {
    if (JSON.stringify(check.command) !== JSON.stringify(workerPacket.visible_checks[index])) fail(`visible execution manifest command ${index} mismatch`);
    if (typeof check.executable_path !== "string" || !check.executable_path.startsWith("/")) fail(`visible execution manifest executable ${index} is invalid`);
    visibleExecutablePaths.push(check.executable_path);
  }

  const stdin = [
    "You are the sole native builder process for a proof-gated experiment.",
    "The parent runner has disabled multi-agent, web, browser, app, plugin, user-configuration, project-instruction, and network capabilities and has restricted filesystem reads to minimal runtime paths, this repository, and exact visible-check executables.",
    "Treat the exact JSON packet below as your complete task capability. Do not search for producer, sibling-arm, held-out, result, receipt, or orchestration evidence.",
    "Decode prompt_base64 and implement only that prompt. Modify only allowed_paths in repository. Do not stage, commit, change refs, push, deploy, migrate, access production, use secrets, or write outside repository.",
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
    "--config", `permissions.${PERMISSION_PROFILE}.filesystem={${[
      `\":minimal\"=\"read\"`,
      `\":workspace_roots\"={\".\"=\"write\",\".git\"=\"read\"}`,
      ...[...new Set(visibleExecutablePaths)].sort().map((target) => `${JSON.stringify(target)}=\"read\"`),
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
    contract_type: "native-codex-exec-launch-v3",
    argv,
    stdin_sha256: sha256(stdin),
    worker_packet_sha256: approvedWorkerPacketSha256,
    worker_packet_delivery: "stdin-bytes",
    sandbox_mode: "permission-profile",
    permission_profile: PERMISSION_PROFILE,
    filesystem_read_scope: "minimal+workspace+visible-executables",
    network_access: false,
    writable_tmp: false,
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
