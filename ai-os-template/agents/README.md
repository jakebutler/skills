# Subagent Roster

**v1 roster: ten roles.** Reduced from the twenty candidates in the source notes —
roles that were sub-cases of another role became named invocations instead:

- *type fixer, build-error resolver* → `implementer` invoked by the verify-on-change
  delegating hook with a fix-types/fix-build task
- *route tester, app/browser verification agent* → `verifier` with a browser or route
  scope
- *plan reviewer, strategic plan architect, architecture confirmer* → the orchestrator
  plus `auditor` lenses
- *code architecture reviewer, simplifier/refactor reviewer, PR reviewer* → `reviewer`
  with a named focus
- *web research specialist* → `researcher` (which may offload to the external research
  route per the routing matrix)

Each definition file uses Claude Code agent frontmatter (`name`, `description`,
`tools`, `model`) so it can be dropped into `.claude/agents/` at instantiation.
Model bindings follow `../routing/model-routing.md` — the frontmatter holds the
default; the delegation may override per the rubric.

## Contracts (binding for every role)

**Delegation contract** — every task given to a subagent specifies: goal · repo/paths ·
files to inspect · excluded areas · expected output artifact · allowed tools · model
preference · verification requirement · quality bar · stop condition.

**Return packet** — every subagent ends with: task assigned · files/docs inspected ·
facts found · decisions made · output artifact or patch summary · verification run ·
risks · open questions · recommended next action.

**Prohibitions** — no unbounded repo-wide rewrites; no irreversible external changes
without permission; never touch secrets; never self-approve own work; never substitute
passing tests for understanding.

## Roster

| Role | File | Default route (matrix v0.3) | Independence rule |
|---|---|---|---|
| Initializer | `initializer.md` | Codex Sol (codex-implementation pattern) | — |
| Researcher | `researcher.md` | Codex Terra read-only packet; GLM research skill for offloaded web sweeps | — |
| Research consolidator | `research-consolidator.md` | Sonnet | not one of the researchers |
| Implementer | `implementer.md` | Sol (heavy/multi-file) · Terra (scoped) · Composer 2.5 (bounded, crisp requirements) · Luna (trivial mechanical) | never sole reviewer of own work |
| Frontend designer | `frontend-designer.md` | Impeccable-on-Claude for judgment; Composer/Sol for build-out; GLM patch skill pending | — |
| Verifier | `verifier.md` | Sol (codex-computer-use for runtime/browser) | did not write the code under test |
| Reviewer | `reviewer.md` | Terra first-pass; Sol for high-tier/security; Fable reviews the diff itself at High | independent of implementer |
| Auditor | `auditor.md` | Terra lenses; Claude steelman; orchestrator synthesis at High | independent lenses at High tier |
| Doc maintainer | `doc-maintainer.md` | Luna or Haiku | Tier A/B files only |
| Autoskill improver | `autoskill-improver.md` | Sonnet | proposals only, never applies |

The frontmatter `model:` in each definition file is the Claude-side fallback when the
Codex route is unavailable; the routing matrix (v0.2+) is authoritative.
