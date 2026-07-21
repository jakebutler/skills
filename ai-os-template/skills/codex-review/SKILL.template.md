---
name: codex-review
description: Ask Codex CLI for an independent code review of uncommitted changes, a branch diff, a commit, or a specific implementation. Use when Codex should audit correctness, regressions, missed tests, repo invariant violations, boundary leaks, security issues, or requirement mismatches.
---

# Codex Review - {{REPO_NAME}}

<!-- Bind {{REPO_NAME}} from the instance manifest. Resolve the active worktree at runtime. -->

Use Codex as an independent reviewer when the user wants a second-pass review or the
change is broad enough that another agent's perspective is useful.

Prefer the Sol orchestrator's normal review process for small local checks. Do not delegate
review just to avoid reading the code yourself. Treat Codex's output as evidence, not
authority.

## Workflow

1. Identify the review target: uncommitted changes, base branch, commit SHA, PR
   checkout, or specific files.
2. Identify the repo invariants, requirements, and ADRs touched by the target.
3. Create a temporary artifact directory for the Codex report.
4. Run `codex review` with either a native review target or a focused custom prompt.
5. Read Codex's report and verify important claims against the code before presenting
   them.
6. Separate confirmed issues from unverified Codex suggestions.

## Command Shapes

```bash
REPO_ROOT="$(git rev-parse --show-toplevel)" || {
  echo "Run this skill from the active target repository/worktree" >&2
  exit 1
}
ARTIFACT_DIR="$(mktemp -d "${TMPDIR:-/tmp}/codex-review.XXXXXX")"
REPORT="$ARTIFACT_DIR/report.md"
PROMPT="$ARTIFACT_DIR/prompt.md"
```

Review staged, unstaged, and untracked changes:

```bash
codex -C "$REPO_ROOT" review --uncommitted > "$REPORT"
```

Review current branch against the default integration branch:

```bash
codex -C "$REPO_ROOT" review --base {{MAIN_BRANCH}} > "$REPORT"
```

Review a single commit:

```bash
codex -C "$REPO_ROOT" review --commit <sha> > "$REPORT"
```

Codex CLI does not accept a custom prompt together with `--uncommitted`, `--base`, or
`--commit`. Native-target reviews still load persistent repository instructions such as
`AGENTS.md`. For task-specific instructions, write `$PROMPT` and run a prompt-only
review that names the exact diff or files to inspect:

```bash
codex -C "$REPO_ROOT" review - < "$PROMPT" > "$REPORT"
```

## Review Prompt

### Prompt requirements

- Provide the diff and the plan or acceptance criteria, not whole files.
- The reviewer may read files in the repository itself as needed.

Ask Codex to use a code-review stance:

```text
Review these changes for bugs, regressions, missing tests, security issues,
boundary leaks, repo invariant violations, and requirement mismatches.

Repository/worktree: <value of $REPO_ROOT>
Review target: <uncommitted changes | base diff | commit | files>

Pay special attention to:
- {{REPO_INVARIANTS}}
- {{DESIGN_CONSTRAINTS}}
- {{VERIFICATION_SCOPING_NOTES}}

Prioritize findings over summary. For each finding include:
- severity
- file and line reference
- concrete failure mode
- suggested fix direction

Do not edit files. If there are no substantive findings, say so and name residual
test gaps.
```

<!--
Bind {{REPO_INVARIANTS}} from the repo's AGENTS.md/CLAUDE.md invariants section.
Bind {{DESIGN_CONSTRAINTS}} only when the repo has UI/design-system rules.
Bind {{VERIFICATION_SCOPING_NOTES}} from the instance manifest.
Bind {{MAIN_BRANCH}} from the instance manifest / repo convention.
-->

Add task-specific context when useful: requirements, risky areas, expected behavior,
relevant tests, ADRs, or files the Sol orchestrator is unsure about.

## Reporting Back

Before relaying a Codex finding, inspect the cited code or diff enough to decide
whether the finding is real.

In the user-facing response, separate:

- confirmed issues
- plausible but unverified suggestions
- non-issues rejected after inspection
- remaining test gaps

If Codex finds nothing, say that clearly and mention what review target it inspected.

If `codex` is not installed or the command fails, report the error and offer to review
the changes directly.
