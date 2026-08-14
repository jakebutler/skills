# Model Routing Matrix

**Version 0.9, 2026-08-13.** `task-routes.json` is the machine source of truth and this
file is its operating guide. Dated source claims live in `model-evidence.json`.
Model quality, pricing, quota, and availability change.
Re-verify bindings older than one quarter. The [complexity rubric](complexity-rubric.md)
can promote a task to a stronger route, but multi-file or user-facing scope alone does
not promote risk or require review.
Bindings are hypotheses; the [experiment workflow](../workflows/experiment.md) is the
evidence loop for changing them.

## Operating decision

1. **Codex Sol at High reasoning is the orchestrator.** It owns framing, task state,
   decomposition, delegation packets, conflict resolution, synthesis, and user updates.
2. **Routine code review is optional and single-lane.** When independence adds real
   value, use one fresh-context reviewer. Proof-required or exceptional High-risk work
   may add diff-triggered specialist lanes concurrently against one frozen candidate.
3. **Fable is an architecture consultant, not a routine code reviewer.** Spend Anthropic
   quota on critique of advanced architecture, system design, and other irreversible
   decisions. Sol prepares a compact decision packet; Fable returns feedback; Sol and
   the user decide.
4. **Codex does most engineering work.** Sol handles hard or long-horizon work. Luna
   is the provisional bounded/mechanical route. Terra is a guarded fallback until
   repo-local evaluations establish a clear advantage over Luna or Sol.
5. **Composer is the bounded frontend implementation default.** The 2026-07-14
   identical-slice experiment completed in 51.05 seconds and passed deterministic and
   browser checks. Terra is the first fallback. GLM-5.2 remains an installed
   experimental route after its streamed arm exceeded the ten-minute cap.
6. **Claude Sonnet is the preferred copy route.** It writes or rewrites product,
   editorial, and marketing copy from a bounded brief. Copy does not consume Fable.
7. **Provider failure is ordinary control flow.** Preserve useful partial work and
   reroute only when the work justifies delegation. Optional reviewer failure does not
   create a new gate; required High-risk lanes fail visibly.

## Route registry

Availability means verified access in this environment, not a promise of remaining
quota. `Conditional` routes require a preflight or a live integration that still needs
to be installed in an instance.

| Route | Family | Best use | Availability note |
|---|---|---|---|
| Codex Sol (`gpt-5.6-sol`), High reasoning | OpenAI/Codex | orchestration, hard builds, synthesis, high-risk verification | verified locally 2026-07-12 |
| Fresh-context Codex Sol (`gpt-5.6-sol`), xhigh reasoning | OpenAI/Codex | independent review for High-risk or unusually uncertain work | launch without implementation-history inheritance when independence is required |
| Codex Sol, Standard reasoning | OpenAI/Codex | focused planning, difficult review, browser/computer-use work | verified locally 2026-07-12 |
| Codex Terra (`gpt-5.6-terra`) | OpenAI/Codex | scoped implementation, research sweeps, user-approved reduced-topology review fallback | verified locally 2026-07-12 |
| Codex Luna (`gpt-5.6-luna`) | OpenAI/Codex | summaries, extraction, classification, inventory | verified locally 2026-07-12; never use for long-context codebase synthesis |
| Claude Opus 5 (`claude-opus-5`) | Anthropic | security/architecture specialist review when the diff warrants cross-family scrutiny | local Claude Code subscription route; pin the exact model for blocking High-risk review |
| Fable | Anthropic | advanced architecture and system-design critique | local Claude Code CLI is authenticated to Claude Pro; quota-limited and local-only unless another environment has explicit auth |
| Claude Sonnet | Anthropic | written copy and steelman review | same local Claude Pro route; quota-limited; do not use as an orchestration fallback unless Codex is unavailable |
| GLM-5.2 (`glm-5.2`) | Z.ai | experimental streamed frontend implementation, user-approved reduced-topology review fallback, offloaded research | runner installed globally; first bounded frontend arm exceeded ten minutes on 2026-07-14, so production routing remains conditional |
| Composer 2.5 (`composer-2.5`) | Cursor | fast bounded implementation with crisp requirements | verified headless 2026-07-12; account-pooled usage |

## Role routes and fallbacks

Fallbacks are ordered. A route from the same unavailable family is skipped. A weaker
route may execute bounded labor, but it never inherits decision authority that its role
does not permit.

| Work | Primary | Fallback 1 | Fallback 2 | Stop rule |
|---|---|---|---|---|
| Orchestration, framing, synthesis | Sol High | Fable, only if Anthropic is available and the user accepts quota use | none | stop for user direction if both Codex and Anthropic are unavailable |
| Routine independent code review | fresh-context native Sol 5.6 xhigh | direct Claude Opus 5 | none | one lane is sufficient; disclose any reroute |
| Proof-required/high-risk review | project-bound independent general + diff-triggered specialist lanes | none automatically | user-approved reduced topology only | run required lanes concurrently and stop if a project-bound blocking lane is unavailable |
| Advanced architecture or system-design feedback | Fable on a compact Sol packet | GLM-5.2 critique, then fresh-context Terra critique | Sol self-critique with an explicit independence caveat | user remains the final gate on irreversible decisions |
| Hard, multi-file, or long-horizon implementation | Sol High | Composer when the packet is crisp | Terra for a bounded compatible slice | stop and re-plan if judgment is required and Codex is unavailable |
| Scoped implementation | Luna Max with narrow paths and deterministic checks | Composer | Sol High | promote to Sol if scope, ambiguity, or risk grows; Terra is a guarded experimental fallback |
| Trivial mechanical work | Luna | Terra | Composer | never give Luna long-context synthesis |
| Frontend implementation | Composer 2.5 for a crisp bounded slice | Terra | Sol High for high complexity; GLM-5.2 only as an explicit experiment | preserve the design packet and acceptance checks across reroutes |
| Frontend design and UX judgment | Impeccable skill on Sol High | Impeccable skill on Fable when a high-value critique gate warrants quota | Impeccable skill on Terra | implementation workers execute the approved direction; they do not self-approve design quality |
| Product, editorial, or marketing copy | Claude Sonnet | Terra for routine copy; Sol Standard for high-stakes copy | GLM-5.2 | preserve voice brief and human approval gate |
| Repo research and feasibility | Sol High | Terra Medium as a bounded fallback | none | use cited evidence; distinguish inference from fact |
| Web research sweeps | GLM research route | Terra with web search | Sol Standard | stop if required sources cannot be verified |
| Runtime and browser verification | Sol Standard | Terra | Composer only for deterministic scripted checks | independence is required only for High-risk or disputed behavior |
| Docs, summaries, inventory | Luna | GLM-5.2 | Terra | significance check still gates doc writes |

## Tracer 7 experimental backend route

Composer is not the general backend default. Tracer 7 is a paired routing-stack
viability test after the proof-required design gate removes unresolved architecture
and security decisions.

- Native control route: one ephemeral `codex exec` process using `gpt-5.6-sol` at high
  reasoning through native Codex subscription access, with multi-agent disabled and
  deterministic prepare/run/finalize evidence under the least-privilege
  `native-proof-builder` permission profile.
- Experimental route: Cursor Agent using only `composer-2.5` through Cursor
  subscription access.
- D0, builder prompt, allowed paths, ignored policy, visible/held-out commands, budgets,
  intervention policy, and review rubric remain identical. Runtime, producer surface,
  authentication path, and model move together as an explicit fixed confound.
- No fallback or silent relabeling is allowed inside either route. Any intervention,
  packet invalidation, prompt change, environment drift, or producer-evidence failure
  is an experiment event and may make the pair non-comparable.
- Reviewers receive neutral labels and may not see model, runtime, producer, transcript,
  duration, or route order before row-level findings and scores are frozen.
- A successful single tracer may establish only provisional viability of the complete
  Composer-on-Cursor route for similar proof-gated slices. It cannot prove Composer
  model superiority, explain speed causally, or establish a universal backend default.

## Review topology

Review is selected by actual risk and uncertainty, not by commit/PR stage.

| Tier | Default review | Additional work |
|---|---|---|
| Simple | self-review of the exact diff | add one fresh-context reviewer only when uncertainty warrants it |
| Medium | self-review; one independent reviewer when behavior is hard to verify or disputed | add only concrete diff-triggered specialist lenses, concurrently |
| High | one independent general reviewer | add concurrent security/data/architecture/UX specialists only where the diff creates that risk |
| Proof-required | project-bound blocking roles against one frozen candidate | fan all roles into one resolution before remediation |

Do not repeat review at commit and again at PR creation when the candidate is unchanged.
When multiple reviewers are expected, keep their source findings separate until all
return, then remediate one consolidated list. Fable is never routine; it remains an
exceptional architecture consultation.

## Fable ROI gate

Fable is eligible only when all of these are true:

1. The decision is durable, high-leverage, or costly to reverse.
2. Sol can provide a compact packet with the decision, constraints, options, evidence,
   and exact questions. Fable does not need to explore the repo from scratch.
3. A strong outside critique could materially change the decision or expose a class of
   risk that the working model family may miss.
4. The response will be recorded in a plan, ADR, review disposition, or routing
   experiment so the quota spend creates reusable value.

For code-review escalation, at least one concrete trigger must also be recorded:

- a load-bearing architecture or system-boundary decision;
- an irreversible or expensive-to-reverse design choice;
- a cross-cutting invariant conflict;
- disagreement between the frozen Sol and Opus packets on an architectural premise; or
- a Sol or Opus finding that exposes a design gap that cannot safely be resolved inside
  the approved implementation contract.

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
routine code review, repeated review passes, and work that acceptance tests can decide.

Budget rule: one critique and, only if necessary, one focused follow-up per decision.
No Fable fan-out. If the first response is sufficient, stop. Fable is not an Opus
fallback: both use the Anthropic family, and they have different jobs.

### Local subscription-backed invocation

When a High-risk cross-family Claude review is warranted, pin Opus 5:

```bash
claude -p --model claude-opus-5 --effort high --permission-mode plan \
  --tools "Read,Grep,Glob,Bash" --no-session-persistence \
  --output-format stream-json --verbose --include-partial-messages \
  < code-review-packet.md
```

Record the provider-returned exact model. The stable `opus` alias is acceptable only
when the result proves it resolved to `claude-opus-5`.

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

When fresh-context Codex independence is required, use a new native Codex context with
`gpt-5.6-sol` at xhigh reasoning. In a collaboration-capable harness, spawn it with no
forked implementation turns. In a CLI-only harness, start a new review process/session
and bind the model explicitly. A same-thread self-review or a Sol worker that inherited
the implementation transcript does not satisfy the lane.

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
For project-bound proof-required roles, one transient retry is allowed; an unavailable
blocking lane leaves that High-risk review incomplete. Optional routine review may use
one eligible route and disclose the reroute.

## Visibility contract

The orchestrator owns status even when another model does the labor.

- At start: report a chosen external/long-running route when the choice matters.
- Report material phase boundaries, not every internal handoff or routine checkpoint.
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
| Simple | current orchestrator inline | current session or a bounded worker when clearly faster | self-review + focused verification |
| Medium | current orchestrator with inline checklist | current session; delegate independent parallel slices only | self-review; one independent reviewer only when uncertainty warrants it |
| High | Sol High owns plan/rollback and synthesis | Sol High; bounded workers only for independent slices | one independent review + concrete diff-triggered specialists + one relevant broad gate |

## Delegation guardrails

Delegate only when expected parallel speedup or fresh-context value exceeds coordination
cost. Routine returns are concise; heavyweight packets/provenance are reserved for
proof-required, external, or experimental work. External runtimes never commit, push,
deploy, publish, or send. The orchestrator inspects diffs and owns git.

## Escalation triggers

- conflicting requirements, docs, or reviewers: Sol High synthesizes and asks the user
  when the choice changes intent
- a recorded principal/architect trigger survives the standard Sol + Opus review:
  compact Fable gate
- two failed quality attempts on a bounded slice: Luna or Composer to Terra, Terra to
  Sol, then stop and re-plan
- Composer discovers ambiguity: stop it and return to Sol for a tighter packet
- provider quota or auth failure: apply the failover protocol, not the quality ladder

## Version history

- **0.9 (2026-08-13):** makes risk semantic rather than file-count based, removes
  mandatory paired review and quiz-before-merge, establishes breadth-first discovery,
  one correction batch, focused feedback, and a one-broad-gate default.
- **0.8 (2026-07-24):** adds a schema-backed task and route registry, dated evidence
  ledger with capped community weight and recency decay, deterministic resolver with
  risk promotion and no silent fallback, doctor/tool-cache generation, and executable
  Claude hook dispatch. Luna becomes the provisional bounded/mechanical route; Terra
  moves to guarded fallback pending repo-local evaluation.
- **0.7 (2026-07-24):** implementation and PR code review now pairs a fresh-context
  native `gpt-5.6-sol` reviewer at xhigh reasoning with direct `claude-opus-5`.
  Fable becomes an optional third principal-engineer/architect consultation with
  explicit triggers and may not replace either standard lane.
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
