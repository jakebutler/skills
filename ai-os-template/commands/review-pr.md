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

Codex Sol High owns review synthesis and reports route diversity. Prefer a reviewer
family different from the implementer; High-tier work gets two lenses plus verification.
Fable is reserved for advanced architecture or system-design judgment. If Anthropic is
unavailable, use GLM plus a fresh Codex reviewer and disclose reduced lineage diversity.
