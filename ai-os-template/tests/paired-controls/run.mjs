import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "paired-controls-"));
const common = {
  schema_version: 1,
  runner: "cursor-agent-paired-builder-v1",
  agent_version: "fixture",
  baseline_commit: "a".repeat(40),
  baseline_tree: "b".repeat(40),
  prompt_sha256: `sha256:${"c".repeat(64)}`,
  allowed_paths: ["src/"],
  timeout_ms: 1000,
  check_timeout_ms: 1000,
  environment_names: ["HOME", "PATH"],
  visible_checks: [{ command: ["pnpm", "test"] }],
  held_out_checks: [{ command: ["/external/evaluator", "."] }]
};
const left = { ...common, arm_id: "a", model: "composer-2.5" };
const right = { ...common, arm_id: "b", model: "gpt-5.6-sol-high" };
const leftPath = path.join(root, "left.json");
const rightPath = path.join(root, "right.json");
fs.writeFileSync(leftPath, JSON.stringify(left));
fs.writeFileSync(rightPath, JSON.stringify(right));
const script = path.resolve("scripts/validate-paired-builder-controls.mjs");
const good = spawnSync(process.execPath, [script, leftPath, rightPath], { encoding: "utf8" });
assert.equal(good.status, 0, good.stderr);
assert.match(good.stdout, /"comparable": true/);
right.timeout_ms = 2000;
fs.writeFileSync(rightPath, JSON.stringify(right));
const drift = spawnSync(process.execPath, [script, leftPath, rightPath], { encoding: "utf8" });
assert.equal(drift.status, 1);
assert.match(drift.stderr, /timeout_ms/);
console.log("paired control fixtures passed");
