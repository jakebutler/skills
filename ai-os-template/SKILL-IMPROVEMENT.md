# Skill Improvement Mechanism — Proposal

**Version 0.1 — 2026-07-13.** Sources: Jake's self-improving-loop research doc
(adversarial / steelman / honest / consolidated report drawing on SkillOpt,
SkillOpt-Sleep, the compound-engineering plugin, self-learning-skills, the Loop
Contract framework, and the Loop Maturity Model). Roadmap tracked in
[epic #2](https://github.com/jakebutler/skills/issues/2).

## The one-paragraph verdict

The research is unambiguous on sequencing: capture-and-compound loops work
(+23.5/+24.8 points in SkillOpt's evals; compound engineering in production), but
every dangerous failure mode — validation gaming, skill drift, context bloat, cost
runaway, review-burden shifting — comes from self-application without gates. So v1
is a **capture loop with zero self-application**, and each later phase adds exactly
one capability on top of a stable base. This slots into what the OS already has:
the autoskill-improver agent (proposals-only), D8's graduated trust, Tier C
protection, and the anti-churn rules.

## v1 — Capture & Triage (adopt now)

The autoskill-improver agent grows into a three-route compound step, run at its
existing hook points (commit workflow step, wrap-session step). Per the research:
**one learning per run, maker ≠ checker, headless never edits instructions.**

### Triage routing (from self-learning-skills)

| Lesson shape | Route | Write authority |
|---|---|---|
| Multi-step procedure worth repeating | Skill proposal in `dev/skill-proposals/` with evidence + minimal target diff | Tier C — staged, human-reviewed |
| Durable one-line fact or convention | Proposal for the nearest doc/`AGENTS.md` section | Tier C — staged |
| Solved problem worth finding again | Solution doc in `{{DOCS_DIR}}/solutions/` | Tier B — guarded automatic |
| One-off, task-specific, or already recorded | Skip — explicitly, in the return packet | — |

### Solution docs (the new piece)

`docs/solutions/YYYY-MM-DD-<slug>.md` with YAML frontmatter: `title`, `date`,
`category`, `module`, `tags`, `problem_type`. This makes captured knowledge
searchable by problem shape instead of being a pile of notes — the property the
research identifies as the difference between compounding and bloat. A template
goes in `docs-templates/solution-doc.template.md` at implementation time.

### Anti-bloat rules (adversarial critique, addressed)

- Significance check before capture (already our anti-churn rule): would a future
  agent act differently knowing this? If not, skip.
- One learning per run — no batch dumps.
- Periodic prune: stale solution docs move to `docs/solutions/archive/`; the
  doc-maintainer flags candidates during wrap-session.
- Context injection stays selective: solutions are *searched* when relevant, never
  bulk-loaded into prompts.

### Loop Contract (required before v1 is called done)

| Element | v1 binding |
|---|---|
| Objective | durable lessons captured; zero noise proposals |
| Trigger | commit + wrap-session workflow steps |
| Workspace | working tree (docs) + `dev/skill-proposals/` (staging) |
| Context | the session itself; existing docs to dedupe against |
| Delegation | autoskill-improver proposes; orchestrator/human disposition |
| Verification | proposal has evidence + target diff; solution doc has valid frontmatter |
| State | the staged files themselves |
| Budget | one improver run per checkpoint |
| Escalation | staged proposal (never applied); PR for anything beyond |
| Exit | proposals staged or explicit "none qualified" in the return packet |

### What v1 explicitly does NOT do

No skill edits are applied, ever — not even metadata. No transcript mining. No
scheduled runs. No validation infrastructure. Those are the later phases, gated on
this being stable.

## Roadmap (tracked issues)

| Phase | Issue | Gate to start |
|---|---|---|
| v2 — validation-gated skill edits: held-out set per skill, strict-improvement acceptance, rejected-edit buffer; unlocks D8's metadata auto-apply | [#3](https://github.com/jakebutler/skills/issues/3) | v1 stable, ~10 quality proposals observed |
| v2.5 — grounding validation for solution docs: mechanical claim checks + separate validator agent | [#4](https://github.com/jakebutler/skills/issues/4) | v1 frontmatter structure in use |
| v3 — session-history harvesting: probe-then-extract transcript mining feeding the same triage | [#5](https://github.com/jakebutler/skills/issues/5) | #3 stable |
| v4 — offline evolution: nightly harvest → mine → replay → consolidate, PR-only, budget-capped | [#6](https://github.com/jakebutler/skills/issues/6) | #3, #4, #5 all stable |

A natural validation vehicle already exists: the **experiment workflow**. A skill
version is an arm; the held-out set is the packet; the comparison table is the
gate's evidence. v2 should be built as an application of that workflow, not new
machinery.

## Adjacent adoptions from the research doc (small, separate from this mechanism)

Worth folding into the routing matrix / worker contracts on their own merits:
1. **Pass diffs, not full files** to reviewer agents (long-context pricing + focus).
2. **Prompt cache breakpoints** on GPT-5.6 for repeated codebase reads (~90% input
   discount).
3. **Cross-lineage review** as a High-tier option: have Sol review Fable-planned
   work and vice versa to catch lineage-specific blind spots (our maker≠checker
   rule already implies independence; this adds *lineage* independence).
4. **Quiz-before-merge**: for High-tier changes, the agent quizzes the human on the
   implementation before merge — cheap comprehension insurance.

## Template changes when this proposal is approved

1. `agents/autoskill-improver.md` — add the triage table and solution-doc route.
2. `docs-templates/solution-doc.template.md` — new.
3. `workflows/commit.md` + `workflows/wrap-session.md` — point the autoskill step
   at the triage (one-line edits).
4. `DESIGN-MEMO.md` §7.4 — note the Tier B solutions-doc route.
5. Instance manifests bind `{{DOCS_DIR}}/solutions/` at the next instance pass.
