import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { inventoryTypeScriptConvex } from "../../scripts/inventory-typescript-convex.mjs";
import { selectInvariants } from "../../scripts/select-proof-harness-invariants.mjs";
import { validateSourceBindings } from "../../scripts/validate-proof-harness.mjs";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "proof-source-binding-"));
const repo = path.join(root, "repo");
const artifacts = path.join(root, "artifacts");
fs.cpSync(path.resolve("tests/typescript-convex-inventory/fixtures/representative"), repo, { recursive: true });
fs.mkdirSync(artifacts);
const git = (...args) => execFileSync("git", ["-C", repo, ...args], { encoding: "utf8" }).trim();
git("init", "-q");
git("config", "user.email", "fixture@example.com");
git("config", "user.name", "Fixture");
git("add", ".");
git("commit", "-qm", "baseline");
const commit = git("rev-parse", "HEAD");
const tree = git("show", "-s", "--format=%T", "HEAD");
const requirements = { schema_version: 1, task_id: "source-binding", baseline: { commit, tree } };
const inventory = inventoryTypeScriptConvex(repo, path.join(repo, "inventory-config.json"), requirements.task_id, tree);
const inventoryPath = path.join(artifacts, "effect-surfaces.json");
fs.writeFileSync(path.join(artifacts, "requirements.json"), JSON.stringify(requirements));
fs.writeFileSync(inventoryPath, JSON.stringify(inventory));
const registry = path.resolve("tests/proof-harness/fixtures/registry/index.json");
const selection = selectInvariants(registry, inventoryPath);
fs.writeFileSync(path.join(artifacts, "invariant-selection.json"), JSON.stringify(selection));

const verified = validateSourceBindings(artifacts, repo, registry, path.join(repo, "inventory-config.json"));
assert.equal(verified.inventory_reproduced, true);
assert.equal(verified.selection_reproduced, true);

selection.selected.pop();
fs.writeFileSync(path.join(artifacts, "invariant-selection.json"), JSON.stringify(selection));
assert.throws(
  () => validateSourceBindings(artifacts, repo, registry, path.join(repo, "inventory-config.json")),
  /invariant selection does not reproduce/,
);

console.log("source binding fixtures passed");
