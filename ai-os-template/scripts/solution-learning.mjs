import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const NON_EMPTY_FIELDS = [
  "title",
  "slug",
  "date",
  "category",
  "module",
  "problem_type",
  "capture_reason",
];

function sha256(value) {
  return `sha256:${crypto.createHash("sha256").update(value).digest("hex")}`;
}

function normalized(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function yamlString(value) {
  return JSON.stringify(String(value));
}

function validateRelativePath(value, label, errors) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    path.isAbsolute(value) ||
    value.split(/[\\/]/).includes("..")
  ) {
    errors.push(`${label} must be a normalized repo-relative path`);
  }
}

export function validateSolutionLearningDocument(text, options = {}) {
  const errors = [];
  if (typeof text !== "string" || !text.startsWith("---\n")) {
    return ["document must start with YAML frontmatter"];
  }
  const close = text.indexOf("\n---\n", 4);
  if (close === -1) return ["document frontmatter is not closed"];
  const frontmatter = text.slice(4, close);
  const values = new Map();
  let tagItems = 0;
  for (const [index, line] of frontmatter.split("\n").entries()) {
    if (line.trim() === "") continue;
    if (/^\s+-\s+/.test(line)) {
      tagItems += 1;
      continue;
    }
    const match = line.match(/^([a-z][a-z0-9_]*):(?:\s*(.*))?$/);
    if (!match) {
      errors.push(`frontmatter line ${index + 1} is not safe key-value YAML`);
      continue;
    }
    if (values.has(match[1]))
      errors.push(`frontmatter key ${match[1]} is duplicated`);
    values.set(match[1], match[2] ?? "");
  }
  for (const required of [
    "schema_version",
    "track",
    "title",
    "slug",
    "date",
    "category",
    "module",
    "tags",
    "problem_type",
    "capture_reason",
    "source_candidate_id",
    "source_git_commit",
    "source_route",
    "observed_at",
    "source_kind",
    "author_id",
    "learning_fingerprint",
    "grounding_status",
    "grounding_validator_id",
  ]) {
    if (!values.has(required))
      errors.push(`frontmatter is missing ${required}`);
    else if (required !== "tags" && values.get(required).trim() === "")
      errors.push(`frontmatter ${required} must be non-empty`);
  }
  if (tagItems === 0) errors.push("frontmatter tags must contain at least one item");
  if (values.get("schema_version") !== "1")
    errors.push("frontmatter schema_version must equal 1");
  if (!["bug", "knowledge"].includes(values.get("track")))
    errors.push("frontmatter track must be bug or knowledge");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.get("slug") ?? ""))
    errors.push("frontmatter slug must be semantic kebab-case");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.get("date") ?? ""))
    errors.push("frontmatter date must use YYYY-MM-DD");
  if (!/^sha256:[a-f0-9]{64}$/.test(values.get("learning_fingerprint") ?? ""))
    errors.push("frontmatter learning_fingerprint must be SHA-256");
  if (!["verified", "degraded"].includes(values.get("grounding_status")))
    errors.push("frontmatter grounding_status must be verified or degraded");
  if (/\{\{[^}]+\}\}/.test(text))
    errors.push("document contains unresolved template placeholder");
  for (const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const target = match[1];
    if (/^(?:https?:|#)/.test(target)) continue;
    const relative = target.split("#", 1)[0];
    validateRelativePath(relative, `internal link ${target}`, errors);
    if (options.repositoryRoot) {
      const resolved = path.resolve(options.repositoryRoot, relative);
      if (
        !resolved.startsWith(`${path.resolve(options.repositoryRoot)}${path.sep}`) ||
        !fs.existsSync(resolved)
      ) {
        errors.push(`internal link ${target} does not exist`);
      }
    }
  }
  return errors;
}

export function validateSolutionLearningCandidate(candidate, options = {}) {
  const errors = [];
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return ["candidate must be an object"];
  }
  if (candidate.schema_version !== 1)
    errors.push("schema_version must equal 1");
  if (candidate.disposition === "skip") {
    if (
      typeof candidate.skip_reason !== "string" ||
      candidate.skip_reason.trim() === ""
    ) {
      errors.push("skip_reason must be a non-empty string");
    }
    for (const field of ["candidate_id", "git_commit", "route"]) {
      if (
        typeof candidate.source_candidate?.[field] !== "string" ||
        candidate.source_candidate[field].trim() === ""
      ) {
        errors.push(`source_candidate.${field} must be a non-empty string`);
      }
    }
    if (!/^[a-f0-9]{40,64}$/.test(candidate.source_candidate?.git_commit ?? ""))
      errors.push("source_candidate.git_commit must be a git object id");
    if (candidate.discoverability_gap) {
      validateRelativePath(
        candidate.discoverability_gap.target,
        "discoverability_gap.target",
        errors,
      );
      if (
        typeof candidate.discoverability_gap.reason !== "string" ||
        candidate.discoverability_gap.reason.trim() === ""
      ) {
        errors.push("discoverability_gap.reason must be a non-empty string");
      }
    }
    return errors;
  }
  if (!["bug", "knowledge"].includes(candidate.track))
    errors.push("track must be bug or knowledge");
  for (const field of NON_EMPTY_FIELDS) {
    if (typeof candidate[field] !== "string" || candidate[field].trim() === "")
      errors.push(`${field} must be a non-empty string`);
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(candidate.slug ?? ""))
    errors.push("slug must be a semantic kebab-case identifier");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate.date ?? ""))
    errors.push("date must use YYYY-MM-DD");
  for (const field of ["category", "module", "problem_type"]) {
    if (!/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/i.test(candidate[field] ?? ""))
      errors.push(`${field} must be a safe identifier`);
  }
  if (
    !Array.isArray(candidate.tags) ||
    candidate.tags.length === 0 ||
    candidate.tags.some((tag) => typeof tag !== "string" || tag.trim() === "")
  ) {
    errors.push("tags must be a non-empty string array");
  } else if (new Set(candidate.tags).size !== candidate.tags.length) {
    errors.push("tags must contain unique values");
  }
  for (const field of ["candidate_id", "git_commit", "route"]) {
    if (
      typeof candidate.source_candidate?.[field] !== "string" ||
      candidate.source_candidate[field].trim() === ""
    ) {
      errors.push(`source_candidate.${field} must be a non-empty string`);
    }
  }
  if (!/^[a-f0-9]{40,64}$/.test(candidate.source_candidate?.git_commit ?? ""))
    errors.push("source_candidate.git_commit must be a git object id");
  for (const field of ["observed_at", "source_kind", "author_id"]) {
    if (
      typeof candidate.provenance?.[field] !== "string" ||
      candidate.provenance[field].trim() === ""
    ) {
      errors.push(`provenance.${field} must be a non-empty string`);
    }
  }
  if (
    candidate.provenance?.observed_at &&
    Number.isNaN(Date.parse(candidate.provenance.observed_at))
  ) {
    errors.push("provenance.observed_at must be an ISO-8601 timestamp");
  }

  const requiredContent =
    candidate.track === "knowledge"
      ? ["context", "guidance", "why_it_matters", "boundaries", "examples"]
      : [
          "problem",
          "investigation",
          "root_cause",
          "solution",
          "why_it_works",
          "prevention",
          "verification",
        ];
  for (const field of requiredContent) {
    if (
      typeof candidate.content?.[field] !== "string" ||
      candidate.content[field].trim() === ""
    ) {
      errors.push(`content.${field} must be a non-empty string`);
    }
  }

  const grounding = candidate.grounding;
  if (
    typeof grounding?.validator_id !== "string" ||
    grounding.validator_id.trim() === ""
  ) {
    errors.push("grounding.validator_id must be a non-empty string");
  }
  if (
    grounding?.validator_id &&
    grounding.validator_id === candidate.provenance?.author_id
  ) {
    errors.push("grounding validator must be independent from the author");
  }
  if (!["verified", "degraded", "contradicted"].includes(grounding?.status))
    errors.push("grounding.status is invalid");
  if (!Array.isArray(grounding?.claims) || grounding.claims.length === 0)
    errors.push("grounding.claims must be a non-empty array");

  for (const [index, claim] of (grounding?.claims ?? []).entries()) {
    if (!["code", "merge-state", "documentation"].includes(claim.kind))
      errors.push(`grounding claim ${index}.kind is invalid`);
    if (typeof claim.statement !== "string" || claim.statement.trim() === "")
      errors.push(`grounding claim ${index}.statement must be non-empty`);
    if (!["verified", "degraded", "contradicted"].includes(claim.status))
      errors.push(`grounding claim ${index}.status is invalid`);
    if (claim.kind === "code" || claim.kind === "documentation") {
      validateRelativePath(
        claim.source_path,
        `grounding claim ${index}.source_path`,
        errors,
      );
      if (
        typeof claim.source_quote !== "string" ||
        claim.source_quote.trim() === ""
      ) {
        errors.push(`grounding claim ${index}.source_quote must be non-empty`);
      } else if (
        claim.historical === true &&
        claim.status === "degraded" &&
        /^[a-f0-9]{40,64}$/.test(claim.source_commit ?? "")
      ) {
        // Historical claims preserve an explicit commit and degraded status;
        // the current tree is not allowed to silently erase that provenance.
        if (options.repositoryRoot) {
          const reachable = spawnSync(
            "git",
            [
              "-C",
              options.repositoryRoot,
              "cat-file",
              "-e",
              `${claim.source_commit}^{commit}`,
            ],
            { encoding: "utf8" },
          );
          if (reachable.status !== 0) {
            errors.push(
              `grounding claim ${index}.source_commit is not reachable`,
            );
          }
        }
      } else if (options.repositoryRoot && claim.source_path) {
        const sourcePath = path.resolve(options.repositoryRoot, claim.source_path);
        if (
          !sourcePath.startsWith(`${path.resolve(options.repositoryRoot)}${path.sep}`) ||
          !fs.existsSync(sourcePath)
        ) {
          errors.push(`grounding claim ${index}.source_path does not exist`);
        } else if (!fs.readFileSync(sourcePath, "utf8").includes(claim.source_quote)) {
          errors.push(`grounding claim ${index}.source_quote was not found`);
        }
      }
    }
    if (claim.kind === "merge-state" && claim.status === "verified") {
      if (
        typeof claim.evidence_url !== "string" ||
        !/^https:\/\/github\.com\/[^/]+\/[^/]+\/(?:pull|issues)\/\d+/.test(
          claim.evidence_url,
        )
      ) {
        errors.push(
          `grounding claim ${index}.evidence_url is required for verified merge state`,
        );
      }
      if (claim.verification_method !== "github-live") {
        errors.push(
          `grounding claim ${index}.verification_method must be github-live when verified`,
        );
      }
    }
    if (
      claim.kind === "merge-state" &&
      claim.status === "degraded" &&
      !["git-reachability", "offline"].includes(claim.verification_method)
    ) {
      errors.push(
        `grounding claim ${index}.verification_method must record the degraded fallback`,
      );
    }
  }

  if (
    grounding?.status === "contradicted" ||
    (grounding?.claims ?? []).some((claim) => claim.status === "contradicted")
  ) {
    errors.push("contradicted grounding blocks trusted solution knowledge");
  }
  if (
    grounding?.status === "verified" &&
    (grounding?.claims ?? []).some((claim) => claim.status !== "verified")
  ) {
    errors.push("grounding.status cannot be verified when a claim is degraded");
  }

  for (const [index, doc] of (candidate.related?.docs ?? []).entries())
    validateRelativePath(doc, `related.docs[${index}]`, errors);
  if (options.repositoryRoot) {
    for (const [index, doc] of (candidate.related?.docs ?? []).entries()) {
      const resolved = path.resolve(options.repositoryRoot, doc);
      if (
        !resolved.startsWith(`${path.resolve(options.repositoryRoot)}${path.sep}`) ||
        !fs.existsSync(resolved)
      ) {
        errors.push(`related.docs[${index}] does not exist`);
      }
    }
  }
  for (const [index, issue] of (candidate.related?.issues ?? []).entries()) {
    if (
      typeof issue !== "string" ||
      !/^https:\/\/github\.com\/[^/]+\/[^/]+\/issues\/\d+$/.test(issue)
    ) {
      errors.push(`related.issues[${index}] must be a GitHub issue URL`);
    }
  }
  if (JSON.stringify(candidate).match(/\{\{[^}]+\}\}/))
    errors.push("candidate contains unresolved template placeholders");
  return errors;
}

export function learningFingerprint(candidate) {
  const identity = {
    source_candidate: {
      candidate_id: candidate.source_candidate.candidate_id,
      git_commit: candidate.source_candidate.git_commit,
    },
    track: candidate.track,
    problem:
      candidate.track === "bug"
        ? normalized(candidate.content.problem)
        : normalized(candidate.content.context),
    root_cause:
      candidate.track === "bug"
        ? normalized(candidate.content.root_cause)
        : normalized(candidate.content.why_it_matters),
    solution:
      candidate.track === "bug"
        ? normalized(candidate.content.solution)
        : normalized(candidate.content.guidance),
  };
  return sha256(JSON.stringify(identity));
}

export function readSolutionLearningCandidate(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function renderList(items) {
  return items.map((item) => `  - ${yamlString(item)}`).join("\n");
}

function renderSections(candidate) {
  if (candidate.track === "knowledge") {
    return `## Context\n\n${candidate.content.context}\n\n## Reusable guidance\n\n${candidate.content.guidance}\n\n## Why it matters\n\n${candidate.content.why_it_matters}\n\n## Applicability boundaries\n\n${candidate.content.boundaries}\n\n## Examples and counterexamples\n\n${candidate.content.examples}`;
  }
  return `## Problem\n\n${candidate.content.problem}\n\n## Investigation and dead ends\n\n${candidate.content.investigation}\n\n## Root cause\n\n${candidate.content.root_cause}\n\n## Verified solution\n\n${candidate.content.solution}\n\n## Why it works\n\n${candidate.content.why_it_works}\n\n## Prevention\n\n${candidate.content.prevention}\n\n## Verification\n\n${candidate.content.verification}`;
}

function termSet(value) {
  return new Set(
    normalized(value)
      .split(/[^a-z0-9]+/)
      .filter((term) => term.length >= 4),
  );
}

function contentSimilarity(candidate, existingText) {
  const candidateTerms = termSet(Object.values(candidate.content).join(" "));
  const existingTerms = termSet(existingText.replace(/^---[\s\S]*?---/m, ""));
  if (candidateTerms.size === 0 || existingTerms.size === 0) return 0;
  const intersection = [...candidateTerms].filter((term) =>
    existingTerms.has(term),
  ).length;
  return intersection / new Set([...candidateTerms, ...existingTerms]).size;
}

function findModerateOverlap(candidate, solutionsDirectory, targetPath) {
  if (!fs.existsSync(solutionsDirectory)) return [];
  return fs
    .readdirSync(solutionsDirectory, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith(".md") &&
        path.join(solutionsDirectory, entry.name) !== targetPath,
    )
    .map((entry) => {
      const text = fs.readFileSync(path.join(solutionsDirectory, entry.name), "utf8");
      const moduleName = text.match(/^module:\s*(.+)$/m)?.[1]?.trim();
      const tagBlock = text.match(/^tags:\s*\n((?:\s+-.*\n?)*)/m)?.[1] ?? "";
      const existingTags = [...tagBlock.matchAll(/^\s+-\s+"?([^"\n]+)"?$/gm)].map(
        (match) => match[1],
      );
      const sharedTags = candidate.tags.filter((tag) => existingTags.includes(tag));
      const sharedDocs = (candidate.related?.docs ?? []).filter((doc) =>
        text.includes(doc),
      );
      const similarity = contentSimilarity(candidate, text);
      const dimensions = [];
      if (moduleName === candidate.module) dimensions.push("module");
      if (sharedTags.length > 0) dimensions.push("tags");
      if (sharedDocs.length > 0) dimensions.push("referenced-files");
      if (similarity >= 0.2) dimensions.push("content");
      return { path: entry.name, dimensions };
    })
    .filter((match) => match.dimensions.length > 0)
    .sort((left, right) => left.path.localeCompare(right.path));
}

export function renderSolutionLearning(candidate, fingerprint, lastUpdated) {
  const claims = candidate.grounding.claims
    .map(
      (claim) =>
        `- ${claim.status}: ${claim.statement}${claim.source_path ? ` (${claim.source_path})` : ""}${claim.source_quote ? ` — quote: ${JSON.stringify(claim.source_quote)}` : ""}`,
    )
    .join("\n");
  return `---
schema_version: 1
track: ${candidate.track}
title: ${yamlString(candidate.title)}
slug: ${candidate.slug}
date: ${candidate.date}
${lastUpdated ? `last_updated: ${lastUpdated}\n` : ""}category: ${candidate.category}
module: ${candidate.module}
tags:
${renderList(candidate.tags)}
problem_type: ${candidate.problem_type}
capture_reason: ${yamlString(candidate.capture_reason)}
source_candidate_id: ${yamlString(candidate.source_candidate.candidate_id)}
source_git_commit: ${candidate.source_candidate.git_commit}
source_route: ${yamlString(candidate.source_candidate.route)}
observed_at: ${yamlString(candidate.provenance.observed_at)}
source_kind: ${yamlString(candidate.provenance.source_kind)}
author_id: ${yamlString(candidate.provenance.author_id)}
learning_fingerprint: ${fingerprint}
grounding_status: ${candidate.grounding.status}
grounding_validator_id: ${yamlString(candidate.grounding.validator_id)}
---

# ${candidate.title}

${renderSections(candidate)}

## Grounding

${claims}

## Related

${[...(candidate.related?.docs ?? []), ...(candidate.related?.issues ?? [])]
  .map((item) => `- ${item}`)
  .join("\n")}
`;
}

export function processSolutionLearning(candidate, options) {
  const errors = validateSolutionLearningCandidate(candidate, {
    repositoryRoot: options.repositoryRoot,
  });
  if (errors.length > 0) {
    return { status: "rejected", errors };
  }
  if (candidate.disposition === "skip") {
    return {
      status: "skipped",
      reason: candidate.skip_reason,
      ...(options.headless &&
        candidate.discoverability_gap && {
          discoverability_gap: {
            ...candidate.discoverability_gap,
            disposition: "report-only",
          },
        }),
    };
  }
  const fingerprint = learningFingerprint(candidate);
  const relativePath = `${candidate.slug}.md`;
  const outputPath = path.join(options.solutionsDirectory, relativePath);
  const moderateOverlap = findModerateOverlap(
    candidate,
    options.solutionsDirectory,
    outputPath,
  );
  let updating = false;
  if (fs.existsSync(outputPath)) {
    const existing = fs.readFileSync(outputPath, "utf8");
    const existingEffectiveDate =
      existing.match(/^last_updated:\s*(\d{4}-\d{2}-\d{2})$/m)?.[1] ??
      existing.match(/^date:\s*(\d{4}-\d{2}-\d{2})$/m)?.[1];
    const candidateObservedDate = candidate.provenance.observed_at.slice(0, 10);
    if (
      existingEffectiveDate &&
      candidateObservedDate < existingEffectiveDate
    ) {
      return {
        status: "stale",
        relative_path: relativePath,
        reason: `candidate observed ${candidateObservedDate} cannot replace newer stored learning from ${existingEffectiveDate}`,
      };
    }
    const existingFingerprint = existing.match(
      /^learning_fingerprint:\s*(sha256:[a-f0-9]{64})$/m,
    )?.[1];
    if (existingFingerprint === fingerprint) {
      return {
        status: "reused",
        track: candidate.track,
        relative_path: relativePath,
        learning_fingerprint: fingerprint,
      };
    }
    updating = true;
  }
  fs.mkdirSync(options.solutionsDirectory, { recursive: true });
  const rendered = renderSolutionLearning(
    candidate,
    fingerprint,
    updating ? candidate.provenance.observed_at.slice(0, 10) : undefined,
  );
  const renderedErrors = validateSolutionLearningDocument(rendered);
  if (renderedErrors.length > 0) {
    return { status: "rejected", errors: renderedErrors };
  }
  fs.writeFileSync(
    outputPath,
    rendered,
    "utf8",
  );
  const result = {
    status: updating ? "updated" : "created",
    track: candidate.track,
    relative_path: relativePath,
    learning_fingerprint: fingerprint,
  };
  if (!updating && moderateOverlap.length > 0) {
    result.refresh_recommendation = {
      reason: "moderate-overlap",
      related_paths: moderateOverlap.map((match) => match.path),
      matches: moderateOverlap,
    };
  }
  return result;
}
