# Debug Workflow

## **Trigger**

This workflow starts when the user reports a bug, a verification command fails, logs or telemetry reveal a defect, a hook delegates a failure investigation, or another workflow cannot proceed because behavior is not understood.

## **Inputs**

- The observed failure, user report, failing command, log excerpt, or reproduction hint.
- `{{PROJECT_STATUS_FILE}}`, relevant docs in `{{DOCS_DIR}}/`, and any related task docs.
- Safe log location `{{TRANSIENT_LOG_DIR}}` and durable task-doc location `{{TASK_DOCS_DIR}}/{{TASK_ID}}/`.
- Repo-specific commands for boot, logs, tests, and smoke checks: `{{DEV_COMMAND}}`, `{{LOG_COMMAND}}`, `{{TEST_COMMAND}}`, `{{SMOKE_COMMAND}}`.

## **Steps**

1. Orchestrator: classify the debug task complexity and create `{{TASK_DOCS_DIR}}/{{TASK_ID}}/debug.md` for Medium and High tiers.
2. Orchestrator: start searchable transient logs in `{{TRANSIENT_LOG_DIR}}/{{TASK_ID}}/` using `{{LOG_COMMAND}}` or the repo's logging process; record the exact command.
3. `implementer` through the Codex exploration route: grep existing logs, traces, test output, issue reports, and known troubleshooting docs before asking the user to reproduce.
4. `implementer`: reproduce or observe the issue with `{{REPRO_COMMAND}}`, browser steps, CLI steps, or the failing verification command; if reproduction is impossible, capture what was tried and the closest observable evidence.
5. `implementer`: assess the failure by separating facts, hypotheses, ruled-out causes, and unknowns in `{{TASK_DOCS_DIR}}/{{TASK_ID}}/debug.md`.
6. Orchestrator: approve a focused plan before code changes; for Simple tier this can be inline, for Medium and High tiers it is written in the debug doc with rollback and verification.
7. `implementer` through the Codex implementation route: make the smallest scoped code or test change needed to test the leading hypothesis.
8. `implementer`: run the focused verification command and the reproduction path; append results to `{{TASK_DOCS_DIR}}/{{TASK_ID}}/debug.md`.
9. Orchestrator and `implementer`: repeat assess, plan, code, test until fixed, blocked, or the hypothesis set is exhausted.
10. `verifier`: independently run the reproduction path and focused verification for Medium and High tiers; write results to `{{TASK_DOCS_DIR}}/{{TASK_ID}}/verification.md`.
11. Orchestrator: identify whether the issue revealed a durable repo convention or recurring trap. If yes, run the Tier C staged-review process by invoking `autoskill-improver` to create proposals under `dev/skill-proposals/`; Tier A/B docs may be delegated to `doc-maintainer`.
12. Orchestrator: clear or archive transient logs according to `{{LOG_RETENTION_RULE}}`; never leave unreported running log processes.
13. Orchestrator: chain into `commit` after the fix and durable lesson handling are complete.

## **Output contract**

- `{{TASK_DOCS_DIR}}/{{TASK_ID}}/debug.md`: symptoms, commands run, log locations, reproduction steps, facts, hypotheses, ruled-out causes, changes made, and final root cause or unresolved status.
- `{{TASK_DOCS_DIR}}/{{TASK_ID}}/verification.md`: required for Medium and High tiers; independent confirmation that the reproduction path no longer fails.
- Code or test changes scoped to the defect.
- Tier A/B doc updates when stable troubleshooting knowledge changed.
- Tier C proposals in `dev/skill-proposals/` when `AGENTS.md`, `CLAUDE.md`, hooks, or skills need durable updates.
- Transient logs removed, archived, or explicitly reported according to `{{LOG_RETENTION_RULE}}`.

## **Verification**

- Existing traces and logs were searched before asking the user for reproduction.
- The issue was reproduced or the inability to reproduce is documented with commands and evidence.
- The focused verification and reproduction path pass after the fix.
- Medium and High tiers have independent verifier confirmation.
- Orchestrator confirms no unreported log processes remain.

## **Ceremony scaling**

- Simple: short debug note, existing log grep, direct reproduction, smallest fix, focused verification, chain to commit.
- Medium: written debug doc, explicit hypothesis list, independent verifier, docs/status update if the defect teaches a durable lesson.
- High: full incident-style debug doc, rollback notes, broader affected-area verification, independent verifier, specialist review for security/data/architecture as applicable, Tier C proposals for recurring traps.

## **Failure handling**

- If logs cannot be started, continue only with available traces and record the logging gap in `{{TASK_DOCS_DIR}}/{{TASK_ID}}/debug.md`.
- If reproduction requires user-only credentials or environment, provide exact reproduction steps and evidence needed, then stop before speculative code changes.
- If a fix fails verification twice, stop and ask orchestrator to re-plan or invoke `researcher` for prior art and related issues.
- If the root cause is outside repo scope, document the boundary and recommended owner, then run `wrap-session` instead of `commit`.
- If durable lesson capture would touch Tier C files, stage a proposal in `dev/skill-proposals/` and do not apply it automatically.
