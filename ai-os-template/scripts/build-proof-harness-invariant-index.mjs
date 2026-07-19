#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function fail(message) {
  throw new Error(message);
}

function readEvents(inboxPath) {
  if (!fs.existsSync(inboxPath)) return [];
  return fs.readFileSync(inboxPath, "utf8").split("\n").filter(Boolean).map((line, index) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      fail(`candidate inbox line ${index + 1} is invalid: ${error.message}`);
    }
  });
}

function normalizedActive(invariant) {
  if (invariant.status !== "active-blocking") fail(`${invariant.id} is not active-blocking`);
  return {
    id: invariant.id,
    status: "active-blocking",
    statement: invariant.statement,
    always_apply: invariant.always_apply,
    applies_to: invariant.applies_to,
    dependencies: [...invariant.dependencies].sort(),
    required_evidence: [...invariant.required_evidence],
  };
}

export function buildInvariantIndex(activePath, inboxPath) {
  const active = JSON.parse(fs.readFileSync(activePath, "utf8"));
  if (active.schema_version !== 1 || !Array.isArray(active.invariants)) fail("active registry is invalid");
  const events = readEvents(inboxPath);
  const rows = active.invariants.map(normalizedActive);
  const ids = new Set(rows.map((row) => row.id));
  const promotions = new Set(
    events.filter((event) => event.event === "candidate_promoted_advisory").map((event) => event.candidate_id),
  );
  for (const candidate of events.filter((event) => event.event === "candidate_created")) {
    if (!promotions.has(candidate.candidate_id)) continue;
    if (ids.has(candidate.candidate_id)) fail(`duplicate invariant ID ${candidate.candidate_id}`);
    ids.add(candidate.candidate_id);
    const promotion = events.find(
      (event) => event.event === "candidate_promoted_advisory" && event.candidate_id === candidate.candidate_id,
    );
    rows.push({
      id: candidate.candidate_id,
      status: "advisory",
      statement: candidate.statement,
      always_apply: false,
      applies_to: {
        kinds: [...candidate.surface_kinds].sort(),
        entities: [],
        tags: [...candidate.tags].sort(),
        risks: ["high"],
      },
      dependencies: [],
      required_evidence: [...new Set([...candidate.required_evidence, promotion.counterexample_test])].sort(),
    });
  }
  rows.sort((left, right) => left.id.localeCompare(right.id));
  return { schema_version: 1, invariants: rows };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const [activePath, inboxPath] = process.argv.slice(2);
  if (!activePath || !inboxPath) {
    console.error("usage: build-proof-harness-invariant-index.mjs <active.json> <candidates.jsonl>");
    process.exit(2);
  }
  try {
    console.log(JSON.stringify(buildInvariantIndex(path.resolve(activePath), path.resolve(inboxPath)), null, 2));
  } catch (error) {
    console.error(`invariant index build failed: ${error.message}`);
    process.exit(1);
  }
}
