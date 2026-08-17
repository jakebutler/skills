#!/usr/bin/env node

import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { hashDesignCandidate } from "./hash-proof-harness-packet.mjs";
import { renderProofHarness } from "./render-proof-harness.mjs";
import { validateSourceBindings } from "./validate-proof-harness.mjs";

function fail(message) {
  throw new Error(message);
}

function nonEmpty(value, label) {
  if (typeof value !== "string" || value.trim() === "") fail(`${label} must be a non-empty string`);
}

function sha256(value) {
  return `sha256:${crypto.createHash("sha256").update(value).digest("hex")}`;
}

function provenanceBytes(directory) {
  const files = ["design-review-coverage.json", "design-review-resolution.json"];
  const rendered = path.join(directory, "rendered");
  if (fs.existsSync(rendered)) {
    files.push(
      ...fs.readdirSync(rendered, { recursive: true })
        .filter((entry) => typeof entry === "string" && fs.statSync(path.join(rendered, entry)).isFile())
        .map((entry) => `rendered/${entry}`),
    );
  }
  return Buffer.concat(
    files.sort().filter((file) => {
      const target = path.join(directory, file);
      return fs.existsSync(target) && !PLACEHOLDER_PATTERN.test(fs.readFileSync(target, "utf8"));
    }).flatMap((file) => [
      Buffer.from(`${file}\0`, "utf8"),
      fs.readFileSync(path.join(directory, file)),
    ]),
  );
}

const SEMANTIC_FILES = [
  "requirements.json",
  "effect-surfaces.json",
  "invariant-selection.json",
  "architecture-proof.json",
  "proof-plan.json",
];
const PLACEHOLDER_PATTERN = /(?:\bTODO\b|\bTBD\b|\bFIXME\b|\bXXX\b|\{\{[^}]+\}\}|<placeholder>|replace\s+(?:me|this))/i;
const STABLE_ID_PATTERN = /^[A-Z][A-Z0-9_-]*-[A-Z0-9_-]+$/;

function scanPlaceholders(value, file, location = "$.") {
  if (typeof value === "string" && PLACEHOLDER_PATTERN.test(value)) {
    fail(`prohibited placeholder in ${file} at ${location}`);
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanPlaceholders(item, file, `${location}[${index}]`));
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) scanPlaceholders(item, file, `${location}${key}.`);
  }
}

function validateGeneratorProfile(inventory, policy, state) {
  nonEmpty(inventory?.generator?.id, "effect-surfaces.generator.id");
  nonEmpty(inventory?.generator?.version, "effect-surfaces.generator.version");
  const profiles = Array.isArray(policy.supported_generator_profiles)
    ? policy.supported_generator_profiles
    : [];
  if (profiles.length === 0) return;
  const profile = profiles.find((item) => item.id === inventory.generator.id);
  if (!profile || !Array.isArray(profile.versions) || !profile.versions.includes(inventory.generator.version)) {
    fail(`unsupported generator version ${inventory.generator.id}@${inventory.generator.version}`);
  }
  for (const generation of Array.isArray(state?.prior_generations) ? state.prior_generations : []) {
    const historical = generation.generator_profile;
    if (!historical) fail(`historical generator profile is missing for generation ${generation.generation}`);
    const historicalProfile = profiles.find((item) => item.id === historical.id);
    const compatible = [
      ...(Array.isArray(historicalProfile?.versions) ? historicalProfile.versions : []),
      ...(Array.isArray(historicalProfile?.historical_versions) ? historicalProfile.historical_versions : []),
    ];
    if (!historicalProfile || !compatible.includes(historical.version)) {
      fail(`historical generator profile incompatibility at generation ${generation.generation}: ${historical.id}@${historical.version}`);
    }
  }
}

function stableIds(rows, label) {
  if (!Array.isArray(rows)) fail(`${label} must be an array`);
  const ids = new Set();
  for (const [index, row] of rows.entries()) {
    if (!STABLE_ID_PATTERN.test(row?.id ?? "")) fail(`invalid stable ID ${row?.id ?? "<missing>"} at ${label}[${index}]`);
    if (ids.has(row.id)) fail(`duplicate mapping ID ${row.id} at ${label}`);
    ids.add(row.id);
  }
  return ids;
}

function requireKnown(values, known, label) {
  if (!Array.isArray(values) || values.length === 0) fail(`${label} must contain at least one stable ID`);
  if (new Set(values).size !== values.length) fail(`${label} contains duplicate mappings`);
  for (const value of values) if (!known.has(value)) fail(`${label} references unknown or orphaned mapping ${value}`);
}

function validateSemanticMappings(documents) {
  const { requirements, inventory, selection, architecture, proofPlan } = documents;
  const requirementIds = stableIds(requirements.requirements, "requirements.requirements");
  const surfaceIds = stableIds(inventory.surfaces, "effect-surfaces.surfaces");
  const invariantIds = stableIds(selection.selected, "invariant-selection.selected");
  stableIds(architecture.decisions, "architecture-proof.decisions");
  stableIds(architecture.sibling_paths, "architecture-proof.sibling_paths");
  stableIds(architecture.review_units, "architecture-proof.review_units");
  if (Array.isArray(inventory.unresolved) && inventory.unresolved.length > 0) fail("effect inventory contains unresolved rows");
  for (const surface of inventory.surfaces) {
    if (surface.risk === "high" && surface.confidence === "unresolved") fail(`${surface.id} is an unresolved high-risk inventory row`);
  }
  for (const requirement of requirements.requirements) requireKnown(requirement.applies_to, surfaceIds, `${requirement.id}.applies_to`);
  for (const invariant of selection.selected) requireKnown(invariant.surface_ids, surfaceIds, `${invariant.id}.surface_ids`);
  if (Array.isArray(selection.unresolved_coverage) && selection.unresolved_coverage.length > 0) fail("source-binding coverage gap in invariant selection");
  const decisionRequirementIds = new Set();
  for (const decision of architecture.decisions) {
    requireKnown(decision.requirement_ids, requirementIds, `${decision.id}.requirement_ids`);
    for (const requirementId of decision.requirement_ids) decisionRequirementIds.add(requirementId);
  }
  for (const requirementId of requirementIds) {
    if (!decisionRequirementIds.has(requirementId)) fail(`orphaned requirement ${requirementId} has no architecture decision contract`);
  }
  for (const sibling of architecture.sibling_paths) {
    requireKnown(sibling.effect_surface_ids, surfaceIds, `${sibling.id}.effect_surface_ids`);
    requireKnown(sibling.requirement_ids, requirementIds, `${sibling.id}.requirement_ids`);
  }
  for (const unit of architecture.review_units) {
    requireKnown(unit.requirement_ids, requirementIds, `${unit.id}.requirement_ids`);
    requireKnown(unit.surface_ids, surfaceIds, `${unit.id}.surface_ids`);
  }
  const plannedSurfaces = new Set();
  for (const [index, entry] of (Array.isArray(proofPlan.entries) ? proofPlan.entries : []).entries()) {
    if (!STABLE_ID_PATTERN.test(entry?.surface_id ?? "") || !surfaceIds.has(entry.surface_id)) fail(`proof-plan.entries[${index}] references unknown or invalid surface ${entry?.surface_id ?? "<missing>"}`);
    if (plannedSurfaces.has(entry.surface_id)) fail(`proof plan contains duplicate mapping for ${entry.surface_id}`);
    plannedSurfaces.add(entry.surface_id);
    requireKnown(entry.requirement_ids, requirementIds, `${entry.surface_id}.requirement_ids`);
    requireKnown(entry.invariant_ids, invariantIds, `${entry.surface_id}.invariant_ids`);
  }
  for (const surfaceId of surfaceIds) if (!plannedSurfaces.has(surfaceId)) fail(`orphaned effect surface ${surfaceId} has no proof-plan entry`);
  const tracedRequirements = new Set();
  for (const trace of Array.isArray(proofPlan.requirement_trace) ? proofPlan.requirement_trace : []) {
    if (!requirementIds.has(trace.requirement_id)) fail(`requirement trace references unknown or orphaned mapping ${trace.requirement_id}`);
    if (tracedRequirements.has(trace.requirement_id)) fail(`duplicate requirement trace ${trace.requirement_id}`);
    tracedRequirements.add(trace.requirement_id);
  }
  for (const requirementId of requirementIds) if (!tracedRequirements.has(requirementId)) fail(`orphaned requirement ${requirementId} has no reciprocal proof trace`);
  return { requirement_count: requirementIds.size, surface_count: surfaceIds.size, invariant_count: invariantIds.size };
}

export function validateProofReviewPreflight(directory, options = {}) {
  const resolved = path.resolve(directory);
  const documents = {};
  for (const file of SEMANTIC_FILES) {
    const target = path.join(resolved, file);
    if (!fs.existsSync(target)) fail(`missing required canonical artifact: ${file}`);
    const value = JSON.parse(fs.readFileSync(target, "utf8"));
    scanPlaceholders(value, file);
    documents[file] = value;
  }
  for (const file of ["design-snapshot.json"]) {
    const target = path.join(resolved, file);
    if (fs.existsSync(target)) scanPlaceholders(JSON.parse(fs.readFileSync(target, "utf8")), file);
  }
  if (options.state) scanPlaceholders(options.state, "proof-review-state.json");
  const requirements = documents["requirements.json"];
  const inventory = documents["effect-surfaces.json"];
  const selection = documents["invariant-selection.json"];
  const architecture = documents["architecture-proof.json"];
  const proofPlan = documents["proof-plan.json"];
  validateGeneratorProfile(inventory, options, options.state);
  const mappings = validateSemanticMappings({ requirements, inventory, selection, architecture, proofPlan });
  if (Array.isArray(architecture.unresolved_assumptions) && architecture.unresolved_assumptions.length > 0) fail("architecture proof has unresolved assumptions");
  if (Array.isArray(proofPlan.orphan_requirements) && proofPlan.orphan_requirements.length > 0) fail("proof plan contains orphan requirements");
  if (Array.isArray(proofPlan.orphan_effects) && proofPlan.orphan_effects.length > 0) fail("proof plan contains orphan effects");
  const identities = computeProofIdentities(resolved);
  const snapshotPath = path.join(resolved, "design-snapshot.json");
  if (!fs.existsSync(snapshotPath)) fail("missing required canonical artifact: design-snapshot.json");
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
  const computedSnapshot = hashDesignCandidate(resolved);
  for (const field of ["schema_version", "task_id", "algorithm", "requirements_hash", "design_candidate_hash"]) {
    if (snapshot[field] !== computedSnapshot[field]) fail(`design snapshot ${field} does not reproduce from the candidate files`);
  }
  if (JSON.stringify(snapshot.included_files) !== JSON.stringify(computedSnapshot.included_files)) {
    fail("design snapshot file manifest does not reproduce from the candidate files");
  }
  const layout = validatePacketLayout(resolved, options.packet_budgets);
  const budgets = validatePacketBudgets(resolved, options.packet_budgets);
  if (options.state) {
    validateConvergenceState(options.state);
    if (options.state.task_id !== requirements.task_id) fail("proof review state task identity does not match the candidate");
    if (options.state.semantic_authority_hash && options.state.semantic_authority_hash !== identities.semantic_authority_hash) {
      fail("proof review state semantic authority identity is stale");
    }
    if (options.state.provenance_hash !== identities.provenance_hash) {
      fail("proof review state provenance identity is stale");
    }
    if (options.process_receipts?.design_candidate_count !== undefined &&
      options.process_receipts.design_candidate_count !== options.state.candidate_generation) {
      fail("design candidate count receipt does not match convergence generation");
    }
  }
  if (options.check_rendered === true) renderProofHarness(resolved, { check: true });
  if (fs.existsSync(path.join(resolved, "design-review-resolution.json"))) validateResolutionReferences(resolved);
  if (options.fixture_only !== true) {
    validateOperationalState(options.state);
    if (!Array.isArray(options.supported_generator_profiles) || options.supported_generator_profiles.length === 0) {
      fail("production preflight requires supported generator profiles");
    }
    if (!options.source_binding) fail("production preflight requires source bindings");
    validateRequiredReviewerRequests(options.review_requests, options.reviewer_policies);
    if (!options.process_receipts) fail("production preflight requires process receipts");
  }
  let sourceBinding = null;
  if (options.source_binding) {
    for (const field of ["repository", "registry", "inventory_config"]) {
      nonEmpty(options.source_binding[field], `source_binding.${field}`);
    }
    sourceBinding = validateSourceBindings(
      resolved,
      options.source_binding.repository,
      options.source_binding.registry,
      options.source_binding.inventory_config,
    );
  }
  const reviewerTransports = {};
  if (options.review_requests || options.reviewer_policies) validateRequiredReviewerRequests(options.review_requests, options.reviewer_policies);
  for (const request of Array.isArray(options.review_requests) ? options.review_requests : []) {
    reviewerTransports[request.lens] = preflightReviewerTransport(
      request,
      options.transport_probes?.[request.lens],
      options.reviewer_policies?.[request.lens],
    );
  }
  const receipts = options.process_receipts ? validateProcessReceipts(options.process_receipts, { now: options.now }) : null;
  return {
    ...identities,
    ...mappings,
    ...layout,
    packet_budgets: budgets,
    source_binding: sourceBinding,
    reviewer_transports: reviewerTransports,
    process_receipts: receipts,
    ready_for_review: true,
  };
}

export function validateResolutionReferences(directory) {
  const resolution = JSON.parse(
    fs.readFileSync(path.join(path.resolve(directory), "design-review-resolution.json"), "utf8"),
  );
  const changes = Array.isArray(resolution.resolved_changes) ? resolution.resolved_changes : [];
  const ids = new Set();
  for (const [index, change] of changes.entries()) {
    if (!STABLE_ID_PATTERN.test(change?.id ?? "")) {
      fail(`resolved_changes[${index}] is missing a valid stable resolution ID`);
    }
    if (ids.has(change.id)) fail(`duplicate stable resolution ID ${change.id}`);
    ids.add(change.id);
  }
  const referenced = new Set();
  for (const disposition of Array.isArray(resolution.source_finding_dispositions)
    ? resolution.source_finding_dispositions
    : []) {
    if (["accepted", "duplicate"].includes(disposition.disposition)) {
      if (!STABLE_ID_PATTERN.test(disposition.resolution_id ?? "") || !ids.has(disposition.resolution_id)) {
        fail(`malformed resolution reference ${disposition.resolution_id ?? "<missing>"} for ${disposition.finding_id ?? "<unknown finding>"}`);
      }
      referenced.add(disposition.resolution_id);
    }
  }
  for (const conflict of Array.isArray(resolution.conflicts) ? resolution.conflicts : []) {
    if (conflict.status === "resolved") {
      if (!STABLE_ID_PATTERN.test(conflict.resolution_id ?? "") || !ids.has(conflict.resolution_id)) {
        fail(`malformed resolution reference ${conflict.resolution_id ?? "<missing>"} for ${conflict.id ?? "<unknown conflict>"}`);
      }
      referenced.add(conflict.resolution_id);
    }
  }
  for (const id of ids) if (!referenced.has(id)) fail(`orphaned resolved change ${id}`);
  return { resolution_ids: [...ids] };
}

function completeCandidate(directory) {
  return SEMANTIC_FILES.every((file) => fs.existsSync(path.join(directory, file)));
}

export function validatePacketLayout(directory, policy = {}) {
  const root = path.resolve(directory);
  if (policy.legacy_read_only === true) {
    return { legacy_read_only: true, active_candidate_generations: 0 };
  }
  const active = [];
  const visit = (current) => {
    if (completeCandidate(current)) active.push(current);
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if ([".git", "rendered", "verification-receipts"].includes(entry.name)) continue;
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) visit(target);
      else if (entry.isFile() && /(?:^|[-_.])v\d+(?:[-_.]|\.json$)/i.test(entry.name)) {
        fail(`versioned canonical artifact name is prohibited: ${path.relative(root, target)}`);
      }
    }
  };
  visit(root);
  if (active.length > 1) {
    fail(`multiple active complete candidate generations found: ${active.map((item) => path.relative(root, item) || ".").join(", ")}`);
  }
  return { active_candidate_generations: active.length };
}

function packetFiles(directory) {
  const files = [];
  const visit = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name === ".git") continue;
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) visit(target);
      else if (entry.isFile()) files.push(target);
    }
  };
  visit(path.resolve(directory));
  return files;
}

function hasBudgetException(policy, budgetName, actual) {
  return (Array.isArray(policy.exception_records) ? policy.exception_records : []).some((record) => {
    if (record?.budget_name !== budgetName || !Number.isFinite(record.authorized_limit) || record.authorized_limit < actual) return false;
    for (const field of ["actor", "timestamp", "reason"]) nonEmpty(record[field], `budget exception ${budgetName}.${field}`);
    if (Number.isNaN(Date.parse(record.timestamp))) fail(`budget exception ${budgetName}.timestamp is invalid`);
    return true;
  });
}

export function validatePacketBudgets(directory, policy = {}) {
  const files = packetFiles(directory);
  const activePacketBytes = files.reduce((total, file) => total + fs.statSync(file).size, 0);
  const generatedLineCount = files.reduce((total, file) => {
    const bytes = fs.readFileSync(file);
    return total + (bytes.length === 0 ? 0 : bytes.toString("utf8").split(/\r?\n/).length);
  }, 0);
  const maxBytes = policy.max_active_packet_bytes ?? 5 * 1024 * 1024;
  const maxLines = policy.max_generated_line_count ?? 50_000;
  if (activePacketBytes > maxBytes && !hasBudgetException(policy, "max_active_packet_bytes", activePacketBytes)) {
    fail(`active packet size budget exceeded: ${activePacketBytes} > ${maxBytes}`);
  }
  if (generatedLineCount > maxLines && !hasBudgetException(policy, "max_generated_line_count", generatedLineCount)) {
    fail(`generated line count budget exceeded: ${generatedLineCount} > ${maxLines}`);
  }
  const totalDiffBytes = policy.total_diff_bytes;
  const generatedDiffBytes = policy.generated_diff_bytes;
  const generatedDiffRatio = Number.isFinite(totalDiffBytes) && totalDiffBytes > 0 && Number.isFinite(generatedDiffBytes)
    ? generatedDiffBytes / totalDiffBytes
    : null;
  const ratioLimit = policy.max_generated_diff_ratio ?? 0.7;
  const warnings = [];
  if (generatedDiffRatio !== null && generatedDiffRatio > ratioLimit) {
    const message = `generated artifacts dominate proposed diff: ${generatedDiffRatio.toFixed(3)} > ${ratioLimit}`;
    if (policy.generated_diff_ratio_action === "fail" && !hasBudgetException(policy, "max_generated_diff_ratio", generatedDiffRatio)) fail(message);
    warnings.push(message);
  }
  return { active_packet_bytes: activePacketBytes, generated_line_count: generatedLineCount, generated_diff_ratio: generatedDiffRatio, warnings };
}

export function deriveGitDiffMetrics(repository, directory, baseRef = "HEAD") {
  const repo = path.resolve(repository);
  const packet = path.resolve(directory);
  const relativePacket = path.relative(repo, packet);
  if (relativePacket.startsWith("..") || path.isAbsolute(relativePacket)) fail("task artifact directory must be inside the source repository");
  nonEmpty(baseRef, "diff base ref");
  execFileSync("git", ["rev-parse", "--verify", `${baseRef}^{commit}`], { cwd: repo, maxBuffer: 128 * 1024 * 1024 });
  const diffBytes = (pathspec) => execFileSync("git", ["diff", "--no-ext-diff", "--binary", `${baseRef}...HEAD`, "--", ...(pathspec ? [pathspec] : [])], { cwd: repo, maxBuffer: 128 * 1024 * 1024 }).byteLength;
  const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard", "-z"], { cwd: repo })
    .toString("utf8").split("\0").filter(Boolean);
  const untrackedBytes = (filter) => untracked.filter(filter).reduce((total, file) => total + fs.statSync(path.join(repo, file)).size, 0);
  const inPacket = (file) => relativePacket === "" || file === relativePacket || file.startsWith(`${relativePacket}${path.sep}`) || file.startsWith(`${relativePacket}/`);
  return {
    total_diff_bytes: diffBytes() + untrackedBytes(() => true),
    generated_diff_bytes: diffBytes(relativePacket) + untrackedBytes(inPacket),
  };
}

function validateRequiredReviewerRequests(requests, policies) {
  if (!Array.isArray(requests)) fail("review state requires exactly architecture and security reviewer requests");
  const lenses = requests.map((request) => request?.lens);
  if (requests.length !== 2 || new Set(lenses).size !== 2 || !lenses.includes("architecture") || !lenses.includes("security")) {
    fail("review state requires exactly architecture and security reviewer requests");
  }
  for (const lens of ["architecture", "security"]) {
    if (!policies?.[lens]) fail(`missing pinned reviewer policy for ${lens}`);
  }
}

export function preflightReviewerTransport(request, probes, pinnedPolicy) {
  for (const field of ["lens", "model", "effort", "model_route"]) nonEmpty(request?.[field], `review request.${field}`);
  if (request.read_only !== true) fail("review request must require read-only capability");
  if (pinnedPolicy && (request.model !== pinnedPolicy.model || request.effort !== pinnedPolicy.effort || request.model_route !== pinnedPolicy.model_route)) {
    fail(`${request.lens} reviewer request does not match pinned policy ${pinnedPolicy.model_route} ${pinnedPolicy.model} ${pinnedPolicy.effort}`);
  }
  if (!Array.isArray(probes) || probes.length === 0) fail("review transport preflight requires at least one probe");
  const eligible = probes.find((probe) =>
    probe?.available === true &&
    probe.authenticated === true &&
    probe.model === request.model &&
    probe.effort === request.effort &&
    probe.model_route === request.model_route &&
    probe.provider === pinnedPolicy?.provider &&
    Array.isArray(pinnedPolicy?.transport_families) && pinnedPolicy.transport_families.includes(probe.transport) &&
    probe.read_only === true &&
    typeof probe.provider === "string" && probe.provider.trim() !== "" &&
    typeof probe.provider_task_run_id === "string" && probe.provider_task_run_id.trim() !== "",
  );
  if (!eligible) {
    fail(`no authenticated read-only reviewer transport provides exact ${request.model} ${request.effort} with provider/task-run identity capture`);
  }
  const first = probes[0];
  return {
    lens: request.lens,
    selected: eligible,
    fallback_from: eligible === first ? null : first?.transport ?? null,
  };
}

function validTimestamp(value, label, { optional = false } = {}) {
  if ((value === null || value === undefined) && optional) return null;
  nonEmpty(value, label);
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) fail(`${label} must be an RFC 3339 timestamp`);
  return timestamp;
}

function validateCheckpoint(checkpoint, reasons) {
  if (!checkpoint) fail(`convergence checkpoint required: ${reasons.join("; ")}`);
  for (const field of ["unresolved_decision", "why_implementation_cannot_start", "smallest_next_action"]) {
    nonEmpty(checkpoint[field], `checkpoint.${field}`);
  }
  if (typeof checkpoint.hitl_required !== "boolean") fail("checkpoint.hitl_required must be boolean");
}

export function validateProcessReceipts(receipts, { now = Date.now(), max_observation_age_ms = 10 * 60 * 1_000 } = {}) {
  const approvedAt = validTimestamp(receipts?.implementation_approved_at, "implementation_approved_at");
  const observedAt = validTimestamp(receipts?.observed_at, "observed_at");
  if (observedAt > now + 60_000) fail("observed_at cannot be in the future");
  if (now - observedAt > max_observation_age_ms) fail("observed_at is stale; refresh process observation before preflight");
  const redAt = validTimestamp(receipts?.first_meaningful_red_at, "first_meaningful_red_at", { optional: true });
  const codeAt = validTimestamp(receipts?.first_production_code_change_at, "first_production_code_change_at", { optional: true });
  const reasons = [];
  const firstActionAt = [redAt, codeAt].filter((value) => value !== null).sort((left, right) => left - right)[0];
  if ((firstActionAt ?? observedAt) - approvedAt > 90 * 60 * 1_000) {
    reasons.push("90 minutes passed after implementation approval without a meaningful RED or production-code change");
  }
  if (!Number.isInteger(receipts.design_candidate_count) || receipts.design_candidate_count < 1) {
    fail("design_candidate_count must be a positive integer");
  }
  if (!Number.isInteger(receipts.full_review_rounds) || receipts.full_review_rounds < 0) {
    fail("full_review_rounds must be a non-negative integer");
  }
  if (receipts.full_review_rounds > 2) reasons.push("more than one full remediation/re-review was attempted");
  const broadRuns = Array.isArray(receipts.broad_suite_runs) ? receipts.broad_suite_runs : fail("broad_suite_runs must be an array");
  for (const [index, run] of broadRuns.entries()) {
    nonEmpty(run.boundary_hash, `broad_suite_runs[${index}].boundary_hash`);
    if (!Number.isFinite(run.duration_seconds) || run.duration_seconds < 0) fail(`broad_suite_runs[${index}].duration_seconds must be non-negative`);
  }
  if (broadRuns.length >= 3) {
    const prior = broadRuns[broadRuns.length - 2];
    const latest = broadRuns[broadRuns.length - 1];
    if (latest.boundary_hash === prior.boundary_hash && latest.changed_affected_boundary !== true) {
      reasons.push("a third broad verification run was requested without a changed affected boundary");
    }
  }
  const invalidated = Array.isArray(receipts.provenance_only_invalidated_shas)
    ? receipts.provenance_only_invalidated_shas
    : fail("provenance_only_invalidated_shas must be an array");
  if (invalidated.length > 0) fail("provenance-only changes must not invalidate semantic approval SHAs");
  if (reasons.length > 0) validateCheckpoint(receipts.checkpoint, reasons);
  return { checkpoint_reasons: reasons, broad_suite_run_count: broadRuns.length };
}

export function computeProofIdentities(directory, previous = undefined) {
  const semanticAuthorityHash = hashDesignCandidate(directory).design_candidate_hash;
  const provenanceHash = sha256(provenanceBytes(directory));
  return {
    semantic_authority_hash: semanticAuthorityHash,
    provenance_hash: provenanceHash,
    semantic_review_required: Boolean(
      previous?.semantic_authority_hash && previous.semantic_authority_hash !== semanticAuthorityHash,
    ),
  };
}

export function validateConvergenceState(state) {
  if (!state || typeof state !== "object" || Array.isArray(state)) {
    fail("convergence state must be an object");
  }
  if (!Number.isInteger(state.candidate_generation) || state.candidate_generation < 1) {
    fail("candidate_generation must be a positive integer");
  }
  nonEmpty(state.task_id, "task_id");
  nonEmpty(state.candidate_kind, "candidate_kind");
  if (!/^sha256:[a-f0-9]{64}$/.test(state.semantic_authority_hash ?? "")) fail("semantic_authority_hash must be a SHA-256 identity");
  if (!/^sha256:[a-f0-9]{64}$/.test(state.provenance_hash ?? "")) fail("provenance_hash must be a SHA-256 identity");
  if (!Array.isArray(state.current_root_cause_classes)) fail("current_root_cause_classes must be an array");
  const previousClasses = new Set(
    (Array.isArray(state.prior_generations) ? state.prior_generations : []).flatMap((generation) =>
      Array.isArray(generation.root_cause_classes) ? generation.root_cause_classes : [],
    ),
  );
  for (const rootCause of Array.isArray(state.current_root_cause_classes)
    ? state.current_root_cause_classes
    : []) {
    nonEmpty(rootCause, "current_root_cause_classes[]");
    if (previousClasses.has(rootCause)) {
      fail(`repeated unresolved root-cause class ${rootCause}; replace the decision contract or use a smaller review unit`);
    }
  }
  const priorGenerations = Array.isArray(state.prior_generations) ? state.prior_generations : [];
  if (priorGenerations.length !== state.candidate_generation - 1) {
    fail(`candidate generation v${state.candidate_generation} requires exactly ${state.candidate_generation - 1} compact prior generation records`);
  }
  for (const [index, generation] of priorGenerations.entries()) {
    if (generation.generation !== index + 1) fail("prior generation ledger must be contiguous and ordered");
    if (index > 0 && generation.semantic_authority_hash === priorGenerations[index - 1].semantic_authority_hash) {
      fail("provenance-only correction must remain in the same semantic candidate generation");
    }
  }
  if (priorGenerations.length > 0 && state.semantic_authority_hash === priorGenerations.at(-1).semantic_authority_hash) {
    fail("provenance-only correction must remain in the same semantic candidate generation");
  }
  if (state.candidate_generation === 1 && state.candidate_kind !== "initial") fail("v1 must be the initial candidate");
  if (state.candidate_generation === 2 && state.candidate_kind !== "remediation") fail("v2 must be the sole remediation/re-review");
  if (state.candidate_generation === 3 && !["final_replacement", "smaller_review_unit"].includes(state.candidate_kind)) {
    fail("v3 must be a final replacement or smaller review unit");
  }
  if (state.candidate_generation >= 4) {
    if (state.candidate_kind !== "hitl_continuation") fail("v4 or later must be marked as a HITL continuation");
    const continuation = state.hitl_continuation;
    if (!continuation) fail("v4 or later requires an explicit HITL continuation record");
    for (const field of ["actor", "timestamp", "reason", "unresolved_decision_class", "newly_authorized_direction"]) {
      nonEmpty(continuation[field], `hitl_continuation.${field}`);
    }
    if (Number.isNaN(Date.parse(continuation.timestamp))) fail("hitl_continuation.timestamp must be an RFC 3339 timestamp");
  }
  return { candidate_generation: state.candidate_generation };
}

function validateOperationalState(state) {
  const required = [
    "schema_version", "task_id", "candidate_generation", "candidate_kind", "semantic_authority_hash",
    "provenance_hash", "diff_base_commit", "current_root_cause_classes", "prior_generations", "review_requests",
    "transport_probes", "process_receipts", "budget_exception_records",
  ];
  if (!state || typeof state !== "object" || Array.isArray(state)) fail("proof review state must be an object");
  for (const field of required) if (!Object.hasOwn(state, field)) fail(`proof review state is missing required field ${field}`);
  const allowed = new Set([...required, "hitl_continuation"]);
  for (const field of Object.keys(state)) if (!allowed.has(field)) fail(`proof review state contains unsupported field ${field}`);
  if (state.schema_version !== 1) fail("proof review state schema_version must be 1");
  nonEmpty(state.task_id, "proof review state.task_id");
  for (const field of ["semantic_authority_hash", "provenance_hash"]) {
    if (!/^sha256:[0-9a-f]{64}$/.test(state[field] ?? "")) fail(`proof review state.${field} must be a sha256 identity`);
  }
  if (!/^[0-9a-f]{40,64}$/.test(state.diff_base_commit ?? "")) fail("proof review state.diff_base_commit must be a full Git object ID");
  if (!Array.isArray(state.current_root_cause_classes) || new Set(state.current_root_cause_classes).size !== state.current_root_cause_classes.length) {
    fail("proof review state current_root_cause_classes must be a unique array");
  }
  if (!Array.isArray(state.prior_generations)) fail("proof review state prior_generations must be an array");
  for (const [index, generation] of state.prior_generations.entries()) {
    for (const field of ["generation", "semantic_authority_hash", "provenance_hash", "root_cause_classes", "disposition", "generator_profile"]) {
      if (!Object.hasOwn(generation, field)) fail(`prior_generations[${index}] is missing required field ${field}`);
    }
    if (!/^sha256:[0-9a-f]{64}$/.test(generation.provenance_hash ?? "")) fail(`prior_generations[${index}].provenance_hash must be a sha256 identity`);
    if (!["superseded", "replaced", "split"].includes(generation.disposition)) fail(`prior_generations[${index}].disposition is invalid`);
  }
  if (!state.transport_probes || typeof state.transport_probes !== "object" || Array.isArray(state.transport_probes)) fail("proof review state transport_probes must be an object");
  if (!Array.isArray(state.budget_exception_records)) fail("proof review state budget_exception_records must be an array");
  for (const record of state.budget_exception_records) {
    if (!["max_active_packet_bytes", "max_generated_line_count", "max_generated_diff_ratio"].includes(record?.budget_name)) fail("budget exception budget_name is invalid");
    if (!Number.isFinite(record.authorized_limit) || record.authorized_limit <= 0) fail("budget exception authorized_limit must be positive");
    for (const field of ["actor", "timestamp", "reason"]) nonEmpty(record[field], `budget exception.${field}`);
    if (Number.isNaN(Date.parse(record.timestamp))) fail("budget exception timestamp is invalid");
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const directory = args.find((value) => !value.startsWith("--"));
  const option = (name) => {
    const index = args.indexOf(name);
    return index >= 0 ? args[index + 1] : undefined;
  };
  if (!directory) {
    console.error("usage: proof-review-preflight.mjs <task-artifact-directory> [--config path] [--state path] [--repository path --registry path --inventory-config path] [--fixture-only]");
    process.exit(2);
  }
  try {
    const resolved = path.resolve(directory);
    const fixtureOnly = args.includes("--fixture-only");
    const configPath = option("--config");
    if (!fixtureOnly && !configPath) fail("production preflight requires --config");
    const config = configPath ? JSON.parse(fs.readFileSync(path.resolve(configPath), "utf8")) : {};
    const bounded = config.bounded_convergence ?? {};
    if (!fixtureOnly && (!config.bounded_convergence || !Array.isArray(bounded.supported_generator_profiles) || bounded.supported_generator_profiles.length === 0)) {
      fail("production preflight requires bounded_convergence generator policy");
    }
    const repository = option("--repository");
    const registry = option("--registry");
    const inventoryConfig = option("--inventory-config");
    if (!fixtureOnly && (!repository || !registry || !inventoryConfig)) {
      fail("production preflight requires --repository, --registry, and --inventory-config");
    }
    const sourceBinding = repository && registry && inventoryConfig
      ? { repository, registry, inventory_config: inventoryConfig }
      : undefined;
    const relativeTaskRoot = repository ? path.relative(path.resolve(repository), resolved).split(path.sep).join("/") : null;
    const legacyReadOnly = relativeTaskRoot !== null && (bounded.legacy_read_only_roots ?? []).includes(relativeTaskRoot);
    if (!fixtureOnly && legacyReadOnly) {
      console.log(JSON.stringify({ valid: true, ready_for_review: false, legacy_read_only: true, task_artifact_root: relativeTaskRoot }, null, 2));
      process.exit(0);
    }
    const statePath = option("--state") ?? path.join(resolved, bounded.state_file ?? "proof-review-state.json");
    if (!fixtureOnly && !fs.existsSync(statePath)) fail("missing required canonical artifact: proof-review-state.json");
    const state = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, "utf8")) : undefined;
    if (!fixtureOnly) validateOperationalState(state);
    const diffMetrics = repository && state ? deriveGitDiffMetrics(repository, resolved, state.diff_base_commit) : {};
    const packetBudgets = {
      max_active_packet_bytes: bounded.max_active_packet_bytes,
      max_generated_line_count: bounded.max_generated_line_count,
      max_generated_diff_ratio: bounded.max_generated_diff_ratio,
      generated_diff_ratio_action: bounded.generated_diff_ratio_action,
      ...diffMetrics,
      exception_records: state?.budget_exception_records ?? [],
      legacy_read_only: legacyReadOnly,
    };
    const result = validateProofReviewPreflight(resolved, {
      state,
      fixture_only: fixtureOnly,
      supported_generator_profiles: bounded.supported_generator_profiles,
      packet_budgets: packetBudgets,
      check_rendered: !fixtureOnly,
      review_requests: state?.review_requests,
      reviewer_policies: bounded.reviewer_policies,
      transport_probes: state?.transport_probes,
      process_receipts: state?.process_receipts,
      source_binding: sourceBinding,
    });
    console.log(JSON.stringify({ valid: true, ...result }, null, 2));
  } catch (error) {
    console.error(`proof review preflight failed: ${error.message}`);
    process.exit(1);
  }
}
