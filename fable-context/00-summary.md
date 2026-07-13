# AI Engineering OS Summary

## Goal

Create a cohesive AI-assisted engineering setup that combines:

- Fable as the main orchestrator in Claude Code
- Codex-for-Claude-Code so Fable can delegate coding work to Codex models
- skills, subagents, hooks, slash commands, and repo-local docs
- reusable templates that can be instantiated into real repos
- strong quality gates without excessive ceremony for solo work

This should be Claude/Fable-first for now, but portable to Codex later.

## First Deliverables

Fable should help create all of the following:

- design memo for the overall system
- implementable repo template
- `AGENTS.md` and `CLAUDE.md` templates
- workflow specs
- hooks and slash command specs
- skill and plugin inventory with keep/add/remove recommendations
- template instantiation for FreshProof
- template instantiation for Lower dB

The next target repo after those two is `corvo-labs-dot-com`.

## Current Best Workflow

The strongest planning-to-implementation flow so far is:

```text
grill-with-docs -> PRD -> to-issues -> TDD implementation
```

The preferred modification is to speed up grilling:

- agent runs a self-grilling round first
- agent includes options considered and why each choice was selected
- user reviews the full batch
- possible pattern: 5 questions with the user, then 20 self-questions by the agent, then human review

Research and prototype work should be available inside the spec workflow, but also callable independently when the task needs them.

## Orchestration Principle

Fable should not do all labor directly. Fable should orchestrate.

Default stance:

- Fable owns framing, decomposition, cross-agent judgment, and final synthesis.
- Cheaper subagents do research, inventory, drafting, implementation, verification, cleanup, and documentation updates when quality will not meaningfully suffer.
- Fable escalates to stronger models only for hard architecture, high-risk decisions, final judgment, or ambiguous conflicts.

## Documentation Principle

Use both global project docs and task-local docs with clear ownership boundaries.

High-level split:

- `SPEC.md`: durable product and architecture intent
- `docs/`: progressive project knowledge and deeper references
- `PROJECT-STATUS.md`: overwritten checkpoint and handoff state
- `CHANGELOG.md`: useful ledger, but not commit-by-commit noise
- `dev/active/[task]/`: task-local plan, context, and checklist
- `AGENTS.md` / `CLAUDE.md`: agent behavior, tool routing, workflows, and documentation map

## Hooks Principle

Hooks should automatically update documentation. Human review should not be required for routine doc maintenance.

However, Fable must design guardrails to prevent low-quality doc churn.

Blocking hooks should be used carefully. Overly aggressive blocking hooks are frustrating. Fable should classify hooks as:

- blocking
- advisory
- delegating
- automatic maintenance

## Quality Principle

Medium and high-complexity plans should automatically trigger three lenses:

- adversarial audit
- steelman audit
- unbiased audit

Simple plans can use one combined audit that bakes in the same guidance.

## Marketing / GTM Scope

Keep a parallel GTM swarm for marketing strategy, launch, content, and sales work.

The AI engineering OS should still include its own copywriting, landing page UX, and conversion design skills for product-facing engineering work.
