# Commit PR Workflow

## **Trigger**

This workflow starts when the user requests `{{COMMIT_PR_COMMAND}}`, a completed slice must be published for review, or `commit` finishes and the orchestrator is asked to open a pull request.

## **Inputs**

- All inputs required by `commit`.
- A branch that may be pushed to `{{REMOTE_NAME}}`, or user approval to create/use `{{FEATURE_BRANCH}}`.
- PR target branch `{{PR_TARGET_BRANCH}}`.
- Repository PR tool command such as `{{PR_CREATE_COMMAND}}` and `{{PR_UPDATE_COMMAND}}`.
- Verification and review packets from `{{TASK_DOCS_DIR}}/{{TASK_ID}}/`.

## **Steps**

1. Orchestrator: run the `commit` workflow and confirm it produced a focused commit hash.
2. Orchestrator: confirm the current branch is not `{{MAIN_BRANCH}}` unless the repo explicitly allows PRs from it; create or switch to `{{FEATURE_BRANCH}}` only with user-approved branch context.
3. Orchestrator: push the branch to `{{REMOTE_NAME}}` with `{{PUSH_COMMAND}}`.
4. Orchestrator: draft the PR body in `{{TASK_DOCS_DIR}}/{{TASK_ID}}/pr.md` with the required sections: Summary, Why, Changes, Verification, Risks & Rollback, Follow-up.
5. Orchestrator: create the PR using `{{PR_CREATE_COMMAND}}` and capture the PR URL in `{{TASK_DOCS_DIR}}/{{TASK_ID}}/pr.md`.
6. `reviewer`: run a PR review agent on the pushed diff; findings must be first, cite file:line, and prioritize bugs, regressions, missing tests, security risks, and broken contracts.
7. Orchestrator: disposition reviewer findings as fix-now, accepted-risk, follow-up, or rejected with reason.
8. `implementer`: address fix-now findings with scoped edits, then run focused verification.
9. Orchestrator: run `commit` again for review fixes if any files changed.
10. Orchestrator: push updates and update the PR body using `{{PR_UPDATE_COMMAND}}` when verification, risks, or follow-up changed.
11. Orchestrator: write final status to `{{TASK_DOCS_DIR}}/{{TASK_ID}}/pr-status.md` and update `{{PROJECT_STATUS_FILE}}` if handoff state changed.

## **Output contract**

- A pushed branch on `{{REMOTE_NAME}}`.
- A PR targeting `{{PR_TARGET_BRANCH}}`.
- PR body includes exactly these top-level sections: `Summary`, `Why`, `Changes`, `Verification`, `Risks & Rollback`, `Follow-up`.
- `{{TASK_DOCS_DIR}}/{{TASK_ID}}/pr.md`: PR body, PR URL, commit hashes, verification summary, risks, rollback, and follow-up items.
- `{{TASK_DOCS_DIR}}/{{TASK_ID}}/pr-review.md`: PR review agent findings and dispositions.
- `{{TASK_DOCS_DIR}}/{{TASK_ID}}/pr-status.md`: final branch, PR URL, review state, remaining risks, and next recommended action.

## **Verification**

- The `commit` workflow completed successfully before push.
- Branch push succeeded and the PR URL was captured.
- PR body contains all required sections.
- PR review agent ran after PR creation or after the pushed diff was available.
- All blocking review findings were addressed or explicitly accepted by the orchestrator with reason.
- Updated PR body reflects final verification and known risks.

## **Ceremony scaling**

- Simple: commit workflow, push, PR body with required sections, one general PR review pass.
- Medium: full commit workflow, PR review agent, review-fix loop, status update, changelog/docs verification reflected in PR.
- High: full commit workflow, specialist PR sub-reviews based on diff content, explicit rollback plan, release notes or deployment gate, final orchestrator synthesis.

## **Failure handling**

- If commit fails, stop and return to `commit` failure handling.
- If push fails due to auth, branch protection, or remote mismatch, record exact error in `{{TASK_DOCS_DIR}}/{{TASK_ID}}/pr-status.md` and stop before retrying destructive commands.
- If PR creation fails, keep the branch pushed if push succeeded, record the command and error, and provide the manual PR body from `{{TASK_DOCS_DIR}}/{{TASK_ID}}/pr.md`.
- If PR review finds blocking issues, loop through implementation, verification, commit, push, and PR update before final status.
- If follow-up work is real scope and not a blocker, record it in the PR `Follow-up` section and `{{TASK_DOCS_DIR}}/{{TASK_ID}}/pr-status.md`.
