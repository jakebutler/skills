#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function fail(message) {
  throw new Error(message);
}

function readJson(directory, file) {
  try {
    return JSON.parse(fs.readFileSync(path.join(directory, file), "utf8"));
  } catch (error) {
    fail(`${file} could not be read as JSON: ${error.message}`);
  }
}

function nonEmpty(value, label) {
  if (typeof value !== "string" || value.trim() === "") fail(`${label} must be non-empty`);
}

function array(value, label) {
  if (!Array.isArray(value)) fail(`${label} must be an array`);
  return value;
}

function exactSet(actual, expected, label) {
  if (actual.length !== new Set(actual).size) fail(`${label} contains duplicates`);
  if (actual.length !== expected.size || actual.some((id) => !expected.has(id))) {
    fail(`${label} must include every source item exactly once`);
  }
}

export function validateReviewResolution(directory) {
  const coverage = readJson(directory, "design-review-coverage.json");
  const resolution = readJson(directory, "design-review-resolution.json");
  nonEmpty(coverage.task_id, "coverage.task_id");
  nonEmpty(coverage.design_candidate_hash, "coverage.design_candidate_hash");
  if (resolution.task_id !== coverage.task_id) fail("resolution task identity does not match coverage");
  if (resolution.design_candidate_hash !== coverage.design_candidate_hash) {
    fail("resolution design candidate identity does not match coverage");
  }

  const reviewIds = new Set();
  const findingIds = new Set();
  const findingsById = new Map();
  let unsatisfiedVerdicts = 0;
  for (const review of array(coverage.reviews, "coverage.reviews")) {
    nonEmpty(review.review_id, "review.review_id");
    nonEmpty(review.review_run_id, `${review.review_id}.review_run_id`);
    nonEmpty(review.transcript_sha256, `${review.review_id}.transcript_sha256`);
    if (reviewIds.has(review.review_id)) fail(`duplicate review ID ${review.review_id}`);
    reviewIds.add(review.review_id);
    if (!['blocking', 'advisory'].includes(review.authority)) fail(`${review.review_id} authority is invalid`);
    if (review.authority === "blocking" && review.snapshot_reproduced !== true) {
      fail(`${review.review_id} blocking review did not reproduce the snapshot`);
    }
    if (review.snapshot_reproduced === true && (
      review.start_snapshot_hash !== coverage.design_candidate_hash ||
      review.end_snapshot_hash !== coverage.design_candidate_hash
    )) fail(`${review.review_id} start/end snapshot evidence does not match coverage`);
    const localFindingIds = new Set();
    for (const finding of array(review.findings, `${review.review_id}.findings`)) {
      nonEmpty(finding.id, `${review.review_id}.finding.id`);
      if (findingIds.has(finding.id)) fail(`duplicate finding ID ${finding.id}`);
      findingIds.add(finding.id);
      localFindingIds.add(finding.id);
      findingsById.set(finding.id, finding);
      if (!['p0', 'p1', 'p2', 'p3'].includes(finding.severity)) fail(`${finding.id} severity is invalid`);
      for (const field of ["root_cause_class", "directive", "evidence"]) nonEmpty(finding[field], `${finding.id}.${field}`);
      for (const field of ["requirement_ids", "surface_ids", "invariant_ids"]) {
        if (array(finding[field], `${finding.id}.${field}`).length === 0) fail(`${finding.id}.${field} must not be empty`);
      }
    }
    for (const verdict of array(review.verdicts, `${review.review_id}.verdicts`)) {
      nonEmpty(verdict.requirement_id, `${review.review_id}.verdict.requirement_id`);
      const linked = array(verdict.finding_ids, `${review.review_id}.${verdict.requirement_id}.finding_ids`);
      if (verdict.status === "satisfied") {
        if (linked.length !== 0) fail(`satisfied verdict ${verdict.requirement_id} cannot link findings`);
      } else if (['violated', 'not_verifiable'].includes(verdict.status)) {
        if (review.authority === "blocking") unsatisfiedVerdicts += 1;
        if (linked.length === 0) fail(`${verdict.status} verdict ${verdict.requirement_id} requires a finding`);
      } else fail(`${review.review_id} verdict status is invalid`);
      for (const findingId of linked) {
        if (!localFindingIds.has(findingId)) fail(`${verdict.requirement_id} links foreign finding ${findingId}`);
        if (!findingsById.get(findingId).requirement_ids.includes(verdict.requirement_id)) {
          fail(`${findingId} does not map back to ${verdict.requirement_id}`);
        }
      }
    }
  }

  exactSet(array(resolution.source_review_ids, "resolution.source_review_ids"), reviewIds, "resolution.source_review_ids");
  const dispositions = array(
    resolution.source_finding_dispositions,
    "resolution.source_finding_dispositions",
  );
  exactSet(dispositions.map((row) => row.finding_id), findingIds, "resolution.source_finding_dispositions");

  const resolvedChanges = array(resolution.resolved_changes, "resolution.resolved_changes");
  const resolutionIds = new Set();
  for (const change of resolvedChanges) {
    nonEmpty(change.id, "resolved_change.id");
    if (resolutionIds.has(change.id)) fail(`duplicate resolution ID ${change.id}`);
    resolutionIds.add(change.id);
    for (const field of ["requirement_ids", "surface_ids", "invariant_ids", "required_evidence"]) {
      if (array(change[field], `${change.id}.${field}`).length === 0) fail(`${change.id}.${field} must not be empty`);
    }
    nonEmpty(change.directive, `${change.id}.directive`);
  }
  for (const disposition of dispositions) {
    if (!['accepted', 'duplicate', 'rejected', 'deferred'].includes(disposition.disposition)) {
      fail(`${disposition.finding_id} disposition is invalid`);
    }
    nonEmpty(disposition.rationale, `${disposition.finding_id}.rationale`);
    if (disposition.disposition === "deferred") nonEmpty(disposition.owner, `${disposition.finding_id}.owner`);
    if (['accepted', 'duplicate'].includes(disposition.disposition)) {
      if (!resolutionIds.has(disposition.resolution_id)) {
        fail(`${disposition.finding_id} does not map to a resolved change`);
      }
    }
  }

  let unresolvedConflictCount = 0;
  for (const conflict of array(resolution.conflicts, "resolution.conflicts")) {
    nonEmpty(conflict.id, "conflict.id");
    const conflictFindings = array(conflict.finding_ids, `${conflict.id}.finding_ids`);
    if (conflictFindings.length < 2) fail(`${conflict.id} must name at least two findings`);
    for (const findingId of conflictFindings) if (!findingIds.has(findingId)) fail(`${conflict.id} references unknown finding ${findingId}`);
    if (conflict.status === "resolved") {
      if (!resolutionIds.has(conflict.resolution_id)) fail(`${conflict.id} lacks a valid resolution`);
      nonEmpty(conflict.rationale, `${conflict.id}.rationale`);
    } else if (conflict.status === "unresolved") unresolvedConflictCount += 1;
    else fail(`${conflict.id} status is invalid`);
  }

  const blocking = array(resolution.blocking_findings, "resolution.blocking_findings");
  for (const findingId of blocking) if (!findingIds.has(findingId)) fail(`unknown blocking finding ${findingId}`);
  if (!['approved', 'changes_required', 'blocked'].includes(resolution.status)) fail("resolution status is invalid");

  if (resolution.status === "approved") {
    const dispositionByFinding = new Map(dispositions.map((row) => [row.finding_id, row]));
    const highSeverity = [...findingsById.values()].filter((finding) => ['p0', 'p1'].includes(finding.severity));
    const actionable = dispositions.filter((row) => ['accepted', 'duplicate'].includes(row.disposition));
    if (highSeverity.length > 0) fail("approved resolution contains a P0/P1 finding");
    if (unsatisfiedVerdicts || blocking.length || unresolvedConflictCount || actionable.length || resolvedChanges.length) {
      fail("approved resolution contains unsatisfied, actionable, blocking, change, or conflict state");
    }
    for (const findingId of findingIds) {
      if (!['rejected', 'deferred'].includes(dispositionByFinding.get(findingId)?.disposition)) {
        fail(`approved resolution lacks terminal non-blocking disposition for ${findingId}`);
      }
    }
    nonEmpty(resolution.approved_builder_packet_hash, "resolution.approved_builder_packet_hash");
  } else {
    if (resolution.approved_builder_packet_hash !== undefined) {
      fail("non-approved resolution must not contain an approved builder packet hash");
    }
    if (resolution.status === "changes_required" && (resolvedChanges.length === 0 || unresolvedConflictCount)) {
      fail("changes_required resolution needs resolved changes and no unresolved conflict");
    }
    if (resolution.status === "blocked" && blocking.length === 0 && unresolvedConflictCount === 0) {
      fail("blocked resolution must identify a blocker or unresolved conflict");
    }
  }

  return {
    task_id: coverage.task_id,
    design_candidate_hash: coverage.design_candidate_hash,
    status: resolution.status,
    review_count: reviewIds.size,
    finding_count: findingIds.size,
    resolved_change_count: resolutionIds.size,
    unresolved_conflict_count: unresolvedConflictCount,
  };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const directory = process.argv[2];
  if (!directory) {
    console.error("usage: validate-review-resolution.mjs <review-artifact-directory>");
    process.exit(2);
  }
  try {
    console.log(JSON.stringify({ valid: true, ...validateReviewResolution(path.resolve(directory)) }, null, 2));
  } catch (error) {
    console.error(`review-resolution validation failed: ${error.message}`);
    process.exit(1);
  }
}
