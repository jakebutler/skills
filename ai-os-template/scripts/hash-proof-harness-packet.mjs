#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Order is part of raw-bytes-manifest-v1. Keep this list sorted so independently
// implemented verifiers can reproduce the candidate identity without hidden state.
const INCLUDED_FILES = [
  "architecture-proof.json",
  "effect-surfaces.json",
  "invariant-selection.json",
  "proof-plan.json",
  "requirements.json",
];

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function readCanonicalUtf8(directory, relativePath) {
  const bytes = fs.readFileSync(path.join(directory, relativePath));
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error(`${relativePath} is not valid UTF-8`);
  }
  if (text.includes("\r")) {
    throw new Error(`${relativePath} must use LF line endings`);
  }
  JSON.parse(text);
  return bytes;
}

export function hashDesignCandidate(directory) {
  const files = INCLUDED_FILES.map((relativePath) => {
    const bytes = readCanonicalUtf8(directory, relativePath);
    return {
      path: relativePath,
      bytes: bytes.byteLength,
      sha256: `sha256:${sha256(bytes)}`,
    };
  });
  const manifestBytes = Buffer.from(`${JSON.stringify(files)}\n`, "utf8");
  const requirements = files.find((file) => file.path === "requirements.json");
  const requirementsDocument = JSON.parse(
    fs.readFileSync(path.join(directory, "requirements.json"), "utf8"),
  );
  if (typeof requirementsDocument.task_id !== "string" || requirementsDocument.task_id === "") {
    throw new Error("requirements.json task_id must be a non-empty string");
  }

  return {
    schema_version: 1,
    task_id: requirementsDocument.task_id,
    algorithm: "raw-bytes-manifest-v1",
    included_files: files,
    requirements_hash: requirements.sha256,
    design_candidate_hash: `sha256:${sha256(manifestBytes)}`,
  };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const directory = process.argv[2];
  if (!directory) {
    console.error("usage: hash-proof-harness-packet.mjs <task-artifact-directory>");
    process.exit(2);
  }
  try {
    console.log(JSON.stringify(hashDesignCandidate(path.resolve(directory)), null, 2));
  } catch (error) {
    console.error(`proof-harness hashing failed: ${error.message}`);
    process.exit(1);
  }
}
