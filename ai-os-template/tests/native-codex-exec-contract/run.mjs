import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { nativeCodexCapabilityProbeContract, nativeCodexExecContract } from "../../scripts/native-codex-exec-contract.mjs";

const visibleCommandPath = "/tooling/bin/pnpm";

const workerPacket = {
  schema_version: 1,
  packet_type: "native-codex-exec-worker-invocation-v5",
  producer_version: "native-codex-exec-producer-v5",
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
  visible_checks: [[visibleCommandPath, "--version"]],
  visible_execution_manifest: {
    schema_version: 1,
    checks: [{ command: [visibleCommandPath, "--version"], executable_path: fs.realpathSync(process.execPath) }],
  },
  visible_execution_manifest_sha256: `sha256:${"5".repeat(64)}`,
};
const workerPacketBytes = Buffer.from(`${JSON.stringify(workerPacket, null, 2)}\n`);
const workerPacketSha256 = `sha256:${crypto.createHash("sha256").update(workerPacketBytes).digest("hex")}`;
const contract = nativeCodexExecContract(workerPacketBytes, workerPacketSha256);

const leakingWorkerPacketBytes = Buffer.from(`${JSON.stringify({
  ...workerPacket,
  held_out_evaluator_self_tests: [["/private/proof/held-out-check", "--proof-harness-self-test"]],
}, null, 2)}\n`);
assert.throws(
  () => nativeCodexExecContract(leakingWorkerPacketBytes, `sha256:${crypto.createHash("sha256").update(leakingWorkerPacketBytes).digest("hex")}`),
  /unsupported worker packet field|root-only/i,
);

assert.deepEqual(contract.argv.slice(0, 2), ["exec", "--ignore-user-config"]);
assert.equal(contract.argv.includes("--ephemeral"), true);
assert.equal(contract.argv.includes("--json"), true);
assert.deepEqual(contract.argv.slice(contract.argv.indexOf("--model"), contract.argv.indexOf("--model") + 2), ["--model", "gpt-5.6-sol"]);
assert.equal(contract.argv.includes('model_reasoning_effort="high"'), true);
assert.equal(contract.argv.includes("--sandbox"), false);
assert.equal(contract.argv.some((arg) => arg.startsWith("sandbox_workspace_write.")), false);
assert.equal(contract.argv.includes('default_permissions="native-proof-builder"'), true);
assert.equal(contract.argv.includes('permissions.native-proof-builder.extends=":workspace"'), true);
const filesystemProfile = contract.argv.find((arg) => arg.startsWith("permissions.native-proof-builder.filesystem="));
assert.equal(filesystemProfile.includes('"/"="deny"'), true);
assert.equal(filesystemProfile.includes('":tmpdir"="deny"'), false);
assert.equal(filesystemProfile.includes('":slash_tmp"="deny"'), false);
assert.equal(filesystemProfile.includes('":minimal"="read"'), true);
assert.equal(filesystemProfile.includes('":workspace_roots"={"."="write",".git"="read"}'), true);
assert.equal(filesystemProfile.includes(`${JSON.stringify(fs.realpathSync(process.execPath))}="read"`), true);
assert.equal(filesystemProfile.includes(`${JSON.stringify(visibleCommandPath)}="read"`), true);
for (const runtimeRoot of ["/tooling/bin", "/tooling/Cellar", "/tooling/opt", "/tooling/etc/openssl@3"]) {
  assert.equal(filesystemProfile.includes(`${JSON.stringify(runtimeRoot)}="read"`), true);
}
assert.equal(
  filesystemProfile.includes(
    `${JSON.stringify(path.join(os.homedir(), ".cache", "node", "corepack", "v1", "pnpm"))}="read"`,
  ),
  true,
);
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
assert.equal(contract.writable_tmp, true);
assert.equal(contract.sandbox_mode, "permission-profile");
assert.equal(contract.permission_profile, "native-proof-builder");
assert.equal(contract.filesystem_read_scope, "minimal+workspace+approved-toolchain");
assert.equal(contract.worker_packet_delivery, "stdin-bytes");
assert.equal(contract.stdin.includes("native-invocation-packet.json"), false);
assert.equal(contract.stdin.includes("native-result.json"), false);
assert.equal(contract.stdin.includes("native-finalize-receipt.json"), false);
assert.equal(contract.stdin.includes("worker-packet.json"), false);
assert.match(contract.sha256, /^sha256:[a-f0-9]{64}$/);

const probe = nativeCodexCapabilityProbeContract(contract, {
  repository: workerPacket.repository,
  visible_command_path: visibleCommandPath,
  visible_executable_path: fs.realpathSync(process.execPath),
  held_out_executable_path: "/private/proof/held-out-check",
  root_evidence_path: "/private/proof/native-invocation-packet.json",
  codex_executable_path: "/private/runtime/codex",
});
assert.equal(probe.argv[0], "sandbox");
assert.equal(probe.argv.includes('default_permissions="native-proof-builder"'), true);
assert.equal(probe.argv.includes("permissions.native-proof-builder.network.enabled=false"), true);
assert.deepEqual(probe.expected, {
  workspace_read: 0,
  visible_command_read: 0,
  visible_executable_read: 0,
  held_out_executable_read: "nonzero",
  root_evidence_read: "nonzero",
  tmp_write: 0,
  network_connect: "nonzero",
  descendant_codex_agent: "nonzero",
});
assert.equal(probe.environment.PROOF_PROBE_VISIBLE_COMMAND, visibleCommandPath);
assert.equal(probe.argv.at(-1).includes("PROBE_COMMAND_OUTPUT"), true, "probe must retain per-command diagnostic output");
assert.match(probe.sha256, /^sha256:[a-f0-9]{64}$/);

console.log("native Codex exec contract fixtures passed");
