# /commit-pr

## Name

`/commit-pr`

## Purpose

Run the commit workflow and continue through branch, PR creation, and review loop for
a ready slice.

## Invocation (args)

`/commit-pr [--title <title>] [--base <branch>] [--draft] [--scope <paths>]`

## Workflow executed

Execute `../workflows/commit-pr.md`.

## Output contract

The user sees commit details, PR title and link or local PR artifact, verification
summary, review status, unresolved risks, and requested reviewer action.

## Model routing note

Codex Sol High owns PR framing, final review readiness, and conflict resolution.
Every PR review uses fresh-context Sol 5.6 xhigh plus Opus 5 against the same frozen
candidate. Bounded routes handle implementation cleanup, verification, browser checks,
and PR mechanics where allowed. Fable is an optional principal/architect escalation
only after a concrete trigger.
