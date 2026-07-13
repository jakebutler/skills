# Wrap Session Workflow

## **Trigger**

This workflow starts when the user requests `{{WRAP_SESSION_COMMAND}}`, the session is ending, context is about to compact, a long task is pausing, or the orchestrator needs to leave a clean handoff state.

## **Inputs**

- Current working directory, branch, task id, and active workflow state.
- `{{PROJECT_STATUS_FILE}}`, `{{CHANGELOG_FILE}}`, `{{SPEC_FILE}}`, relevant `{{DOCS_DIR}}/` pages, and active task docs.
- Verification commands run or intentionally skipped during the session.
- Knowledge of running processes started by agents, including dev servers, log tails, test watchers, and browser automation.
- Repo-specific running-process inspection command `{{PROCESS_CHECK_COMMAND}}`.

## **Steps**

1. Orchestrator: confirm `pwd`, current branch, active task id, and whether there are uncommitted changes.
2. Orchestrator: summarize completed work, remaining work, risks, blockers, and the next recommended action.
3. `doc-maintainer`: overwrite `{{PROJECT_STATUS_FILE}}` idempotently with current state, active task, branch, last verification, open risks, next action, and handoff notes. Do not append a history ledger.
4. `doc-maintainer`: update `{{CHANGELOG_FILE}}` only if the session produced a meaningful user/operator-facing change.
5. `doc-maintainer`: update `{{SPEC_FILE}}` or relevant `{{DOCS_DIR}}/` pages only if stable behavior, state, or intent changed; record one-line update reasons.
6. `autoskill-improver`: run the four-route triage in `agents/autoskill-improver.md` (skill proposal, doc proposal, solution doc, or skip); proposals are staged, while solution docs are written directly as Tier B.
7. Orchestrator: confirm no unreported running processes remain by checking `{{PROCESS_CHECK_COMMAND}}` or the repo's known process list.
8. Orchestrator: stop transient processes started only for the session when safe, or report their PID, purpose, and owner if they must remain running.
9. Orchestrator: list verification completed and verification skipped with reasons in `{{TASK_DOCS_DIR}}/{{TASK_ID}}/wrap-session.md` for Medium and High tiers, or in the final response for Simple tier.
10. Orchestrator: provide final handoff with files changed, docs updated, proposals created, verification completed/skipped, next recommended action, and any process status.

## **Output contract**

- Updated `{{PROJECT_STATUS_FILE}}` as an overwrite, not an append-only ledger.
- Updated `{{CHANGELOG_FILE}}` only when meaningful.
- Updated `{{SPEC_FILE}}` or `{{DOCS_DIR}}/` pages only for stable durable changes.
- `{{TASK_DOCS_DIR}}/{{TASK_ID}}/wrap-session.md` for Medium and High tiers, containing summary, changed files, verification completed, verification skipped with reasons, running-process status, risks, blockers, and next recommended action.
- Zero or more triage outputs: staged proposals in `dev/skill-proposals/` (Tier C) or solution docs in `{{DOCS_DIR}}/solutions/` (Tier B, with recorded `capture_reason`).
- Final user-facing status report matching the artifacts.

## **Verification**

- `{{PROJECT_STATUS_FILE}}` exists and reflects current state after the wrap.
- Verification completed and skipped are both listed, with exact commands where available.
- Changelog/docs updates pass the significance check or are explicitly skipped.
- Autoskill scan ran; proposal files exist when durable lessons qualified, while their absence means no durable lessons qualified. Do not write empty "none qualified" note files.
- Orchestrator confirms no unreported running processes remain.

## **Ceremony scaling**

- Simple: update `{{PROJECT_STATUS_FILE}}` only if state changed, mention verification completed/skipped in final response, process check if any process was started.
- Medium: status overwrite, wrap-session task doc, changelog/docs significance check, autoskill scan, process check.
- High: status overwrite, full handoff doc, changelog and durable docs review, autoskill scan, process inventory, explicit blockers/risks/rollback or next release action.

## **Failure handling**

- If `{{PROJECT_STATUS_FILE}}` cannot be updated, write the handoff to `{{TASK_DOCS_DIR}}/{{TASK_ID}}/wrap-session.md` and report the status-file failure.
- If docs/changelog updates are ambiguous, skip the edit and record the question instead of adding noisy content.
- If a running process cannot be identified or stopped safely, report PID, command, port, owner, and recommended action.
- If autoskill scan finds Tier C changes, leave proposal files only and do not apply them.
- If verification was skipped due to time, environment, or missing credentials, list the skipped command, reason, and recommended owner.
