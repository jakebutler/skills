# /commit

## Name

`/commit`

## Purpose

Prepare and make a focused commit by inspecting the exact diff and reusing valid
verification/review evidence.

## Invocation (args)

`/commit [--message <summary>] [--scope <paths>]`

## Workflow executed

Execute `../workflows/commit.md`.

## Output contract

The user sees what was committed, verification reused or run, review state, residual
risk, and uncommitted work intentionally left behind.

## Model routing note

Codex Sol High owns final commit judgment and message quality. Reaching commit does not
rerun an unchanged check or review. One independent reviewer is required only for
genuinely High-risk work, material uncertainty, or explicit user request.
