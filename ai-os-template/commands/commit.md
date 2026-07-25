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

Codex Sol High owns final commit judgment and message quality. The frozen diff receives
independent fresh-context Sol 5.6 xhigh and Opus 5 review before the orchestrator
approves the commit. Other bounded routes perform verification, mechanical fixes, and
repo checks; Fable is only an exceptional principal/architect escalation.
