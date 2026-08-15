# Spec Workflow

## **Trigger**

Run when the user asks for planning/specification or when a material product or
architecture ambiguity prevents safe implementation. Do not invoke merely because a
feature is new or multi-file.

## **Inputs**

- User goal and constraints.
- Task-relevant code, contracts, durable docs, and current state.
- Actual consequence/reversibility classification.

## **Steps**

1. Read the requested and directly relevant surface once. Read status/history/task
   docs only when resuming or overlapping tracked work.
2. Perform a breadth-first uncertainty sweep: affected users/systems, entry points,
   existing patterns, dependencies, acceptance criteria, non-goals, rollout/rollback,
   and verification. Keep one decision list.
3. Ask the user only questions whose answers would materially change behavior or a
   difficult-to-reverse decision. Batch them in one message when possible; make
   reasonable reversible assumptions for everything else.
4. Use research or a throwaway prototype only to resolve a named uncertainty. Do not
   create them as automatic phases.
5. Produce the smallest durable artifact the downstream work needs: an inline plan,
   one task plan, a PRD, or issue drafts. Do not require all of them.
6. Add one independent plan review only for genuinely High-risk/irreversible work or
   explicit request. Concurrent specialist lenses return one findings list before one
   revision.
7. Run design-proof only if the plan introduces or materially changes an authority or
   hard-to-reverse boundary. Otherwise hand one implementation batch with acceptance
   criteria and focused/broad verification triggers to `implement-tdd`.

## **Output contract**

- One implementation-usable artifact containing goal, non-goals, acceptance criteria,
  affected surface, decisions, risks, and verification.
- Optional research, prototype, PRD, or issue artifacts only when they resolve a named
  downstream need.
- Proof-required artifacts only when the narrow predicate is met.

## **Verification**

- Every unresolved question materially affects behavior, risk, or scope.
- Downstream implementation can proceed without reinterpreting intent.
- No duplicate artifact restates the same decisions without a consumer.

## **Ceremony scaling**

- Simple/Medium: inline or one short task plan; no mandatory grill, PRD, issue graph,
  audit, or user pause.
- High: one written plan/rollback, one independent review, and proof gate only when the
  authority model changes.

## **Failure handling**

- Missing user-only product decision: report the exact decision and continue any
  independent read-only work.
- Research/prototype contradicts the plan: revise once using the complete evidence set;
  do not restart every planning phase.
- A second novel blocking class triggers one widened uncertainty sweep, not more
  sequential audit rounds.
