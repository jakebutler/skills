<!--
  TEMPLATE: PROJECT-STATUS.md — overwritten handoff checkpoint.

  WRITE TIER: A — fully automatic (see DESIGN-MEMO.md §7.4).
  - This file is an idempotent OVERWRITE, not an append. Replace the whole body at
    every checkpoint; never accumulate history here.
  - NEVER a ledger. Anything you want preserved as history belongs in CHANGELOG.md
    (user-facing) or git log (commit-level). If you're tempted to add a dated section
    below the current one, that content belongs in the changelog instead.
  - Update only at checkpoints: session end, commit, compaction, or explicit handoff —
    never mid-response, never speculatively.
  - Because it's an overwrite, there's no anti-churn gate to apply here beyond "did the
    state actually change since the last checkpoint" — if nothing changed, don't touch it.

  Instantiation: replace {{PLACEHOLDERS}}. This file should exist at repo root (or the
  path bound in the instance manifest) and stay short enough to read in one pass.
-->

# Project Status

**Last updated:** {{TIMESTAMP}} by {{UPDATED_BY}}

## Current state

<!-- One paragraph: where the project/feature stands right now, in plain terms. -->

{{CURRENT_STATE_SUMMARY}}

## Work just completed

<!-- What changed in the session/checkpoint that produced this update. Bullet list,
     each item concrete enough to act on without re-deriving context. -->

- {{COMPLETED_ITEM_1}}
- {{COMPLETED_ITEM_2}}

## Verification run

<!-- Exact commands and their results — not "tests pass," the actual command and
     outcome, so the next agent can trust or re-run it. -->

| Check | Command | Result |
|---|---|---|
| {{CHECK_NAME_1}} | `{{COMMAND_1}}` | {{RESULT_1}} |
| {{CHECK_NAME_2}} | `{{COMMAND_2}}` | {{RESULT_2}} |

## Known issues

<!-- Open defects or gaps discovered but not yet fixed. Delete this section's rows
     once resolved rather than marking them "fixed" here — that belongs in the
     changelog or the issue tracker. -->

- {{KNOWN_ISSUE_1}}
- {{KNOWN_ISSUE_2}}

## Recommended next steps

<!-- Ordered, actionable. The next agent should be able to start from item 1 without
     asking clarifying questions. -->

1. {{NEXT_STEP_1}}
2. {{NEXT_STEP_2}}

## Handoff instructions

<!-- Anything a fresh agent/session needs to resume safely: branch/worktree state,
     env setup, in-flight task docs to read, blocking questions for the user. -->

- Branch / worktree: {{BRANCH_OR_WORKTREE}}
- Active task doc(s): {{ACTIVE_TASK_DOCS}}
- Blocking questions for the user: {{BLOCKING_QUESTIONS}}
- {{OTHER_HANDOFF_NOTES}}
