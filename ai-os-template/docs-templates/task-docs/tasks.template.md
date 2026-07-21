<!--
  TEMPLATE: {{TASK_DOCS_DIR}}/[task]/tasks.md — task-scoped execution checklist.

  WRITE TIER: task-scoped and disposable (see DESIGN-MEMO.md §4, §11 decision #2).
  - Lives only for the duration of the task. Archive the whole {{TASK_DOCS_DIR}}/[task]/
    directory when the task completes.
  - This is the tactical checklist, not the plan (see plan.md) and not the decision
    record (see context.md). It does not get promoted anywhere — it's disposable by
    design. If a checklist item reveals a decision worth keeping, record it in
    context.md, not here.
  - Update items in place as work proceeds (check them off, add timestamps); don't
    delete completed items — they're useful history for the remainder of the task.

  Instantiation: create at {{TASK_DOCS_DIR}}/{{TASK_SLUG}}/tasks.md, replace {{PLACEHOLDERS}}.
-->

# Tasks: {{TASK_NAME}}

## Checklist

<!-- One line per unit of work. Timestamp on completion, not on creation. -->

- [ ] {{TASK_ITEM_1}} <!-- completed: {{TIMESTAMP_1}} -->
- [ ] {{TASK_ITEM_2}} <!-- completed: {{TIMESTAMP_2}} -->
- [ ] {{TASK_ITEM_3}} <!-- completed: {{TIMESTAMP_3}} -->

## Blocked / waiting on

<!-- Items stalled on something external: user input, another task, an env issue. -->

- {{BLOCKED_ITEM_1}} — waiting on {{BLOCKER_1}}

## Notes

<!-- Short, dated notes on scope changes or surprises encountered mid-task. Anything
     durable belongs in context.md instead. -->

- {{DATE}}: {{NOTE}}
