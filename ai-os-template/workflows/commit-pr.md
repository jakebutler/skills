# Commit PR Workflow

## **Trigger**

Run when the user asks to commit/push/open or update a PR.

## **Inputs**

- Commit workflow inputs or an already committed candidate.
- Branch/remote/PR target and publication authority.
- Existing exact-head verification/review evidence.

## **Steps**

1. Run `commit` only when uncommitted intended changes remain. Reuse its evidence.
2. Confirm the branch and target, then push safely without rewriting history unless the
   user explicitly authorized the verified rewrite.
3. Create/update a concise PR body with summary, important verification, material
   risk/rollback, and real follow-up. Do not create duplicate task files solely to
   mirror the PR.
4. PR creation does not trigger another review. Run `review-pr` only when requested,
   genuinely High-risk, not yet adequately reviewed, or changed after review.
5. If review runs, collect every finding before edits, make one correction batch, run
   affected checks, commit once, push once, and update the PR once.
6. Report URL, exact head, checks, review state, material risks, and next action.

## **Output contract**

- Pushed branch and PR when external tooling succeeds.
- Concise delivery report; task-local PR artifacts only when already part of the task
  contract or explicitly useful for handoff.

## **Verification**

- Branch/head/target are exact.
- Required checks/review match the pushed candidate.
- No unchanged gate was rerun solely because the PR was opened.

## **Ceremony scaling**

- Simple/Medium: commit, push, concise PR; review only when requested or uncertain.
- High: reuse one independent review and relevant gate; add concurrent specialists
  only for concrete diff-triggered risks.

## **Failure handling**

- Push/PR failure: preserve the local commit and return the exact error plus PR body.
- Blocking findings: one consolidated correction cycle, not one cycle per finding.
- No quiz-before-merge. Merge/deploy/production authority remains separate.
