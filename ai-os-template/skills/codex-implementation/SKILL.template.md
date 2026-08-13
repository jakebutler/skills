---
name: codex-implementation
description: Delegate a bounded implementation slice to Codex only when parallel speedup, mechanical volume, or fresh context outweighs coordination cost.
---

# Codex Implementation - {{REPO_NAME}}

Use Codex for an independently executable slice with clear acceptance criteria. Small
coherent changes stay in the current session; multi-file scope alone is not a reason to
delegate or split the work.

## Workflow

1. Confirm the active worktree, preserve unrelated changes, and read task-relevant
   source, tests, and governing docs.
2. Perform a breadth-first impact sweep before delegation. Put all confirmed in-scope
   paths and acceptance checks in one concise prompt so the worker does not discover
   and patch the surface incrementally.
3. Name the goal, writable scope, exclusions, observable acceptance criteria, focused
   verification, and stop condition.
4. Run one bounded Codex process. Do not split one coherent change into separate runs
   merely because it touches several files.
5. Inspect the complete diff after the worker exits. Run focused checks, then one broad
   gate only if actual blast radius warrants it.
6. Add independent review only for genuinely High-risk work, material uncertainty, or
   explicit request. All review findings fan in before one correction batch.

## Worker constraints

- `{{PACKAGE_MANAGER_RULES}}`
- `{{REPO_INVARIANTS}}`
- `{{DESIGN_CONSTRAINTS}}`
- `{{ENV_WRAPPER}}`
- Preserve unrelated work; do not commit, stage, push, deploy, send, mutate external
  state, access secrets, or edit global configuration.
- Run no repo-wide check or build unless the prompt explicitly justifies it.
- Return only changed files, behavior, checks, risks, and unresolved questions.

Treat worker output as evidence, not authority. If scope expands or the repo is worse,
stop with the exact diff rather than starting serial repair runs.
