# /wrap-session

## Name

`/wrap-session`

## Purpose

End a work session with durable handoff state: status, changelog draft, docs updates,
autoskill proposals, and next action.

## Invocation (args)

`/wrap-session [--task <name>] [--archive] [--next <action>]`

## Workflow executed

Execute `../workflows/wrap-session.md`.

## Output contract

The user sees what changed, verification status, docs/status/changelog updates,
autoskill proposal status, unresolved risks, and the recommended next action for the
next session.

## Model routing note

Codex Sol High owns the final handoff narrative and decides what is durable. Bounded
routes gather repo state, run verification, update Tier A/B docs through configured
maintenance paths, and prepare artifacts. Doc-maintainer and autoskill-improver roles
may run, with autoskill changes proposed rather than auto-applied.
