import assert from "node:assert/strict";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const templateRoot = path.resolve(here, "../..");
const adapter = path.join(templateRoot, "scripts/inventory-typescript-convex.mjs");
const tree = "2222222222222222222222222222222222222222";

function inventory(fixture) {
  const root = path.join(here, "fixtures", fixture);
  return spawnSync(
    process.execPath,
    [adapter, root, path.join(root, "inventory-config.json"), `fixture-${fixture}`, tree],
    { cwd: templateRoot, encoding: "utf8" },
  );
}

const first = inventory("representative");
const second = inventory("representative");
assert.equal(first.status, 0, first.stderr);
assert.equal(second.status, 0, second.stderr);
assert.equal(first.stdout, second.stdout, "inventory output must be byte-stable");

const packet = JSON.parse(first.stdout);
assert.deepEqual(packet.unresolved, []);
const kinds = new Set(packet.surfaces.map((surface) => surface.kind));
for (const kind of [
  "callable_action",
  "callable_internal_mutation",
  "callable_mutation",
  "callable_query",
  "cursor_scan",
  "database_delete",
  "database_insert",
  "database_update",
  "external_request",
  "internal_mutation_call",
  "scheduled_registration",
  "scheduler_invocation",
  "storage_delete",
]) {
  assert.ok(kinds.has(kind), `missing ${kind}`);
}
assert.ok(packet.surfaces.some((surface) => surface.tags.includes("outbox")));
assert.ok(packet.surfaces.some((surface) => surface.tags.includes("cache")));
assert.ok(packet.surfaces.some((surface) => surface.tags.includes("replay")));
assert.ok(packet.surfaces.some((surface) => surface.tags.includes("census")));

const unknown = inventory("unknown");
assert.notEqual(unknown.status, 0, "unknown high-risk database operation must fail closed");
const unknownPacket = JSON.parse(unknown.stdout);
assert.equal(unknownPacket.unresolved.length, 2);
assert.ok(unknownPacket.unresolved.some((row) => /unsupported database method/i.test(row.reason)));
assert.ok(unknownPacket.unresolved.some((row) => /destructured database context/i.test(row.reason)));

const symlinkRoot = path.join(here, "fixtures", "symlink-runtime");
const outsideRoot = path.join(here, "fixtures", "symlink-outside-runtime");
try {
  fs.mkdirSync(path.join(symlinkRoot, "convex"), { recursive: true });
  fs.mkdirSync(outsideRoot, { recursive: true });
  fs.writeFileSync(path.join(outsideRoot, "external.ts"), "export const x = 1;\n");
  fs.symlinkSync(outsideRoot, path.join(symlinkRoot, "convex", "linked"));
  fs.writeFileSync(path.join(symlinkRoot, "inventory-config.json"), JSON.stringify({ schema_version: 1, include_paths: ["convex"], exclude_path_fragments: [] }));
  const symlinked = inventory("symlink-runtime");
  assert.notEqual(symlinked.status, 0);
  assert.ok(JSON.parse(symlinked.stdout).unresolved.some((row) => /symbolic link/i.test(row.reason)));
} finally {
  fs.rmSync(symlinkRoot, { recursive: true, force: true });
  fs.rmSync(outsideRoot, { recursive: true, force: true });
}

console.log("typescript-convex inventory fixtures passed");
