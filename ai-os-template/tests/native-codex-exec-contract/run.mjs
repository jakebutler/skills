import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";

import { nativeCodexExecContract } from "../../scripts/native-codex-exec-contract.mjs";

const workerPacket = {
  schema_version: 1,
  packet_type: "native-codex-exec-worker-invocation-v3",
  producer_version: "native-codex-exec-producer-v3",
  invocation_id: `sha256:${"1".repeat(64)}`,
  experiment_id: "fixture",
  arm_id: "sol-a",
  run_nonce: "fixture-001",
  model: "gpt-5.6-sol",
  reasoning_effort: "high",
  execution_surface: "codex-exec",
  repository: "/tmp/builder-repository",
  baseline_commit: "2".repeat(40),
  baseline_tree: "3".repeat(40),
  prompt_sha256: `sha256:${"4".repeat(64)}`,
  prompt_base64: Buffer.from("Implement the approved slice.\n").toString("base64"),
  allowed_paths: ["allowed.txt"],
  allowed_ignored_paths: [],
  timeout_ms: 10_000,
  intervention_budget: 0,
  visible_checks: [[process.execPath, "--version"]],
  visible_execution_manifest: {
    schema_version: 1,
    checks: [{ command: [process.execPath, "--version"], executable_path: fs.realpathSync(process.execPath) }],
  },
  visible_execution_manifest_sha256: `sha256:${"5".repeat(64)}`,
};
const workerPacketBytes = Buffer.from(`${JSON.stringify(workerPacket, null, 2)}\n`);
const workerPacketSha256 = `sha256:${crypto.createHash("sha256").update(workerPacketBytes).digest("hex")}`;
const contract = nativeCodexExecContract(workerPacketBytes, workerPacketSha256);

assert.deepEqual(contract.argv.slice(0, 2), ["exec", "--ignore-user-config"]);
assert.equal(contract.argv.includes("--ephemeral"), true);
assert.equal(contract.argv.includes("--json"), true);
assert.deepEqual(contract.argv.slice(contract.argv.indexOf("--model"), contract.argv.indexOf("--model") + 2), ["--model", "gpt-5.6-sol"]);
assert.equal(contract.argv.includes('model_reasoning_effort="high"'), true);
assert.equal(contract.argv.includes("--sandbox"), false);
assert.equal(contract.argv.some((arg) => arg.startsWith("sandbox_workspace_write.")), false);
assert.equal(contract.argv.includes('default_permissions="native-proof-builder"'), true);
const filesystemProfile = contract.argv.find((arg) => arg.startsWith("permissions.native-proof-builder.filesystem="));
assert.equal(filesystemProfile.includes('":minimal"="read"'), true);
assert.equal(filesystemProfile.includes('":workspace_roots"={"."="write",".git"="read"}'), true);
assert.equal(filesystemProfile.includes(`${JSON.stringify(fs.realpathSync(process.execPath))}="read"`), true);
assert.equal(contract.argv.includes("permissions.native-proof-builder.network.enabled=false"), true);
assert.equal(contract.argv.includes("project_doc_max_bytes=0"), true);
assert.equal(contract.argv.includes('web_search="disabled"'), true);
assert.equal(contract.argv.includes("mcp_servers={}"), true);
assert.deepEqual(contract.argv.slice(contract.argv.indexOf("--disable"), contract.argv.indexOf("--disable") + 2), ["--disable", "multi_agent"]);
for (const feature of ["multi_agent_v2", "enable_fanout", "enable_mcp_apps", "computer_use", "tool_search", "standalone_web_search", "search_tool"]) {
  assert.equal(contract.disabled_features.includes(feature), true, `${feature} must be disabled`);
}
assert.equal(contract.multi_agent_enabled, false);
assert.equal(contract.network_access, false);
assert.equal(contract.writable_tmp, false);
assert.equal(contract.sandbox_mode, "permission-profile");
assert.equal(contract.permission_profile, "native-proof-builder");
assert.equal(contract.filesystem_read_scope, "minimal+workspace+visible-executables");
assert.equal(contract.worker_packet_delivery, "stdin-bytes");
assert.equal(contract.stdin.includes("native-invocation-packet.json"), false);
assert.equal(contract.stdin.includes("native-result.json"), false);
assert.equal(contract.stdin.includes("native-finalize-receipt.json"), false);
assert.equal(contract.stdin.includes("worker-packet.json"), false);
assert.match(contract.sha256, /^sha256:[a-f0-9]{64}$/);

console.log("native Codex exec contract fixtures passed");
