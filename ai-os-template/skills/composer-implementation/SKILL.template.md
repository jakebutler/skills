---
name: composer-implementation
description: Delegate fast, bounded implementation with clear requirements to Cursor Composer. Use for repo-neutral build slices that are already specified precisely. Never use for ambiguous architecture or debugging work, Send actions, deploys, commits, or work whose requirements need judgment to interpret.
---

# Composer Implementation - {{REPO_NAME}}

<!-- Bind {{REPO_NAME}} and {{REPO_PATH}} from the instance manifest. -->

Use Cursor Composer 2.5 as a separate implementation agent for a bounded change in
`{{REPO_PATH}}`. Codex Sol High remains responsible for scope, invariants, diff review,
validation, and user-facing explanation.

Treat Composer output as evidence, not authority.

## Routing Criterion: Requirements Clarity

Use this lane only when the packet is unambiguous enough to execute without product,
architecture, or debugging judgment. If Composer would need to interpret intent,
choose among materially different designs, or discover the task while working, stop
and escalate to the orchestrator for a tighter packet or a different route.

## Workflow

1. Read the repo root instructions and task-specific docs.
2. Inspect the current branch, status, and relevant diffs without mutating git.
3. Classify dirty paths as preserve / hold / remove before touching overlapping areas.
4. Write one bounded packet with the required fields below.
5. Save the packet to a prompt file outside the target repo.
6. Change into the target repo or worktree and invoke Composer.
7. After it exits, inspect `git status` and `git diff` yourself.
8. Run the cheapest reliable focused verification yourself when practical.
9. Report the diff, independent verification, and remaining uncertainty.

## Invocation

```bash
ARTIFACT_DIR="$(mktemp -d "${TMPDIR:-/tmp}/composer-implementation.XXXXXX")"
PROMPT="$ARTIFACT_DIR/prompt.md"
```

Write the complete packet to `$PROMPT` first. Then:

```bash
cd "{{REPO_PATH}}"
cursor-agent -p --trust --model composer-2.5 "$(cat "$PROMPT")"
```

<!-- Bind {{REPO_PATH}} to the target repo or isolated worktree. -->

`composer-2.5-fast` exists, costs more per token, and is only for genuine latency
needs. Do not select it as a routine default.

Authenticate with existing `cursor-agent login` state or `CURSOR_API_KEY`. Treat
`CURSOR_API_KEY` as a full account credential: never echo, log, print, or place it in
the packet, repository, report, or shell history.

## Packet Requirements

Tell Composer:

- The exact goal and observable acceptance criteria.
- The repository/worktree path and relevant branch context.
- Which instructions, source-of-truth docs, files, patterns, and tests to read first.
- Which files, areas, rails, and boundaries to avoid.
- To preserve unrelated user changes and touch only the bounded scope.
- `{{REPO_INVARIANTS}}`
  <!-- Bind from the repo's AGENTS.md/CLAUDE.md invariants section. -->
- That it must not commit, stage, push, deploy, send, mutate cloud data, or edit
  global configuration.
- `{{PACKAGE_MANAGER_RULES}}`
  <!-- Bind the instance's package-manager policy. -->
- `{{VERIFICATION_COMMANDS}}`
  <!-- Bind exact focused verification commands from the instance manifest. -->
- That repo-wide lint or broad tests are forbidden unless explicitly requested.
- To stop and report if requirements prove ambiguous or work would escape scope.
- To return: files changed, behavioral summary, verification run/results, and
  uncertainties or unresolved questions.

## Spend Guardrails

Cursor Pro usage is pooled at the account level, has no published numeric limits,
and may allow on-demand billing beyond included usage. Keep packets small and
bounded, do not create wide Composer fan-outs, and check the Cursor dashboard during
sustained heavy use.

CLI subagent model routing can be inconsistent and may silently use a `-fast` model.
Spot-check dashboard usage records when model choice or cost matters.

## After the Run

The orchestrator must inspect `git status` and `git diff` before reporting the work
done. Confirm scope, invariants, acceptance criteria, and focused verification
independently; Composer's summary does not replace diff review.

If `cursor-agent` is missing or unauthenticated, do not improvise credentials or
another invocation. Report the failure and offer the Codex implementation route.
