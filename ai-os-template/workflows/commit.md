# Commit Workflow

## **Trigger**

This workflow starts when the user requests `{{COMMIT_COMMAND}}`, `debug` chains into commit, `implement-tdd` finishes a verified slice, or the orchestrator determines a focused change is ready for commit.

## **Inputs**

- A completed implementation or documentation slice with known scope and complexity tier.
- Current working directory and branch context.
- Repo-specific commands: `{{FORMAT_COMMAND}}`, `{{LINT_COMMAND}}`, `{{TYPECHECK_COMMAND}}`, `{{TEST_COMMAND}}`, `{{BUILD_COMMAND}}`.
- Repo commit message format or template `{{COMMIT_MESSAGE}}`.
- Any task docs under `{{TASK_DOCS_DIR}}/{{TASK_ID}}/` and status/docs/changelog rules.

## **Steps**

1. Orchestrator: confirm working directory with `pwd` and confirm the user permits a commit in the current branch.
2. Orchestrator: run `git status --short` and identify changed, untracked, and unrelated files without staging anything.
3. Orchestrator: review the diff for files in scope using `git diff -- {{SCOPED_PATHS}}` and inspect untracked files that are part of the intended change.
4. Orchestrator: separate intended changes from unrelated work; stop and ask the user before touching, staging, or committing any ambiguous file.
5. Orchestrator or `implementer`: run formatter and lint commands scoped to the change when the repo supports scoped runs; otherwise run the standard `{{FORMAT_COMMAND}}` and `{{LINT_COMMAND}}` if safe for the branch.
6. Orchestrator or `verifier`: run tests, typecheck, and build scoped to the change: `{{TYPECHECK_COMMAND}}`, `{{TEST_COMMAND}}`, `{{BUILD_COMMAND}}`, or documented focused variants.
7. `reviewer`: perform an independent review of the diff; the implementer is never the sole reviewer. Findings must cite file:line and prioritize bugs, regressions, missing tests, security, and broken contracts.
8. Orchestrator: disposition each review finding as fixed, accepted-risk, deferred with owner, or rejected with reason.
9. `implementer`: address accepted findings with scoped edits, then rerun affected verification.
10. `doc-maintainer`: update `{{PROJECT_STATUS_FILE}}`, `{{CHANGELOG_FILE}}`, and relevant docs according to doc write tiers. Use Tier A automatic updates, Tier B guarded updates, and no Tier C direct edits.
11. `autoskill-improver`: run the four-route triage in `agents/autoskill-improver.md` (skill proposal, doc proposal, solution doc, or skip); proposals are staged, while solution docs are written directly as Tier B.
12. Orchestrator: review the final diff and status again, then create one focused commit with message `{{COMMIT_MESSAGE}}` including only the intended files.

## **Output contract**

- One focused commit on the current branch containing only intended changes.
- `{{TASK_DOCS_DIR}}/{{TASK_ID}}/commit.md`: commands run, results, review findings and dispositions, docs updates, autoskill proposals, skipped checks with reasons, and final commit hash.
- Updated `{{PROJECT_STATUS_FILE}}` when handoff state changed.
- Updated `{{CHANGELOG_FILE}}` when the change is meaningful to users or operators.
- Proposals under `dev/skill-proposals/` only when autoskill scan finds durable lessons.

## **Verification**

- `git status --short` was inspected before committing.
- The diff was reviewed before committing.
- Formatter/lint ran or was explicitly skipped with reason.
- Tests/typecheck/build ran at the scope required by the complexity tier or were explicitly skipped with reason.
- An independent reviewer reviewed the change; implementer was not the sole reviewer.
- Final commit contains only intended files.

## **Ceremony scaling**

- Simple: status, diff review, focused formatter/lint/test where available, independent review can be orchestrator review if the orchestrator did not implement the change, concise status update.
- Medium: scoped formatter/lint/typecheck/tests, independent `reviewer`, docs/status/changelog significance check, autoskill scan.
- High: full relevant suite or release gate, independent reviewer plus specialist review as needed, changelog and durable docs updates, rollback notes in task docs, autoskill scan.

## **Failure handling**

- If unrelated work is present, leave it untouched and commit only intended files; if file ownership is ambiguous, stop for user direction.
- If formatting changes unrelated files, inspect the diff and include only changes required for the slice.
- If verification fails, do not commit; return to `implement-tdd` or `debug` with the failing command and evidence.
- If independent review finds blocking issues, address them and rerun verification before committing.
- If autoskill proposes Tier C updates, leave them as proposal files and mention them in the commit packet; never include applied Tier C changes unless separately requested and reviewed.
