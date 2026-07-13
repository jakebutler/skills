# Skills & Plugin Inventory — Verdicts

**Version 0.1 — 2026-07-08.** Based on a full sweep of this repo's `skills/` families
(79 skills across 7 families) plus the installed environment skills. Verdicts:
**keep** (use as-is), **adopt** (wire into the OS), **adapt** (modify then wire),
**merge** (fold into another), **deprecate** (remove from the active path),
**experiment** (evaluate before deciding).

## Families

| Family | Count | Verdict | Rationale |
|---|---|---|---|
| matt-pocock | 7 | **adopt** | The spec backbone (grill → PRD → to-issues → TDD) comes from here. Canonical planning/implementation discipline for the OS. |
| convex | 6 | **keep** | Both first instance repos are Convex-backed. Self-contained vertical; no overlaps. |
| impeccable | 1 (62 files) | **keep** | The frontend design/UX route in the routing matrix. Monolithic but internally progressive; do not modularize in v1. |
| marketingskills | 17 | **keep, fenced** | Lives with the parallel GTM swarm (decision #9). The engineering OS borrows only the product-facing subset via the `docs/gtm/` handoff interface. **Engineering-OS subset for Jake's audit (D9):** `copywriting`, `copy-editing`, `marketing-psychology` (conversion), `onboarding` (UX copy), `site-architecture`, `product-marketing`, `seo-audit`. The other ten (`ai-seo`, `analytics`, `aso`, `content-strategy`, `customer-research`, `emails`, `image`, `launch`, `marketing-ideas`, `social`) stay GTM-swarm-only. |
| bmad | 44 | **dropped** (user decision D2, 2026-07-12) | A complete competing framework — two sources of process truth. Not wired anywhere; remove from auto-activation keyword lists. The auditor role already absorbed its one good idea (adversarial elicitation). Files may stay in the repo as reference; the OS never routes to them. |
| openspec | 3 | **deprecate (from OS path)** | Its proposal→apply→archive SDD pipeline duplicates the spec workflow + task docs. Keep the files; remove from the active toolset. |
| gsd | 1 | **experiment** | Autonomous build orchestrator overlaps with the orchestrator role itself. Evaluate for unattended greenfield builds only (pairs with the optional FEATURE-LIST module). |

## Environment skill dedupe (decision #14)

| Cluster | Canonical | Verdict on the rest |
|---|---|---|
| Grilling | `grill-me` mechanics inside the `/spec` workflow's accelerated grill (5 user + ~20 self-grill with options-considered) | matt-pocock grill variants **merge** into `/spec`; standalone `grill-me` stays for plan stress-tests outside spec work |
| TDD | `tdd` (matt-pocock), wired to the implement-tdd workflow | `test-driven-development` **deprecate** from active use |
| PRD breakdown | `prd-to-issues` (backbone step) | `prd-to-plan` **keep** as the non-GitHub alternative (local plans/ output) |
| Plan write/execute | OS workflow specs + `dev/active/` task docs | `writing-plans`, `executing-plans` **deprecate** from the OS path |
| Brainstorm/elicit | `brainstorming` (installed) | `bmad-brainstorming`, `bmad-advanced-elicitation` **hold** with BMAD |
| Review | harness `code-review` / `verify` / `simplify` + the OS reviewer/verifier agents (Codex routes) | `code-reviewer`, `architect-review` skills **merge** — their stances are absorbed into `agents/reviewer.md` focuses |
| Web research | Codex `codex exec` (routing v0.2) | `research` (GLM-5) **keep** as the alternate route; not deprecated — it burns zero Claude/Codex tokens |
| Session rituals | template workflows commit / commit-pr / wrap-session | `prove`, `publish-slice`, `wrap-session` **keep as repo-specific bindings** — they ARE the Lower dB instance of those workflows; the instance manifest maps to them rather than replacing them |
| Codex delegation | **adopt + generalize**: `codex-implementation`, `codex-review`, `codex-computer-use` (from the lower-db repo-overlay) | These become template-level skills with lower-db specifics parameterized to {{PLACEHOLDER}}s — action item below |
| Prose | `humanizer` **keep** for user-facing writing | — |
| Autoskill | `agents/autoskill-improver.md` (proposals-only) | external autoskill plugin **experiment**. Graduated trust policy (D8, 2026-07-12): staged-only now → auto-apply for low-risk metadata (descriptions, trigger keywords) after ~10 accepted proposals with zero reverts → revisit auto-apply for skill bodies only after that holds. Auto-apply never extends to `AGENTS.md`/`CLAUDE.md`/hooks. |

## Action items

1. ~~Generalize the three codex-* skills~~ — done 2026-07-08; live in `ai-os-template/skills/`.
2. Instance manifests must bind the session-ritual roles to existing repo skills where
   they exist (Lower dB) and to the template workflows where they don't (FreshProof).
3. Remove openspec, writing-plans/executing-plans, and bmad (D2) from any
   auto-activation hook keyword lists so deprecated/dropped paths don't resurrect.
4. Re-run this inventory after both instances ship; promote/demote based on actual use.
5. **Build the GLM frontend-patch shell skill** (D1 choice a): a bounded-patch loop in
   the style of the `research` skill (own venv, Z.ai key, external agentic loop).
   Spec: `ai-os-template/skills/glm-frontend-patch/SKILL.template.md`. First validation
   run should go through the experiment workflow (GLM vs Composer vs Sol on the same
   frontend slice).
