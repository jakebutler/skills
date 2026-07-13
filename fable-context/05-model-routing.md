# Model Routing And Delegation

## Objective

Create a routing system that combines firm defaults with a task-complexity rubric.

The routing table should be explicit enough for agents to follow, but flexible enough to change as model quality and cost change.

## Current Default Preferences

Initial defaults from user:

- Fable: orchestrator
- possible future Opus 4.8 extra-high: heavier orchestration
- Codex / GPT-5.5 High: most coding
- Codex / GPT-5.5 Medium: simple coding
- GLM-5.2: frontend design and frontend coding by default
- GPT: browser use, research, and general tool-heavy work
- Claude Sonnet: written content
- Z.ai models: available through API key
- Codex-for-Claude-Code plugin: use Codex models inside Claude Code

Fable should verify current model availability before finalizing operational instructions.

## Complexity Rubric

Fable should define a rubric using dimensions like:

- risk to production/data/security
- blast radius
- ambiguity
- cross-module dependencies
- need for creative design judgment
- need for external research
- verification cost
- architectural permanence
- user-facing impact
- reversibility

## Draft Routing Policy

### Simple Tasks

Examples:

- small copy edit
- tiny bug fix in known file
- simple UI polish
- test update with clear behavior

Default:

- cheaper model or GPT-5.5 Medium
- no heavy multi-agent workflow
- combined audit only
- run focused verification

### Medium Tasks

Examples:

- new feature slice
- non-trivial frontend component
- multi-file refactor
- API route with persistence
- workflow update

Default:

- Fable plans/decomposes
- subagent executes
- reviewer/verification subagent checks
- adversarial/steelman/unbiased audits
- update docs automatically

### High Tasks

Examples:

- architecture changes
- auth/security/payment/data migration
- cross-repo workflow
- production rollout
- significant product direction

Default:

- Fable owns plan and final synthesis
- specialist subagents gather evidence
- stronger coding model for implementation if needed
- independent review agent
- explicit release/rollback plan
- full audit lenses

## Delegation Guardrails

Fable should delegate by default, but only with bounded tasks.

Every delegation should specify:

- goal
- repo/path
- files or docs to inspect
- excluded areas
- expected output
- allowed tools
- model preference
- verification requirement
- stop condition

Subagents should not:

- perform unbounded repo-wide rewrites
- make irreversible external changes without permission
- silently update secrets
- self-approve their own work
- substitute passing tests for understanding

## Research Delegation Pattern

For larger research:

1. Fable defines research questions.
2. Multiple research subagents gather evidence.
3. A consolidation subagent synthesizes findings.
4. Fable reviews the synthesis and makes decisions.

The consolidator should preserve:

- source links
- confidence
- disagreement
- actionable recommendations
- what remains unknown

## Coding Delegation Pattern

For implementation:

1. Fable writes or approves the plan.
2. Coding subagent implements.
3. Verification subagent tests.
4. Reviewer subagent audits.
5. Fable synthesizes and decides whether to proceed, revise, or ask the user.

The coding agent should not be the sole reviewer.
