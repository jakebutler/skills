# /spec

## Name

`/spec`

## Purpose

Turn an explicitly requested or genuinely ambiguous change into the smallest
implementation-usable plan artifact.

## Invocation (args)

`/spec [feature-or-problem] [--repo-scope <paths>] [--risk <simple|medium|high>]`

Args are optional. If omitted, the orchestrator asks only the minimum clarifying
questions needed to run the workflow.

## Workflow executed

Execute `../workflows/spec.md`.

## Output contract

The user sees one concise implementation-usable plan plus only the optional research,
prototype, PRD, or issue artifacts that resolve a named downstream need.

## Model routing note

Codex Sol High owns framing, conflicts, user questions, and final synthesis. Terra and
Luna handle bounded exploration and research. Fable receives a compact review packet
only when advanced architecture or system design warrants scarce Anthropic quota.
Provider fallback follows `../routing/model-routing.md` without changing the accepted
scope or verification gates.
