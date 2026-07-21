# Review PR Workflow

## **Trigger**

This workflow starts when the user requests `{{REVIEW_PR_COMMAND}}`, `commit-pr` delegates PR review, a hook detects a PR review need, or the orchestrator needs an independent review of a branch or pull request.

## **Inputs**

- PR URL, branch, commit range, or diff command such as `{{PR_DIFF_COMMAND}}`.
- Base branch `{{PR_TARGET_BRANCH}}` and repository path.
- Original plan plus the diff; relevant docs, contracts, tests, and task docs for the
  changed area. Do not hand off whole files; the reviewer reads repository files as
  needed.
- Complexity tier from `{{RUBRIC_LOCATION}}`.
- For proof-required work: the exact frozen candidate identity, approved builder packet,
  generated effect-surface inventory, and scoped invariant selection.

## **Steps**

1. Orchestrator: confirm the PR URL or diff range, target branch, and review scope.
2. Orchestrator: classify the review tier using `{{RUBRIC_LOCATION}}`; promote to High for security, data, migrations, production rollout, or broad shared contracts.
3. Orchestrator: freeze the exact candidate identity. Every lens must reproduce it at
   start and finish; a changed identity invalidates all outstanding review packets.
4. `reviewer`: enumerate every reachable write, read, transition, external effect,
   background entry point, and bypass path in scope before judging the diff. Reconcile
   that enumeration with the generated inventory and record unresolved surfaces.
5. `reviewer`: read the full diff and enough surrounding code to understand changed behavior, not only the patch hunks.
6. `reviewer`: inspect relevant tests, docs, contracts, public APIs, and existing patterns for the changed area.
7. `reviewer`: produce findings first. Each finding must include a stable finding ID,
   severity, file:line, defect statement, concrete failure scenario, and recommended fix direction.
8. Orchestrator: launch applicable architecture, security, correctness, UX, test, and
   docs lenses concurrently against the same frozen candidate. Each source packet is
   durable and immutable once returned.
9. `review-resolver`: validate source-packet identity and coverage, deduplicate and
   cluster findings, resolve conflicts using declared priority and requirement evidence,
   and emit one non-contradictory resolution packet. It is read-only and cannot invent
   findings, approve code, or edit policy.
10. Orchestrator: pass only the validated consolidated changes to the implementer.
    Never drip individual lens feedback through sequential implementation rounds.
11. After deterministic checks and consolidated fixes pass, run one residual
    adversarial review for unknown-unknowns. Novel confirmed findings enter the
    invariant-extraction workflow; known-class findings link to their existing ID.
12. Orchestrator: write the validated resolution and final review to
    `{{TASK_DOCS_DIR}}/{{TASK_ID}}/pr-review.md` or post it through
    `{{PR_REVIEW_COMMAND}}` when requested.

## **Output contract**

- `{{TASK_DOCS_DIR}}/{{TASK_ID}}/pr-review.md` or PR review comment containing findings first, ordered by severity.
- Every finding includes file:line, severity, defect statement, concrete failure scenario, and recommended fix direction.
- A `No findings above threshold` statement when no qualifying findings exist.
- `Open questions` section only for questions that affect correctness, risk, or review disposition.
- `Review coverage` section listing diff range, files/docs inspected, sub-reviews run, and checks not run.
- For proof-required work, machine-readable coverage and resolution packets validate
  against their schemas and match the frozen identity exactly.

## **Verification**

- Reviewer inspected the full diff and surrounding code relevant to each finding.
- Findings are grounded in file:line references.
- Review contains no vague style-only feedback without concrete maintainability or product impact.
- Medium and High tier reviews considered architecture, security, UX, tests, and docs sub-review triggers based on actual diff content; applicable lenses ran in parallel.
- Every source finding is dispositioned exactly once by the validated resolution packet.
- Orchestrator confirms implementer did not self-approve as the sole reviewer.

## **Ceremony scaling**

- Simple: one general review pass, findings first, file:line citations, no specialist sub-review unless the diff contains security or data risk.
- Medium: general review plus delegated sub-reviews triggered by diff content; test and docs coverage checked explicitly.
- High: parallel independent general and applicable specialist reviews against one
  freeze; validated resolver fan-in required before approval or requested changes.

## **Failure handling**

- If the diff cannot be fetched, record the failing command and stop with the exact PR URL or branch needed.
- If a file:line cannot be cited because the issue is cross-file, cite the primary call site or contract file and name the related files in the finding.
- If the review uncovers scope creep or missing spec decisions, stop approval and chain back to `spec` for plan repair.
- For proof-required work, missing design discovered in code review revokes the builder
  packet and returns to `design-proof`; do not decide it inside the review-fix loop.
- If the review uncovers a defect requiring code changes, chain to `implement-tdd` or `debug` with the finding as the implementation contract.
- If no findings exist but verification was not run, state the residual risk in `Review coverage`.
