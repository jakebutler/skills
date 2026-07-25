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

Codex Sol High owns review synthesis. Every code-review generation runs two independent
lanes against one frozen candidate: fresh-context native `gpt-5.6-sol` at xhigh
reasoning and direct Claude subscription `claude-opus-5`. Their packets remain separate
until resolver fan-in. Fable is an optional third principal-engineer/architect
consultation only when a concrete escalation trigger is recorded; it never replaces
Sol or Opus. If either standard lane is unavailable, stop and request explicit approval
before using a reduced topology.
