# /review-pr

## Name

`/review-pr`

## Purpose

Review a PR for bugs, regressions, missing tests, security issues, architecture risk,
and documentation drift.

## Invocation (args)

`/review-pr <pr-or-branch> [--focus <security|architecture|frontend|tests|docs>] [--base <branch>]`

## Workflow executed

Execute `../workflows/review-pr.md`.

## Output contract

The user sees findings first, ordered by severity with file references where
available, followed by open questions, verification performed, residual risk, and a
short summary.

## Model routing note

Codex Sol High owns review synthesis. Use one fresh-context general reviewer when
independence is warranted. Add specialists only for concrete diff-triggered risk and
run them concurrently against one candidate. Freeze all expected findings before one
correction batch; routine review does not require paired model families.
