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

Claude/Fable owns framing, conflicts, user questions, and final synthesis. Codex is
the workhorse for repo exploration, implementation feasibility checks, research
support, and browser verification. Cheap Claude roles may draft mechanical prose;
high-risk architecture remains with the orchestrator plus independent auditor/reviewer
passes per `DESIGN-MEMO.md` section 8.

