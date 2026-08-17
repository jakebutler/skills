import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { hashBuilderPacket } from "../../scripts/hash-proof-harness-builder-packet.mjs";
import { validate as validatePacket } from "../../scripts/validate-proof-harness.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const templateRoot = path.resolve(here, "../..");
const validator = path.join(templateRoot, "scripts/validate-proof-harness.mjs");
const selector = path.join(templateRoot, "scripts/select-proof-harness-invariants.mjs");
const extractor = path.join(templateRoot, "scripts/extract-proof-harness-invariant.mjs");

function validate(fixture) {
  return spawnSync(process.execPath, [validator, path.join(here, "fixtures", fixture), "--fixture-only"], {
    cwd: templateRoot,
    encoding: "utf8",
  });
}

const approved = validate("approved");
assert.equal(
  approved.status,
  0,
  `approved packet should pass\nstdout:\n${approved.stdout}\nstderr:\n${approved.stderr}`,
);

const missingSecurity = validate("missing-security-approval");
assert.notEqual(missingSecurity.status, 0, "missing security approval must fail closed");
assert.match(
  `${missingSecurity.stdout}\n${missingSecurity.stderr}`,
  /security design approval/i,
);

const staleDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "proof-harness-stale-"));
try {
  fs.cpSync(path.join(here, "fixtures", "approved"), staleDirectory, { recursive: true });
  const requirementsPath = path.join(staleDirectory, "requirements.json");
  const requirements = JSON.parse(fs.readFileSync(requirementsPath, "utf8"));
  requirements.requirements[0].statement = "Changed after the design snapshot was frozen.";
  fs.writeFileSync(requirementsPath, `${JSON.stringify(requirements, null, 2)}\n`, "utf8");

  const staleSnapshot = spawnSync(process.execPath, [validator, staleDirectory, "--fixture-only"], {
    cwd: templateRoot,
    encoding: "utf8",
  });
  assert.notEqual(staleSnapshot.status, 0, "a stale design snapshot must fail closed");
  assert.match(
    `${staleSnapshot.stdout}\n${staleSnapshot.stderr}`,
    /design snapshot/i,
  );
} finally {
  fs.rmSync(staleDirectory, { recursive: true, force: true });
}

const staleReviewDirectory = fs.mkdtempSync(
  path.join(os.tmpdir(), "proof-harness-stale-review-"),
);
try {
  fs.cpSync(path.join(here, "fixtures", "approved"), staleReviewDirectory, {
    recursive: true,
  });
  const coveragePath = path.join(staleReviewDirectory, "design-review-coverage.json");
  const coverage = JSON.parse(fs.readFileSync(coveragePath, "utf8"));
  coverage.reviews[0].verdicts[0].evidence = "Changed after builder approval.";
  fs.writeFileSync(coveragePath, `${JSON.stringify(coverage, null, 2)}\n`, "utf8");

  const staleBuilderPacket = spawnSync(process.execPath, [validator, staleReviewDirectory, "--fixture-only"], {
    cwd: templateRoot,
    encoding: "utf8",
  });
  assert.notEqual(staleBuilderPacket.status, 0, "a stale builder packet must fail closed");
  assert.match(
    `${staleBuilderPacket.stdout}\n${staleBuilderPacket.stderr}`,
    /builder packet/i,
  );
} finally {
  fs.rmSync(staleReviewDirectory, { recursive: true, force: true });
}

const reviewBinding = {
  task_id: "fixture-sensitive-write",
  semantic_authority_hash: "sha256:1f34a7b68f29df8fa3a5ea9536b1205b6bfa62cb3bce33c50b8b391566c70b06",
  review_requests: [
    { lens: "architecture", model_route: "fable", model: "claude-fable-5", effort: "high", read_only: true },
    { lens: "security", model_route: "opus-4.8", model: "claude-opus-4-8", effort: "high", read_only: true },
  ],
  reviewer_policies: {
    architecture: { model_route: "fable", provider: "anthropic", transport_families: ["claude-cli"], model: "claude-fable-5", effort: "high" },
    security: { model_route: "opus-4.8", provider: "anthropic", transport_families: ["claude-cli"], model: "claude-opus-4-8", effort: "high" },
  },
  transport_probes: {
    architecture: [{ transport: "claude-cli", provider: "anthropic", model_route: "fable", available: true, authenticated: true, model: "claude-fable-5", effort: "high", read_only: true, provider_task_run_id: "PROBE-ARCH-001" }],
    security: [{ transport: "claude-cli", provider: "anthropic", model_route: "opus-4.8", available: true, authenticated: true, model: "claude-opus-4-8", effort: "high", read_only: true, provider_task_run_id: "PROBE-SEC-001" }],
  },
};

function refreshBuilderPacket(directory) {
  const resolutionPath = path.join(directory, "design-review-resolution.json");
  const resolution = JSON.parse(fs.readFileSync(resolutionPath, "utf8"));
  resolution.approved_builder_packet_hash = "pending";
  fs.writeFileSync(resolutionPath, `${JSON.stringify(resolution, null, 2)}\n`, "utf8");
  resolution.approved_builder_packet_hash = hashBuilderPacket(directory).approved_builder_packet_hash;
  fs.writeFileSync(resolutionPath, `${JSON.stringify(resolution, null, 2)}\n`, "utf8");
}

assert.doesNotThrow(
  () => validatePacket(path.join(here, "fixtures", "approved"), reviewBinding),
  "an exact final review binding should remain valid",
);
assert.throws(
  () => validatePacket(path.join(here, "fixtures", "approved"), {
    ...reviewBinding,
    semantic_authority_hash: `sha256:${"f".repeat(64)}`,
  }),
  /final review binding does not match the design candidate/i,
);

const wrongProbeDirectory = fs.mkdtempSync(
  path.join(os.tmpdir(), "proof-harness-wrong-probe-"),
);
try {
  fs.cpSync(path.join(here, "fixtures", "approved"), wrongProbeDirectory, { recursive: true });
  const coveragePath = path.join(wrongProbeDirectory, "design-review-coverage.json");
  const coverage = JSON.parse(fs.readFileSync(coveragePath, "utf8"));
  coverage.reviews[0].transport_probe_run_id = "PROBE-UNBOUND";
  fs.writeFileSync(coveragePath, `${JSON.stringify(coverage, null, 2)}\n`, "utf8");
  refreshBuilderPacket(wrongProbeDirectory);
  assert.throws(
    () => validatePacket(wrongProbeDirectory, reviewBinding),
    /architecture blocking review does not retain the selected transport probe identity/i,
  );
} finally {
  fs.rmSync(wrongProbeDirectory, { recursive: true, force: true });
}

const downgradedReviewDirectory = fs.mkdtempSync(
  path.join(os.tmpdir(), "proof-harness-downgraded-review-"),
);
try {
  fs.cpSync(path.join(here, "fixtures", "approved"), downgradedReviewDirectory, { recursive: true });
  const coveragePath = path.join(downgradedReviewDirectory, "design-review-coverage.json");
  const coverage = JSON.parse(fs.readFileSync(coveragePath, "utf8"));
  coverage.reviews[0].model_route = "weaker-fallback";
  coverage.reviews[0].transport_probe_run_id = "PROBE-ARCH-001";
  coverage.reviews[1].transport_probe_run_id = "PROBE-SEC-001";
  fs.writeFileSync(coveragePath, `${JSON.stringify(coverage, null, 2)}\n`, "utf8");
  refreshBuilderPacket(downgradedReviewDirectory);
  assert.throws(
    () => validatePacket(downgradedReviewDirectory, reviewBinding),
    /architecture blocking review route does not match pinned review request/i,
    "final approval must reject a blocking review route that bypasses preflight policy",
  );
} finally {
  fs.rmSync(downgradedReviewDirectory, { recursive: true, force: true });
}

const downgradedStateDirectory = fs.mkdtempSync(
  path.join(os.tmpdir(), "proof-harness-downgraded-state-"),
);
try {
  fs.cpSync(path.join(here, "fixtures", "approved"), downgradedStateDirectory, { recursive: true });
  const coveragePath = path.join(downgradedStateDirectory, "design-review-coverage.json");
  const coverage = JSON.parse(fs.readFileSync(coveragePath, "utf8"));
  coverage.reviews[0].model_route = "weaker-fallback";
  coverage.reviews[0].transport_probe_run_id = "PROBE-ARCH-WEAK";
  coverage.reviews[1].transport_probe_run_id = "PROBE-SEC-001";
  fs.writeFileSync(coveragePath, `${JSON.stringify(coverage, null, 2)}\n`, "utf8");
  refreshBuilderPacket(downgradedStateDirectory);
  const downgradedBinding = structuredClone(reviewBinding);
  downgradedBinding.review_requests[0] = {
    lens: "architecture", model_route: "weaker-fallback", model: "gpt-5.6-luna", effort: "low", read_only: true,
  };
  downgradedBinding.transport_probes.architecture = [{
    transport: "claude-cli", provider: "anthropic", model_route: "weaker-fallback", available: true,
    authenticated: true, model: "gpt-5.6-luna", effort: "low", read_only: true,
    provider_task_run_id: "PROBE-ARCH-WEAK",
  }];
  assert.throws(
    () => validatePacket(downgradedStateDirectory, downgradedBinding),
    /architecture review request does not match pinned reviewer policy/i,
    "final approval must reject review state that downgrades the pinned model or effort",
  );
} finally {
  fs.rmSync(downgradedStateDirectory, { recursive: true, force: true });
}

const placeholderReviewDirectory = fs.mkdtempSync(
  path.join(os.tmpdir(), "proof-harness-placeholder-review-"),
);
try {
  fs.cpSync(path.join(here, "fixtures", "approved"), placeholderReviewDirectory, { recursive: true });
  const coveragePath = path.join(placeholderReviewDirectory, "design-review-coverage.json");
  const coverage = JSON.parse(fs.readFileSync(coveragePath, "utf8"));
  coverage.reviews[0].review_run_id = "{{ARCHITECTURE_REVIEW_RUN_ID}}";
  fs.writeFileSync(coveragePath, `${JSON.stringify(coverage, null, 2)}\n`, "utf8");
  refreshBuilderPacket(placeholderReviewDirectory);
  assert.throws(
    () => validatePacket(placeholderReviewDirectory),
    /prohibited placeholder.*design-review-coverage\.json/i,
    "post-review placeholders must not enter an approved builder packet",
  );
} finally {
  fs.rmSync(placeholderReviewDirectory, { recursive: true, force: true });
}

const registry = path.join(here, "fixtures", "registry", "index.json");
const inventory = path.join(here, "fixtures", "approved", "effect-surfaces.json");
const selectedOnce = spawnSync(process.execPath, [selector, registry, inventory], {
  cwd: templateRoot,
  encoding: "utf8",
});
const selectedTwice = spawnSync(process.execPath, [selector, registry, inventory], {
  cwd: templateRoot,
  encoding: "utf8",
});
assert.equal(selectedOnce.status, 0, selectedOnce.stderr);
assert.equal(selectedTwice.status, 0, selectedTwice.stderr);
assert.equal(selectedOnce.stdout, selectedTwice.stdout, "selection must be byte-stable");
const selectedPacket = JSON.parse(selectedOnce.stdout);
assert.deepEqual(
  selectedPacket.selected.map((row) => row.id),
  ["INV-ATTEMPT-FENCE-001", "INV-AUDIT-001"],
);
assert.deepEqual(selectedPacket.excluded.map((row) => row.id), ["INV-CENSUS-001"]);
assert.deepEqual(selectedPacket.unresolved_coverage, []);

const unresolvedDirectory = fs.mkdtempSync(
  path.join(os.tmpdir(), "proof-harness-unresolved-selection-"),
);
try {
  const unresolvedInventoryPath = path.join(unresolvedDirectory, "effect-surfaces.json");
  const unresolvedInventory = JSON.parse(fs.readFileSync(inventory, "utf8"));
  unresolvedInventory.surfaces[0] = {
    ...unresolvedInventory.surfaces[0],
    id: "SURF-UNKNOWN",
    kind: "unknown_destructive_effect",
    tags: ["unknown"],
  };
  fs.writeFileSync(
    unresolvedInventoryPath,
    `${JSON.stringify(unresolvedInventory, null, 2)}\n`,
    "utf8",
  );
  const unresolvedSelection = spawnSync(
    process.execPath,
    [selector, registry, unresolvedInventoryPath],
    { cwd: templateRoot, encoding: "utf8" },
  );
  assert.notEqual(unresolvedSelection.status, 0, "unclassified High-risk surface must fail");
  const unresolvedPacket = JSON.parse(unresolvedSelection.stdout);
  assert.deepEqual(unresolvedPacket.unresolved_coverage, [
    {
      surface_id: "SURF-UNKNOWN",
      reason: "no surface-specific active-blocking invariant; always-apply rules are insufficient classification",
    },
  ]);
} finally {
  fs.rmSync(unresolvedDirectory, { recursive: true, force: true });
}

const candidateDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "proof-harness-candidate-"));
try {
  const candidateInbox = path.join(candidateDirectory, "candidates.jsonl");
  fs.writeFileSync(candidateInbox, "", "utf8");
  const finding = path.join(here, "fixtures", "novel-finding.json");
  const firstExtraction = spawnSync(process.execPath, [extractor, finding, candidateInbox], {
    cwd: templateRoot,
    encoding: "utf8",
  });
  assert.equal(firstExtraction.status, 0, firstExtraction.stderr);
  const firstBytes = fs.readFileSync(candidateInbox, "utf8");
  const candidate = JSON.parse(firstBytes.trim());
  assert.equal(candidate.event, "candidate_created");
  assert.equal(candidate.status, "candidate");
  assert.equal(candidate.origin.finding_id, "FINDING-NOVEL-001");

  const repeatedExtraction = spawnSync(process.execPath, [extractor, finding, candidateInbox], {
    cwd: templateRoot,
    encoding: "utf8",
  });
  assert.equal(repeatedExtraction.status, 0, repeatedExtraction.stderr);
  assert.equal(
    fs.readFileSync(candidateInbox, "utf8"),
    firstBytes,
    "repeating extraction must be idempotent",
  );
  assert.match(repeatedExtraction.stdout, /already_recorded/);

  fs.mkdirSync(`${candidateInbox}.lock`);
  const contendedExtraction = spawnSync(process.execPath, [extractor, finding, candidateInbox], {
    cwd: templateRoot,
    encoding: "utf8",
  });
  fs.rmdirSync(`${candidateInbox}.lock`);
  assert.notEqual(contendedExtraction.status, 0, "candidate inbox contention must fail visibly");
  assert.match(contendedExtraction.stderr, /locked/i);
} finally {
  fs.rmSync(candidateDirectory, { recursive: true, force: true });
}

console.log("proof-harness contract fixtures passed");
