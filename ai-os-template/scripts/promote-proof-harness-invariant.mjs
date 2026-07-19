#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function fail(message) {
  throw new Error(message);
}

function events(inboxPath) {
  if (!fs.existsSync(inboxPath)) fail(`candidate inbox does not exist: ${inboxPath}`);
  const text = fs.readFileSync(inboxPath, "utf8");
  return {
    text,
    rows: text.split("\n").filter(Boolean).map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        fail(`candidate inbox line ${index + 1} is invalid: ${error.message}`);
      }
    }),
  };
}

function appendLocked(inboxPath, operation) {
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

function appendAtomically(inboxPath, existingText, event) {
  const temporary = path.join(path.dirname(inboxPath), `.${path.basename(inboxPath)}.${process.pid}.tmp`);
  const prefix = existingText === "" || existingText.endsWith("\n") ? existingText : `${existingText}\n`;
  try {
    fs.writeFileSync(temporary, `${prefix}${JSON.stringify(event)}\n`, { encoding: "utf8", flag: "wx" });
    fs.renameSync(temporary, inboxPath);
  } catch (error) {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
    throw error;
  }
}

export function promoteInvariantCandidate(inboxPath, promotionPath) {
  const promotion = JSON.parse(fs.readFileSync(promotionPath, "utf8"));
  if (promotion.schema_version !== 1) fail("promotion schema_version must be 1");
  if (promotion.target_status !== "advisory") {
    fail("deterministic promotion may target advisory only; active policy requires owner approval");
  }
  for (const field of ["candidate_id", "counterexample_test", "verification_command", "promoted_at"]) {
    if (typeof promotion[field] !== "string" || promotion[field] === "") fail(`promotion.${field} missing`);
  }
  if (promotion.verification_result !== "pass") fail("promotion verification_result must be pass");
  if (!Array.isArray(promotion.conflicts_active_invariant_ids)) fail("promotion conflicts must be an array");
  if (promotion.conflicts_active_invariant_ids.length > 0) fail("candidate conflicts with active policy");

  return appendLocked(inboxPath, () => {
    const inbox = events(inboxPath);
    const candidate = inbox.rows.find(
      (event) => event.event === "candidate_created" && event.candidate_id === promotion.candidate_id,
    );
    if (!candidate) fail(`candidate not recorded: ${promotion.candidate_id}`);
    if (candidate.existing_invariant_ids?.length) fail("candidate has unresolved possible duplicates");
    if (
      inbox.rows.some(
        (event) =>
          event.event === "candidate_promoted_advisory" &&
          event.candidate_id === promotion.candidate_id,
      )
    ) {
      return { outcome: "already_advisory", candidate_id: promotion.candidate_id, appended: false };
    }
    const originEvidence = inbox.rows.filter(
      (event) =>
        event.candidate_id === promotion.candidate_id &&
        ["candidate_created", "candidate_evidence_added"].includes(event.event),
    );
    if (originEvidence.length === 0) fail("candidate has no reproduced origin evidence");
    const promotionFingerprint = `sha256:${crypto
      .createHash("sha256")
      .update(JSON.stringify(promotion))
      .digest("hex")}`;
    const event = {
      schema_version: 1,
      event: "candidate_promoted_advisory",
      candidate_id: promotion.candidate_id,
      status: "advisory",
      candidate_fingerprint: candidate.fingerprint,
      promotion_fingerprint: promotionFingerprint,
      counterexample_test: promotion.counterexample_test,
      verification_command: promotion.verification_command,
      verification_result: promotion.verification_result,
      origin_evidence_count: originEvidence.length,
      promoted_at: promotion.promoted_at,
    };
    appendAtomically(inboxPath, inbox.text, event);
    return { outcome: "promoted_advisory", candidate_id: promotion.candidate_id, appended: true };
  });
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const [inboxPath, promotionPath] = process.argv.slice(2);
  if (!inboxPath || !promotionPath) {
    console.error("usage: promote-proof-harness-invariant.mjs <candidates.jsonl> <promotion.json>");
    process.exit(2);
  }
  try {
    console.log(JSON.stringify(promoteInvariantCandidate(path.resolve(inboxPath), path.resolve(promotionPath)), null, 2));
  } catch (error) {
    console.error(`invariant promotion failed: ${error.message}`);
    process.exit(1);
  }
}
