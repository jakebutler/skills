# Review Convergence Policy

Review is a bounded defect-discovery pass, not a serial implementation loop.

## Default topology

- Routine reversible work has no mandatory delegated review.
- When independence is warranted, use one fresh-context general reviewer.
- Add specialist lenses only for concrete security, data, UX, architecture, test, or
  operations risk visible in the diff. Run them concurrently against one candidate.
- Proof-required work may bind multiple blocking roles, but every source packet fans
  into one consolidated findings list before remediation.

## Convergence

1. Reviewers inspect the full affected surface breadth-first before returning findings.
2. Freeze all source findings; do not show one reviewer's output to the implementer
   while other expected lanes are still running.
3. Deduplicate and disposition the complete set once.
4. Apply one coherent correction batch and run affected focused checks.
5. Run a targeted residual review only when the correction materially changed
   sensitive logic or a P0/P1 finding remains.

Do not repeat review at commit and again at PR creation when the exact diff and review
evidence are unchanged.

For proof-required design, the executable sequence is `v1` initial candidate, `v2`
one remediation/re-review, then `v3` final replacement or smaller review unit. A `v4`
requires an explicit actor/timestamp/reason/decision-class/new-direction HITL record,
and a repeated unresolved root-cause class fails closed. Prose cannot override the
state machine.

Deterministic packet, mapping, identity, budget, rendered-freshness, and transport
preflight finishes before any reviewer launches. Semantic authority identity is
separate from review/provenance identity, so metadata-only correction does not consume
a semantic review round.

Focused RED/GREEN work precedes one warranted broad confirmation. Final read-only
independent review and exact-head CI may run concurrently. Reviewers reproduce the
focused concern unless a concrete risk justifies the full suite; merge still requires
every bound approval and green exact-head CI.

## Forced reset

A second review that reveals a novel blocking class does not start another drip-fix
round. Stop edits, widen the breadth-first impact inventory once, decide whether the
approved design is still valid, then make one replacement batch. Return to design-proof
only for a new authority/product decision or a contradiction of the approved design;
missing implementation coverage inside that design is a batch finding.

Round limits never authorize accepting a known defect. They prevent unbounded review
spend by forcing one consolidated re-assessment or an explicit risk decision.
