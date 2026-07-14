# /commit

## Name

`/commit`

## Purpose

Prepare and make a focused commit after verification, review, doc maintenance, and
autoskill proposal checks.

## Invocation (args)

`/commit [--message <summary>] [--scope <paths>] [--no-autoskill]`

## Workflow executed

Execute `../workflows/commit.md`.

## Output contract

The user sees what was committed, commit message, verification run, review/doc status,
autoskill proposal status, and any uncommitted work intentionally left behind.

## Model routing note

Codex Sol High owns final commit judgment and message quality. Independent routes
perform verification, diff inspection, mechanical fixes, and repo checks. Reviewer,
doc-maintainer, and autoskill-improver roles may run under bounded contracts before
the orchestrator approves the final commit.
