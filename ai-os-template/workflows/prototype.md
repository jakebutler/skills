# Prototype Workflow

## **Trigger**

This workflow starts when the user invokes `/prototype` or the spec workflow needs to explore UI, a state machine, an interaction, or other uncertain behavior.

## **Inputs**

- The uncertainty to resolve.
- Done-criteria stating the exact question the prototype must answer.
- Workspace: `{{TASK_DOCS_DIR}}/{{TASK_ID}}/prototype/` or an isolated worktree; `{{TASK_DOCS_DIR}}` and `{{TASK_ID}}` are bound by the instance manifest.
- A timebox for building, exercising, and summarizing the prototype.

## **Steps**

1. Orchestrator: frame the uncertainty as one answerable question with done-criteria, workspace, and timebox.
2. `frontend-designer` or `implementer`: build the cheapest thing that answers the question, using Composer for crisp scopes and Codex Sol for exploratory work.
3. `frontend-designer` or `implementer`: exercise the prototype enough to collect evidence against the done-criteria.
4. Orchestrator: write `{{TASK_DOCS_DIR}}/{{TASK_ID}}/prototype.md` with the question, the done-criteria, what was tested, what was learned, the evidence collected, and what must NOT be promoted.
5. Orchestrator: decide whether the question was answered, whether another bounded prototype is justified, or whether the production path should proceed through `implement-tdd` — and append that decision to `prototype.md`.

## **Output contract**

- `{{TASK_DOCS_DIR}}/{{TASK_ID}}/prototype.md`: the question, done-criteria, what was tested, what was learned, evidence, decision, and what must NOT be promoted.
- Throwaway prototype code is clearly quarantined under `{{TASK_DOCS_DIR}}/{{TASK_ID}}/prototype/` or in the named isolated worktree.

## **Verification**

- The stated question is answered with evidence or explicitly declared unanswerable within the timebox.
- Prototype code is visibly quarantined from production paths.

## **Ceremony scaling**

- Simple UI question: one quick design/build pass and a concise prototype summary.
- Behavior-shaping prototype: findings feed the PRD through the spec workflow before implementation.

## **Failure handling**

- Prototype code is NEVER promoted directly to production paths; a winning approach goes through `implement-tdd`.
- Inconclusive prototypes record what evidence, constraint change, or follow-up test would disambiguate the result.
