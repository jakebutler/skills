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

Codex Sol High keeps scope and acceptance criteria stable. Implementation begins with
one breadth-first impact sweep, proceeds as one coherent batch, and uses focused checks
before one warranted broad gate. Independent review is added only for High-risk work,
material uncertainty, or explicit request; multiple lenses run concurrently.
