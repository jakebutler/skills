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

Claude/Fable owns review synthesis and final judgment. Codex performs diff analysis,
repo exploration, test/build verification, and browser verification. Reviewer,
frontend-designer, verifier, or doc-maintainer roles may be delegated
depending on PR risk and focus.
