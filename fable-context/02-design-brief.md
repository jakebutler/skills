# Design Brief

## System Name

Working name: AI Engineering OS.

The final name can change. Do not over-index on naming during the first design pass.

## Purpose

The system should make AI-assisted software work more reliable, reusable, and inspectable across multiple repos.

It should combine:

- skill-based expertise
- agent/subagent delegation
- workflow commands
- automatic hooks
- repo-local documentation
- task-local memory
- model routing by complexity
- verification and audit loops

The point is not to create bureaucracy. The point is to preserve momentum while reducing repeated context loss, low-quality agent behavior, missed verification, and inconsistent planning.

## Target Harness

Design for Claude Code with Fable first.

Portability to Codex matters, but do not force an abstraction that weakens the Claude/Fable v1.

## First Repos

First template instances:

- FreshProof
- Lower dB

Next repo:

- `corvo-labs-dot-com`

## Core Operating Loop

The core loop has five pieces plus memory:

1. Automations that trigger work at the right time.
2. Worktrees so agents do not collide.
3. Skills so agents use project conventions rather than guessing.
4. Connectors so agents can open PRs, update tickets, inspect browsers, and modify external state when authorized.
5. Subagents so the coding agent is not the only reviewer.
6. Repo-resident memory because models forget and the repo persists.

## Key Design Principle

Make the abstraction concrete.

Every recommendation should eventually map to one or more of:

- a file
- a hook
- a slash command
- a workflow spec
- a skill
- a subagent
- a model routing rule
- a verification gate
- a repo convention

## Universal Agent Behavior Rules

These should appear in root instructions unless Fable proposes a better location.

- Always confirm the working directory for repo-mutating work.
- Read and understand relevant files before proposing edits.
- If the user references a file/path, inspect it before explaining or fixing.
- Search rigorously for existing conventions, style, and abstractions.
- Do not speculate about code that has not been inspected.
- Write general-purpose solutions for valid inputs.
- Do not hard-code for tests.
- Do not create helper scripts or workarounds just to satisfy tests faster.
- If a task is unreasonable, infeasible, or tests are wrong, say so.
- Avoid over-engineering.
- Make only requested or clearly necessary changes.
- Avoid opportunistic refactors.
- Reuse existing abstractions where possible.
- Validate at system boundaries.
- Trust internal code and framework guarantees unless evidence says otherwise.
- Reflect after tool results before choosing the next action.

## Complexity And Ceremony

The system should support a lighter solo path and a more rigorous production path.

Solo work should still be disciplined:

- inspect before edit
- plan proportional to risk
- run relevant verification
- update docs automatically
- produce clear handoff state

But it should not require the full ceremony of a team production workflow for a trivial change.

## Audit Lenses

Medium/high-complexity plans should run:

- adversarial audit: how could this fail, be wrong, or create risk?
- steelman audit: what is the strongest case for the chosen approach?
- unbiased audit: what would a neutral reviewer conclude?

Simple plans should run a single combined audit.

Fable should define the trigger threshold.

## Expected Fable Role

Fable owns:

- architecture of the operating system
- conflict resolution
- workflow decomposition
- final synthesis
- high-risk decisions
- delegation strategy
- artifact quality

Fable should avoid doing mechanical work directly when a cheaper subagent can handle it with equal quality.
