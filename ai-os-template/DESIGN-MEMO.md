# AI Engineering OS — Template Design Memo

**Version:** 0.3 (2026-07-13)
**Status:** Architecture approved; v0.3 rebalances the harness around Codex Sol High
orchestration, quota-aware cross-family fallback, Fable architecture consultation,
GLM-5.2 frontend implementation, and explicit progress visibility.
**Owner:** Jake Butler; orchestrated by Codex Sol High

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
2. **Delegate for leverage.** Codex Sol High owns coherent work by default. It
   delegates only independent slices where parallel speedup, mechanical volume, or
   fresh context outweighs coordination cost. Fable is a scarce consulting route for
   advanced architecture, not an always-on control plane.
3. **Repo-resident memory.** Models forget; the repo persists. Everything an agent needs
   is in the repo or explicitly mapped from it.
4. **Batched proportionality.** Inspect the affected surface breadth-first, implement
   one batch, use focused checks, consolidate any warranted review, then run one broad
   gate. Add artifacts or reviewers only when a downstream consumer or actual risk
   justifies them.
5. **Merge, don't bulldoze.** Instantiation adapts to a repo's existing conventions via a
   manifest. The template never silently overwrites or renames what a repo already has.
6. **Codex-first, harness-portable.** Harness-neutral content lives in `AGENTS.md`.
   Claude-specific mechanics remain in a thin `CLAUDE.md` adapter so Fable and Sonnet
   can be invoked when their lanes add value without owning the whole run.

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
| Task memory | `{{TASK_DOCS_DIR}}/[task]/` — project-bound plan, context, tasks; archived on completion | Task-scoped, disposable |
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

Planning is an explicit entry point, not a mandatory prelude. The spec workflow performs
one breadth-first uncertainty sweep, asks only material user questions, and produces
the smallest downstream artifact needed: inline plan, task plan, PRD, or issue drafts.
Research and prototypes resolve named uncertainties rather than running automatically.

Research and prototype are subroutines of `/spec` **and** standalone commands.

Standard workflows (specs in `workflows/`): spec, **design-proof**, implement-tdd,
debug, commit, commit-pr, review-pr, wrap-session, init, **experiment**. Research and prototype
additionally have standalone specs (`research.md`, `prototype.md`) since they are
callable outside spec. Each spec defines trigger, steps, output contract, verification
requirements, and failure handling.

Design-proof review dispatch is guarded by `scripts/proof-review-preflight.mjs`. Its
canonical `proof-review-state.json` separates semantic authority identity from
review/provenance identity, limits complete candidates to v1/v2/v3 without an explicit
HITL continuation, enforces one current unversioned packet and configured budgets, and
accepts equivalent reviewer transports only when exact model, effort, read-only, auth,
and provider/task-run capture all match. Immutable pre-v0.10 packets remain legacy
read-only evidence under their project verifier.

**Experimentation is first-class methodology** (added v0.2): Jake validates coding
implementations by running the same bounded task across different LLMs/setups,
comparing against identical acceptance checks, and documenting results in a
public-shareable lab notebook. The experiment workflow formalizes this, and it is the
evidence engine for the routing matrix — routing bindings are hypotheses; experiments
confirm or rebind them, with the matrix version citing the experiment.

## 6. Quality system

**Complexity tiers** (full rubric in `routing/complexity-rubric.md`):
- **Simple** — localized, known, easily reversible.
- **Medium** — bounded new behavior whose intent is clear and reversible.
- **High** — actually changes an authority, destructive/external effect, irreversible
  contract, or similarly costly-to-recover behavior. File count, user-facing scope,
  cross-repo coordination, or a sensitive-path label does not promote by itself.

**Review by tier:** Simple and Medium work self-review by default; add one
fresh-context reviewer only when uncertainty warrants it. High work gets one
independent reviewer plus concurrent specialists for concrete diff-triggered risks.
Proof-required work uses its project-bound blocking roles.

Every tier uses breadth-first discovery, one coherent implementation/correction batch,
focused checks during development, and one warranted broad gate at the stable boundary.

## 7. Contracts

### 7.1 Delegation contract
Delegate only when expected parallel speedup or fresh-context value exceeds coordination
cost. Routine packets need goal · scope · exclusions · expected result · verification ·
stop condition. Heavy provenance is reserved for proof/external/experimental work.

Subagents must not: perform unbounded repo-wide rewrites, make irreversible external
changes without permission, touch secrets, self-approve their own work, or substitute
passing tests for understanding.

### 7.2 Return packet
Routine results contain findings or changes · verification · risks · next action. Do
not create unused artifacts.

### 7.3 Hook classification
- **Blocking** (sparse): secrets exposure, client-side model API keys, and destructive
  git ops without permission. An explicitly required failed check remains visible but
  a hook never creates a requirement to run one.
- **Advisory:** missing docs/tests consideration, error-handling and architecture reminders.
- **Delegating:** disabled by default; projects may opt High-risk/proof work into
  concurrent review. Large/frontend diffs alone do not delegate.
- **Automatic maintenance:** `PROJECT-STATUS.md`, changelog draft, tool cache, generated docs.

### 7.4 Doc write tiers
- **Tier A** fully automatic: status, tool cache, changelog draft, generated docs.
- **Tier B** guarded automatic: `SPEC.md`, `docs/`, and the autoskill-improver solutions
  docs route — stable facts and links only, with recorded update reason.
- **Tier C** staged for review: skills, `AGENTS.md`, `CLAUDE.md`, hooks. Autoskill
  proposals land as diffs in `dev/skill-proposals/` with evidence; never auto-applied in v1.

## 8. Model routing

`routing/task-routes.json` is the machine source of truth, validated by
`schemas/task-route-registry.schema.json`; `routing/model-routing.md` is the operating
guide, and `routing/model-evidence.json` records dated claims, authority, recency, and
limitations. The resolver applies the complexity override and refuses silent
substitution.

Defaults as of routing v0.9: **Codex Sol High** (`gpt-5.6-sol`) is the orchestrator and
hard-work route; **Codex Luna Max** (`gpt-5.6-luna`) is the provisional bounded and
mechanical route with narrow paths and deterministic checks; **Codex Terra**
(`gpt-5.6-terra`) is a guarded fallback pending repo-local evaluation; **Composer 2.5**
is an optional crisp bounded frontend route; **Claude Sonnet** writes copy. Routine
review, when warranted, uses one fresh-context reviewer. Proof-required/high-risk
review may add concurrent specialist lanes. **Fable** is only an optional
principal-engineer/architect escalation after a concrete trigger. **GLM-5.2** remains
an installed experimental implementation route.

Provider failures are modeled as state, not improvisation. Quota, auth, or invalid-model
errors mark an entire family unavailable; transient failures get one checkpointed retry;
then the orchestrator selects the next eligible cross-family route. The user sees the
route, phase, evidence path, failure, and takeover. A failed command is never described
as still running.

## 9. Template layout

```
ai-os-template/
  README.md               — what this is, how to instantiate
  DESIGN-MEMO.md          — this file
  PRODUCT.md              — users, purpose, principles, and interface anti-references
  DESIGN.md               — visual and interaction system for walkthrough artifacts
  WALKTHROUGH.html        — interactive system guide and routing failover lab
  INVENTORY.md            — skills/plugin keep/adopt/adapt/merge/deprecate verdicts
  root/                   — AGENTS.md and CLAUDE.md templates
  docs-templates/         — SPEC, PROJECT-STATUS, CHANGELOG, feature doc, task docs,
                            optional FEATURE-LIST.json
  workflows/              — workflow specs (10 core + research, prototype, and invariant extraction = 13 files)
  commands/               — slash command specs with output contracts
  hooks/                  — hook specs; scripts/ai-os-hook.mjs is the executable dispatcher
  agents/                 — subagent role definitions
  routing/                — machine task registry, evidence ledger, operating guide, complexity rubric
  runtime/                — doctor config, generated tool cache, Claude settings template
  skills/                 — Codex, Fable, GLM, and Composer worker contracts
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
4. Vendor shared specs or bind them through `AI_OS_HOME` plus a portable source URL.
   Never install an author's absolute checkout path; root docs must remain usable when
   the optional shared checkout is absent.
5. Vendor the runtime scripts, bind `.ai/ai-os.json`, activate project hooks, run
   `node scripts/ai-os-doctor.mjs --write`, and wire commands appropriate to the repo's stack.
6. Verify no placeholders or host-specific absolute paths survive, with `AI_OS_HOME`
   unset for the fallback check.
7. Land on a feature branch (`ai-os/instance`), commit with clear messages, never main.
8. Promote repo learnings back into the template only when they generalize.

## 11. Decisions record

| # | Decision |
|---|---|
| 1 | `AGENTS.md` canonical + `CLAUDE.md` thin adapter; layered, not mirrored, no generation step |
| 2 | Global docs + project-bound `{{TASK_DOCS_DIR}}/` task docs; promote decisions upward, archive task docs on completion |
| 3 | `FEATURE-LIST.json` optional module, off by default; not used in FreshProof/Lower dB v1 |
| 4 | Tiered doc write authority (A/B/C) with anti-churn guardrails |
| 5 | Blocking hooks only for hard safety/correctness failures; advisory/delegating otherwise |
| 6 | Changelog at checkpoint/user-facing granularity; git history is the commit ledger |
| 7 | Research & prototype: embeddable in `/spec` and standalone |
| 8 | Audit lenses scale with complexity tier; any high-risk dimension promotes the tier |
| 9 | GTM stays a parallel swarm; interface via handoff packets in `docs/gtm/`; OS keeps copy/conversion skills |
| 10 | Historical autoskill staging decision; superseded by D21's permanent proposal/PR-only skill adoption boundary |
| 11 | Routing matrix: firm defaults + rubric override, versioned and date-stamped |
| 12 | Generic template first; instances follow; learnings promoted only when general |
| 13 | Instances adopt existing repo conventions via manifest (merge, don't bulldoze) |
| 14 | Duplicate installed skills deduped to one canonical per function in `INVENTORY.md` |

### Second decision round (Jake's walkthrough review, 2026-07-12)

| # | Decision |
|---|---|
| D1 | GLM frontend coding uses a user-global streamed shell skill with thin repo bindings; implemented 2026-07-14 |
| D2 | BMAD explicitly dropped — never routed to; files may remain as reference |
| D3 | Routing matrix distribution: canonical copy in the template repo; instances reference it with a version pin, portable source URL, optional `AI_OS_HOME`, and a repo-local summary fallback (absolute symlinks and checkout paths rejected; see MANIFEST-SCHEMA) |
| D4 | FreshProof `FEEDBACK_IMPLEMENTATION_COMPLETE.md` → archive (apply in next instance pass) |
| D5/D6 | Both repos: consolidate to one `plans/` (FreshProof) / `docs/plans/` (Lower dB) with an `archive/` subdirectory (apply in next instance pass) |
| D7 | corvo-labs-dot-com: skip the FEATURE-LIST module |
| D8 | Historical autoskill graduated-trust proposal; superseded by D21 before any auto-apply capability shipped |
| D9 | Marketingskills engineering-OS subset named for audit (7 skills; see INVENTORY) |
| D10 | Instance branches held unpushed while the OS is refined; Lower dB gets the updated template next, then drives the weekly-digest-automation feature work |
| D11 | Hook implementation order: safety pair first, then status/tool-cache, then skill-activation/verify-on-change, delegating-review last |
| D12 | Template commits on branch `ai-os-template/v0.1`, merged via PR |
| D13 | Codex Sol High replaces Fable as the primary orchestrator; Fable becomes a scarce architecture/system-design consultation lane |
| D14 | Every role has ordered cross-family fallbacks; quota/auth failures disable the whole family for the task |
| D15 | Historical 2026-07-13 hypothesis: GLM-5.2 preferred for streamed frontend implementation; superseded by D19 after validation |
| D16 | Claude Sonnet owns copy; Fable quota is not spent on routine prose |
| D17 | Historical review-diversity rule, superseded by D20 for implementation and PR code review; its Fable scarcity principle remains active |
| D18 | Status visibility is a contract: start route, phase checkpoints, immediate retry/fallback notice, evidence path, and final route ledger |
| D19 | The first identical-slice experiment rejected GLM as the frontend default; Composer becomes the bounded implementation route, Terra first fallback, and GLM remains experimental behind a ten-minute deadline and automatic takeover |
| D20 | Code review uses two independent standard lanes against one frozen candidate: fresh-context native GPT-5.6 Sol at xhigh and Claude Opus 5. Fable is an optional third principal-engineer/architect escalation only after a concrete trigger and never replaces either lane. |
| D21 | Skill improvement remains proposal/PR-only at every maturity level: validation gates may authorize a reviewable candidate, never direct live-file adoption or merge. Scheduled proposal runs require a separate human activation decision and cannot edit root instructions, hooks, or routes. See `SKILL-IMPROVEMENT.md` v0.2 and epic #2. |
| D22 | Tier B solution learning uses one versioned candidate contract and stable semantic-slug identity. Commit and wrap-session reuse one fingerprint; newer current evidence outranks stale sessions; independent grounding blocks contradicted claims; headless discoverability gaps are report-only. Legacy date-prefixed paths migrate only in reviewed PRs. See `SOLUTION-LEARNING.md` and issue #4. |

### v0.2 context additions (same session)

- **GPT-5.6 family** (Sol/Terra/Luna) replaces "GPT-5.5" as the Codex binding; all
  three smoke-verified. Sol also takes bounded architectural exploration to keep
  Fable usage conservative.
- **Composer 2.5** (Cursor Pro sub) added as the fast bounded-build lane, invoked
  headless via `cursor-agent`; wrapped in a worker-contract skill.
- **Experiment workflow** added as a first-class OS component and the routing
  matrix's evidence engine; lab-notebook entry template added for public sharing.

### v0.3 routing rebalance (2026-07-13)

- Fable exhausted the user's Anthropic subscription quota too quickly when it owned the
  full orchestration loop. Sol High now owns that loop.
- Fable remains valuable as a bounded critic for advanced architecture and system
  design, migration and rollback pre-mortems, harness policy, conflicting-review
  adjudication, and rare flagship positioning critique. It receives compact packets
  rather than repo-wide working context, with at most one critique and one focused
  follow-up per decision.
- On this machine, Codex can launch Fable through `claude -p --model fable` using the
  authenticated Claude Pro login. This is a local external-worker route, not a native
  Codex model binding and not an API-key route. Remote environments must preflight their
  own authentication.
- The first frontend-route experiment is now recorded at
  `experiments/2026-07-14-frontend-route/`. Composer completed fastest and passed the
  full check set; Terra also passed; GLM stayed connected but exceeded ten minutes.
  Composer now owns crisp bounded frontend implementation, Terra is first fallback,
  and GLM remains an experimental route with visible checkpoints and takeover.
- The routing matrix now distinguishes capability escalation from provider failover and
  makes reduced review diversity explicit when a family is unavailable.

## 12. Out of scope for v1

Plugin packaging (layout stays plugin-compatible), `FEATURE-LIST.json` by default,
scheduled skill-proposal activation, and the GTM swarm itself. Direct autoskill
application is rejected by D21.
