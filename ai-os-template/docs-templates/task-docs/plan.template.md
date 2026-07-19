<!--
  TEMPLATE: {{TASK_DOCS_DIR}}/[task]/plan.md — task-scoped implementation plan.

  WRITE TIER: task-scoped and disposable (see DESIGN-MEMO.md §4, §11 decision #2).
  - Lives only for the duration of the task. Archive (or delete, per repo convention)
    the whole {{TASK_DOCS_DIR}}/[task]/ directory when the task completes.
  - The PLAN does not get promoted to global docs. Only DECISIONS made while executing
    it get promoted — into SPEC.md, docs/, or AGENTS.md as appropriate. If this plan
    contains a decision worth keeping, copy the decision (not the plan) upward and note
    it in context.md.
  - Never treated as a durable record: don't link to this file from SPEC.md or docs/;
    link to the promoted decision instead.

  Instantiation: create at {{TASK_DOCS_DIR}}/{{TASK_SLUG}}/plan.md, replace {{PLACEHOLDERS}}.
-->

# Plan: {{TASK_NAME}}

**Created:** {{CREATED_DATE}}
**Complexity tier:** {{COMPLEXITY_TIER}} <!-- Simple / Medium / High — see routing/complexity-rubric.md -->

## Goal

<!-- What "done" looks like, in one or two sentences. -->

{{GOAL_SUMMARY}}

## Approach

<!-- The chosen implementation approach, concrete enough to execute from. -->

{{APPROACH_DESCRIPTION}}

## Options considered

<!-- Alternatives evaluated and why they were not chosen. Keeps future agents from
     re-litigating a settled question without knowing it was already settled. -->

| Option | Rationale for / against | Chosen? |
|---|---|---|
| {{OPTION_1}} | {{OPTION_1_RATIONALE}} | {{OPTION_1_CHOSEN}} |
| {{OPTION_2}} | {{OPTION_2_RATIONALE}} | {{OPTION_2_CHOSEN}} |

## Audit results

<!-- Per the complexity tier's audit lenses (DESIGN-MEMO.md §6): Simple gets one
     combined pass; Medium gets three passes from one auditor; High gets three
     independent subagents synthesized by the orchestrator.

     Instantiation: Simple-tier tasks collapse this table to one row named
     "Combined audit (adversarial + steelman + neutral)". Medium/High use the full
     three-row breakdown. -->

| Lens | Finding | Resolution |
|---|---|---|
| Adversarial | {{ADVERSARIAL_FINDING}} | {{ADVERSARIAL_RESOLUTION}} |
| Steelman | {{STEELMAN_FINDING}} | {{STEELMAN_RESOLUTION}} |
| Neutral / unbiased | {{NEUTRAL_FINDING}} | {{NEUTRAL_RESOLUTION}} |

## Rollback

<!-- How to undo this change if it goes wrong in review, CI, or production. Required
     for Medium/High tier; recommended even for Simple if not trivially git-revertable. -->

{{ROLLBACK_PLAN}}
