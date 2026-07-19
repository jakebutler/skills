import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const templateRoot = path.resolve(here, "../..");
const validator = path.join(templateRoot, "scripts/validate-review-resolution.mjs");
const fixture = path.join(here, "fixtures", "changes-required");

function validate(directory) {
  return spawnSync(process.execPath, [validator, directory], {
    cwd: templateRoot,
    encoding: "utf8",
  });
}

const consolidated = validate(fixture);
assert.equal(consolidated.status, 0, consolidated.stderr);
assert.match(consolidated.stdout, /changes_required/);

const incompleteDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "review-resolution-"));
try {
  fs.cpSync(fixture, incompleteDirectory, { recursive: true });
  const resolutionPath = path.join(incompleteDirectory, "design-review-resolution.json");
  const resolution = JSON.parse(fs.readFileSync(resolutionPath, "utf8"));
  resolution.source_finding_dispositions.pop();
  fs.writeFileSync(resolutionPath, `${JSON.stringify(resolution, null, 2)}\n`, "utf8");
  const incomplete = validate(incompleteDirectory);
  assert.notEqual(incomplete.status, 0, "omitted source finding must fail");
  assert.match(incomplete.stderr, /every source item exactly once/i);
} finally {
  fs.rmSync(incompleteDirectory, { recursive: true, force: true });
}

const nonBlockingDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "review-resolution-approved-"));
try {
  fs.cpSync(fixture, nonBlockingDirectory, { recursive: true });
  const coveragePath = path.join(nonBlockingDirectory, "design-review-coverage.json");
  const coverage = JSON.parse(fs.readFileSync(coveragePath, "utf8"));
  for (const review of coverage.reviews) {
    review.findings[0].severity = "p2";
    review.verdicts[0].status = "satisfied";
    review.verdicts[0].finding_ids = [];
  }
  fs.writeFileSync(coveragePath, `${JSON.stringify(coverage, null, 2)}\n`);
  const resolutionPath = path.join(nonBlockingDirectory, "design-review-resolution.json");
  const resolution = JSON.parse(fs.readFileSync(resolutionPath, "utf8"));
  resolution.source_finding_dispositions = resolution.source_finding_dispositions.map((row) => ({
    finding_id: row.finding_id,
    disposition: "rejected",
    rationale: "Evidence does not establish a requirement violation."
  }));
  resolution.resolved_changes = [];
  resolution.conflicts = [];
  resolution.status = "approved";
  resolution.approved_builder_packet_hash = `sha256:${"a".repeat(64)}`;
  fs.writeFileSync(resolutionPath, `${JSON.stringify(resolution, null, 2)}\n`);
  const approvedWithRejected = validate(nonBlockingDirectory);
  assert.equal(approvedWithRejected.status, 0, approvedWithRejected.stderr);

  coverage.reviews[0].findings[0].severity = "p1";
  fs.writeFileSync(coveragePath, `${JSON.stringify(coverage, null, 2)}\n`);
  const rejectedBlocker = validate(nonBlockingDirectory);
  assert.notEqual(rejectedBlocker.status, 0, "rejected P0/P1 must not approve");
  assert.match(rejectedBlocker.stderr, /p0\/p1/i);
} finally {
  fs.rmSync(nonBlockingDirectory, { recursive: true, force: true });
}

console.log("review-resolution fixtures passed");
