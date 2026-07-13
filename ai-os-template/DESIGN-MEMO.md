# AI Engineering OS — Template Design Memo

**Version:** 0.2 (2026-07-12)
**Status:** Architecture approved; v0.2 incorporates Jake's walkthrough review (decisions
D1–D12), the GPT-5.6 model family (Sol/Terra/Luna), the Composer lane, conservative
Fable usage, and the experiment workflow.
**Owner:** Jake Butler; orchestrated by Fable

## 1. Purpose

A reusable operating system for AI-assisted software work across repos. It packages
root instruction files, a repo-resident documentation/memory system, workflow specs,
hooks, slash commands, subagent role definitions, and a model routing rubric into a
template that gets *instantiated* into real repos (first: FreshProof, Lower dB; next:
corvo-labs-dot-com).

The point is not ceremony. The point is to preserve momentum while eliminating four
recurring failure modes: repeated context loss, low-quality agent behavior, missed
verification, and inconsistent planning.

## 2. Design principles

1. **Concrete abstraction.** Every recommendation maps to a file, hook, slash command,
   workflow spec, skill, subagent, routing rule, verification gate, or repo convention.
   Nothing ships as advice-only.
2. **Orchestrator, not laborer — and a conservative one.** The orchestrator (Fable)
   owns framing, decomposition, judgment, conflict resolution, and synthesis, and is
   the scarcest resource in the system: spend it only where judgment is genuinely
   required. Bounded architectural exploration (option enumeration, trade-off
   analysis, design-doc drafts) offloads to Codex Sol; Fable reviews and decides.
   Cheaper models do research, drafting, mechanical implementation, verification, and
   doc maintenance under bounded contracts.
3. **Repo-resident memory.** Models forget; the repo persists. Everything an agent needs
   is in the repo or explicitly mapped from it.
4. **Proportional ceremony.** A solo path lighter than a production-team path, but never
   below the floor: inspect before edit, plan proportional to risk, run relevant
   verification, update docs automatically, leave clean handoff state.
5. **Merge, don't bulldoze.** Instantiation adapts to a repo's existing conventions via a
   manifest. The template never silently overwrites or renames what a repo already has.
6. **Claude/Fable-first, Codex-portable.** Harness-neutral content lives in `AGENTS.md`
   (which Codex reads natively); Claude-specific mechanics live in a thin `CLAUDE.md`
   adapter. No abstraction that weakens the Claude v1.

## 3. System architecture

The core operating loop and where each element lives:

| Loop element | Concrete artifact |
|---|---|
| Automations | hooks (`hooks/`), classified by authority (§7.3) |
| Worktrees | worktree conventions in `AGENTS.md` + init workflow |
| Skills | curated inventory (`INVENTORY.md`) + skill activation hook |
| Connectors | tool inventory cache (`.ai/tools.md`) + routing rules |
| Subagents | role definitions (`agents/`) + delegation contract (§7.1) |
| Memory | doc system (§4) + task-local docs + `PROJECT-STATUS.md` checkpoint |

## 4. Documentation layer model

| Layer | File(s) | Ownership & write authority |
|---|---|---|
| Root instructions | `AGENTS.md` (canonical, harness-neutral), `CLAUDE.md` (thin Claude adapter) | Tier C: staged edits only |
| Durable intent | `SPEC.md` — product/architecture intent, stack, major stories, links out | Tier B: guarded automatic |
| Progressive knowledge | `docs/` — feature specs, architecture, data flow, ops, troubleshooting; mapped in `AGENTS.md` | Tier B |
| Solutions knowledge base | `{{DOCS_DIR}}/solutions/` — searchable solved-problem docs with YAML frontmatter | Tier B (autoskill-improver solutions route) |
| Checkpoint | `PROJECT-STATUS.md` — overwritten handoff state, never a ledger | Tier A: fully automatic |
| Ledger | `CHANGELOG.md` — checkpoint/user-facing entries; git history is the commit ledger | Tier A (draft section) |
| Task memory | `dev/active/[task]/` — plan, context, tasks; archived on completion | Task-scoped, disposable |
| Tool cache | `.ai/tools.md` — MCP/command/skill inventory with refresh timestamp | Tier A |
| Optional module | `FEATURE-LIST.json` — greenfield/acceptance-driven builds only; off by default | opt-in |

**Anti-drift rule:** plans live in task docs; *decisions* get promoted to global docs.
Never the reverse. `PROJECT-STATUS.md` holds only the current handoff.

**Anti-churn guardrails for automatic doc edits:**
- Updates fire at checkpoints (session end, commit, compaction) — never per response.
- A significance check gates each write: did behavior, state, or intent actually change?
- Status files are idempotent overwrites, so noise cannot accumulate.
- Every automatic edit records a one-line update reason.

## 5. Workflow backbone

Primary spec flow: `grill-with-docs → PRD → to-issues → TDD implementation`.

Accelerated grill: up to 5 critical user questions → ~20 self-grill questions, each with
options considered and rationale for the selection → batched user review → docs/PRD update.

Research and prototype are subroutines of `/spec` **and** standalone commands.

Standard workflows (specs in `workflows/`): spec, implement-tdd, debug, commit,
commit-pr, review-pr, wrap-session, init, **experiment**. Research and prototype
additionally have standalone specs (`research.md`, `prototype.md`) since they are
callable outside spec. Each spec defines trigger, steps, output contract, verification
requirements, and failure handling.

**Experimentation is first-class methodology** (added v0.2): Jake validates coding
implementations by running the same bounded task across different LLMs/setups,
comparing against identical acceptance checks, and documenting results in a
public-shareable lab notebook. The experiment workflow formalizes this, and it is the
evidence engine for the routing matrix — routing bindings are hypotheses; experiments
confirm or rebind them, with the matrix version citing the experiment.

## 6. Quality system

**Complexity tiers** (full rubric in `routing/complexity-rubric.md`):
- **Simple** — single file, known pattern, easily reversible, no data/security surface.
- **Medium** — multi-file, new behavior, or user-facing.
- **High** — architecture, auth/security/payments/data migration, cross-repo, low
  reversibility, or production rollout. Any single high-risk dimension promotes the
  tier regardless of size.

**Audit lenses by tier:**
- Simple → one combined audit inline (adversarial + steelman + neutral guidance baked in).
- Medium → three lenses as three passes by one cheap auditor subagent.
- High → three lenses as independent subagents; Fable synthesizes.

**Review independence:** the coding agent is never the sole reviewer of its own work.

## 7. Contracts

### 7.1 Delegation contract (every subagent task)
Goal · repo/paths · files to inspect · excluded areas · expected output artifact ·
allowed tools · model preference · verification requirement · quality bar · stop condition.

Subagents must not: perform unbounded repo-wide rewrites, make irreversible external
changes without permission, touch secrets, self-approve their own work, or substitute
passing tests for understanding.

### 7.2 Return packet (every subagent result)
Task assigned · files/docs inspected · facts found · decisions made · output artifact or
patch summary · verification run · risks · open questions · recommended next action.

### 7.3 Hook classification
- **Blocking** (sparse): secrets exposure, client-side model API keys, destructive git
  ops without permission, failed build/typecheck on code changes. Documented local
  override for non-production work.
- **Advisory:** missing docs/tests consideration, error-handling and architecture reminders.
- **Delegating:** too many type errors → fix-types agent; large diff → architecture
  reviewer; frontend diff → UX reviewer; docs drift → doc maintainer.
- **Automatic maintenance:** `PROJECT-STATUS.md`, changelog draft, tool cache, generated docs.

### 7.4 Doc write tiers
- **Tier A** fully automatic: status, tool cache, changelog draft, generated docs.
- **Tier B** guarded automatic: `SPEC.md`, `docs/`, and the autoskill-improver solutions
  docs route — stable facts and links only, with recorded update reason.
- **Tier C** staged for review: skills, `AGENTS.md`, `CLAUDE.md`, hooks. Autoskill
  proposals land as diffs in `dev/skill-proposals/` with evidence; never auto-applied in v1.

## 8. Model routing

Versioned matrix in `routing/model-routing.md`: firm defaults + complexity-rubric
override. Role-based rows (orchestrator, heavy coder, cheap coder, frontend, browser/
research, prose) bound to currently-verified models, with a "pending verification"
section for routes not yet confirmed working. Date-stamped, because model quality and
availability change.

Defaults as of v0.2 (all verified locally 2026-07-12 unless marked): Fable orchestrates
conservatively; **Codex Sol** (`gpt-5.6-sol`) for heavy build work, independent review
of high-tier diffs, browser/computer-use verification, and bounded architectural
exploration; **Codex Terra** (`gpt-5.6-terra`) for scoped implementation, first-pass
code review, and research sweeps; **Codex Luna** (`gpt-5.6-luna`) for high-volume
light tasks — summaries, extraction, inventory — but never long-context codebase
synthesis (documented recall cliff); **Composer** (Cursor sub) for fast bounded builds
with clear requirements (integration path pending verification); GLM via shell skills
for offloaded research and (pending build) bounded frontend patches; Sonnet for prose;
Impeccable-on-Claude for frontend design judgment.

## 9. Template layout

```
ai-os-template/
  README.md               — what this is, how to instantiate
  DESIGN-MEMO.md          — this file
  INVENTORY.md            — skills/plugin keep/adopt/adapt/merge/deprecate verdicts
  root/                   — AGENTS.md and CLAUDE.md templates
  docs-templates/         — SPEC, PROJECT-STATUS, CHANGELOG, feature doc, task docs,
                            optional FEATURE-LIST.json
  workflows/              — the workflow specs (9 core + standalone research and prototype = 11 files)
  commands/               — slash command specs with output contracts
  hooks/                  — hook specs + example settings snippets
  agents/                 — subagent role definitions
  routing/                — model-routing.md, complexity-rubric.md
  instances/
    MANIFEST-SCHEMA.md    — role→file mapping convention for instantiation
```

## 10. Instantiation procedure

1. Run repo recon (codemap + existing docs) → tailoring packet.
2. Write `instances/<repo>/manifest.md` in the target repo mapping template roles to
   the repo's *existing* files (e.g., Lower dB's lowercase `spec.md`/`project-status.md`
   stay; template roles bind to them). Only roles with no counterpart get new files.
3. Merge root instructions: preserve existing content, layer in OS sections, flag
   conflicts rather than resolving silently.
4. Wire hooks/commands appropriate to the repo's stack and verification commands.
5. Land on a feature branch (`ai-os/instance`), commit with clear messages, never main.
6. Promote repo learnings back into the template only when they generalize.

## 11. Decisions record

| # | Decision |
|---|---|
| 1 | `AGENTS.md` canonical + `CLAUDE.md` thin adapter; layered, not mirrored, no generation step |
| 2 | Global docs + `dev/active/` task docs; promote decisions upward, archive task docs on completion |
| 3 | `FEATURE-LIST.json` optional module, off by default; not used in FreshProof/Lower dB v1 |
| 4 | Tiered doc write authority (A/B/C) with anti-churn guardrails |
| 5 | Blocking hooks only for hard safety/correctness failures; advisory/delegating otherwise |
| 6 | Changelog at checkpoint/user-facing granularity; git history is the commit ledger |
| 7 | Research & prototype: embeddable in `/spec` and standalone |
| 8 | Audit lenses scale with complexity tier; any high-risk dimension promotes the tier |
| 9 | GTM stays a parallel swarm; interface via handoff packets in `docs/gtm/`; OS keeps copy/conversion skills |
| 10 | Autoskill edits staged for review; revisit auto-apply for low-risk metadata later |
| 11 | Routing matrix: firm defaults + rubric override, versioned and date-stamped |
| 12 | Generic template first; instances follow; learnings promoted only when general |
| 13 | Instances adopt existing repo conventions via manifest (merge, don't bulldoze) |
| 14 | Duplicate installed skills deduped to one canonical per function in `INVENTORY.md` |

### Second decision round (Jake's walkthrough review, 2026-07-12)

| # | Decision |
|---|---|
| D1 | GLM frontend coding via a shell skill (research-skill style); spec staged, implementation queued; first use validated by experiment |
| D2 | BMAD explicitly dropped — never routed to; files may remain as reference |
| D3 | Routing matrix distribution: canonical copy in the template repo; instances *reference* it in their manifest with a version pin (symlinks rejected — they break on clone/CI/other machines; see MANIFEST-SCHEMA) |
| D4 | FreshProof `FEEDBACK_IMPLEMENTATION_COMPLETE.md` → archive (apply in next instance pass) |
| D5/D6 | Both repos: consolidate to one `plans/` (FreshProof) / `docs/plans/` (Lower dB) with an `archive/` subdirectory (apply in next instance pass) |
| D7 | corvo-labs-dot-com: skip the FEATURE-LIST module |
| D8 | Autoskill: graduated trust — staged-only now; auto-apply low-risk metadata after ~10 accepted proposals with zero reverts; never auto-applies to root instructions/hooks |
| D9 | Marketingskills engineering-OS subset named for audit (7 skills; see INVENTORY) |
| D10 | Instance branches held unpushed while the OS is refined; Lower dB gets the updated template next, then drives the weekly-digest-automation feature work |
| D11 | Hook implementation order: safety pair first, then status/tool-cache, then skill-activation/verify-on-change, delegating-review last |
| D12 | Template commits on branch `ai-os-template/v0.1`, merged via PR |

### v0.2 context additions (same session)

- **GPT-5.6 family** (Sol/Terra/Luna) replaces "GPT-5.5" as the Codex binding; all
  three smoke-verified. Sol also takes bounded architectural exploration to keep
  Fable usage conservative.
- **Composer 2.5** (Cursor Pro sub) added as the fast bounded-build lane, invoked
  headless via `cursor-agent`; wrapped in a worker-contract skill.
- **Experiment workflow** added as a first-class OS component and the routing
  matrix's evidence engine; lab-notebook entry template added for public sharing.

## 12. Out of scope for v1

Plugin packaging (layout stays plugin-compatible), `FEATURE-LIST.json` by default,
autoskill auto-apply, the GTM swarm itself, Codex-native harness port (kept portable,
not built).
