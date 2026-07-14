# /implement-tdd

## Name

`/implement-tdd`

## Purpose

Execute a planned change using the test-first loop appropriate to the repo and risk
tier.

## Invocation (args)

`/implement-tdd <task-or-issue> [--plan <path>] [--scope <paths>] [--risk <simple|medium|high>]`

## Workflow executed

Execute `../workflows/implement-tdd.md`.

## Output contract

The user sees the files changed, tests added or updated, verification commands and
results, known residual risks, docs touched or intentionally left unchanged, and the
next review or commit action.

## Model routing note

Codex Sol High keeps scope and acceptance criteria stable. Codex is the primary
implementation workhorse, including test writing, code edits, repo exploration, and
verification. Review independence is preserved through `reviewer`, `verifier`, or
orchestrator review depending on complexity.
