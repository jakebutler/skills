import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "baseline-intake-"));
const script = path.resolve("scripts/verify-git-baseline-intake.mjs");
const git = (...args) => execFileSync("git", ["-C", root, ...args]);
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");

git("init", "-q");
git("config", "user.email", "fixture@example.com");
git("config", "user.name", "Fixture");
fs.writeFileSync(path.join(root, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
git("add", ".");
git("commit", "-qm", "base");
const base = git("rev-parse", "HEAD").toString().trim();
fs.writeFileSync(path.join(root, "feature.txt"), "feature\n");
git("add", ".");
git("commit", "-qm", "candidate");
const commit = git("rev-parse", "HEAD").toString().trim();
const tree = git("show", "-s", "--format=%T", commit).toString().trim();
const intake = {
  schema_version: 1,
  baseline_id: "fixture",
  commit,
  tree,
  parents: [base],
  reviewed_candidate: {
    base,
    tree,
    binary_diff_sha256: hash(git("diff", "--binary", base, commit)),
    nul_status_sha256: "recorded-only",
    path_count: 1,
    manifest_sha256: "recorded-only",
    lockfile_path: "pnpm-lock.yaml",
    lockfile_sha256: hash(git("show", `${commit}:pnpm-lock.yaml`)),
  },
};
const intakePath = path.join(root, "intake.json");
fs.writeFileSync(intakePath, JSON.stringify(intake));

const good = spawnSync(process.execPath, [script, root, intakePath], { encoding: "utf8" });
assert.equal(good.status, 0, good.stderr);
const report = JSON.parse(good.stdout);
assert.equal(report.verdict, "verified");
assert.deepEqual(report.recorded_only.sort(), ["manifest_sha256", "nul_status_sha256"]);

intake.tree = "0".repeat(40);
fs.writeFileSync(intakePath, JSON.stringify(intake));
const bad = spawnSync(process.execPath, [script, root, intakePath], { encoding: "utf8" });
assert.equal(bad.status, 1);
assert.match(bad.stderr, /tree mismatch/);

intake.tree = tree;
intake.reviewed_candidate.base = "--output=/tmp/should-never-exist";
fs.writeFileSync(intakePath, JSON.stringify(intake));
const injected = spawnSync(process.execPath, [script, root, intakePath], { encoding: "utf8" });
assert.equal(injected.status, 1);
assert.match(injected.stderr, /full 40-character lowercase Git object ID/);

console.log("baseline intake fixtures passed");
