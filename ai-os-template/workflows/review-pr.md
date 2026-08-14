# Review PR Workflow

## **Trigger**

Run when the user asks for review or when actual High-risk/uncertain behavior warrants
independent review. Do not invoke automatically for every commit or PR.

## **Inputs**

- Exact PR/base/head/diff and acceptance criteria.
- Task-relevant contracts, tests, docs, and invariants.
- Proof packet only when the change is proof-required.

## **Steps**

1. Resolve the exact candidate and review scope. Freeze identity only when concurrent
   or proof-required lenses need a shared candidate.
2. Read the complete diff and enough surrounding code to inspect affected entry points,
   callers, sibling paths, configuration, contracts, retries, recovery, and
   runtime/build boundaries before issuing findings.
3. Use one fresh-context general reviewer when independence is warranted. Add
   specialist lenses only for concrete diff-triggered risk and run them concurrently.
   Routine review does not require paired model families.
4. Each reviewer returns findings first with severity, file/line, concrete failure
   scenario, and fix direction.
5. Freeze all expected source findings, deduplicate/disposition them once, and pass one
   actionable list to the implementer. Never drip feedback through serial rounds.
6. After one correction batch and focused checks, run a targeted residual review only
   when sensitive logic materially changed or a P0/P1 remains.
7. Return to design-proof only for a genuinely new product/authority decision or a
   contradiction of the approved design. Missing implementation coverage inside that
   design remains a batch finding.

## **Output contract**

- Findings first, ordered by severity; or `No findings above threshold`.
- Coverage, checks omitted, open correctness questions, and residual risk.
- One consolidated packet only when multiple lenses actually ran.

## **Verification**

- Full diff and relevant surrounding code were inspected.
- All expected reviewer output arrived before remediation.
- Every consolidated finding has one disposition.
- Review was not duplicated for an unchanged candidate.

## **Ceremony scaling**

- Simple/Medium: one reviewer only when independence adds value; no specialist fan-out
  by default.
- High: one independent reviewer plus concurrently run, concrete risk-triggered
  specialists. Proof-required projects may bind multiple blocking roles.

## **Failure handling**

- Unavailable optional reviewer: continue without it and disclose the gap.
- Unavailable required High-risk/proof reviewer: preserve completed output and stop for
  the applicable risk decision; do not silently relabel another route.
- A second novel blocking class triggers one widened breadth-first audit before more
  edits, not another drip-fix loop.
