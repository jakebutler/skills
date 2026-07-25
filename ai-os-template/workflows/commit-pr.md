# Commit PR Workflow

## **Trigger**

This workflow starts when the user requests `{{COMMIT_PR_COMMAND}}`, a completed slice must be published for review, or `commit` finishes and the orchestrator is asked to open a pull request.

## **Inputs**

- All inputs required by `commit`.
- A branch that may be pushed to `{{REMOTE_NAME}}`, or user approval to create/use `{{FEATURE_BRANCH}}`.
- Push command `{{PUSH_COMMAND}}`, main branch `{{MAIN_BRANCH}}`, and PR target branch `{{PR_TARGET_BRANCH}}`.
- Repository PR tool command such as `{{PR_CREATE_COMMAND}}` and `{{PR_UPDATE_COMMAND}}`.
- Verification and review packets from `{{TASK_DOCS_DIR}}/{{TASK_ID}}/`.

## **Steps**

1. Orchestrator: run the `commit` workflow and confirm it produced a focused commit hash.
2. Orchestrator: confirm the current branch is not `{{MAIN_BRANCH}}` unless the repo explicitly allows PRs from it; create or switch to `{{FEATURE_BRANCH}}` only with user-approved branch context.
3. Orchestrator: push the branch to `{{REMOTE_NAME}}` with `{{PUSH_COMMAND}}`.
4. Orchestrator: draft the PR body in `{{TASK_DOCS_DIR}}/{{TASK_ID}}/pr.md` with the required sections: Summary, Why, Changes, Verification, Risks & Rollback, Follow-up.
5. Orchestrator: create the PR using `{{PR_CREATE_COMMAND}}` and capture the PR URL and commit hash or hashes in `{{TASK_DOCS_DIR}}/{{TASK_ID}}/pr.md`.
6. Orchestrator: run `review-pr` against the pushed frozen diff. Applicable lenses run
   concurrently and `review-resolver` produces the sole actionable feedback packet.
   Write source coverage and consolidated findings to
   `{{TASK_DOCS_DIR}}/{{TASK_ID}}/pr-review.md`.
7. Orchestrator: disposition consolidated findings as fix-now, accepted-risk,
   follow-up, or rejected with reason, and write each disposition beside its finding.
8. `implementer`: address fix-now findings with scoped edits, then run focused verification.
9. Orchestrator: run `commit` again for review fixes if any files changed.
10. Orchestrator: push updates and update the PR body using `{{PR_UPDATE_COMMAND}}` when Changes, Verification, Risks & Rollback, or Follow-up changed.
11. Orchestrator: for High-tier work, once the PR is otherwise ready to merge, run the
    quiz-before-merge and record each question, the user's answer, any unresolved
    misunderstanding, and the quiz state in `{{TASK_DOCS_DIR}}/{{TASK_ID}}/pr-status.md`.
    The state is `pending` until the user responds substantively to every question. It
    becomes `engaged` once they have done so, including explicitly identifying
    uncertainty, and `resolved` only when the answers show sufficient understanding
    and every misunderstanding is explained or the change is revised.
12. Orchestrator: write final status to `{{TASK_DOCS_DIR}}/{{TASK_ID}}/pr-status.md`,
    recording `not-required` for a Simple or Medium quiz or `pending` when a High-tier
    PR has not reached the merge gate, and update `{{PROJECT_STATUS_FILE}}` if handoff
    state changed.

## **Output contract**

- A pushed branch on `{{REMOTE_NAME}}`.
- A PR targeting `{{PR_TARGET_BRANCH}}`.
- PR body includes exactly these top-level sections: `Summary`, `Why`, `Changes`, `Verification`, `Risks & Rollback`, `Follow-up`.
- `{{TASK_DOCS_DIR}}/{{TASK_ID}}/pr.md`: PR body, PR URL, commit hashes, verification summary, risks, rollback, and follow-up items.
- `{{TASK_DOCS_DIR}}/{{TASK_ID}}/pr-review.md`: PR review agent findings and dispositions.
- `{{TASK_DOCS_DIR}}/{{TASK_ID}}/pr-status.md`: final branch, PR URL, review state,
  remaining risks, next recommended action, and quiz questions, answers, unresolved
  misunderstandings, and state (`not-required`, `pending`, `engaged`, or `resolved`).

## **Verification**

- The `commit` workflow completed successfully before push.
- Branch push succeeded and the PR URL was captured.
- PR body contains all required sections.
- PR review agent ran after PR creation or after the pushed diff was available.
- All blocking review findings were addressed or explicitly accepted by the orchestrator with reason.
- Updated PR body reflects final verification and known risks.
- For High-tier work at the merge gate, quiz questions and answers are recorded and
  the state is `resolved`; Simple and Medium work record `not-required`.

## **Ceremony scaling**

- Simple: commit workflow, push, PR body with required sections, paired fresh-context
  Sol 5.6 xhigh + Opus 5 PR review.
- Medium: full commit workflow, paired Sol + Opus PR review, review-fix loop, status
  update, changelog/docs verification reflected in PR.
- High: full commit workflow, paired Sol + Opus PR review, specialist sub-reviews
  based on diff content, explicit rollback plan, release notes or deployment gate,
  final orchestrator synthesis, optional Fable principal/architect escalation only
  after a concrete trigger, and quiz-before-merge: before merging, the orchestrator
  asks the user 3–5 pointed questions about the change (what breaks if X, why approach
  Y, where is Z verified). Merge proceeds only when the recorded quiz state is
  `resolved`.

## **Failure handling**

- If commit fails, stop and return to `commit` failure handling.
- If push fails due to auth, branch protection, or remote mismatch, record exact error in `{{TASK_DOCS_DIR}}/{{TASK_ID}}/pr-status.md` and stop before retrying destructive commands.
- If PR creation fails, keep the branch pushed if push succeeded, record the command and error, and provide the manual PR body from `{{TASK_DOCS_DIR}}/{{TASK_ID}}/pr.md`.
- If PR review finds blocking issues, loop through implementation, verification, commit, push, and PR update before final status.
- If the quiz-before-merge surfaces a misunderstanding, resolve it (explain or revise)
  before merge.
- If follow-up work is real scope and not a blocker, record it in the PR `Follow-up` section and `{{TASK_DOCS_DIR}}/{{TASK_ID}}/pr-status.md`.
