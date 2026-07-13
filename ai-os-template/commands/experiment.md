# /experiment

## Name

`/experiment`

## Purpose

Run a hypothesis-driven comparison of LLMs, prompts, or setups against the same
bounded coding task, record it in the lab notebook, and feed durable learnings back
into the routing matrix. Use when choosing between models/approaches with evidence
instead of vibes, when validating a routing binding, or when a new model needs
placement.

## Invocation

`/experiment <hypothesis or comparison question>` — e.g.
`/experiment does Composer 2.5 match Sol on bounded frontend slices?`

The orchestrator turns the argument into a falsifiable hypothesis, proposes arms and
success criteria, and confirms the budget cap before any arm that spends real money.

## Workflow executed

`../workflows/experiment.md` — do not duplicate its steps here.

## Output contract

The user sees: the experiment brief (hypothesis, arms, criteria, budget) for approval
at High tier; then the comparison table, the verdict (supported / rejected /
inconclusive) with deciding evidence, the lab notebook entry, and any proposed routing
matrix change.

## Model routing note

Arms are whatever the experiment tests. The controlled roles route normally: the
verifier runs on a route that is NOT an arm; the orchestrator judges and writes the
notebook entry. Arm execution is Codex/Composer/GLM per the experiment design, in
isolated worktrees.
