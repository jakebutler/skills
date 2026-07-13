---
name: codex-review
description: Ask Codex CLI (gpt-5.5) for an independent lower-db code review of uncommitted changes, a branch diff, a commit, or a specific implementation. Use when Codex/gpt-5.5 should audit for correctness, regressions, missed tests, lower-db invariant violations, public/admin boundary leaks, or product-risk mismatches. For a small Claude-only review, use the normal review process instead.
---

# Codex Review — lower-db

Use Codex as an independent reviewer when the user wants a second-pass review or the change is broad enough that another agent's perspective is useful.

Prefer Claude/Fable's normal review process for small local checks. Do not delegate review just to avoid reading the code yourself. Treat Codex's output as evidence, not authority.

## Workflow

1. Identify the review target: uncommitted changes, base branch, commit SHA, PR checkout, or specific files.
2. Identify the lower-db invariants and ADRs touched by the target.
3. Create a temporary artifact directory for the Codex report.
4. Run `codex review` with a focused review prompt.
5. Read Codex's report and verify important claims against the code before presenting them.
6. Separate confirmed issues from unverified Codex suggestions.

## Command shapes

```bash
ARTIFACT_DIR="$(mktemp -d "${TMPDIR:-/tmp}/codex-review.XXXXXX")"
```

```bash
REPORT="$ARTIFACT_DIR/report.md"
```

```bash
PROMPT="$ARTIFACT_DIR/prompt.md"
```

Review staged, unstaged, and untracked changes:

```bash
codex -C "$PWD" review --uncommitted - < "$PROMPT" > "$REPORT"
```

Review current branch against main:

```bash
codex -C "$PWD" review --base main - < "$PROMPT" > "$REPORT"
```

Review a single commit:

```bash
codex -C "$PWD" review --commit <sha> - < "$PROMPT" > "$REPORT"
```

## Review prompt

Ask Codex to use a lower-db code-review stance:

```text
Review these changes for bugs, regressions, missing tests, security issues, public/admin boundary leaks, lower-db invariant violations, and requirement mismatches.

Pay special attention to:
- Publish versus Send separation
- reader-visible verified semantics
- patientSignal citation eligibility
- stale ledger re-blocking publish
- canonical getWeekLabel usage
- immutable evidence snapshots
- V2 additive-only persistence
- CLAIM_LEDGER_READ_ONLY guard
- real-or-absent citations
- public Convex query boundaries
- dev/seed/reset functions exposed as public mutations
- direct provider/model calls instead of alias registry
- raw Tailwind values, rounded corners, or design-system drift
- operator scripts without dry-run safe default
- missing focused tests or wrong .test.ts/.test.tsx runner

Prioritize findings over summary. For each finding include:
- severity
- file and line reference
- concrete failure mode
- suggested fix direction

Do not edit files. If there are no substantive findings, say so and name residual test gaps.
```

Add task-specific context when useful: requirements, risky areas, expected behavior, relevant tests, ADRs, or files Claude/Fable is unsure about.

## Reporting back

Before relaying a Codex finding, inspect the cited code or diff enough to decide whether the finding is real.

In the user-facing response, separate:

- confirmed issues
- plausible but unverified suggestions
- non-issues rejected after inspection
- remaining test gaps

If Codex finds nothing, say that clearly and mention what review target it inspected.

If `codex` is not installed or the command fails, report the error and offer to review the changes directly.
