#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { hashDesignCandidate } from "./hash-proof-harness-packet.mjs";
import { hashBuilderPacket } from "./hash-proof-harness-builder-packet.mjs";
import { validateReviewResolution } from "./validate-review-resolution.mjs";
import { inventoryTypeScriptConvex } from "./inventory-typescript-convex.mjs";
import { selectInvariants } from "./select-proof-harness-invariants.mjs";

const REQUIRED_FILES = [
  "requirements.json",
  "effect-surfaces.json",
  "invariant-selection.json",
  "architecture-proof.json",
  "proof-plan.json",
  "design-snapshot.json",
  "design-review-coverage.json",
  "design-review-resolution.json",
];

function fail(message) {
  throw new Error(message);
}

function readJson(directory, file) {
  const target = path.join(directory, file);
  if (!fs.existsSync(target)) fail(`missing required artifact: ${file}`);

  try {
    return JSON.parse(fs.readFileSync(target, "utf8"));
  } catch (error) {
    fail(`${file} is not valid JSON: ${error.message}`);
  }
}

function requireString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    fail(`${label} must be a non-empty string`);
  }
}

function requireArray(value, label, { nonEmpty = false } = {}) {
  if (!Array.isArray(value)) fail(`${label} must be an array`);
  if (nonEmpty && value.length === 0) fail(`${label} must not be empty`);
  return value;
}

function uniqueById(rows, label) {
  const ids = new Set();
  for (const [index, row] of rows.entries()) {
    requireString(row?.id, `${label}[${index}].id`);
    if (ids.has(row.id)) fail(`${label} contains duplicate ID ${row.id}`);
    ids.add(row.id);
  }
  return ids;
}

function sameTask(expected, artifact, label) {
  if (artifact.task_id !== expected) {
    fail(`${label}.task_id ${artifact.task_id ?? "<missing>"} does not match ${expected}`);
  }
}

function sameCandidate(expected, artifact, label) {
  if (artifact.design_candidate_hash !== expected) {
    fail(`${label} is bound to a different design candidate hash`);
  }
}

function git(repo, args) {
  const result = spawnSync("git", ["-C", repo, ...args], { encoding: "utf8" });
  if (result.status !== 0) fail(`git ${args.join(" ")} failed: ${result.stderr.trim()}`);
  return result.stdout.trim();
}

function exactJson(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) fail(`${label} does not reproduce from bound source`);
}

export function validateSourceBindings(directory, repository, registryPath, inventoryConfigPath) {
  const requirements = readJson(directory, "requirements.json");
  const recordedInventory = readJson(directory, "effect-surfaces.json");
  const recordedSelection = readJson(directory, "invariant-selection.json");
  const repo = path.resolve(repository);
  if (!/^[a-f0-9]{40}$/.test(requirements.baseline?.commit ?? "")) fail("requirements baseline commit must be a full Git object ID");
  if (!/^[a-f0-9]{40}$/.test(requirements.baseline?.tree ?? "")) fail("requirements baseline tree must be a full Git object ID");
  const head = git(repo, ["rev-parse", "HEAD"]);
  const tree = git(repo, ["show", "-s", "--format=%T", "HEAD"]);
  if (head !== requirements.baseline.commit) fail(`live repository HEAD ${head} does not match approved baseline commit`);
  if (tree !== requirements.baseline.tree) fail(`live repository tree ${tree} does not match approved baseline tree`);
  if (git(repo, ["status", "--porcelain=v1", "--untracked-files=all"]) !== "") {
    fail("live repository is not clean at the approved baseline");
  }
  const generatedInventory = inventoryTypeScriptConvex(
    repo,
    path.resolve(inventoryConfigPath),
    requirements.task_id,
    tree,
  );
  exactJson(recordedInventory, generatedInventory, "effect inventory");
  const generatedSelection = selectInvariants(path.resolve(registryPath), path.join(directory, "effect-surfaces.json"));
  exactJson(recordedSelection, generatedSelection, "invariant selection");
  return { head, tree, inventory_reproduced: true, selection_reproduced: true };
}

export function validate(directory) {
  for (const file of REQUIRED_FILES) {
    if (!fs.existsSync(path.join(directory, file))) {
      fail(`missing required artifact: ${file}`);
    }
  }

  const requirements = readJson(directory, "requirements.json");
  const inventory = readJson(directory, "effect-surfaces.json");
  const selection = readJson(directory, "invariant-selection.json");
  const architecture = readJson(directory, "architecture-proof.json");
  const proofPlan = readJson(directory, "proof-plan.json");
  const snapshot = readJson(directory, "design-snapshot.json");
  const coverage = readJson(directory, "design-review-coverage.json");
  const resolution = readJson(directory, "design-review-resolution.json");

  requireString(requirements.task_id, "requirements.task_id");
  requireString(requirements.baseline?.commit, "requirements.baseline.commit");
  requireString(requirements.baseline?.tree, "requirements.baseline.tree");
  const requirementRows = requireArray(requirements.requirements, "requirements.requirements", {
    nonEmpty: true,
  });
  const requirementIds = uniqueById(requirementRows, "requirements.requirements");
  const requirementSurfaces = new Set();

  for (const requirement of requirementRows) {
    requireString(requirement.statement, `${requirement.id}.statement`);
    requireString(requirement.source, `${requirement.id}.source`);
    for (const surface of requireArray(requirement.applies_to, `${requirement.id}.applies_to`, {
      nonEmpty: true,
    })) {
      requireString(surface, `${requirement.id}.applies_to[]`);
      requirementSurfaces.add(surface);
    }
    requireString(requirement.verification?.method, `${requirement.id}.verification.method`);
    requireString(requirement.verification?.command, `${requirement.id}.verification.command`);
    requireString(requirement.verification?.expected, `${requirement.id}.verification.expected`);
    requireString(
      requirement.verification?.denial_without_effects,
      `${requirement.id}.verification.denial_without_effects`,
    );
  }

  sameTask(requirements.task_id, inventory, "effect-surfaces");
  requireString(inventory.generator?.id, "effect-surfaces.generator.id");
  requireString(inventory.generator?.version, "effect-surfaces.generator.version");
  requireString(
    inventory.generator?.source_tree_hash,
    "effect-surfaces.generator.source_tree_hash",
  );
  if (inventory.generator.source_tree_hash !== requirements.baseline.tree) {
    fail("effect inventory was generated from a different baseline tree");
  }
  const surfaces = requireArray(inventory.surfaces, "effect-surfaces.surfaces", {
    nonEmpty: true,
  });
  const surfaceIds = uniqueById(surfaces, "effect-surfaces.surfaces");
  for (const surface of surfaces) {
    for (const field of ["kind", "risk", "file", "symbol", "boundary", "confidence"]) {
      requireString(surface[field], `${surface.id}.${field}`);
    }
    if (!Number.isInteger(surface.line) || surface.line < 1) {
      fail(`${surface.id}.line must be a positive integer`);
    }
    for (const field of ["entities", "tags", "callers", "observed_guards"]) {
      requireArray(surface[field], `${surface.id}.${field}`);
    }
    if (surface.risk === "high" && surface.confidence === "unresolved") {
      fail(`${surface.id} is a High-risk unresolved surface`);
    }
  }
  if (requireArray(inventory.unresolved, "effect-surfaces.unresolved").length > 0) {
    fail("effect inventory contains unresolved surfaces");
  }
  for (const surface of requirementSurfaces) {
    if (!surfaceIds.has(surface)) fail(`${surface} is absent from the effect inventory`);
  }

  sameTask(requirements.task_id, selection, "invariant-selection");
  requireString(selection.registry_hash, "invariant-selection.registry_hash");
  if (selection.selection_algorithm !== "metadata-exact-v1") {
    fail("invariant-selection uses an unsupported selection algorithm");
  }
  const querySurfaceIds = new Set(
    requireArray(
      selection.query_features?.surface_ids,
      "invariant-selection.query_features.surface_ids",
      { nonEmpty: true },
    ),
  );
  for (const surfaceId of surfaceIds) {
    if (!querySurfaceIds.has(surfaceId)) {
      fail(`${surfaceId} was omitted from invariant-selection query features`);
    }
  }
  for (const field of ["kinds", "entities", "tags"]) {
    requireArray(selection.query_features?.[field], `invariant-selection.query_features.${field}`, {
      nonEmpty: true,
    });
  }
  const selected = requireArray(selection.selected, "invariant-selection.selected", {
    nonEmpty: true,
  });
  const selectedInvariantIds = uniqueById(selected, "invariant-selection.selected");
  const blockingInvariantIds = new Set(
    selected.filter((invariant) => invariant.status === "active-blocking").map((row) => row.id),
  );
  const requirementSources = new Set(requirementRows.map((requirement) => requirement.source));
  for (const invariantId of blockingInvariantIds) {
    if (!requirementSources.has(invariantId)) {
      fail(`${invariantId} has no explicit requirement`);
    }
  }
  const selectedSurfaceIds = new Set();
  for (const invariant of selected) {
    if (!['advisory', 'active-blocking'].includes(invariant.status)) {
      fail(`${invariant.id}.status must be advisory or active-blocking`);
    }
    requireString(invariant.statement, `${invariant.id}.statement`);
    requireString(invariant.reason, `${invariant.id}.reason`);
    requireArray(invariant.required_evidence, `${invariant.id}.required_evidence`, {
      nonEmpty: true,
    });
    for (const surfaceId of requireArray(invariant.surface_ids, `${invariant.id}.surface_ids`, {
      nonEmpty: true,
    })) {
      if (!surfaceIds.has(surfaceId)) {
        fail(`${invariant.id} references unknown surface ${surfaceId}`);
      }
      selectedSurfaceIds.add(surfaceId);
    }
    for (const dependency of requireArray(invariant.dependencies, `${invariant.id}.dependencies`)) {
      if (!selectedInvariantIds.has(dependency)) {
        fail(`${invariant.id} has unselected dependency ${dependency}`);
      }
    }
  }
  for (const surfaceId of surfaceIds) {
    if (!selectedSurfaceIds.has(surfaceId)) {
      fail(`${surfaceId} has no selected invariant disposition`);
    }
  }
  requireArray(selection.excluded, "invariant-selection.excluded");
  if (requireArray(selection.unresolved_coverage, "invariant-selection.unresolved_coverage").length) {
    fail("invariant selection has unresolved coverage");
  }

  sameTask(requirements.task_id, architecture, "architecture-proof");
  requireString(
    architecture.authority_effect_diagram?.content,
    "architecture-proof.authority_effect_diagram.content",
  );
  requireArray(
    architecture.authority_effect_diagram?.trust_boundaries,
    "architecture-proof.authority_effect_diagram.trust_boundaries",
    { nonEmpty: true },
  );
  const decisions = requireArray(architecture.decisions, "architecture-proof.decisions", {
    nonEmpty: true,
  });
  uniqueById(decisions, "architecture-proof.decisions");
  const decisionRequirements = new Set();
  for (const decision of decisions) {
    for (const field of [
      "immutable_root",
      "canonical_projection",
      "cardinality",
      "creation_anchor",
      "lifecycle_semantics",
      "fail_closed_behavior",
      "enforcement_point",
    ]) {
      requireString(decision[field], `${decision.id}.${field}`);
    }
    for (const requirementId of requireArray(
      decision.requirement_ids,
      `${decision.id}.requirement_ids`,
      { nonEmpty: true },
    )) {
      if (!requirementIds.has(requirementId)) {
        fail(`${decision.id} references unknown requirement ${requirementId}`);
      }
      decisionRequirements.add(requirementId);
    }
  }
  for (const requirementId of requirementIds) {
    if (!decisionRequirements.has(requirementId)) {
      fail(`${requirementId} has no architecture decision contract`);
    }
  }

  const siblingPaths = requireArray(
    architecture.sibling_paths,
    "architecture-proof.sibling_paths",
    { nonEmpty: true },
  );
  uniqueById(siblingPaths, "architecture-proof.sibling_paths");
  const siblingSurfaces = new Set();
  for (const sibling of siblingPaths) {
    requireString(sibling.kind, `${sibling.id}.kind`);
    requireString(sibling.entry_point, `${sibling.id}.entry_point`);
    requireString(sibling.enforcement_point, `${sibling.id}.enforcement_point`);
    for (const surface of requireArray(
      sibling.effect_surface_ids,
      `${sibling.id}.effect_surface_ids`,
      { nonEmpty: true },
    )) {
      siblingSurfaces.add(surface);
    }
    for (const requirementId of requireArray(
      sibling.requirement_ids,
      `${sibling.id}.requirement_ids`,
      { nonEmpty: true },
    )) {
      if (!requirementIds.has(requirementId)) {
        fail(`${sibling.id} references unknown requirement ${requirementId}`);
      }
    }
  }
  for (const surface of requirementSurfaces) {
    if (!siblingSurfaces.has(surface)) {
      fail(`${surface} has no sibling-path enumeration`);
    }
  }

  for (const matrixName of ["coherent_tamper", "lifecycle", "worker_progress"]) {
    const rows = requireArray(
      architecture.matrices?.[matrixName],
      `architecture-proof.matrices.${matrixName}`,
    );
    for (const [index, row] of rows.entries()) {
      requireString(row.case, `${matrixName}[${index}].case`);
      requireString(row.applicability, `${matrixName}[${index}].applicability`);
      requireString(row.expected, `${matrixName}[${index}].expected`);
      for (const requirementId of requireArray(
        row.requirement_ids,
        `${matrixName}[${index}].requirement_ids`,
        { nonEmpty: true },
      )) {
        if (!requirementIds.has(requirementId)) {
          fail(`${matrixName}[${index}] references unknown requirement ${requirementId}`);
        }
      }
    }
  }
  if (requireArray(architecture.unresolved_assumptions, "unresolved_assumptions").length > 0) {
    fail("architecture proof has unresolved assumptions");
  }

  sameTask(requirements.task_id, proofPlan, "proof-plan");
  const proofEntries = requireArray(proofPlan.entries, "proof-plan.entries", {
    nonEmpty: true,
  });
  const proofSurfaces = new Set();
  const proofInvariantIds = new Set();
  for (const [index, entry] of proofEntries.entries()) {
    requireString(entry.surface_id, `proof-plan.entries[${index}].surface_id`);
    proofSurfaces.add(entry.surface_id);
    requireString(entry.reachable_because, `${entry.surface_id}.reachable_because`);
    requireString(entry.enforcement_point, `${entry.surface_id}.enforcement_point`);
    requireString(entry.negative_evidence, `${entry.surface_id}.negative_evidence`);
    requireString(entry.integration_evidence, `${entry.surface_id}.integration_evidence`);
    if (!['covered', 'not_applicable'].includes(entry.disposition)) {
      fail(`${entry.surface_id}.disposition must be covered or not_applicable`);
    }
    for (const invariantId of requireArray(
      entry.invariant_ids,
      `${entry.surface_id}.invariant_ids`,
      { nonEmpty: true },
    )) {
      if (!selectedInvariantIds.has(invariantId)) {
        fail(`${entry.surface_id} references unselected invariant ${invariantId}`);
      }
      proofInvariantIds.add(invariantId);
    }
    for (const requirementId of requireArray(
      entry.requirement_ids,
      `${entry.surface_id}.requirement_ids`,
      { nonEmpty: true },
    )) {
      if (!requirementIds.has(requirementId)) {
        fail(`${entry.surface_id} references unknown requirement ${requirementId}`);
      }
    }
  }
  for (const surface of requirementSurfaces) {
    if (!proofSurfaces.has(surface)) fail(`${surface} has no proof-plan disposition`);
  }
  for (const invariantId of blockingInvariantIds) {
    if (!proofInvariantIds.has(invariantId)) {
      fail(`${invariantId} has no proof-plan evidence disposition`);
    }
  }
  if (requireArray(proofPlan.orphan_requirements, "proof-plan.orphan_requirements").length > 0) {
    fail("proof plan contains orphan requirements");
  }
  if (requireArray(proofPlan.orphan_effects, "proof-plan.orphan_effects").length > 0) {
    fail("proof plan contains orphan effects");
  }
  const tracedRequirements = new Set();
  for (const [index, trace] of requireArray(
    proofPlan.requirement_trace,
    "proof-plan.requirement_trace",
    { nonEmpty: true },
  ).entries()) {
    if (!requirementIds.has(trace.requirement_id)) {
      fail(`requirement_trace[${index}] references unknown requirement ${trace.requirement_id}`);
    }
    if (tracedRequirements.has(trace.requirement_id)) {
      fail(`requirement_trace duplicates ${trace.requirement_id}`);
    }
    tracedRequirements.add(trace.requirement_id);
    requireArray(trace.enforcement_points, `${trace.requirement_id}.enforcement_points`, {
      nonEmpty: true,
    });
    requireArray(trace.verification_evidence, `${trace.requirement_id}.verification_evidence`, {
      nonEmpty: true,
    });
    if (trace.status !== "covered") fail(`${trace.requirement_id} trace is not covered`);
  }
  for (const requirementId of requirementIds) {
    if (!tracedRequirements.has(requirementId)) fail(`${requirementId} has no proof trace`);
  }

  sameTask(requirements.task_id, snapshot, "design-snapshot");
  const computedSnapshot = hashDesignCandidate(directory);
  for (const field of [
    "schema_version",
    "algorithm",
    "requirements_hash",
    "design_candidate_hash",
  ]) {
    if (snapshot[field] !== computedSnapshot[field]) {
      fail(`design snapshot ${field} does not reproduce from the candidate files`);
    }
  }
  if (JSON.stringify(snapshot.included_files) !== JSON.stringify(computedSnapshot.included_files)) {
    fail("design snapshot file manifest does not reproduce from the candidate files");
  }

  sameTask(requirements.task_id, coverage, "design-review-coverage");
  sameCandidate(snapshot.design_candidate_hash, coverage, "design-review-coverage");
  if (coverage.requirements_hash !== snapshot.requirements_hash) {
    fail("design reviews use a different requirements hash");
  }
  const reviews = requireArray(coverage.reviews, "design-review-coverage.reviews", {
    nonEmpty: true,
  });
  const reviewIds = uniqueById(
    reviews.map((review) => ({ ...review, id: review.review_id })),
    "design-review-coverage.reviews",
  );
  const blockingReviews = reviews.filter((review) => review.authority === "blocking");
  const lenses = new Set(blockingReviews.map((review) => review.lens));
  if (!lenses.has("architecture")) fail("architecture design approval is missing");
  if (!lenses.has("security")) fail("security design approval is missing");

  for (const review of reviews) {
    requireString(review.review_run_id, `${review.review_id}.review_run_id`);
    requireString(review.model_route, `${review.review_id}.model_route`);
    requireString(review.transcript_sha256, `${review.review_id}.transcript_sha256`);
    if (!['blocking', 'advisory'].includes(review.authority)) {
      fail(`${review.review_id} has invalid review authority`);
    }
    if (review.authority === "blocking" && review.snapshot_reproduced !== true) {
      fail(`${review.review_id} blocking review did not reproduce the design snapshot`);
    }
    if (review.snapshot_reproduced === true && (
      review.start_snapshot_hash !== snapshot.design_candidate_hash ||
      review.end_snapshot_hash !== snapshot.design_candidate_hash
    )) {
      fail(`${review.review_id} start/end snapshot evidence does not match the candidate`);
    }
    const verdicts = requireArray(review.verdicts, `${review.review_id}.verdicts`, {
      nonEmpty: true,
    });
    const covered = new Set();
    for (const verdict of verdicts) {
      if (!requirementIds.has(verdict.requirement_id)) {
        fail(`${review.review_id} references unknown requirement ${verdict.requirement_id}`);
      }
      if (covered.has(verdict.requirement_id)) {
        fail(`${review.review_id} duplicates verdict for ${verdict.requirement_id}`);
      }
      covered.add(verdict.requirement_id);
      if (review.authority === "blocking" && verdict.status !== "satisfied") {
        fail(`${review.review_id} did not satisfy ${verdict.requirement_id}`);
      }
      requireString(verdict.evidence, `${review.review_id}.${verdict.requirement_id}.evidence`);
    }
    if (review.authority === "blocking") {
      for (const requirementId of requirementIds) {
        if (!covered.has(requirementId)) {
          fail(`${review.review_id} omitted verdict for ${requirementId}`);
        }
      }
    }
  }

  sameTask(requirements.task_id, resolution, "design-review-resolution");
  sameCandidate(snapshot.design_candidate_hash, resolution, "design-review-resolution");
  const resolutionReviewIds = requireArray(
    resolution.source_review_ids,
    "design-review-resolution.source_review_ids",
    { nonEmpty: true },
  );
  if (
    resolutionReviewIds.length !== reviewIds.size ||
    resolutionReviewIds.some((id) => !reviewIds.has(id))
  ) {
    fail("design-review-resolution does not include every source review exactly once");
  }
  if (requireArray(resolution.conflicts, "design-review-resolution.conflicts").length > 0) {
    fail("design-review-resolution has unresolved conflicts");
  }
  if (
    requireArray(resolution.blocking_findings, "design-review-resolution.blocking_findings")
      .length > 0
  ) {
    fail("design-review-resolution has blocking findings");
  }
  if (resolution.status !== "approved") fail("design-review-resolution is not approved");
  validateReviewResolution(directory);
  requireString(
    resolution.approved_builder_packet_hash,
    "design-review-resolution.approved_builder_packet_hash",
  );
  const computedBuilderPacket = hashBuilderPacket(directory);
  if (
    resolution.approved_builder_packet_hash !==
    computedBuilderPacket.approved_builder_packet_hash
  ) {
    fail("approved builder packet hash does not reproduce from review and resolution content");
  }

  return {
    task_id: requirements.task_id,
    design_candidate_hash: snapshot.design_candidate_hash,
    approved_builder_packet_hash: computedBuilderPacket.approved_builder_packet_hash,
    requirement_count: requirementIds.size,
    surface_count: surfaceIds.size,
    invariant_count: selectedInvariantIds.size,
    review_count: reviewIds.size,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [directory, bindingMode, registryPath, inventoryConfigPath] = process.argv.slice(2);
  if (!directory) {
    console.error("usage: validate-proof-harness.mjs <task-artifact-directory> <repository> <registry-index.json> <inventory-config.json>");
    process.exit(2);
  }

  try {
    let sourceBinding;
    if (bindingMode === "--fixture-only") {
      sourceBinding = { fixture_only: true };
    } else {
      if (!bindingMode || !registryPath || !inventoryConfigPath) {
        fail("production validation requires repository, registry index, and inventory config bindings");
      }
      sourceBinding = validateSourceBindings(
        path.resolve(directory),
        path.resolve(bindingMode),
        path.resolve(registryPath),
        path.resolve(inventoryConfigPath),
      );
    }
    const result = validate(path.resolve(directory));
    console.log(JSON.stringify({ valid: true, source_binding: sourceBinding, ...result }, null, 2));
  } catch (error) {
    console.error(`proof-harness validation failed: ${error.message}`);
    process.exit(1);
  }
}
