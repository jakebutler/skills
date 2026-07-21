# Spec Workflow

## **Trigger**

This workflow starts when the user requests `{{SPEC_COMMAND}}`, asks for a new feature or significant change, a hook delegates an ambiguous task to planning, or another workflow discovers that requirements must be clarified before implementation.

Research and prototype may be called from this workflow, and each may also be invoked as a standalone command when the user asks for research or prototype work directly.

## **Inputs**

- `{{PROJECT_STATUS_FILE}}` exists or the orchestrator records that this is pre-init work.
- `{{SPEC_FILE}}`, relevant files in `{{DOCS_DIR}}/`, and any active task docs in `{{TASK_DOCS_DIR}}/{{TASK_ID}}/` have been read when they exist.
- The orchestrator has the user request, current working directory, relevant constraints, and complexity tier from `{{RUBRIC_LOCATION}}`.
- The project instance exposes its proof-harness binding when the task may be
  `proof_required`.
- The orchestrator has a delegation contract for any subagent it invokes: goal, repo/paths, files to inspect, excluded areas, output artifact, allowed tools, model preference, verification requirement, quality bar, and stop condition.

## **Steps**

1. Orchestrator: confirm `pwd`, read `{{PROJECT_STATUS_FILE}}`, `{{SPEC_FILE}}`, relevant `{{DOCS_DIR}}/` pages, and existing task docs for `{{TASK_ID}}` if present.
2. Orchestrator: classify the task as Simple, Medium, or High using `{{RUBRIC_LOCATION}}`; promote to High for security, data loss, irreversible rollout, or broad blast radius. Independently record whether it is `proof_required`; this is a risk predicate, not another size tier.
3. Orchestrator: open `{{TASK_DOCS_DIR}}/{{TASK_ID}}/plan.md`, `{{TASK_DOCS_DIR}}/{{TASK_ID}}/context.md`, and `{{TASK_DOCS_DIR}}/{{TASK_ID}}/questions.md` for Medium and High tiers; for Simple tier, write the inline plan into `{{TASK_DOCS_DIR}}/{{TASK_ID}}/plan.md` only when the change will continue into implementation.
4. Orchestrator: run the accelerated grill by asking the user up to 5 critical questions only when answers would materially change the plan; otherwise record why no user questions were needed.
5. Orchestrator: run approximately 20 self-grill questions in `{{TASK_DOCS_DIR}}/{{TASK_ID}}/questions.md`; for each question record the question, options considered, selected option, and rationale.
6. Orchestrator: invoke `researcher` through the Codex exploration route when facts, prior art, external docs, libraries, or repo evidence are needed; require a read-only research packet at `{{TASK_DOCS_DIR}}/{{TASK_ID}}/research.md`.
7. Orchestrator: invoke `implementer` through the Codex exploration route for a throwaway prototype only when UI, state-machine, interaction, or uncertain behavior needs exploration; require prototype code or notes under `{{TASK_DOCS_DIR}}/{{TASK_ID}}/prototype/` and a summary in `{{TASK_DOCS_DIR}}/{{TASK_ID}}/prototype.md`.
8. Orchestrator: draft the PRD in `{{TASK_DOCS_DIR}}/{{TASK_ID}}/prd.md` with problem, goals, non-goals, user stories or acceptance criteria, constraints, dependencies, risks, rollout notes, and verification plan.
9. Orchestrator: batch the grill results, selected options, PRD draft, research findings, and prototype summary for user review; pause for user review at Medium and High tiers unless the user explicitly delegated autonomous planning.
10. Orchestrator: update the PRD after user feedback and record unresolved questions in `{{TASK_DOCS_DIR}}/{{TASK_ID}}/open-questions.md`.
11. Orchestrator: invoke `auditor` on the plan. Simple tier gets one combined adversarial, steelman, and unbiased pass; Medium tier gets three passes by one auditor; High tier gets three independent auditor subagents, one lens each.
12. Orchestrator: synthesize audit findings into `{{TASK_DOCS_DIR}}/{{TASK_ID}}/audit.md`, then revise the PRD or record why each finding is accepted, rejected, or deferred.
13. Orchestrator: run the to-issues step by writing independently grabbable issue drafts to `{{TASK_DOCS_DIR}}/{{TASK_ID}}/issues.md`; each issue has scope, acceptance criteria, files likely touched, verification, dependencies, and rollback notes.
14. For `proof_required` work, run `design-proof` before writing an implementation handoff. The canonical JSON packet must validate, architecture and security roles must approve the same exact candidate, and the resolver must produce one approved builder-packet hash. For other work, record `proof_required: false` and the reason.
15. Orchestrator: write the TDD implementation plan to `{{TASK_DOCS_DIR}}/{{TASK_ID}}/tdd-plan.md`, naming the first failing test or executable acceptance check, implementation route, focused verification, broader verification trigger, docs updates, stop conditions, and approved builder-packet hash when required.
16. `doc-maintainer`: update `{{SPEC_FILE}}` and relevant `{{DOCS_DIR}}/` pages only with stable decisions from the accepted PRD; record a one-line update reason for each Tier B edit.
17. Orchestrator: hand off the next slice to `implement-tdd` only after the PRD, issue draft, and TDD plan satisfy the output contract and, when proof-required, the approved builder packet validates.

## **Output contract**

- `{{TASK_DOCS_DIR}}/{{TASK_ID}}/context.md`: source docs/files read, constraints, complexity tier, and routing decisions.
- `{{TASK_DOCS_DIR}}/{{TASK_ID}}/questions.md`: up to 5 user questions asked plus approximately 20 self-grill questions with options considered and selected-option rationale.
- `{{TASK_DOCS_DIR}}/{{TASK_ID}}/research.md`: required only when research runs; includes facts with file:line or URL evidence, confidence, and gaps.
- `{{TASK_DOCS_DIR}}/{{TASK_ID}}/prototype.md` and `{{TASK_DOCS_DIR}}/{{TASK_ID}}/prototype/`: required only when prototype runs; includes what was tested, what was learned, and what must not be promoted.
- `{{TASK_DOCS_DIR}}/{{TASK_ID}}/prd.md`: accepted PRD with problem, goals, non-goals, acceptance criteria, constraints, dependencies, risks, rollout notes, and verification plan.
- `{{TASK_DOCS_DIR}}/{{TASK_ID}}/audit.md`: audit lens results, verdicts, and disposition of findings.
- `{{TASK_DOCS_DIR}}/{{TASK_ID}}/issues.md`: issue drafts that can be copied to `{{ISSUE_TRACKER}}` without reinterpreting scope.
- `{{TASK_DOCS_DIR}}/{{TASK_ID}}/tdd-plan.md`: implementation-ready plan for `implement-tdd`.
- Proof-required tasks: canonical requirements, architecture proof, proof plan, design
  review coverage/resolution, and approved builder-packet hash defined by
  `workflows/design-proof.md`.
- Updated `{{SPEC_FILE}}` or `{{DOCS_DIR}}/` pages only when stable decisions changed durable docs.

## **Verification**

- Orchestrator confirms all required planning artifacts for the selected tier exist or are explicitly marked not applicable (six core: context.md, questions.md, prd.md, audit.md, issues.md, tdd-plan.md; research.md and prototype.md only when those subroutines ran).
- Orchestrator confirms every audit finding has a disposition: accepted, rejected with reason, deferred with owner, or blocked.
- Orchestrator confirms the TDD plan names at least one failing test or executable acceptance check and the exact focused verification command placeholder, such as `{{TEST_COMMAND}}` or `{{ACCEPTANCE_CHECK_COMMAND}}`.
- For proof-required work, the project validator confirms the exact approved builder
  packet before implementation handoff.
- `doc-maintainer` confirms Tier B doc edits contain only stable facts and recorded update reasons.

## **Ceremony scaling**

- Simple: inline or short task-doc plan, no more than 5 user questions only if needed, one combined audit pass, issue drafts optional if the change is a single local slice, focused verification only.
- Medium: full task docs, accelerated grill, PRD, issue drafts, TDD plan, three audit passes by one auditor, independent reviewer required before commit.
- High: full task docs plus rollback plan, independent audit subagents for adversarial, steelman, and unbiased lenses, explicit release and rollback notes, specialist reviewers identified before implementation.

## **Failure handling**

- If user answers are required and unavailable, orchestrator records the blocking questions in `{{TASK_DOCS_DIR}}/{{TASK_ID}}/open-questions.md` and stops before implementation.
- If research contradicts the initial approach, orchestrator revises the PRD or records the rejected path and evidence in `{{TASK_DOCS_DIR}}/{{TASK_ID}}/research.md`.
- If prototype findings invalidate the plan, orchestrator updates the PRD and reruns the relevant audit lens before writing issues.
- If an audit verdict is `rethink`, orchestrator stops workflow chaining until the plan is revised and re-audited.
- If design-proof validation or either required review role fails, stop before
  implementation. Do not downgrade the task or silently substitute a weaker gate.
- If durable repo conventions or recurring traps are discovered, orchestrator delegates Tier B doc updates to `doc-maintainer` and stages Tier C changes only through `dev/skill-proposals/` via `autoskill-improver`.
