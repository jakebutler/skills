#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SHA256 = /^sha256:[a-f0-9]{64}$/;

function fail(message) {
  throw new Error(message);
}

function normalizedStatement(statement) {
  return statement.trim().replace(/\s+/g, " ").toLowerCase();
}

function sortedUnique(values) {
  return [...new Set(values)].sort();
}

function digest(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function requireStrings(value, label) {
  if (!Array.isArray(value) || value.length === 0 || value.some((row) => typeof row !== "string" || row === "")) {
    fail(`${label} must be a non-empty string array`);
  }
}

function validateFinding(finding) {
  if (finding?.schema_version !== 1) fail("finding schema_version must be 1");
  for (const field of ["task_id", "finding_id", "statement", "observed_at"]) {
    if (typeof finding[field] !== "string" || finding[field].trim() === "") {
      fail(`finding ${field} missing`);
    }
  }
  if (finding.classification !== "novel_reproduced") {
    fail("only novel_reproduced findings may enter the candidate inbox");
  }
  for (const field of ["surface_ids", "surface_kinds", "tags", "required_evidence"]) {
    requireStrings(finding[field], `finding.${field}`);
  }
  for (const field of ["finding_snapshot", "fix_snapshot"]) {
    if (!SHA256.test(finding[field])) fail(`finding.${field} must be a SHA-256 identity`);
  }
  for (const field of ["command", "result", "counterexample_test"]) {
    if (typeof finding.reproduction?.[field] !== "string" || finding.reproduction[field] === "") {
      fail(`finding.reproduction.${field} missing`);
    }
  }
  if (!Array.isArray(finding.existing_invariant_ids)) {
    fail("finding.existing_invariant_ids must be an array");
  }
  if (finding.existing_invariant_ids.length > 0) {
    fail("finding is a possible duplicate and cannot enter the novel candidate inbox");
  }
}

function readEvents(inboxPath) {
  if (!fs.existsSync(inboxPath)) return { text: "", events: [] };
  const text = fs.readFileSync(inboxPath, "utf8");
  const lines = text.split("\n").filter((line) => line.trim() !== "");
  return {
    text,
    events: lines.map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        fail(`candidate inbox line ${index + 1} is invalid JSON: ${error.message}`);
      }
    }),
  };
}

function appendAtomically(inboxPath, existingText, event) {
  const directory = path.dirname(inboxPath);
  const temporary = path.join(directory, `.${path.basename(inboxPath)}.${process.pid}.tmp`);
  const prefix = existingText === "" || existingText.endsWith("\n") ? existingText : `${existingText}\n`;
  try {
    fs.writeFileSync(temporary, `${prefix}${JSON.stringify(event)}\n`, {
      encoding: "utf8",
      flag: "wx",
    });
    fs.renameSync(temporary, inboxPath);
  } catch (error) {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
    throw error;
  }
}

function withInboxLock(inboxPath, operation) {
  const lockPath = `${inboxPath}.lock`;
  try {
    fs.mkdirSync(lockPath);
  } catch (error) {
    if (error.code === "EEXIST") fail(`candidate inbox is locked: ${inboxPath}; inspect the lock owner and recover manually if the writer crashed`);
    throw error;
  }
  try {
    return operation();
  } finally {
    fs.rmdirSync(lockPath);
  }
}

export function extractInvariantCandidate(findingPath, inboxPath) {
  const finding = JSON.parse(fs.readFileSync(findingPath, "utf8"));
  validateFinding(finding);
  const normalized = normalizedStatement(finding.statement);
  const fingerprint = `sha256:${digest(JSON.stringify({
    statement: normalized,
    surface_kinds: sortedUnique(finding.surface_kinds),
    tags: sortedUnique(finding.tags),
  }))}`;
  const candidateId = `INVC-${fingerprint.slice("sha256:".length, "sha256:".length + 16).toUpperCase()}`;
  const originFingerprint = `sha256:${digest(JSON.stringify({
    task_id: finding.task_id,
    finding_id: finding.finding_id,
    finding_snapshot: finding.finding_snapshot,
    fix_snapshot: finding.fix_snapshot,
  }))}`;
  return withInboxLock(inboxPath, () => {
    const inbox = readEvents(inboxPath);
    if (inbox.events.some((event) => event.origin_fingerprint === originFingerprint)) {
      return { outcome: "already_recorded", candidate_id: candidateId, appended: false };
    }

    const existingCandidate = inbox.events.find(
      (event) => event.event === "candidate_created" && event.fingerprint === fingerprint,
    );
    const origin = {
      task_id: finding.task_id,
      finding_id: finding.finding_id,
      finding_snapshot: finding.finding_snapshot,
      fix_snapshot: finding.fix_snapshot,
      reproduction: finding.reproduction,
      observed_at: finding.observed_at,
    };
    const event = existingCandidate
      ? {
          schema_version: 1,
          event: "candidate_evidence_added",
          candidate_id: existingCandidate.candidate_id,
          status: "candidate",
          fingerprint,
          origin_fingerprint: originFingerprint,
          origin,
        }
      : {
          schema_version: 1,
          event: "candidate_created",
          candidate_id: candidateId,
          status: "candidate",
          fingerprint,
          statement: finding.statement.trim().replace(/\s+/g, " "),
          surface_ids: sortedUnique(finding.surface_ids),
          surface_kinds: sortedUnique(finding.surface_kinds),
          tags: sortedUnique(finding.tags),
          required_evidence: sortedUnique(finding.required_evidence),
          existing_invariant_ids: sortedUnique(finding.existing_invariant_ids),
          origin_fingerprint: originFingerprint,
          origin,
        };
    appendAtomically(inboxPath, inbox.text, event);
    return {
      outcome: existingCandidate ? "evidence_added" : "candidate_created",
      candidate_id: existingCandidate?.candidate_id ?? candidateId,
      appended: true,
    };
  });
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const [findingPath, inboxPath] = process.argv.slice(2);
  if (!findingPath || !inboxPath) {
    console.error(
      "usage: extract-proof-harness-invariant.mjs <novel-finding.json> <candidates.jsonl>",
    );
    process.exit(2);
  }
  try {
    console.log(
      JSON.stringify(
        extractInvariantCandidate(path.resolve(findingPath), path.resolve(inboxPath)),
        null,
        2,
      ),
    );
  } catch (error) {
    console.error(`invariant extraction failed: ${error.message}`);
    process.exit(1);
  }
}
