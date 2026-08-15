# Implement TDD Workflow

## **Trigger**

Run when the user asks for test-first implementation or when a behavior change benefits
from an executable regression check. It does not require a prior spec artifact unless
the task is genuinely High-risk or ambiguous.

## **Inputs**

- User request or concise acceptance criteria.
- Task-relevant source, tests, contracts, and repo conventions.
- Focused verification commands and any warranted broad command.
- For proof-required work only, the approved design/builder packet.

## **Steps**

1. Confirm the worktree and preserve unrelated changes. Read user-named and directly
   affected files; read status/task docs only when resuming or overlapping tracked work.
2. Classify by actual consequence and reversibility. File count, user-facing scope,
   cross-repo work, or a sensitive-path label does not promote by itself.
3. Before editing, perform one breadth-first sweep of entry points, callers, sibling
   paths, tests, configuration, contracts, and runtime/build boundaries. Keep one
   impact or defect list and finish the sweep before fixing it.
4. Add the smallest meaningful failing test or executable acceptance check and confirm
   it fails for the intended reason.
5. Implement all confirmed in-scope behavior as one coherent batch using existing
   patterns. Missing implementation paths inside an approved design join this batch;
   only a new design decision or authority-model contradiction returns to design-proof.
6. Run focused checks. If a command reports several failures, collect all of them
   before the next edit.
7. After focused checks pass, run broader verification once only when the actual blast
   radius requires it. A build is reserved for build/runtime/configuration boundaries,
   requested release preflight, or a reproduced build-only failure.
8. If the broad gate fails, collect all failures, make one consolidated correction,
   and run one confirmation after focused checks pass. A third broad run requires a
   concrete affected-boundary reason.
9. Add independent review only for genuinely High-risk work, material uncertainty, or
   explicit user request. Concurrent lenses fan into one findings list before edits.

## **Output contract**

- Scoped code/tests and a concise report of behavior, files, RED/GREEN evidence,
  verification, and residual risk.
- A task artifact only when the task already uses one, is long-running/High-risk, or
  the user requests it.
- Durable docs/status only when behavior, intent, or handoff truth changed.

## **Verification**

- The regression check failed for the intended reason and passes after the batch.
- Focused checks pass.
- At most one warranted broad run plus one consolidated-correction confirmation ran,
  unless a concrete reason for another run is recorded.
- No unrelated files or unnecessary abstractions were introduced.

## **Ceremony scaling**

- Simple/Medium: inline criteria, one impact sweep, one batch, focused checks; no
  mandatory artifact, delegation, or independent review.
- High: written plan/rollback, proof gate only if the authority model changes, one
  independent review, and one relevant broad/release gate.

## **Failure handling**

- Broken baseline: record the exact pre-existing failure; continue only when it does
  not invalidate the focused check or is explicitly in scope.
- Two unsuccessful coherent strategies: stop with the evidence map and missing
  information. Do not count individual edits as separate strategies.
- A genuinely new product/authority decision: return to design-proof. Missing coverage
  inside an approved decision remains in the consolidated implementation batch.
