# Implement TDD Workflow

## **Trigger**

This workflow starts when the user requests `{{IMPLEMENT_COMMAND}}`, the spec workflow hands off `{{TASK_DOCS_DIR}}/{{TASK_ID}}/tdd-plan.md`, a hook delegates a bounded implementation task, or another workflow needs a planned change executed test-first.

## **Inputs**

- `{{TASK_DOCS_DIR}}/{{TASK_ID}}/tdd-plan.md` exists for Medium and High tiers, or the orchestrator provides an inline Simple-tier implementation contract.
- For `proof_required` work, the exact approved builder packet and its validated hash
  exist under the bound task-artifact root.
- The implementer has the user request, complexity tier, scoped paths, excluded paths, expected output, and verification commands.
- Relevant source files, tests, docs, and local conventions are readable.
- Repo-specific verification placeholders are known: `{{LINT_COMMAND}}`, `{{TYPECHECK_COMMAND}}`, `{{TEST_COMMAND}}`, `{{BUILD_COMMAND}}`, and any `{{ACCEPTANCE_CHECK_COMMAND}}`.

## **Steps**

1. Orchestrator: confirm the implementation contract includes scope, non-goals, first failing test or executable acceptance check, verification commands, and stop conditions. For proof-required work, run the project proof-harness validator against the live clean repository, regenerate inventory and invariant selection, and reproduce both the baseline tree and approved builder-packet hash before granting production-edit authority.
2. `implementer` through the Codex implementation route: confirm `pwd`, read `{{PROJECT_STATUS_FILE}}` and every file named in scope before editing; read `{{TASK_DOCS_DIR}}/{{TASK_ID}}/tdd-plan.md` when it exists for Medium and High tiers, and use the orchestrator's inline contract for Simple tier.
3. `implementer`: search the scoped code for existing conventions, patterns, helper APIs, fixtures, and tests; record the conventions followed in the return packet.
4. `implementer`: write a failing test first, or define and run an executable acceptance check when the repo has no suitable test harness for the behavior.
5. `implementer`: confirm the failure is relevant to the requested behavior and is not caused by broken setup; if setup is broken, stop and report the setup failure.
6. `implementer`: implement the minimum correct general-purpose change using existing local patterns; do not hard-code for tests, add unnecessary abstractions, widen scope, create workaround scripts, or make an architecture decision absent from the approved builder packet.
7. `implementer`: run the focused verification named in the contract, such as `{{TEST_COMMAND}} -- {{FOCUSED_TEST_TARGET}}`, `{{TYPECHECK_COMMAND}}`, or `{{ACCEPTANCE_CHECK_COMMAND}}`.
8. `implementer`: refactor only when the passing implementation has clear duplication, readability, or local-pattern problems that matter for the scoped change; rerun the focused verification after refactoring.
9. If implementation discovers a missing trust root, reachable effect, sibling path,
   lifecycle behavior, requirement, or required scope expansion, stop production edits,
   invalidate the builder packet, and return to `design-proof`.
10. Orchestrator: decide whether the blast radius requires broader verification. Medium and High tiers: independent verification recorded in verification.md, or a documented reason why not.
11. `verifier`: when independent verification runs, execute scoped checks and affected-flow verification without editing code and write results to `{{TASK_DOCS_DIR}}/{{TASK_ID}}/verification.md`.
12. `doc-maintainer`: update `{{PROJECT_STATUS_FILE}}` and touched Tier B docs only when behavior, state, or intent changed; record update reasons.
13. Orchestrator: review the implementer and verifier return packets; either chain to `commit` or send the one consolidated resolution contract back to `implementer`.

## **Output contract**

- Code and tests changed only inside the implementation contract scope.
- A failing test or executable acceptance check exists in the repo, unless the plan explicitly documents why no durable check can be added.
- `{{TASK_DOCS_DIR}}/{{TASK_ID}}/implementation.md`: implementer return packet with files read, conventions found, changes made, verification commands, results, risks, and open questions.
- Medium and High tiers: independent verification recorded in verification.md, or a documented reason why not.
- Updated `{{PROJECT_STATUS_FILE}}` when the checkpoint changed.
- Updated `{{DOCS_DIR}}/` or `{{SPEC_FILE}}` only when durable behavior or intent changed.

## **Verification**

- The initial test or executable acceptance check failed for the right reason before implementation, or the setup failure is documented and escalated.
- Focused verification passes after implementation.
- Broader verification runs when the blast radius touches shared behavior, user-facing flow, API contracts, data, security, or build/runtime boundaries.
- Medium and High tiers: independent verification recorded in verification.md, or a documented reason why not.
- Orchestrator confirms no unrelated files were edited and no unnecessary abstraction was introduced.

## **Ceremony scaling**

- Simple: inline contract, one failing test or acceptance check, minimum implementation, focused verification, short return packet, status update only if state changed.
- Medium and High tiers: independent verification recorded in verification.md, or a documented reason why not. Medium also requires a written TDD plan, focused implementation, touched docs/status updates, and an independent reviewer before commit.
- High: written TDD plan plus rollback notes, Codex implementation route, specialist reviewer preselected by risk, and full relevant suite or documented release gate before commit.

## **Failure handling**

- If the implementer cannot write a meaningful failing test or acceptance check, it stops and asks the orchestrator to revise the TDD plan.
- If the approved builder packet is missing, stale, or contradicted by reachable code,
  the implementer stops and returns to `design-proof`; it never repairs the packet while
  continuing production edits.
- If the existing test suite or app setup is broken before edits, the implementer records the baseline failure and stops unless the contract explicitly includes fixing that failure.
- If two attempts at the same fix fail, the implementer stops and returns evidence, hypotheses, and recommended next action instead of brute-forcing another attempt.
- If verification fails after implementation, orchestrator sends the smallest actionable finding back to `implementer` or reclassifies the task as `debug`.
- If implementation reveals a durable repo convention or recurring trap, orchestrator delegates Tier A/B docs to `doc-maintainer` and Tier C proposals to `autoskill-improver` under `dev/skill-proposals/`.
