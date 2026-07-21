import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const templateRoot = path.resolve(here, "../..");
const extractor = path.join(templateRoot, "scripts/extract-proof-harness-invariant.mjs");
const promoter = path.join(templateRoot, "scripts/promote-proof-harness-invariant.mjs");
const indexer = path.join(templateRoot, "scripts/build-proof-harness-invariant-index.mjs");
const finding = path.join(templateRoot, "tests/proof-harness/fixtures/novel-finding.json");
const active = path.join(here, "fixtures", "active.json");

const directory = fs.mkdtempSync(path.join(os.tmpdir(), "registry-lifecycle-"));
try {
  const inbox = path.join(directory, "candidates.jsonl");
  fs.writeFileSync(inbox, "", "utf8");
  const extracted = spawnSync(process.execPath, [extractor, finding, inbox], {
    cwd: templateRoot,
    encoding: "utf8",
  });
  assert.equal(extracted.status, 0, extracted.stderr);
  const candidateId = JSON.parse(extracted.stdout).candidate_id;

  const promotionPath = path.join(directory, "promotion.json");
  fs.writeFileSync(
    promotionPath,
    `${JSON.stringify({
      schema_version: 1,
      candidate_id: candidateId,
      target_status: "advisory",
      counterexample_test: "sensitive-write.test.ts denies without success audit",
      verification_command: "pnpm test -- sensitive-write.test.ts",
      verification_result: "pass",
      conflicts_active_invariant_ids: [],
      promoted_at: "2026-07-19T13:00:00.000Z",
    }, null, 2)}\n`,
    "utf8",
  );
  const promoted = spawnSync(process.execPath, [promoter, inbox, promotionPath], {
    cwd: templateRoot,
    encoding: "utf8",
  });
  assert.equal(promoted.status, 0, promoted.stderr);
  assert.match(promoted.stdout, /promoted_advisory/);

  const repeated = spawnSync(process.execPath, [promoter, inbox, promotionPath], {
    cwd: templateRoot,
    encoding: "utf8",
  });
  assert.equal(repeated.status, 0, repeated.stderr);
  assert.match(repeated.stdout, /already_advisory/);

  const firstIndex = spawnSync(process.execPath, [indexer, active, inbox], {
    cwd: templateRoot,
    encoding: "utf8",
  });
  const secondIndex = spawnSync(process.execPath, [indexer, active, inbox], {
    cwd: templateRoot,
    encoding: "utf8",
  });
  assert.equal(firstIndex.status, 0, firstIndex.stderr);
  assert.equal(secondIndex.status, 0, secondIndex.stderr);
  assert.equal(firstIndex.stdout, secondIndex.stdout, "registry index must be byte-stable");
  const index = JSON.parse(firstIndex.stdout);
  assert.equal(index.invariants.find((row) => row.id === candidateId).status, "advisory");
  assert.equal(index.invariants.find((row) => row.id === "INV-AUDIT-001").status, "active-blocking");

  const invalidPromotion = JSON.parse(fs.readFileSync(promotionPath, "utf8"));
  invalidPromotion.candidate_id = "INVC-NOT-RECORDED";
  invalidPromotion.target_status = "active-blocking";
  fs.writeFileSync(promotionPath, `${JSON.stringify(invalidPromotion, null, 2)}\n`, "utf8");
  const activePromotion = spawnSync(process.execPath, [promoter, inbox, promotionPath], {
    cwd: templateRoot,
    encoding: "utf8",
  });
  assert.notEqual(activePromotion.status, 0, "deterministic promotion must never activate policy");
  assert.match(activePromotion.stderr, /advisory/i);
} finally {
  fs.rmSync(directory, { recursive: true, force: true });
}

console.log("registry lifecycle fixtures passed");
