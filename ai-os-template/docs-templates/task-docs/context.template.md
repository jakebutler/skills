<!--
  TEMPLATE: {{TASK_DOCS_DIR}}/[task]/context.md — task-scoped working memory.

  WRITE TIER: task-scoped and disposable (see DESIGN-MEMO.md §4, §11 decision #2).
  - Lives only for the duration of the task. Archive the whole {{TASK_DOCS_DIR}}/[task]/
    directory when the task completes.
  - This file accumulates facts and decisions AS the task proceeds — append to it
    rather than rewriting, so it stays an honest record of what was learned and why.
  - DECISIONS recorded here get promoted to global docs (SPEC.md, docs/, AGENTS.md) when
    the task lands; the raw exploration notes and files-inspected list do not travel
    upward — they exist to keep this task's agent (or its successor) oriented.

  Instantiation: create at {{TASK_DOCS_DIR}}/{{TASK_SLUG}}/context.md, replace
  {{PLACEHOLDERS}}. Keep entries dated so staleness is visible.
-->

# Context: {{TASK_NAME}}

## Files inspected

<!-- Running list, not a re-derivation. Add to this as you read more; don't remove
     entries once added even if they turned out to be irrelevant — note that instead. -->

| File | Why it was inspected | Relevant? |
|---|---|---|
| `{{FILE_PATH_1}}` | {{INSPECTION_REASON_1}} | {{RELEVANCE_1}} |
| `{{FILE_PATH_2}}` | {{INSPECTION_REASON_2}} | {{RELEVANCE_2}} |

## Key facts

<!-- Things learned about the codebase/system that matter for this task, with enough
     detail that a fresh agent doesn't have to rediscover them. -->

- {{KEY_FACT_1}}
- {{KEY_FACT_2}}

## Decisions made

<!-- Decisions that should survive this task and get promoted to global docs on
     completion. Mark where each one should land. -->

| Decision | Rationale | Promote to |
|---|---|---|
| {{DECISION_1}} | {{DECISION_1_RATIONALE}} | {{DECISION_1_TARGET_DOC}} |
| {{DECISION_2}} | {{DECISION_2_RATIONALE}} | {{DECISION_2_TARGET_DOC}} |

## Route state

<!-- Current task state, not a provider-account ledger. Update at phase boundaries and
     on failure. Never record credentials, tokens, or full auth output. -->

| Phase | Route | State | Evidence or checkpoint | Next action |
|---|---|---|---|---|
| {{PHASE_1}} | {{ROUTE_1}} | {{ROUTE_STATE_1}} | `{{CHECKPOINT_1}}` | {{ROUTE_NEXT_1}} |

Provider family state: Codex {{CODEX_STATE}}; Anthropic {{ANTHROPIC_STATE}}; Z.ai
{{ZAI_STATE}}; Cursor {{CURSOR_STATE}}.

Fallback events: {{FALLBACK_EVENTS_OR_NONE}}.

## Links

<!-- Issues, PRs, external references, related task docs. -->

- {{LINK_1}}
- {{LINK_2}}
