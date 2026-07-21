# Review Convergence Policy

Review is a coverage gate, not an unbounded search for more opinions.

## Design convergence

Proof-required work follows `workflows/design-proof.md`. Production implementation has
no authority until the exact approved builder-packet hash exists.

## Implementation convergence

All reviewers receive the same frozen base, tree/diff identity, approved builder packet,
selected invariants, inventories, and proof plan. Reviews run concurrently and fan into
one validated resolution before remediation.

Acceptance requires:

- generated and reviewer surface inventories reconcile;
- every reachable surface and applicable invariant has a disposition;
- deterministic checks pass against the reviewed snapshot;
- every requirement traces to code and executable evidence;
- no unresolved P0/P1 or blocking conflict remains; and
- one scoped residual adversarial pass finds no new blocking class.

## Forced replan

- The first implementation defect inside the approved design receives one consolidated
  remediation.
- A second candidate review reporting the same root-cause class revokes production-edit
  authority. Local extensions of the old design are prohibited.
- Sol writes a replacement architecture packet, reduces the review unit, and obtains
  fresh architecture and security approval before implementation resumes.
- The replacement requirements matrix must fail for its intended reasons before new
  production code is accepted.
- The same invariant missed on another sibling path is an inventory failure: rebuild and
  recheck the complete sibling set.

Round limits never authorize accepting a known defect. They force a strategy change or
HITL decision.

After the residual adversarial pass, every reproduced novel root-cause class enters
`workflows/extract-invariant.md`. Extraction status is part of closure; the deterministic
writer can append only candidate events and cannot promote blocking policy.
