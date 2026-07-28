import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  processSolutionLearning,
  readSolutionLearningCandidate,
  validateSolutionLearningDocument,
} from "../../scripts/solution-learning.mjs";

const root = path.resolve(import.meta.dirname, "../..");
const schema = JSON.parse(
  fs.readFileSync(path.join(root, "schemas/solution-learning.schema.json"), "utf8"),
);
assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
assert.equal(schema.properties.track.enum.length, 2);
const fixture = path.join(import.meta.dirname, "fixtures/new-bug.json");
const candidate = readSolutionLearningCandidate(fixture);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "ai-os-solution-learning-"));
const solutionsDirectory = path.join(temp, "docs/solutions");

const result = processSolutionLearning(candidate, {
  repositoryRoot: root,
  solutionsDirectory,
});

assert.equal(result.status, "created");
assert.equal(result.track, "bug");
assert.equal(
  result.relative_path,
  "normalize-provider-identifiers.md",
);
assert.match(result.learning_fingerprint, /^sha256:[a-f0-9]{64}$/);
assert.equal(fs.existsSync(path.join(solutionsDirectory, result.relative_path)), true);
assert.match(
  fs.readFileSync(path.join(solutionsDirectory, result.relative_path), "utf8"),
  /track: bug/,
);
assert.deepEqual(
  validateSolutionLearningDocument(
    fs.readFileSync(path.join(solutionsDirectory, result.relative_path), "utf8"),
  ),
  [],
);

const skipped = processSolutionLearning(
  readSolutionLearningCandidate(
    path.join(import.meta.dirname, "fixtures/skipped-trivial.json"),
  ),
  { repositoryRoot: root, solutionsDirectory },
);
assert.deepEqual(skipped, {
  status: "skipped",
  reason:
    "The episode was task-specific and did not change how a future agent should act.",
});

const beforeDuplicate = fs.readFileSync(
  path.join(solutionsDirectory, result.relative_path),
  "utf8",
);
const duplicate = processSolutionLearning(
  readSolutionLearningCandidate(
    path.join(import.meta.dirname, "fixtures/duplicate-wrap.json"),
  ),
  { repositoryRoot: root, solutionsDirectory },
);
assert.equal(duplicate.status, "reused");
assert.equal(duplicate.relative_path, result.relative_path);
assert.equal(
  fs.readFileSync(path.join(solutionsDirectory, result.relative_path), "utf8"),
  beforeDuplicate,
);

const updated = processSolutionLearning(
  readSolutionLearningCandidate(
    path.join(import.meta.dirname, "fixtures/high-overlap-update.json"),
  ),
  { repositoryRoot: root, solutionsDirectory },
);
assert.equal(updated.status, "updated");
assert.equal(updated.relative_path, result.relative_path);
assert.match(
  fs.readFileSync(path.join(solutionsDirectory, result.relative_path), "utf8"),
  /last_updated: 2026-07-29/,
);

const moderate = processSolutionLearning(
  readSolutionLearningCandidate(
    path.join(
      import.meta.dirname,
      "fixtures/moderate-overlap-knowledge.json",
    ),
  ),
  { repositoryRoot: root, solutionsDirectory },
);
assert.equal(moderate.status, "created");
assert.equal(moderate.track, "knowledge");
assert.deepEqual(moderate.refresh_recommendation, {
  reason: "moderate-overlap",
  related_paths: ["normalize-provider-identifiers.md"],
  matches: [
    {
      path: "normalize-provider-identifiers.md",
      dimensions: ["module", "tags", "referenced-files"],
    },
  ],
});

const stale = processSolutionLearning(
  readSolutionLearningCandidate(
    path.join(import.meta.dirname, "fixtures/stale-session.json"),
  ),
  { repositoryRoot: root, solutionsDirectory },
);
assert.equal(stale.status, "stale");
assert.match(stale.reason, /newer stored learning/);

const historical = processSolutionLearning(
  readSolutionLearningCandidate(
    path.join(import.meta.dirname, "fixtures/historical-deleted-path.json"),
  ),
  {
    repositoryRoot: root,
    solutionsDirectory: path.join(temp, "historical-solutions"),
  },
);
assert.equal(historical.status, "created");

const malformedErrors = validateSolutionLearningDocument(
  fs.readFileSync(
    path.join(import.meta.dirname, "fixtures/malformed-frontmatter.md"),
    "utf8",
  ),
);
assert.ok(malformedErrors.some((error) => /frontmatter line/.test(error)));
assert.ok(malformedErrors.some((error) => /placeholder/.test(error)));

const rootInstructions = path.join(root, "root/AGENTS.template.md");
const instructionsBefore = fs.readFileSync(rootInstructions, "utf8");
const headless = processSolutionLearning(
  readSolutionLearningCandidate(
    path.join(
      import.meta.dirname,
      "fixtures/headless-discoverability-gap.json",
    ),
  ),
  { repositoryRoot: root, solutionsDirectory, headless: true },
);
assert.equal(headless.status, "skipped");
assert.deepEqual(headless.discoverability_gap, {
  target: "root/AGENTS.template.md",
  reason:
    "The instantiated root instructions do not mention selective solution retrieval.",
  disposition: "report-only",
});
assert.equal(fs.readFileSync(rootInstructions, "utf8"), instructionsBefore);

const contradictedDescriptor = readSolutionLearningCandidate(
  path.join(import.meta.dirname, "fixtures/contradicted-current-source.json"),
);
const contradictedCandidate = structuredClone(candidate);
contradictedCandidate.grounding.status =
  contradictedDescriptor.grounding_status;
contradictedCandidate.grounding.claims[0].status =
  contradictedDescriptor.claim_status;
const contradicted = processSolutionLearning(contradictedCandidate, {
  repositoryRoot: root,
  solutionsDirectory: path.join(temp, "contradicted-solutions"),
});
assert.equal(contradicted.status, "rejected");
assert.ok(
  contradicted.errors.some((error) =>
    /contradicted grounding blocks/.test(error),
  ),
);

const brokenDescriptor = readSolutionLearningCandidate(
  path.join(import.meta.dirname, "fixtures/broken-references.json"),
);
const brokenCandidate = structuredClone(candidate);
brokenCandidate.related.docs = [brokenDescriptor.related_doc];
brokenCandidate.related.issues = [brokenDescriptor.related_issue];
const broken = processSolutionLearning(brokenCandidate, {
  repositoryRoot: root,
  solutionsDirectory: path.join(temp, "broken-solutions"),
});
assert.equal(broken.status, "rejected");
assert.ok(broken.errors.some((error) => /related\.docs\[0\] does not exist/.test(error)));
assert.ok(broken.errors.some((error) => /GitHub issue URL/.test(error)));

const mergeCandidate = structuredClone(candidate);
mergeCandidate.grounding.claims = [
  {
    kind: "merge-state",
    statement: "Planning PR 16 is merged.",
    status: "verified",
    verification_method: "github-live",
    evidence_url: "https://github.com/jakebutler/skills/pull/16",
  },
];
assert.equal(
  processSolutionLearning(mergeCandidate, {
    repositoryRoot: root,
    solutionsDirectory: path.join(temp, "merge-solutions"),
  }).status,
  "created",
);
mergeCandidate.grounding.claims[0].verification_method = "offline";
const unverifiedMerge = processSolutionLearning(mergeCandidate, {
  repositoryRoot: root,
  solutionsDirectory: path.join(temp, "bad-merge-solutions"),
});
assert.equal(unverifiedMerge.status, "rejected");
assert.ok(
  unverifiedMerge.errors.some((error) =>
    /verification_method must be github-live/.test(error),
  ),
);

const cliSolutions = path.join(temp, "cli-solutions");
const cli = spawnSync(
  process.execPath,
  [
    path.join(root, "scripts/process-solution-learning.mjs"),
    fixture,
    root,
    cliSolutions,
  ],
  { encoding: "utf8" },
);
assert.equal(cli.status, 0, cli.stderr);
assert.equal(JSON.parse(cli.stdout).status, "created");

console.log("solution-learning tests passed");
