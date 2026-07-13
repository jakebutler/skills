# Implement TDD Workflow

## **Trigger**

This workflow starts when the user requests `{{IMPLEMENT_COMMAND}}`, the spec workflow hands off `{{TASK_DOCS_DIR}}/{{TASK_ID}}/tdd-plan.md`, a hook delegates a bounded implementation task, or another workflow needs a planned change executed test-first.

## **Inputs**

- `{{TASK_DOCS_DIR}}/{{TASK_ID}}/tdd-plan.md` exists for Medium and High tiers, or the orchestrator provides an inline Simple-tier implementation contract.
- The implementer has the user request, complexity tier, scoped paths, excluded paths, expected output, and verification commands.
- Relevant source files, tests, docs, and local conventions are readable.
- Repo-specific verification placeholders are known: `{{LINT_COMMAND}}`, `{{TYPECHECK_COMMAND}}`, `{{TEST_COMMAND}}`, `{{BUILD_COMMAND}}`, and any `{{ACCEPTANCE_CHECK_COMMAND}}`.

## **Steps**

1. Orchestrator: confirm the implementation contract includes scope, non-goals, first failing test or executable acceptance check, verification commands, and stop conditions.
2. `implementer` through the Codex implementation route: confirm `pwd`, read `{{PROJECT_STATUS_FILE}}`, `{{TASK_DOCS_DIR}}/{{TASK_ID}}/tdd-plan.md`, and every file named in scope before editing.
3. `implementer`: search the scoped code for existing conventions, patterns, helper APIs, fixtures, and tests; record the conventions followed in the return packet.
4. `implementer`: write a failing test first, or define and run an executable acceptance check when the repo has no suitable test harness for the behavior.
5. `implementer`: confirm the failure is relevant to the requested behavior and is not caused by broken setup; if setup is broken, stop and report the setup failure.
6. `implementer`: implement the minimum correct general-purpose change using existing local patterns; do not hard-code for tests, add unnecessary abstractions, widen scope, or create workaround scripts.
7. `implementer`: run the focused verification named in the contract, such as `{{TEST_COMMAND}} -- {{FOCUSED_TEST_TARGET}}`, `{{TYPECHECK_COMMAND}}`, or `{{ACCEPTANCE_CHECK_COMMAND}}`.
8. `implementer`: refactor only when the passing implementation has clear duplication, readability, or local-pattern problems that matter for the scoped change; rerun the focused verification after refactoring.
9. Orchestrator: decide whether the blast radius requires broader verification; for Medium and High tiers, delegate to `verifier` through the Codex verification route when behavior, browser, CLI, API, or integration flow needs independent exercise.
10. `verifier`: run scoped checks and affected-flow verification without editing code; write results to `{{TASK_DOCS_DIR}}/{{TASK_ID}}/verification.md` for Medium and High tiers.
11. `doc-maintainer`: update `{{PROJECT_STATUS_FILE}}` and touched Tier B docs only when behavior, state, or intent changed; record update reasons.
12. Orchestrator: review the implementer and verifier return packets; either chain to `commit` or send precise findings back to `implementer`.

## **Output contract**

- Code and tests changed only inside the implementation contract scope.
- A failing test or executable acceptance check exists in the repo, unless the plan explicitly documents why no durable check can be added.
- `{{TASK_DOCS_DIR}}/{{TASK_ID}}/implementation.md`: implementer return packet with files read, conventions found, changes made, verification commands, results, risks, and open questions.
- `{{TASK_DOCS_DIR}}/{{TASK_ID}}/verification.md`: required for Medium and High tiers; includes independent verifier transcript, claims confirmed/refuted, skipped checks, and reasons.
- Updated `{{PROJECT_STATUS_FILE}}` when the checkpoint changed.
- Updated `{{DOCS_DIR}}/` or `{{SPEC_FILE}}` only when durable behavior or intent changed.

## **Verification**

- The initial test or executable acceptance check failed for the right reason before implementation, or the setup failure is documented and escalated.
- Focused verification passes after implementation.
- Broader verification runs when the blast radius touches shared behavior, user-facing flow, API contracts, data, security, or build/runtime boundaries.
- Medium and High tiers have independent verification or a documented reason independent verification was impossible.
- Orchestrator confirms no unrelated files were edited and no unnecessary abstraction was introduced.

## **Ceremony scaling**

- Simple: inline contract, one failing test or acceptance check, minimum implementation, focused verification, short return packet, status update only if state changed.
- Medium: written TDD plan, focused implementation, independent verifier for affected flow, touched docs/status updates, independent reviewer before commit.
- High: written TDD plan plus rollback notes, Codex implementation route, independent verifier, specialist reviewer preselected by risk, full relevant suite or documented release gate before commit.

## **Failure handling**

- If the implementer cannot write a meaningful failing test or acceptance check, it stops and asks the orchestrator to revise the TDD plan.
- If the existing test suite or app setup is broken before edits, the implementer records the baseline failure and stops unless the contract explicitly includes fixing that failure.
- If two attempts at the same fix fail, the implementer stops and returns evidence, hypotheses, and recommended next action instead of brute-forcing another attempt.
- If verification fails after implementation, orchestrator sends the smallest actionable finding back to `implementer` or reclassifies the task as `debug`.
- If implementation reveals a durable repo convention or recurring trap, orchestrator delegates Tier A/B docs to `doc-maintainer` and Tier C proposals to `autoskill-improver` under `dev/skill-proposals/`.
