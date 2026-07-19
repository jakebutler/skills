# Model Routing Matrix

**Version 0.6, 2026-07-14.** Model quality, pricing, quota, and availability change.
Re-verify bindings older than one quarter. The [complexity rubric](complexity-rubric.md)
can promote a task to a stronger route, but it cannot remove review independence.
Bindings are hypotheses; the [experiment workflow](../workflows/experiment.md) is the
evidence loop for changing them.

## Operating decision

1. **Codex Sol at High reasoning is the orchestrator.** It owns framing, task state,
   decomposition, delegation packets, conflict resolution, synthesis, and user updates.
2. **Fable is an architecture consultant, not the control plane.** Spend Anthropic
   quota on critique of advanced architecture, system design, and other irreversible
   decisions. Sol prepares a compact decision packet; Fable returns feedback; Sol and
   the user decide.
3. **Codex does most engineering work.** Sol handles hard or long-horizon work, Terra
   handles scoped work, and Luna handles high-volume light work.
4. **Composer is the bounded frontend implementation default.** The 2026-07-14
   identical-slice experiment completed in 51.05 seconds and passed deterministic and
   browser checks. Terra is the first fallback. GLM-5.2 remains an installed
   experimental route after its streamed arm exceeded the ten-minute cap.
5. **Claude Sonnet is the preferred copy route.** It writes or rewrites product,
   editorial, and marketing copy from a bounded brief. Copy does not consume Fable.
6. **Provider failure is ordinary control flow.** Each role has an ordered fallback
   chain, partial work is checkpointed, and a route change never weakens acceptance
   criteria or review requirements.

## Route registry

Availability means verified access in this environment, not a promise of remaining
quota. `Conditional` routes require a preflight or a live integration that still needs
to be installed in an instance.

| Route | Family | Best use | Availability note |
|---|---|---|---|
| Codex Sol (`gpt-5.6-sol`), High reasoning | OpenAI/Codex | orchestration, hard builds, synthesis, high-risk verification | verified locally 2026-07-12 |
| Codex Sol, Standard reasoning | OpenAI/Codex | focused planning, difficult review, browser/computer-use work | verified locally 2026-07-12 |
| Codex Terra (`gpt-5.6-terra`) | OpenAI/Codex | scoped implementation, code review, research sweeps | verified locally 2026-07-12 |
| Codex Luna (`gpt-5.6-luna`) | OpenAI/Codex | summaries, extraction, classification, inventory | verified locally 2026-07-12; never use for long-context codebase synthesis |
| Fable | Anthropic | advanced architecture and system-design critique | local Claude Code CLI is authenticated to Claude Pro; quota-limited and local-only unless another environment has explicit auth |
| Claude Sonnet | Anthropic | written copy and steelman review | same local Claude Pro route; quota-limited; do not use as an orchestration fallback unless Codex is unavailable |
| GLM-5.2 (`glm-5.2`) | Z.ai | experimental streamed frontend implementation, independent review, offloaded research | runner installed globally; first bounded frontend arm exceeded ten minutes on 2026-07-14, so production routing remains conditional |
| Composer 2.5 (`composer-2.5`) | Cursor | fast bounded implementation with crisp requirements | verified headless 2026-07-12; account-pooled usage |

## Role routes and fallbacks

Fallbacks are ordered. A route from the same unavailable family is skipped. A weaker
route may execute bounded labor, but it never inherits decision authority that its role
does not permit.

| Work | Primary | Fallback 1 | Fallback 2 | Stop rule |
|---|---|---|---|---|
| Orchestration, framing, synthesis | Sol High | Fable, only if Anthropic is available and the user accepts quota use | none | stop for user direction if both Codex and Anthropic are unavailable |
| Advanced architecture or system-design feedback | Fable on a compact Sol packet | GLM-5.2 critique, then fresh-context Terra critique | Sol self-critique with an explicit independence caveat | user remains the final gate on irreversible decisions |
| Hard, multi-file, or long-horizon implementation | Sol High | Composer when the packet is crisp | Terra for a bounded compatible slice | stop and re-plan if judgment is required and Codex is unavailable |
| Scoped implementation | Terra | Composer | GLM-5.2 experimental | promote to Sol if scope or ambiguity grows |
| Trivial mechanical work | Luna | Terra | Composer | never give Luna long-context synthesis |
| Frontend implementation | Composer 2.5 for a crisp bounded slice | Terra | Sol High for high complexity; GLM-5.2 only as an explicit experiment | preserve the design packet and acceptance checks across reroutes |
| Frontend design and UX judgment | Impeccable skill on Sol High | Impeccable skill on Fable when a high-value critique gate warrants quota | Impeccable skill on Terra | implementation workers execute the approved direction; they do not self-approve design quality |
| Product, editorial, or marketing copy | Claude Sonnet | Terra for routine copy; Sol Standard for high-stakes copy | GLM-5.2 | preserve voice brief and human approval gate |
| Repo research and feasibility | Terra | Sol Standard | GLM-5.2 | use cited evidence; distinguish inference from fact |
| Web research sweeps | GLM research route | Terra with web search | Sol Standard | stop if required sources cannot be verified |
| Runtime and browser verification | Sol Standard | Terra | Composer only for deterministic scripted checks | verifier must be independent of implementer |
| Docs, summaries, inventory | Luna | GLM-5.2 | Terra | significance check still gates doc writes |

## Tracer 7 experimental backend route

Composer is not the general backend default. Tracer 7 is a paired, provisional test of
whether it can execute most builder work after the proof-required design gate has
removed unresolved architecture and security decisions.

- Control builder route: Cursor Agent model `gpt-5.6-sol-high`.
- Experimental builder route: Cursor Agent model `composer-2.5`.
- Both arms use the same Cursor Agent binary and subscription-backed authentication,
  frozen baseline, byte-identical builder packet and prompt, tool policy, time and
  retry budget, visible checks, held-out evaluation, and review topology.
- Model selection is the only planned independent variable. Any fallback, intervention,
  packet invalidation, prompt change, or environment drift is an experiment event and
  may make the arm non-comparable.
- Architecture and security lenses are completed during the shared design dogfood gate.
  Post-build reviewers remain independent of the builder family and receive blinded
  candidate labels until their findings and scores are frozen.
- No routing-table change follows from one tracer. Evidence may justify only a
  provisional bounded-backend route, with explicit stop conditions and more tracers.

## Review topology

Review routes depend on both task tier and the implementer's family. Different prompts
on the same model are useful, but they are not cross-family independence.

| Tier | Required review | Preferred topology | Anthropic unavailable |
|---|---|---|---|
| Simple | focused verification plus one combined self-audit | orchestrator reviews if it did not implement; otherwise Terra or GLM | Terra or GLM |
| Medium | one independent reviewer plus verifier when behavior is user-facing | prefer a reviewer from a different family than the implementer | GLM reviews Codex work; Terra reviews GLM or Composer work |
| High | two independent review lenses plus verification; specialist lenses as the diff requires | Fable for architecture/system design, plus GLM or a fresh Codex reviewer; Sol synthesizes | GLM plus fresh-context Terra or Sol reviewer; disclose reduced lineage diversity |

The coding agent is never the sole reviewer. A Fable gate is not scheduled for every
High task. It is preferred, subject to availability and the ROI gate, when advanced
architecture, system design, or another durable judgment is the reason the task is
High. Security, data, and release risk can use the appropriate specialist routes
without spending Fable quota unless architectural judgment is also needed.

## Fable ROI gate

Fable is eligible only when all of these are true:

1. The decision is durable, high-leverage, or costly to reverse.
2. Sol can provide a compact packet with the decision, constraints, options, evidence,
   and exact questions. Fable does not need to explore the repo from scratch.
3. A strong outside critique could materially change the decision or expose a class of
   risk that the working model family may miss.
4. The response will be recorded in a plan, ADR, review disposition, or routing
   experiment so the quota spend creates reusable value.

High-ROI Fable uses:

- critique of advanced architecture, system boundaries, data models, and public API
  contracts before implementation becomes expensive
- pre-mortem on migrations, rollout and rollback plans, security boundaries, payments,
  or other low-reversibility changes
- review of the harness itself: agent contracts, prompt policy, routing rules, memory
  ownership, evaluation design, and automation authority
- adjudication when two credible independent reviews conflict on a load-bearing choice
- strategic critique of a flagship public narrative or positioning decision after
  Sonnet drafts it; Fable critiques the strategy, not the sentence-level copy

Low-ROI Fable uses are prohibited by default: routine orchestration, repo recon,
summaries, status updates, mechanical planning, implementation, ordinary copy drafting,
repeated review passes, and work that acceptance tests can decide.

Budget rule: one critique and, only if necessary, one focused follow-up per decision.
No Fable fan-out. If the first response is sufficient, stop. If the Anthropic family is
Limited or Unavailable, use the documented GLM plus fresh-Codex topology instead of
waiting unless the user explicitly asks to wait.

### Local subscription-backed invocation

On the verified local machine, Codex may invoke Fable through the installed Claude Code
CLI and the user's existing Claude Pro login. This does not require an Anthropic API key:

```bash
claude -p --model fable --effort high --tools "" \
  --no-session-persistence --output-format stream-json --verbose \
  --include-partial-messages < decision-packet.md
```

Treat this as an external worker process. Capture stdout to the task artifact directory,
parse the final result, and preserve the exact error on failure. Use stdin in the
eventual skill implementation so large packets are not exposed to shell expansion.

Preflight with `claude auth status` and require `authMethod: claude.ai` or another
explicitly approved credential source. Do not use Claude Code `--bare` for the
subscription route: that mode deliberately skips OAuth and keychain reads and requires
API-key-style credentials. Do not assume the local login exists in Codex cloud, CI, or a
different machine. In those environments, mark Anthropic Unavailable unless a separate
credential path has been configured intentionally.

## Availability and failover protocol

### Provider states

- **Available:** new work may be routed normally.
- **Limited:** conserve the family. Finish current bounded work, do not fan out, and
  route optional work elsewhere.
- **Unavailable:** quota exhausted, authentication failed, provider rejected the model,
  or the route failed its preflight. Skip every model in that family until reset or
  explicit recheck.

### Failure classification

| Failure | Action |
|---|---|
| quota, session limit, billing, authentication, invalid model | mark the family Unavailable immediately; do not retry another model in the same family |
| rate limit with a reliable reset time | mark Limited; checkpoint; wait only if the user asked to wait, otherwise reroute |
| timeout, dropped stream, transient 5xx | retry once on the same route from the last checkpoint; then reroute |
| malformed or incomplete output | request one bounded continuation or repair; then reroute with the partial artifact attached |
| quality failure against acceptance checks | do not treat as provider outage; escalate one capability tier and preserve the failed result as experiment evidence |

### Reroute sequence

1. Save the current delegation packet, partial output, last verified checkpoint, and
   exact error. Never discard a useful partial artifact.
2. Classify the failure and update the family state for the current task.
3. Select the first eligible fallback from the role table, skipping unavailable
   families and routes that violate the task tier.
4. Reuse the same goal, scope, acceptance checks, and stop condition. Add only the
   failure context and checkpoint location.
5. Tell the user which route stopped, why, which route took over, and whether review
   diversity or expected quality changed.
6. Record the route event in the return packet and lab notebook when it is useful
   evidence for a future matrix change.

There is no infinite retry loop. One transient retry and two cross-route fallbacks are
the default maximum for a delegation. After that, Sol stops and presents the evidence.

## Visibility contract

The orchestrator owns status even when another model does the labor.

- At start: report task tier, chosen route, reason, and the next observable checkpoint.
- At every phase boundary: report what completed, artifact path or evidence, next
  owner, and any route change.
- On retry or fallback: report it immediately. A failed command is never described as
  still running.
- For long external generations: use streaming or a pollable process, preserve
  checkpoints, and surface attempt count plus last meaningful progress.
- At finish: report implementation route, reviewers, verification performed, skipped
  checks, fallback events, and residual risk.

For experimental GLM frontend work, streaming is mandatory. The endpoint buffered
non-streamed long responses until completion and caused read timeouts in the
2026-07-13 live run. On 2026-07-14, a streamed bounded arm stayed connected but did not
complete inside ten minutes. The installed runner now enforces a ten-minute total
deadline, 15-second content-free heartbeats, partial-response checkpoints, at most four
continuation rounds, and one transient retry before Composer then Terra takeover.

## Default assignments by task tier

| Tier | Plan and orchestrate | Implement | Review and verify |
|---|---|---|---|
| Simple | Sol High inline, with a compact packet | Luna for trivial work; Composer for crisp frontend; Terra otherwise | focused verification; one combined audit |
| Medium | Sol High; Sol Standard may draft options | Terra or Composer; Sol for multi-file work | one independent reviewer, cross-family when practical; verifier for user-facing behavior |
| High | Sol High owns plan and synthesis; Fable consults only at architecture/system-design gates | Sol High; Composer for a separately bounded frontend slice | two review lenses plus independent verification; Fable only when the durable judgment warrants it |

High-tier ceremony includes a quiz-before-merge: the orchestrator asks the user three
to five pointed questions about the implementation before merge.

## Delegation guardrails

Every route receives the delegation contract and returns the standard packet from
`AGENTS.md`. External runtimes never commit, push, deploy, publish, or send. The Sol
orchestrator inspects diffs and owns git. Pass diffs plus the original plan to reviewers;
they request full files only when needed.

## Escalation triggers

- conflicting requirements, docs, or reviewers: Sol High synthesizes and asks the user
  when the choice changes intent
- advanced architecture or system design needs an outside critic: compact Fable gate
- two failed quality attempts on a bounded slice: Luna or Composer to Terra, Terra to
  Sol, then stop and re-plan
- Composer discovers ambiguity: stop it and return to Sol for a tighter packet
- provider quota or auth failure: apply the failover protocol, not the quality ladder

## Version history

- **0.6 (2026-07-14):** first frontend-route experiment rejects GLM as the default;
  Composer becomes the bounded frontend implementation route, Terra the first
  fallback, and GLM an installed experiment guarded by deadline, heartbeat, partial
  checkpoint, and automatic takeover.
- **0.5 (2026-07-13):** Sol High becomes the primary orchestrator; Fable moves to a
  quota-conserving architecture and system-design consultation lane; GLM-5.2 becomes
  the preferred streamed frontend implementation route; Sonnet owns copy; cross-family
  fallback, review topology, provider state, retry limits, and status visibility are
  explicit.
- **0.4 (2026-07-13):** diff-passing, cache tactics, cross-lineage review, and
  quiz-before-merge.
- **0.3 (2026-07-12):** GPT-5.6 family, Composer lane, conservative Fable usage, GLM
  frontend skill decision, and experiment workflow.
- **0.2 (2026-07-08):** Codex-first delegation through `codex exec`.
- **0.1 (2026-07-08):** initial matrix.
