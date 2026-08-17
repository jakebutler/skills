import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { renderProofHarness } from "../../scripts/render-proof-harness.mjs";
import {
  computeProofIdentities,
  validateConvergenceState,
  validateProofReviewPreflight,
  validatePacketLayout,
  validatePacketBudgets,
  validateResolutionReferences,
  preflightReviewerTransport,
  validateProcessReceipts,
  deriveGitDiffMetrics,
} from "../../scripts/proof-review-preflight.mjs";

const sha = (character) => `sha256:${character.repeat(64)}`;

const fourthCandidate = {
  schema_version: 1,
  task_id: "fixture-bounded-convergence",
  candidate_generation: 4,
  candidate_kind: "hitl_continuation",
  semantic_authority_hash: sha("a"),
  provenance_hash: sha("b"),
  current_root_cause_classes: [],
  prior_generations: [
    { generation: 1, semantic_authority_hash: sha("c"), root_cause_classes: ["coverage-gap"] },
    { generation: 2, semantic_authority_hash: sha("d"), root_cause_classes: ["stable-id"] },
    { generation: 3, semantic_authority_hash: sha("e"), root_cause_classes: ["replacement-decision"] },
  ],
};

assert.throws(
  () => validateConvergenceState(fourthCandidate),
  /v4.*HITL continuation/i,
  "a fourth complete candidate must fail before review without explicit HITL authority",
);

assert.throws(
  () => validateConvergenceState({
    ...fourthCandidate,
    candidate_generation: 3,
    current_root_cause_classes: ["stable-id"],
  }),
  /repeated unresolved root-cause class.*stable-id/i,
  "a repeated unresolved class must force a replacement decision or smaller review unit",
);
assert.throws(
  () => validateConvergenceState({
    ...fourthCandidate,
    candidate_generation: 3,
    prior_generations: fourthCandidate.prior_generations.slice(0, 2),
  }),
  /v3.*final replacement or smaller review unit/i,
);
assert.doesNotThrow(() => validateConvergenceState({
  ...fourthCandidate,
  candidate_kind: "hitl_continuation",
  hitl_continuation: {
    actor: "review-owner@example.test",
    timestamp: "2026-08-17T12:00:00.000Z",
    reason: "A newly discovered authority choice requires one bounded continuation.",
    unresolved_decision_class: "new-authority-choice",
    newly_authorized_direction: "Split the review into the named authority subunit.",
  },
}));

const identityDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "proof-identities-"));
try {
  fs.cpSync(path.resolve(import.meta.dirname, "../proof-harness/fixtures/approved"), identityDirectory, {
    recursive: true,
  });
  const initial = computeProofIdentities(identityDirectory);
  const coveragePath = path.join(identityDirectory, "design-review-coverage.json");
  const coverage = JSON.parse(fs.readFileSync(coveragePath, "utf8"));
  coverage.reviews[0].review_run_id = "RUN-ARCH-PROVENANCE-CORRECTION";
  coverage.reviews[0].verdicts[0].evidence = "Corrected explanatory provenance wording.";
  fs.writeFileSync(coveragePath, `${JSON.stringify(coverage, null, 2)}\n`);
  const provenanceCorrection = computeProofIdentities(identityDirectory, initial);
  assert.equal(provenanceCorrection.semantic_authority_hash, initial.semantic_authority_hash);
  assert.notEqual(provenanceCorrection.provenance_hash, initial.provenance_hash);
  assert.equal(provenanceCorrection.semantic_review_required, false);

  const requirementsPath = path.join(identityDirectory, "requirements.json");
  const requirements = JSON.parse(fs.readFileSync(requirementsPath, "utf8"));
  requirements.requirements[0].statement = "Changed semantic authority requirement.";
  fs.writeFileSync(requirementsPath, `${JSON.stringify(requirements, null, 2)}\n`);
  const semanticCorrection = computeProofIdentities(identityDirectory, initial);
  assert.notEqual(semanticCorrection.semantic_authority_hash, initial.semantic_authority_hash);
  assert.equal(semanticCorrection.semantic_review_required, true);
} finally {
  fs.rmSync(identityDirectory, { recursive: true, force: true });
}

const placeholderDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "proof-placeholder-"));
try {
  fs.cpSync(path.resolve(import.meta.dirname, "../proof-harness/fixtures/approved"), placeholderDirectory, {
    recursive: true,
  });
  const requirementsPath = path.join(placeholderDirectory, "requirements.json");
  const requirements = JSON.parse(fs.readFileSync(requirementsPath, "utf8"));
  requirements.requirements[0].statement = "TODO: replace this placeholder after review";
  fs.writeFileSync(requirementsPath, `${JSON.stringify(requirements, null, 2)}\n`);
  assert.throws(
    () => validateProofReviewPreflight(placeholderDirectory),
    /prohibited placeholder.*requirements\.json/i,
    "issue #525 v7-style placeholders must be rejected before reviewer dispatch",
  );
} finally {
  fs.rmSync(placeholderDirectory, { recursive: true, force: true });
}

const resolutionDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "proof-resolution-id-"));
try {
  fs.cpSync(path.resolve(import.meta.dirname, "../review-resolution/fixtures/changes-required"), resolutionDirectory, {
    recursive: true,
  });
  const resolutionPath = path.join(resolutionDirectory, "design-review-resolution.json");
  const resolution = JSON.parse(fs.readFileSync(resolutionPath, "utf8"));
  resolution.source_finding_dispositions[0].resolution_id = "RESOLUTION-WRONG";
  fs.writeFileSync(resolutionPath, `${JSON.stringify(resolution, null, 2)}\n`);
  assert.throws(
    () => validateResolutionReferences(resolutionDirectory),
    /malformed resolution reference.*RESOLUTION-WRONG/i,
    "issue #525 v8-style incorrect stable resolution IDs must fail deterministically",
  );
  delete resolution.resolved_changes[0].id;
  resolution.source_finding_dispositions[0].resolution_id = "RESOLUTION-001";
  fs.writeFileSync(resolutionPath, `${JSON.stringify(resolution, null, 2)}\n`);
  assert.throws(
    () => validateResolutionReferences(resolutionDirectory),
    /missing a valid stable resolution ID/i,
    "issue #525 v9-style omitted correction IDs must fail deterministically",
  );
} finally {
  fs.rmSync(resolutionDirectory, { recursive: true, force: true });
}

const generationDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "proof-generations-"));
try {
  fs.cpSync(path.resolve(import.meta.dirname, "../proof-harness/fixtures/approved"), generationDirectory, {
    recursive: true,
  });
  fs.mkdirSync(path.join(generationDirectory, "archive", "v2"), { recursive: true });
  for (const file of [
    "requirements.json",
    "effect-surfaces.json",
    "invariant-selection.json",
    "architecture-proof.json",
    "proof-plan.json",
  ]) {
    fs.copyFileSync(path.join(generationDirectory, file), path.join(generationDirectory, "archive", "v2", file));
  }
  assert.throws(
    () => validatePacketLayout(generationDirectory),
    /multiple active complete candidate generations/i,
  );
  assert.equal(validatePacketLayout(generationDirectory, { legacy_read_only: true }).legacy_read_only, true);
} finally {
  fs.rmSync(generationDirectory, { recursive: true, force: true });
}

const budgetFixture = path.resolve(import.meta.dirname, "../proof-harness/fixtures/approved");
assert.throws(
  () => validateProofReviewPreflight(budgetFixture),
  /proof review state must be an object/i,
  "the exported production validator must not report ready without bound operational state",
);
assert.throws(
  () => validatePacketBudgets(budgetFixture, { max_active_packet_bytes: 10 }),
  /active packet size budget exceeded/i,
);

const transport = preflightReviewerTransport(
  { lens: "security", model_route: "claude-opus5-high", model: "claude-opus-5", effort: "high", read_only: true, transport_probe_run_id: "claude-task-probe-001" },
  [
    {
      transport: "cursor-wrapper",
      provider: "anthropic",
      model_route: "claude-opus5-high",
      available: true,
      authenticated: false,
      model: "claude-opus-5",
      effort: "high",
      read_only: true,
      provider_task_run_id: null,
    },
    {
      transport: "claude-cli",
      provider: "anthropic",
      model_route: "claude-opus5-high",
      available: true,
      authenticated: true,
      model: "claude-opus-5",
      effort: "high",
      read_only: true,
      provider_task_run_id: "claude-task-probe-reselected",
    },
    {
      transport: "claude-cli",
      provider: "anthropic",
      model_route: "claude-opus5-high",
      available: true,
      authenticated: true,
      model: "claude-opus-5",
      effort: "high",
      read_only: true,
      provider_task_run_id: "claude-task-probe-001",
    },
  ],
  { model_route: "claude-opus5-high", provider: "anthropic", transport_families: ["cursor-wrapper", "claude-cli"], model: "claude-opus-5", effort: "high" },
);
assert.equal(transport.selected.transport, "claude-cli");
assert.equal(transport.selected.provider_task_run_id, "claude-task-probe-001");
assert.equal(transport.fallback_from, "cursor-wrapper");
assert.throws(
  () => preflightReviewerTransport(
    { lens: "security", model_route: "claude-opus5-high", model: "claude-opus-5", effort: "high", read_only: true, transport_probe_run_id: "wrong-provider" },
    [{ transport: "api-wrapper", provider: "anthropic-api", model_route: "claude-opus5-high", available: true, authenticated: true, model: "claude-opus-5", effort: "high", read_only: true, provider_task_run_id: "wrong-provider" }],
    { model_route: "claude-opus5-high", provider: "anthropic", transport_families: ["claude-cli"], model: "claude-opus-5", effort: "high" },
  ),
  /no authenticated read-only reviewer transport/i,
);
assert.throws(
  () => preflightReviewerTransport(
    { lens: "security", model_route: "claude-opus5-high", model: "claude-opus-5", effort: "high", read_only: true, transport_probe_run_id: "expected-probe" },
    [{ transport: "claude-cli", provider: "anthropic", model_route: "claude-opus5-high", available: true, authenticated: true, model: "claude-opus-5", effort: "high", read_only: true, provider_task_run_id: "different-probe" }],
    { model_route: "claude-opus5-high", provider: "anthropic", transport_families: ["claude-cli"], model: "claude-opus-5", effort: "high" },
  ),
  /no authenticated read-only reviewer transport/i,
  "preflight must reject an otherwise eligible probe with a different retained identity",
);
assert.throws(
  () => preflightReviewerTransport(
    { lens: "security", model_route: "codex-luna-low", model: "gpt-5.6-luna", effort: "low", read_only: true, transport_probe_run_id: "probe-downgraded" },
    [{
      transport: "codex-cli", provider: "openai", model_route: "codex-luna-low", available: true, authenticated: true,
      model: "gpt-5.6-luna", effort: "low", read_only: true, provider_task_run_id: "probe-downgraded",
    }],
    { model_route: "codex-sol-xhigh", provider: "openai", transport_families: ["codex-cli"], model: "gpt-5.6-sol", effort: "xhigh" },
  ),
  /does not match pinned policy/i,
);

assert.throws(
  () => validateProofReviewPreflight(budgetFixture, {
    supported_generator_profiles: [{ id: "fixture-inventory", versions: ["2.0.0"] }],
  }),
  /unsupported generator version.*fixture-inventory.*1\.0\.0/i,
);

assert.throws(
  () => validateProcessReceipts({
    implementation_approved_at: "2026-08-17T10:00:00.000Z",
    observed_at: "2026-08-17T11:31:00.000Z",
    first_meaningful_red_at: null,
    first_production_code_change_at: null,
    design_candidate_count: 1,
    full_review_rounds: 0,
    broad_suite_runs: [],
    provenance_only_invalidated_shas: [],
  }, { now: Date.parse("2026-08-17T11:31:00.000Z") }),
  /convergence checkpoint required.*90 minutes/i,
);
assert.throws(
  () => validateProcessReceipts({
    implementation_approved_at: "2026-08-17T10:00:00.000Z",
    observed_at: "2026-08-17T10:01:00.000Z",
    first_meaningful_red_at: "2026-08-17T10:01:00.000Z",
    first_production_code_change_at: null,
    design_candidate_count: 1,
    full_review_rounds: 0,
    broad_suite_runs: [],
    provenance_only_invalidated_shas: [],
  }, { now: Date.parse("2026-08-17T10:12:00.001Z") }),
  /observed_at is stale/i,
);

assert.throws(
  () => validateConvergenceState({
    schema_version: 1,
    task_id: "same-semantic-candidate",
    candidate_generation: 2,
    candidate_kind: "remediation",
    semantic_authority_hash: sha("a"),
    provenance_hash: sha("b"),
    current_root_cause_classes: [],
    prior_generations: [{ generation: 1, semantic_authority_hash: sha("a"), root_cause_classes: [] }],
  }),
  /provenance-only correction must remain in the same semantic candidate generation/i,
);

const stableIdDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "proof-stable-id-"));
try {
  fs.cpSync(budgetFixture, stableIdDirectory, { recursive: true });
  const requirementsPath = path.join(stableIdDirectory, "requirements.json");
  const requirements = JSON.parse(fs.readFileSync(requirementsPath, "utf8"));
  requirements.requirements[0].id = "temporary-id";
  fs.writeFileSync(requirementsPath, `${JSON.stringify(requirements, null, 2)}\n`);
  assert.throws(
    () => validateProofReviewPreflight(stableIdDirectory),
    /invalid stable ID.*temporary-id/i,
  );
} finally {
  fs.rmSync(stableIdDirectory, { recursive: true, force: true });
}

const preReviewDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "proof-pre-review-template-"));
try {
  fs.cpSync(budgetFixture, preReviewDirectory, { recursive: true });
  const coveragePath = path.join(preReviewDirectory, "design-review-coverage.json");
  const coverage = JSON.parse(fs.readFileSync(coveragePath, "utf8"));
  coverage.reviews[0].review_run_id = "{{ARCHITECTURE_REVIEW_RUN_ID}}";
  fs.writeFileSync(coveragePath, `${JSON.stringify(coverage, null, 2)}\n`);
  const firstPlaceholderIdentity = computeProofIdentities(preReviewDirectory);
  coverage.reviews[0].review_run_id = "{{ARCHITECTURE_REVIEW_RUN_ID_REISSUED}}";
  fs.writeFileSync(coveragePath, `${JSON.stringify(coverage, null, 2)}\n`);
  const secondPlaceholderIdentity = computeProofIdentities(preReviewDirectory);
  assert.notEqual(
    secondPlaceholderIdentity.provenance_hash,
    firstPlaceholderIdentity.provenance_hash,
    "pre-review placeholder-bearing provenance must remain byte-sensitive",
  );
  const resolutionPath = path.join(preReviewDirectory, "design-review-resolution.json");
  const resolution = JSON.parse(fs.readFileSync(resolutionPath, "utf8"));
  const originalResolution = `${JSON.stringify(resolution, null, 2)}\n`;
  resolution.status = "{{RESOLUTION_STATUS_REISSUED}}";
  fs.writeFileSync(resolutionPath, `${JSON.stringify(resolution, null, 2)}\n`);
  const resolutionPlaceholderIdentity = computeProofIdentities(preReviewDirectory);
  assert.notEqual(
    resolutionPlaceholderIdentity.provenance_hash,
    secondPlaceholderIdentity.provenance_hash,
    "resolution placeholder changes must remain byte-sensitive provenance",
  );
  fs.writeFileSync(resolutionPath, originalResolution);
  assert.equal(validateProofReviewPreflight(preReviewDirectory, { fixture_only: true }).ready_for_review, true);

  const architecturePath = path.join(preReviewDirectory, "architecture-proof.json");
  const architecture = JSON.parse(fs.readFileSync(architecturePath, "utf8"));
  architecture.decisions[0].requirement_ids = [architecture.decisions[0].requirement_ids[0]];
  fs.writeFileSync(architecturePath, `${JSON.stringify(architecture, null, 2)}\n`);
  assert.throws(
    () => validateProofReviewPreflight(preReviewDirectory, { fixture_only: true }),
    /orphaned requirement.*has no architecture decision contract/i,
  );
} finally {
  fs.rmSync(preReviewDirectory, { recursive: true, force: true });
}

const diffRepository = fs.mkdtempSync(path.join(os.tmpdir(), "proof-diff-base-"));
try {
  const runGit = (...args) => execFileSync("git", args, { cwd: diffRepository, encoding: "utf8" }).trim();
  fs.mkdirSync(path.join(diffRepository, "plans", "task"), { recursive: true });
  fs.writeFileSync(path.join(diffRepository, "plans", "task", "packet.json"), "base\n");
  fs.writeFileSync(path.join(diffRepository, "source.txt"), "base\n");
  runGit("init", "-q");
  runGit("config", "user.email", "fixture@example.test");
  runGit("config", "user.name", "Fixture");
  runGit("add", ".");
  runGit("commit", "-qm", "base");
  const base = runGit("rev-parse", "HEAD");
  fs.writeFileSync(path.join(diffRepository, "plans", "task", "packet.json"), "generated candidate\n");
  fs.writeFileSync(path.join(diffRepository, "source.txt"), "production source change\n");
  runGit("add", ".");
  runGit("commit", "-qm", "candidate");
  const metrics = deriveGitDiffMetrics(diffRepository, path.join(diffRepository, "plans", "task"), base);
  assert.ok(metrics.total_diff_bytes > metrics.generated_diff_bytes);
  assert.ok(metrics.generated_diff_bytes > 0);
  fs.appendFileSync(path.join(diffRepository, "plans", "task", "packet.json"), "tracked working-tree packet update\n".repeat(20));
  runGit("add", "plans/task/packet.json");
  fs.appendFileSync(path.join(diffRepository, "source.txt"), "tracked working-tree source update\n".repeat(20));
  const workingTreeMetrics = deriveGitDiffMetrics(diffRepository, path.join(diffRepository, "plans", "task"), base);
  assert.ok(
    workingTreeMetrics.total_diff_bytes > metrics.total_diff_bytes,
    "diff accounting must include staged and unstaged tracked working-tree changes",
  );
  assert.ok(
    workingTreeMetrics.generated_diff_bytes > metrics.generated_diff_bytes,
    "generated diff accounting must include tracked packet changes",
  );
} finally {
  fs.rmSync(diffRepository, { recursive: true, force: true });
}

const staleSnapshotDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "proof-pre-review-stale-"));
try {
  fs.cpSync(budgetFixture, staleSnapshotDirectory, { recursive: true });
  const requirementsPath = path.join(staleSnapshotDirectory, "requirements.json");
  const requirements = JSON.parse(fs.readFileSync(requirementsPath, "utf8"));
  requirements.requirements[0].statement = "Semantically changed after snapshot generation.";
  fs.writeFileSync(requirementsPath, `${JSON.stringify(requirements, null, 2)}\n`);
  assert.throws(
    () => validateProofReviewPreflight(staleSnapshotDirectory),
    /design snapshot requirements_hash does not reproduce/i,
  );
} finally {
  fs.rmSync(staleSnapshotDirectory, { recursive: true, force: true });
}

const completeDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "proof-complete-preflight-"));
try {
  fs.cpSync(budgetFixture, completeDirectory, { recursive: true });
  renderProofHarness(completeDirectory);
  const completeIdentities = computeProofIdentities(completeDirectory);
  const complete = validateProofReviewPreflight(completeDirectory, {
    fixture_only: true,
    state: {
      schema_version: 1,
      task_id: "fixture-sensitive-write",
      candidate_generation: 1,
      candidate_kind: "initial",
      semantic_authority_hash: completeIdentities.semantic_authority_hash,
      provenance_hash: completeIdentities.provenance_hash,
      current_root_cause_classes: [],
      prior_generations: [],
    },
    supported_generator_profiles: [{ id: "fixture-inventory", versions: ["1.0.0"] }],
    packet_budgets: {},
    check_rendered: true,
    review_requests: [
      { lens: "architecture", model_route: "codex-sol-xhigh", model: "gpt-5.6-sol", effort: "xhigh", read_only: true, transport_probe_run_id: "codex-task-probe-001" },
      { lens: "security", model_route: "claude-opus5-high", model: "claude-opus-5", effort: "high", read_only: true, transport_probe_run_id: "claude-task-probe-001" },
    ],
    reviewer_policies: {
      architecture: { model_route: "codex-sol-xhigh", provider: "openai", transport_families: ["codex-cli"], model: "gpt-5.6-sol", effort: "xhigh" },
      security: { model_route: "claude-opus5-high", provider: "anthropic", transport_families: ["claude-cli"], model: "claude-opus-5", effort: "high" },
    },
    transport_probes: {
      architecture: [{
        transport: "codex-cli",
        provider: "openai",
        model_route: "codex-sol-xhigh",
        available: true,
        authenticated: true,
        model: "gpt-5.6-sol",
        effort: "xhigh",
        read_only: true,
        provider_task_run_id: "codex-task-probe-001",
      }],
      security: [{
        transport: "claude-cli",
        provider: "anthropic",
        model_route: "claude-opus5-high",
        available: true,
        authenticated: true,
        model: "claude-opus-5",
        effort: "high",
        read_only: true,
        provider_task_run_id: "claude-task-probe-001",
      }],
    },
    process_receipts: {
      implementation_approved_at: "2026-08-17T10:00:00.000Z",
      observed_at: "2026-08-17T10:15:00.000Z",
      first_meaningful_red_at: "2026-08-17T10:05:00.000Z",
      first_production_code_change_at: null,
      design_candidate_count: 1,
      full_review_rounds: 0,
      broad_suite_runs: [],
      provenance_only_invalidated_shas: [],
    },
    now: Date.parse("2026-08-17T10:15:00.000Z"),
  });
  assert.equal(complete.ready_for_review, true);
  assert.equal(complete.reviewer_transports.architecture.selected.transport, "codex-cli");
  assert.equal(complete.reviewer_transports.security.selected.transport, "claude-cli");
  assert.throws(
    () => validateProofReviewPreflight(completeDirectory, {
      fixture_only: true,
      ...{
        state: { schema_version: 1, task_id: "fixture-sensitive-write", candidate_generation: 1, candidate_kind: "initial", semantic_authority_hash: completeIdentities.semantic_authority_hash, provenance_hash: completeIdentities.provenance_hash, current_root_cause_classes: [], prior_generations: [] },
        review_requests: [{ lens: "architecture", model_route: "codex-sol-xhigh", model: "gpt-5.6-sol", effort: "xhigh", read_only: true, transport_probe_run_id: "codex-task-probe-001" }],
        reviewer_policies: { architecture: { model_route: "codex-sol-xhigh", provider: "openai", transport_families: ["codex-cli"], model: "gpt-5.6-sol", effort: "xhigh" }, security: { model_route: "claude-opus5-high", provider: "anthropic", transport_families: ["claude-cli"], model: "claude-opus-5", effort: "high" } },
        transport_probes: {},
        process_receipts: { implementation_approved_at: "2026-08-17T10:00:00.000Z", observed_at: "2026-08-17T10:15:00.000Z", first_meaningful_red_at: "2026-08-17T10:05:00.000Z", first_production_code_change_at: null, design_candidate_count: 1, full_review_rounds: 0, broad_suite_runs: [], provenance_only_invalidated_shas: [] },
      },
    }),
    /requires exactly architecture and security reviewer requests/i,
  );
  fs.appendFileSync(path.join(completeDirectory, "rendered", "requirements.md"), "stale view\n");
  assert.throws(
    () => validateProofReviewPreflight(completeDirectory, { check_rendered: true }),
    /stale rendered artifact/i,
  );
} finally {
  fs.rmSync(completeDirectory, { recursive: true, force: true });
}

console.log("bounded convergence fixtures passed");
