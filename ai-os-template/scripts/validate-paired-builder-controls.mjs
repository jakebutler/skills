#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CONTROL_FIELDS = [
  "runner",
  "agent_version",
  "baseline_commit",
  "baseline_tree",
  "prompt_sha256",
  "allowed_paths",
  "allowed_ignored_paths",
  "ignored_baseline_sha256",
  "timeout_ms",
  "check_timeout_ms",
  "environment_names",
];

function fail(message) {
  throw new Error(message);
}

function checkCommands(result, field) {
  if (!Array.isArray(result[field])) fail(`${field} is missing`);
  return result[field].map((row) => row.command);
}

export function validatePairedControls(leftPath, rightPath) {
  const left = JSON.parse(fs.readFileSync(path.resolve(leftPath), "utf8"));
  const right = JSON.parse(fs.readFileSync(path.resolve(rightPath), "utf8"));
  const models = new Set([left.model, right.model]);
  if (models.size !== 2 || !models.has("composer-2.5") || !models.has("gpt-5.6-sol-high")) {
    fail("paired results must contain the exact Composer 2.5 and Sol High routes");
  }
  if (left.arm_id === right.arm_id) fail("paired results must use distinct arm IDs");
  for (const field of CONTROL_FIELDS) {
    if (JSON.stringify(left[field]) !== JSON.stringify(right[field])) fail(`paired control drift: ${field}`);
  }
  for (const field of ["visible_checks", "held_out_checks"]) {
    if (JSON.stringify(checkCommands(left, field)) !== JSON.stringify(checkCommands(right, field))) {
      fail(`paired control drift: ${field}`);
    }
  }
  return {
    comparable: true,
    models: [...models].sort(),
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
