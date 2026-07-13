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

Claude/Fable owns PR framing, final review readiness, and conflict resolution. Codex
handles implementation cleanup, verification, browser checks, and PR mechanics where
allowed. Independent reviewer/verifier/doc-maintainer roles are used when risk or diff
size warrants them.

