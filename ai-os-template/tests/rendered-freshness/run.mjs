import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const templateRoot = path.resolve(here, "../..");
const renderer = path.join(templateRoot, "scripts/render-proof-harness.mjs");
const approved = path.join(templateRoot, "tests/proof-harness/fixtures/approved");
const directory = fs.mkdtempSync(path.join(os.tmpdir(), "proof-render-"));

try {
  fs.cpSync(approved, directory, { recursive: true });
  const first = spawnSync(process.execPath, [renderer, directory], {
    cwd: templateRoot,
    encoding: "utf8",
  });
  assert.equal(first.status, 0, first.stderr);
  const firstBytes = fs.readFileSync(path.join(directory, "rendered", "requirements.md"), "utf8");
  assert.match(firstBytes, /Generated from `requirements\.json`/);
  assert.match(firstBytes, /REQ-001/);

  const second = spawnSync(process.execPath, [renderer, directory], {
    cwd: templateRoot,
    encoding: "utf8",
  });
  assert.equal(second.status, 0, second.stderr);
  assert.equal(
    fs.readFileSync(path.join(directory, "rendered", "requirements.md"), "utf8"),
    firstBytes,
    "rendering must be byte-stable",
  );

  const fresh = spawnSync(process.execPath, [renderer, directory, "--check"], {
    cwd: templateRoot,
    encoding: "utf8",
  });
  assert.equal(fresh.status, 0, fresh.stderr);

  fs.appendFileSync(path.join(directory, "rendered", "requirements.md"), "manual drift\n");
  const stale = spawnSync(process.execPath, [renderer, directory, "--check"], {
    cwd: templateRoot,
    encoding: "utf8",
  });
  assert.notEqual(stale.status, 0, "manual rendered-view drift must fail");
  assert.match(stale.stderr, /stale rendered artifact/i);
} finally {
  fs.rmSync(directory, { recursive: true, force: true });
}

console.log("rendered freshness fixtures passed");
