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
4. Orchestrator: launch the two standard code-review lanes against that same freeze:
   - a native Codex `gpt-5.6-sol` reviewer at xhigh reasoning in fresh context, with no
     implementation-history inheritance; and
   - a direct Claude subscription `claude-opus-5` reviewer.
   Neither lane is primary or fallback. Keep their prompts, transcripts, and source
   packets independent until both return.
5. Each `reviewer`: enumerate every reachable write, read, transition, external effect,
   background entry point, and bypass path in scope before judging the diff. Reconcile
   that enumeration with the generated inventory and record unresolved surfaces.
6. Each `reviewer`: read the full diff and enough surrounding code to understand
   changed behavior, not only the patch hunks.
7. Each `reviewer`: inspect relevant tests, docs, contracts, public APIs, and existing
   patterns for the changed area.
8. Each `reviewer`: produce findings first. Each finding must include a stable finding ID,
   severity, file:line, defect statement, concrete failure scenario, and recommended fix direction.
9. Orchestrator: add applicable security, correctness, UX, test, and docs lenses based
   on the actual diff. Consider Fable only as a separate read-only principal-engineer /
   architect escalation. Record `not_escalated` unless a concrete trigger exists: a
   load-bearing architecture or system boundary, an irreversible design choice, a
   cross-cutting invariant conflict, credible reviewer disagreement on an architectural
   premise, or a standard-lane finding that exposes a design gap outside the approved
   implementation contract. Task tier alone is not a trigger. Fable never replaces
   either standard lane.
10. If Fable is warranted, send one compact decision packet and allow at most one
    focused follow-up. Preserve its packet separately from both routine code reviews.
11. `review-resolver`: validate source-packet identity and coverage, require both
    standard reviewer packets, deduplicate and
   cluster findings, resolve conflicts using declared priority and requirement evidence,
   and emit one non-contradictory resolution packet. It is read-only and cannot invent
   findings, approve code, or edit policy.
12. Orchestrator: pass only the validated consolidated changes to the implementer.
    Never drip individual lens feedback through sequential implementation rounds.
13. After deterministic checks and consolidated fixes pass, freeze the new candidate
    and run one paired residual review generation through fresh-context Sol 5.6 xhigh
    and Opus 5. Novel confirmed findings enter the invariant-extraction workflow;
    known-class findings link to their existing ID. Do not repeat Fable unless the
    original escalation still needs its single allowed focused follow-up.
14. Orchestrator: write the validated resolution and final review to
    `{{TASK_DOCS_DIR}}/{{TASK_ID}}/pr-review.md` or post it through
    `{{PR_REVIEW_COMMAND}}` when requested.

## **Output contract**

- `{{TASK_DOCS_DIR}}/{{TASK_ID}}/pr-review.md` or PR review comment containing findings first, ordered by severity.
- Every finding includes file:line, severity, defect statement, concrete failure scenario, and recommended fix direction.
- A `No findings above threshold` statement when no qualifying findings exist.
- `Open questions` section only for questions that affect correctness, risk, or review disposition.
- `Review coverage` section listing diff range, files/docs inspected, sub-reviews run, and checks not run.
- Exact route evidence for fresh-context `gpt-5.6-sol` at xhigh and
  `claude-opus-5`, including candidate identity and provider/model provenance.
- A Fable escalation disposition of `not_escalated` with rationale or `escalated` with
  the exact trigger, packet identity, and bounded consultation count.
- For proof-required work, machine-readable coverage and resolution packets validate
  against their schemas and match the frozen identity exactly.

## **Verification**

- Reviewer inspected the full diff and surrounding code relevant to each finding.
- Findings are grounded in file:line references.
- Review contains no vague style-only feedback without concrete maintainability or product impact.
- Medium and High tier reviews considered architecture, security, UX, tests, and docs sub-review triggers based on actual diff content; applicable lenses ran in parallel.
- Every source finding is dispositioned exactly once by the validated resolution packet.
- Orchestrator confirms implementer did not self-approve as the sole reviewer.
- Both standard review packets match the same frozen candidate and were produced
  independently before resolver fan-in.

## **Ceremony scaling**

- Simple: paired Sol + Opus general review, findings first, file:line citations, and no
  specialist sub-review unless the diff contains a concrete security, data, or
  architecture trigger.
- Medium: paired Sol + Opus general review plus sub-reviews triggered by diff content;
  test and docs coverage checked explicitly.
- High: paired Sol + Opus review plus applicable specialist reviews against one freeze;
  validated resolver fan-in is required. Fable remains optional and exceptional.

## **Failure handling**

- If the diff cannot be fetched, record the failing command and stop with the exact PR URL or branch needed.
- If a file:line cannot be cited because the issue is cross-file, cite the primary call site or contract file and name the related files in the finding.
- If the review uncovers scope creep or missing spec decisions, stop approval and chain back to `spec` for plan repair.
- For proof-required work, missing design discovered in code review revokes the builder
  packet and returns to `design-proof`; do not decide it inside the review-fix loop.
- If the review uncovers a defect requiring code changes, chain to `implement-tdd` or `debug` with the finding as the implementation contract.
- If no findings exist but verification was not run, state the residual risk in `Review coverage`.
- If either Sol or Opus is unavailable after one transient retry, preserve the
  completed packet, mark the review incomplete, and request explicit user approval
  before any reduced-diversity fallback. Do not silently substitute Fable, Terra, GLM,
  Cursor, or an inherited-context Sol worker.
