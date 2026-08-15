# /commit-pr

## Name

`/commit-pr`

## Purpose

Commit and publish a ready slice without duplicating unchanged verification or review.

## Invocation (args)

`/commit-pr [--title <title>] [--base <branch>] [--draft] [--scope <paths>]`

## Workflow executed

Execute `../workflows/commit-pr.md`.

## Output contract

The user sees commit details, PR title and link or local PR artifact, verification
summary, review status, unresolved risks, and requested reviewer action.

## Model routing note

Codex Sol High owns PR framing and conflict resolution. PR creation does not trigger a
new review. Review runs only when requested, genuinely High-risk, still uncertain, or
changed after prior review; concurrent lenses fan into one findings list.
