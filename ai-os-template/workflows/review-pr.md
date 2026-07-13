# Review PR Workflow

## **Trigger**

This workflow starts when the user requests `{{REVIEW_PR_COMMAND}}`, `commit-pr` delegates PR review, a hook detects a PR review need, or the orchestrator needs an independent review of a branch or pull request.

## **Inputs**

- PR URL, branch, commit range, or diff command such as `{{PR_DIFF_COMMAND}}`.
- Base branch `{{PR_TARGET_BRANCH}}` and repository path.
- Relevant docs, contracts, tests, and task docs for the changed area.
- Complexity tier from `{{RUBRIC_LOCATION}}`.

## **Steps**

1. Orchestrator: confirm the PR URL or diff range, target branch, and review scope.
2. Orchestrator: classify the review tier using `{{RUBRIC_LOCATION}}`; promote to High for security, data, migrations, production rollout, or broad shared contracts.
3. `reviewer`: read the full diff and enough surrounding code to understand changed behavior, not only the patch hunks.
4. `reviewer`: inspect relevant tests, docs, contracts, public APIs, and existing patterns for the changed area.
5. `reviewer`: produce findings first. Each finding must include severity, file:line, defect statement, concrete failure scenario, and recommended fix direction.
6. `reviewer`: prioritize bugs, regressions, missing tests, security risks, and broken contracts. Do not include vague style-only feedback unless it affects maintainability or product quality.
7. Orchestrator: for Medium and High tiers, delegate sub-reviews based on diff content: architecture reviewer for shared abstractions/contracts, security reviewer for auth/secrets/permissions/data exposure, UX reviewer or `frontend-designer` for user-facing UI, test reviewer for coverage gaps, docs reviewer for docs/API drift.
8. Specialist `reviewer` or `frontend-designer`: return focused findings with the same file:line and failure-scenario requirements.
9. Orchestrator: synthesize duplicate findings and write the final review to `{{TASK_DOCS_DIR}}/{{TASK_ID}}/pr-review.md` or post it through `{{PR_REVIEW_COMMAND}}` when requested.
10. Orchestrator: classify each finding as blocking, non-blocking, follow-up, or no-action after discussion with the implementer or user.

## **Output contract**

- `{{TASK_DOCS_DIR}}/{{TASK_ID}}/pr-review.md` or PR review comment containing findings first, ordered by severity.
- Every finding includes file:line, severity, defect statement, concrete failure scenario, and recommended fix direction.
- A `No findings above threshold` statement when no qualifying findings exist.
- `Open questions` section only for questions that affect correctness, risk, or review disposition.
- `Review coverage` section listing diff range, files/docs inspected, sub-reviews run, and checks not run.

## **Verification**

- Reviewer inspected the full diff and surrounding code relevant to each finding.
- Findings are grounded in file:line references.
- Review contains no vague style-only feedback without concrete maintainability or product impact.
- Medium and High tier reviews considered architecture, security, UX, tests, and docs sub-review triggers based on actual diff content.
- Orchestrator confirms implementer did not self-approve as the sole reviewer.

## **Ceremony scaling**

- Simple: one general review pass, findings first, file:line citations, no specialist sub-review unless the diff contains security or data risk.
- Medium: general review plus delegated sub-reviews triggered by diff content; test and docs coverage checked explicitly.
- High: independent general review plus specialist architecture/security/UX/tests/docs reviews as applicable; orchestrator synthesis required before approval or requested changes.

## **Failure handling**

- If the diff cannot be fetched, record the failing command and stop with the exact PR URL or branch needed.
- If a file:line cannot be cited because the issue is cross-file, cite the primary call site or contract file and name the related files in the finding.
- If the review uncovers scope creep or missing spec decisions, stop approval and chain back to `spec` for plan repair.
- If the review uncovers a defect requiring code changes, chain to `implement-tdd` or `debug` with the finding as the implementation contract.
- If no findings exist but verification was not run, state the residual risk in `Review coverage`.
