# Model Routing Matrix

**Version 0.3 — 2026-07-12.** Model quality, pricing, and availability change; do not
trust bindings older than ~1 quarter without re-verifying. Firm defaults below; the
[complexity rubric](complexity-rubric.md) overrides them (higher tier → stronger model,
more independence). Routing bindings are hypotheses — the **experiment workflow**
(`../workflows/experiment.md`) is how they get validated or rebound, and version bumps
here should cite the experiment that motivated them.

## Prime directives

1. **Fable is the scarcest resource.** It orchestrates, resolves conflicts, makes
   final decisions, and reviews what matters — and does as little else as possible.
   Even bounded architectural exploration (option enumeration, trade-off analysis,
   design-doc drafts) offloads to Codex Sol; Fable reviews the output and decides.
2. **Codex Sol is the workhorse** for heavy, long-horizon, or multi-file work.
3. **Right-size within the Codex family**: Terra for scoped implementation and
   first-pass review; Luna for high-volume light tasks only.
4. **Composer is the speed lane**: bounded builds with clear requirements and
   appropriate context. Requirements clarity is the routing criterion — if the packet
   needs judgment to interpret, it is not a Composer packet.

## Verified routes (all confirmed working in this environment, 2026-07-12)

| Role | Binding | Invocation | Verified how |
|---|---|---|---|
| Orchestrator | Fable (Claude Code main session) | — | this harness |
| Heavy build, multi-file, long-horizon | Codex Sol (`gpt-5.6-sol`) | `codex exec` (config default) | all codex runs 2026-07-08–12 ran on Sol |
| Bounded architectural exploration | Codex Sol | `codex exec` read-only packet; Fable reviews + decides | same |
| Independent review (high-tier diffs), security review, computer-use verification | Codex Sol | codex-review / codex-computer-use patterns | same |
| Scoped implementation, first-pass code review, research sweeps | Codex Terra (`gpt-5.6-terra`) | `codex exec -m gpt-5.6-terra` | smoke + live research run 2026-07-12 |
| High-volume light tasks: summaries, extraction, classification, inventory | Codex Luna (`gpt-5.6-luna`) | `codex exec -m gpt-5.6-luna` | smoke 2026-07-12. **Never** long-context codebase synthesis — documented recall cliff (MRCR 41.3%) |
| Fast bounded builds with clear requirements | Composer 2.5 (`composer-2.5`) | `cursor-agent -p --trust --model composer-2.5` in the target dir; wrap in the composer-implementation worker contract | smoke 2026-07-12, logged in |
| Offloaded web research (zero Claude/Codex tokens) | GLM-5 via `research` skill | skill script | live run 2026-07-12 (note: can time out; Terra `codex exec -c tools.web_search=true` is the fallback) |
| Written content / prose | Claude Sonnet subagent | Agent tool `model: sonnet` | prior runs |
| Frontend design & UX judgment | Impeccable skill on Claude | Skill | plugin installed |
| Audit lens passes | Terra (adversarial/unbiased), Claude for steelman-with-taste; Fable synthesis at High tier | — | — |
| Small in-session lookups | Claude Haiku — only when an external round-trip costs more than it saves | Agent tool | prior runs |

## Pending (decided but not yet built/verified)

| Role | Binding | Status |
|---|---|---|
| Bounded frontend patches | GLM via a shell skill (D1 decision, 2026-07-12) | skill spec at `../skills/glm-frontend-patch/SKILL.template.md`; implementation queued. First use goes through an experiment (GLM vs Composer vs Sol on the same slice). |

## Composer lane rules

- Composer is an agent runtime, not a raw model API — always invoke through the
  worker-contract skill (`../skills/composer-implementation/SKILL.template.md`), never
  ad-hoc. Same packet discipline as Codex: goal, acceptance criteria, read-first,
  avoid-list, verification, report.
- Model IDs: `composer-2.5` (default), `composer-2.5-fast` (throughput variant — costs
  more per token; use only when latency genuinely matters).
- Pro-plan usage is account-pooled with no published numeric limits and possible
  on-demand billing past included usage: keep packets bounded, don't fan out Composer
  arms wide, and treat sustained heavy use as a signal to check the Cursor dashboard.
- CLI subagent model-routing has known inconsistencies (may silently use `-fast`);
  spot-check the dashboard usage records when cost matters.

## Default assignments by task tier

| Tier | Plan | Implement | Review/verify | Audit |
|---|---|---|---|---|
| Simple | orchestrator inline | Composer (clear requirements) or Luna (trivial mechanical) | focused verification + one combined audit | inline |
| Medium | orchestrator; Sol drafts options when the design space is real | Terra (scoped) or Sol (multi-file); Composer when requirements are crisp | Terra first-pass review; independent verifier | one auditor (Terra), three passes |
| High | orchestrator owns plan + synthesis; Sol produces the exploration packet | Sol | Sol independent review + Fable reviews the diff itself | three independent lenses; Fable synthesizes |

## Delegation guardrails (apply to every route)

Bounded task contract and return packet per `AGENTS.md` § Delegation. Subagents never:
run unbounded repo-wide rewrites, make irreversible external changes without
permission, touch secrets, self-approve their own work, or substitute passing tests
for understanding. The implementer is never the sole reviewer. External runtimes
(Codex, Composer, GLM) never commit, push, deploy, or send — the orchestrator inspects
diffs and owns git.

## Escalation triggers (route UP)

- ambiguous conflict between requirements, docs, or reviewers → Fable
- any High-tier dimension discovered mid-task → Fable
- two failed attempts at the same fix by a cheaper route → next tier up
  (Composer/Luna → Terra → Sol → Fable)
- requirements turn out to need interpretation mid-Composer-run → stop, back to
  orchestrator for a tighter packet
- final synthesis of multi-agent output → Fable, always

## Version history

- **0.3 (2026-07-12)** — GPT-5.6 family rebind (Sol/Terra/Luna, all smoke-verified) +
  Composer 2.5 lane (verified headless via cursor-agent) + conservative-Fable prime
  directive (architectural exploration offloads to Sol) + GLM frontend-patch skill
  decided (D1) + experiment workflow named as the matrix's evidence engine.
- **0.2 (2026-07-08)** — Codex-first rebind per user direction; codex exec as the
  canonical delegation surface.
- **0.1 (2026-07-08)** — initial matrix.
