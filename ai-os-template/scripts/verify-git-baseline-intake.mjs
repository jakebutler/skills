#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function fail(message) {
  throw new Error(message);
}

function git(repo, args, encoding = "utf8") {
  const result = spawnSync("git", ["-C", repo, ...args], { encoding, maxBuffer: 128 * 1024 * 1024 });
  if (result.status !== 0) {
    const detail = result.error?.message ?? String(result.stderr ?? "").trim();
    fail(`git ${args.join(" ")} failed: ${detail}`);
  }
  return result.stdout;
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function equal(label, actual, expected) {
  if (actual !== expected) fail(`${label} mismatch: expected ${expected}, got ${actual}`);
}

function objectId(value, label) {
  if (typeof value !== "string" || !/^[a-f0-9]{40}$/.test(value)) {
    fail(`${label} must be a full 40-character lowercase Git object ID`);
  }
  return value;
}

function safeRepositoryPath(value, label) {
  if (typeof value !== "string" || value === "" || path.isAbsolute(value)) fail(`${label} must be repo-relative`);
  const normalized = path.posix.normalize(value.replaceAll("\\", "/"));
  if (normalized === "." || normalized === ".." || normalized.startsWith("../") || normalized.includes("/../")) {
    fail(`${label} escapes the repository`);
  }
  return normalized;
}

export function verifyBaselineIntake(repositoryPath, intakePath) {
  const repo = path.resolve(repositoryPath);
  const intake = JSON.parse(fs.readFileSync(path.resolve(intakePath), "utf8"));
  if (intake.schema_version !== 1) fail("baseline intake schema_version must be 1");
  if (!intake.commit || !intake.tree || !Array.isArray(intake.parents)) fail("baseline identity is incomplete");
  const reviewed = intake.reviewed_candidate;
  if (!reviewed?.base) fail("reviewed candidate base is missing");
  objectId(intake.commit, "commit");
  objectId(intake.tree, "tree");
  for (const [index, parent] of intake.parents.entries()) objectId(parent, `parents[${index}]`);
  objectId(reviewed.base, "reviewed_candidate.base");
  objectId(reviewed.tree, "reviewed_candidate.tree");
  const lockfilePath = safeRepositoryPath(reviewed.lockfile_path, "reviewed_candidate.lockfile_path");

  git(repo, ["cat-file", "-e", "--end-of-options", `${intake.commit}^{commit}`]);
  const identity = git(repo, ["show", "--no-patch", "--format=%H%n%T%n%P", "--end-of-options", intake.commit])
    .trim()
    .split("\n");
  equal("commit", identity[0], intake.commit);
  equal("tree", identity[1], intake.tree);
  equal("reviewed tree", identity[1], reviewed.tree);
  const parents = (identity[2] ?? "").split(" ").filter(Boolean);
  equal("parents", JSON.stringify(parents), JSON.stringify(intake.parents));

  const binaryDiff = git(repo, ["diff", "--binary", "--end-of-options", reviewed.base, intake.commit], null);
  equal("binary diff sha256", sha256(binaryDiff), reviewed.binary_diff_sha256);
  const pathCount = git(repo, ["diff", "--name-only", "--end-of-options", reviewed.base, intake.commit])
    .split("\n")
    .filter(Boolean).length;
  equal("path count", pathCount, reviewed.path_count);
  const lockfile = git(repo, ["show", "--end-of-options", `${intake.commit}:${lockfilePath}`], null);
  equal("lockfile sha256", sha256(lockfile), reviewed.lockfile_sha256);

  return {
    schema_version: 1,
    baseline_id: intake.baseline_id,
    verdict: "verified",
    commit: intake.commit,
    tree: intake.tree,
    parents,
    binary_diff_sha256: reviewed.binary_diff_sha256,
    path_count: reviewed.path_count,
    lockfile_path: lockfilePath,
    lockfile_sha256: reviewed.lockfile_sha256,
    recorded_only: ["nul_status_sha256", "manifest_sha256"],
    note: "The original pre-commit NUL status and path/mode/content manifest require their recorded freeze recipe; they are retained as attestations, not silently recomputed with a different command.",
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const [repo, intakePath] = process.argv.slice(2);
  if (!repo || !intakePath) {
    console.error("usage: verify-git-baseline-intake.mjs <repository> <b0-intake.json>");
    process.exit(2);
  }
  try {
    console.log(JSON.stringify(verifyBaselineIntake(repo, intakePath), null, 2));
  } catch (error) {
    console.error(`baseline intake verification failed: ${error.message}`);
    process.exit(1);
  }
}
