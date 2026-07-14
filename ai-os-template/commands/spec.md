# /spec

## Name

`/spec`

## Purpose

Turn an ambiguous feature, product change, or architecture request into a concrete
specification path: grill, PRD, issues, and an implementation-ready TDD plan.

## Invocation (args)

`/spec [feature-or-problem] [--repo-scope <paths>] [--risk <simple|medium|high>]`

Args are optional. If omitted, the orchestrator asks only the minimum clarifying
questions needed to run the workflow.

## Workflow executed

Execute `../workflows/spec.md`.

## Output contract

The user sees a concise spec packet: decision summary, selected scope, open questions,
links or paths to created artifacts, verification or review gates, and the next
implementation action.

## Model routing note

Codex Sol High owns framing, conflicts, user questions, and final synthesis. Terra and
Luna handle bounded exploration and research. Fable receives a compact review packet
only when advanced architecture or system design warrants scarce Anthropic quota.
Provider fallback follows `../routing/model-routing.md` without changing the accepted
scope or verification gates.
