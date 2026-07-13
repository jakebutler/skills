---
name: codex-implementation
description: Ask Codex CLI (gpt-5.5) to implement a bounded lower-db code slice in an isolated repo/worktree, then have Claude/Fable inspect the diff and run verification. Use when implementation work is broad, mechanical, test-heavy, or better delegated to Codex. Never use for Send actions, live cloud mutations, deploys, global config edits, or unbounded product decisions.
---

# Codex Implementation — lower-db

Use Codex as a separate implementation agent for bounded lower-db code changes. Claude/Fable remains responsible for scope, invariants, diff review, validation, and user-facing explanation.

This skill should offload the bulk of implementation work to Codex while keeping the slice small enough to review and publish safely.

## Workflow

1. Read `CLAUDE.md`, the current slice spec, and relevant docs from `docs/operations/agent-progressive-disclosure.md`.
2. Pin the current state with `git fetch origin`, `git status --short --branch`, and `git diff --name-only origin/main...HEAD`.
3. Confirm dirty paths are classified as preserve / hold / remove before any git operation that could touch them.
4. Define a bounded implementation packet: goal, acceptance criteria, files to inspect, files to avoid, invariants touched, verification commands.
5. Create a temporary artifact directory for Codex's report.
6. Run `codex exec` with repo write access.
7. After Codex exits, inspect `git status` and `git diff`.
8. Run the cheapest reliable verification yourself when practical, or invoke `/prove`.
9. If the work is non-trivial, run `codex-review`.
10. Report what Codex changed, what Claude/Fable verified, and any remaining risks.

## Command shape

```bash
ARTIFACT_DIR="$(mktemp -d "${TMPDIR:-/tmp}/codex-implementation.XXXXXX")"
```

```bash
REPORT="$ARTIFACT_DIR/report.md"
```

```bash
PROMPT="$ARTIFACT_DIR/prompt.md"
```

Write a self-contained prompt to `$PROMPT`, then run:

```bash
codex exec -C "$PWD" --add-dir "$ARTIFACT_DIR" -s workspace-write -o "$REPORT" "$(cat "$PROMPT")"
```

Use `-s workspace-write` by default.

Use `-s danger-full-access` only when the implementation truly needs access outside the repo, app launch automation, simulator work, package-manager global state, or other machine-level operations. Never use it for convenience.

## Prompt requirements

Tell Codex:

- The exact implementation goal and acceptance criteria.
- The repository path and branch context.
- The relevant lower-db source-of-truth docs.
- Which files, patterns, or tests to inspect first.
- Which files, rails, or boundaries to avoid.
- Which lower-db invariants the slice touches.
- That it must preserve unrelated user changes.
- That it must not commit, push, deploy, send, mutate cloud data, or edit global config.
- That it must not use npm/yarn.
- That it must not run repo-wide lint or broad tests unless explicitly asked.
- Which verification commands to run, or to explain why they were skipped.
- To write a concise final report with files changed, behavioral summary, verification, and unresolved questions.

Keep the task bounded. If the requested work bundles several substantial changes, split it into separate Codex runs or ask Jake to choose the first scope.

## Lower-db hard constraints for Codex

Codex must not:

- trigger Send-class actions
- run live non-dry-run cloud Convex mutations
- loosen reader-visible verified semantics
- modify finalized evidence snapshots in place
- write V2 changes into legacy digest rails
- bypass public/admin import boundaries
- expose dev/seed/reset handlers publicly
- introduce direct provider SDK/model calls
- introduce raw Tailwind or rounded corners
- overwrite unrelated dirty files

## Example prompt

```text
You are implementing one scoped lower-db slice for Claude/Fable.

Repository: /absolute/path/to/lower-db
Artifact directory: /tmp/codex-implementation.xxxxxx
Branch context: codex/<slug> off origin/main

Goal:
- Add <specific behavior>.

Read first:
- CLAUDE.md
- CONTEXT.md
- docs/adr/<relevant>.md
- docs/plans/2026-07-06-fable-audit-source-of-truth.md
- <specific source files/tests>

Acceptance criteria:
- <observable behavior>
- <invariant enforced>
- <test/verification requirement>

Constraints:
- Preserve unrelated user changes.
- Do not commit, push, deploy, send email, mutate cloud data, or edit global config.
- Do not stage files.
- Use pnpm only.
- Follow existing patterns.
- Keep the diff minimal.

Verification:
- Run <focused node/react test command> if available.
- Run typecheck only if practical for this packet.
- Explain skipped verification.

Report:
- Files changed
- Behavioral summary
- Verification run and result
- Anything blocked or uncertain
```

## Review after Codex

Always inspect Codex's diff before telling Jake the work is done. Revert only Codex-created mistakes when you are sure they are not user changes.

If Codex leaves the repo in a worse state or changes unrelated files, stop and report the issue with the diff summary.

If `codex` is not installed or the command fails, report the error and offer to implement the change directly.
