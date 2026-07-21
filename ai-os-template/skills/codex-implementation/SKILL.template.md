---
name: codex-implementation
description: Delegate a bounded implementation slice to Codex CLI, then inspect the diff and run verification. Use when code work is broad, mechanical, test-heavy, or benefits from a separate implementation agent. Never use for sending, live external mutations, deploys, global config edits, or unbounded product decisions.
---

# Codex Implementation - {{REPO_NAME}}

<!-- Bind {{REPO_NAME}} from the instance manifest. Resolve the active worktree at runtime. -->

Use Codex as a separate implementation agent for bounded code changes in the active
repository/worktree. Codex Sol High remains responsible for scope, invariants, diff
review, validation, and user-facing explanation.

Treat Codex's output as evidence, not authority.

## Workflow

1. Read the repo root instructions and task-specific docs.
2. Pin the current state without mutating git: inspect branch, status, and relevant diffs.
3. Confirm dirty paths are classified as preserve / hold / remove before any operation
   that could touch them.
4. Define a bounded implementation packet: goal, acceptance criteria, files to inspect,
   files to avoid, invariants touched, verification commands.
5. Create a temporary artifact directory for Codex's report.
6. Run `codex exec` with repo write access.
7. After Codex exits, inspect status and diff yourself.
8. Run the cheapest reliable verification yourself when practical.
9. If the work is non-trivial, run `codex-review`.
10. Report what the worker changed, what the Sol orchestrator verified, and remaining risks.

## Command Shape

```bash
REPO_ROOT="$(git rev-parse --show-toplevel)" || {
  echo "Run this skill from the active target repository/worktree" >&2
  exit 1
}
ARTIFACT_DIR="$(mktemp -d "${TMPDIR:-/tmp}/codex-implementation.XXXXXX")"
REPORT="$ARTIFACT_DIR/report.md"
PROMPT="$ARTIFACT_DIR/prompt.md"
```

Write a self-contained prompt to `$PROMPT`, then run:

```bash
codex -a on-request -s workspace-write exec -C "$REPO_ROOT" --add-dir "$ARTIFACT_DIR" \
  -o "$REPORT" "$(cat "$PROMPT")"
```

Keep `workspace-write` and `on-request` approval enabled. If the task needs access
outside the repository, approve only the specific action Codex requests. Stop if the
headless run cannot request that approval; do not pre-authorize blanket machine access.

## Prompt Requirements

Tell Codex:

- The exact implementation goal and acceptance criteria.
- The repository path and branch context.
- The relevant source-of-truth docs.
- Which files, patterns, or tests to inspect first.
- Which files, rails, or boundaries to avoid.
- Which repo invariants the slice touches.
- That it must preserve unrelated user changes.
- That it must not commit, push, stage, deploy, send, mutate cloud data, or edit
  global config.
- `{{PACKAGE_MANAGER_RULES}}`
  <!-- Bind package-manager policy from the instance manifest, for example pnpm-only. -->
- That it must not run repo-wide lint or broad tests unless explicitly asked.
- `{{VERIFICATION_COMMANDS}}`
  <!-- Bind exact focused verification commands from the instance manifest. -->
- `{{VERIFICATION_SCOPING_NOTES}}`
  <!-- Bind rules for when focused checks are enough versus broader checks. -->
- To write a concise final report with files changed, behavioral summary,
  verification, and unresolved questions.

Keep the task bounded. If the requested work bundles several substantial changes,
split it into separate Codex runs or ask the user to choose the first scope.

## Repo Constraints for Codex

Codex must follow:

- `{{REPO_INVARIANTS}}`
  <!-- Bind from the repo's AGENTS.md/CLAUDE.md invariants section. -->
- `{{DESIGN_CONSTRAINTS}}`
  <!-- Bind UI/design-system constraints if the slice touches frontend code. -->
- `{{ENV_WRAPPER}}`
  <!-- Bind any required env wrapper or local command prefix for safe execution. -->
- Preserve unrelated dirty files.

## Example Prompt

```text
You are implementing one scoped {{REPO_NAME}} slice for a Codex Sol High orchestrator.

Repository/worktree: <value of $REPO_ROOT>
Artifact directory: /tmp/codex-implementation.xxxxxx
Branch context: {{BRANCH_NAMING}}

Goal:
- Add <specific behavior>.

Read first:
- AGENTS.md
- CLAUDE.md
- <specific source-of-truth docs>
- <specific source files/tests>

Acceptance criteria:
- <observable behavior>
- <invariant enforced>
- <test/verification requirement>

Constraints:
- Preserve unrelated user changes.
- Do not commit, push, stage, deploy, send, mutate cloud data, or edit global config.
- {{PACKAGE_MANAGER_RULES}}
- {{REPO_INVARIANTS}}
- Follow existing patterns.
- Keep the diff minimal.

Verification:
- {{VERIFICATION_COMMANDS}}
- Explain skipped verification.

Report:
- Files changed
- Behavioral summary
- Verification run and result
- Anything blocked or uncertain
```

## Review After Codex

Always inspect Codex's diff before telling the user the work is done. Revert only
Codex-created mistakes when you are sure they are not user changes.

If Codex leaves the repo in a worse state or changes unrelated files, stop and report
the issue with the diff summary.

If `codex` is not installed or the command fails, report the error and offer to
implement the change directly.
