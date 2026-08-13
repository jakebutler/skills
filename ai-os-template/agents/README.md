# Subagent Roster

**v1 roster: twelve roles.** Reduced from the twenty candidates in the source notes —
roles that were sub-cases of another role became named invocations instead:

- *type fixer, build-error resolver* → `implementer` receives the complete end-of-batch
  failure set as one correction task when needed
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

## Contracts

Delegate only when leverage exceeds coordination cost. Routine tasks specify goal ·
scope · exclusions · expected result · verification · stop condition. Proof-required,
external, or experimental work adds the heavier provenance it needs.

Routine returns include findings or changes · verification · risks · next action. Do
not require unused artifacts.

**Prohibitions** — no unbounded repo-wide rewrites; no irreversible external changes
without permission; never touch secrets; never self-approve High-risk work; never
substitute passing tests for understanding.

## Roster

| Role | File | Default route (matrix v0.9) | Independence rule |
|---|---|---|---|
| Initializer | `initializer.md` | Codex Sol (codex-implementation pattern) | — |
| Researcher | `researcher.md` | Codex Terra read-only packet; GLM research skill for offloaded web sweeps | — |
| Research consolidator | `research-consolidator.md` | Terra; Sonnet when prose quality warrants the quota | not one of the researchers |
| Implementer | `implementer.md` | Current session by default; bounded worker only when faster or mechanically useful | separate review only for High-risk or uncertain work |
| Frontend designer | `frontend-designer.md` | Impeccable on Sol High for judgment; Composer for crisp build-out; Terra fallback; GLM-5.2 experimental | does not self-approve visual quality |
| Verifier | `verifier.md` | Sol (codex-computer-use for runtime/browser) | independent only when risk/dispute warrants it |
| Reviewer | `reviewer.md` | one fresh-context reviewer when warranted; concurrent specialists for concrete High-risk/proof triggers | all expected lanes finish before one findings fan-in |
| Review resolver | `review-resolver.md` | route-neutral read-only synthesis; Sol owns final disposition | did not design or implement the candidate |
| Invariant extractor | `invariant-extractor.md` | bounded read-only normalization; deterministic writer appends candidates | never promotes active policy or edits product code |
| Auditor | `auditor.md` | Terra and GLM lenses; Fable architecture lens when warranted; Sol synthesis | independent lenses at High tier |
| Doc maintainer | `doc-maintainer.md` | Luna; GLM/Terra fallback | Tier A/B files only |
| Autoskill improver | `autoskill-improver.md` | Terra; Sonnet for language-sensitive proposals | Tier C: staged proposals only, never applied; direct writes limited to Tier B solution docs |

The frontmatter `model:` in each definition file is only the Claude adapter binding.
It is not the complete route. The v0.9 routing matrix is authoritative; family-level
quota failure skips all unavailable-family routes.
