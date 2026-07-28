# Skill Improvement Mechanism — Plan of Record

**Version 0.2 — 2026-07-28.** Roadmap tracked in
[epic #2](https://github.com/jakebutler/skills/issues/2).

This version refreshes the original capture-first proposal against:

- Microsoft SkillOpt and SkillOpt-Sleep at
  `8304e6c3eceae36bc595e58a34b4a422ae6b2d4f`;
- EveryInc `compound-engineering-plugin` / `ce-compound` at
  `a9f6d530d4446d805a3100387dedd86268d7e695`;
- the installed AI OS v0.8 proof-harness, routing, experiment, and document-write
  contracts.

Pinned upstream evidence, license data, adopted concepts, deferred concepts, and
recheck policy belong in
[#15](https://github.com/jakebutler/skills/issues/15). Upstream benchmark claims are
context, not local acceptance evidence.

## Verdict

AI OS should use `ce-compound` to harden **knowledge capture** and SkillOpt to
discipline **skill promotion**. It should not import either system wholesale.

The learning lifecycle is:

```text
verified episode
  -> grounded learning
  -> bounded candidate skill patch
  -> immutable eval pack
  -> strict held-out validation gate
  -> independent review and resolution
  -> draft PR
  -> human adoption
  -> revalidation when model, harness, tools, evaluator, or source evidence changes
```

The current v1 capture-and-triage behavior remains the baseline, but it is not
trustworthy optimizer input until grounded compounding in #4 ships.

## Decisions

### Adopt from `ce-compound`

- Exactly one verified, non-trivial learning per run; zero is a valid explicit
  outcome.
- Separate bug and reusable-knowledge tracks.
- Stable semantic document identity rather than date-prefixed duplicate files.
- Five-dimensional overlap assessment: problem, root cause, solution, referenced
  files, and prevention rules.
- High overlap updates in place; moderate overlap remains distinct and creates only
  a narrow refresh recommendation.
- Mechanical claims validation plus independent semantic grounding.
- Current-tree evidence and newer explicit user corrections outrank older
  transcript or memory material.
- Research workers use run-scoped scratch artifacts; the orchestrator is the only
  tracked-file writer.
- Solution knowledge is discoverable from lean root instructions and retrieved
  selectively rather than bulk-loaded.
- Session history uses a cheap metadata probe before bounded extraction.
- Headless and lightweight flows never edit root instruction files.

### Adopt from SkillOpt

- Treat a skill document as versioned external state for a frozen target agent.
- Generate bounded structured add/delete/replace patches rather than relying on
  unconstrained full rewrites.
- Learn from successful and failed trajectories.
- Deduplicate edits and enforce a textual learning-rate/edit budget.
- Preserve rejected edits as negative evidence.
- Use disjoint train, validation, and untouched test sets.
- Accept only strict primary improvement after all blocking invariants pass.
- Keep current, best validation-selected, final attempted, and untouched-test
  checkpoints distinct.
- Delay slow/meta longitudinal consolidation until ordinary bounded updates show
  stable local improvement.

### AI OS additions

- Freeze Git tree, candidate, scope, evaluator, splits, actual provider/model/harness
  routes, tools, and permissions for every decision.
- Gate lexicographically: blocking invariants, then correctness outside the noise
  band, then cost/latency/tokens/review burden.
- Require evaluator self-tests and calibration proportional to evaluator risk.
- Invalidate or revalidate evidence on material model, harness, tool-surface,
  permission, evaluator, schema, corpus, or referenced-workflow change.
- Review transcript-derived tasks before any real provider receives them.
- Run offline replay in a disposable clean worktree or equivalent isolated root.
- Enforce budgets before calls rather than merely reporting usage afterward.
- Promote only through a staged proposal or draft PR; never overwrite or merge live
  files automatically.

### Defer or reject

- Importing the full `ce-compound` monolith.
- Assuming SkillOpt benchmark gains transfer to AI OS without local evaluation.
- Using validation examples as untouched milestone test evidence.
- Letting a weighted score trade away correctness or a blocking invariant.
- Full-history transcript extraction without a relevance hit.
- Sending unreviewed transcript-derived content to a provider.
- Treating regex redaction as a guarantee that evidence is secret-free.
- Treating configured counters as hard budgets without pre-call enforcement.
- Replaying in the user's dirty working tree.
- SkillOpt-Sleep-style direct live-file adoption or any `auto_adopt` equivalent.
- Auto-merge, production deployment, provider/account mutation, or self-editing root
  instructions.
- Following mutable upstream `main` branches as production dependencies.

## Existing baseline — v1 capture and triage

The current template already provides:

- a significance check;
- one-learning triage into skill proposal, documentation proposal, solution
  knowledge, or explicit skip;
- Tier C staging for skills, `AGENTS.md`, `CLAUDE.md`, hooks, and routes;
- guarded Tier B solution-document writes;
- commit and wrap-session integration;
- no skill self-application.

Until #4 ships, v1 solution documents retain their current guarded status but must
not be treated as validated training/evaluation truth.

## Roadmap

| Phase | Issue | Gate to start | Primary output |
|---|---|---|---|
| v1.1 — grounded compounding | [#4](https://github.com/jakebutler/skills/issues/4) | current v1 baseline | schema-valid, deduplicated, grounded solution knowledge |
| v2 — immutable eval packs and strict gate | [#3](https://github.com/jakebutler/skills/issues/3) | #4 accepted | reproducible acceptance/rejection packets |
| v2.1 — bounded optimizer pilot | [#14](https://github.com/jakebutler/skills/issues/14) | #3 and #4 accepted | local evidence on 2–3 objective skills; proposal/PR only |
| v3 — review-gated transcript harvesting | [#5](https://github.com/jakebutler/skills/issues/5) | #3, #4, and #14 accepted | redacted reviewed candidate tasks/learnings |
| v4 — supervised offline evolution | [#6](https://github.com/jakebutler/skills/issues/6) | #3, #4, #14, #5, and #15 stable | isolated bounded runs producing draft PRs |
| maintenance — upstream method registry | [#15](https://github.com/jakebutler/skills/issues/15) | may run alongside #4 | immutable source evidence and review-needed signals |

Issue bodies are implementation handoffs. Each contains expected artifacts,
acceptance criteria, required positive/negative fixtures, non-goals, stop
conditions, and verification expectations.

## v1.1 — grounded compounding

[#4](https://github.com/jakebutler/skills/issues/4) upgrades capture before any
optimization begins.

Required properties:

1. Bug and knowledge tracks validate against a versioned schema.
2. Semantic slugs remain stable; `date` and `last_updated` carry time.
3. A deterministic learning fingerprint makes commit and wrap-session idempotent.
4. High-overlap knowledge updates in place.
5. Mechanical validation catches frontmatter, placeholder, path, link, and evidence
   problems.
6. An independent semantic validator checks code behavior and live merge state.
7. Headless flows report instruction discoverability gaps without editing
   instructions.
8. Root instructions mention the solution store minimally; retrieval stays
   selective.
9. Existing date-prefixed documents receive an explicit migration plan rather than
   silent renames.

This phase may maintain a repo's existing `CONCEPTS.md` only for domain terms directly
grounded by the captured learning. It does not bootstrap a broad glossary.

## v2 — immutable skill evaluation

[#3](https://github.com/jakebutler/skills/issues/3) builds optimizer-independent
evaluation infrastructure.

Every eval pack binds:

- base and candidate hashes;
- frozen commit/tree and allowed scope;
- actual target and optimizer execution routes;
- evaluator identity and self-tests;
- disjoint train, validation, and untouched test identities;
- split seed and provenance;
- objective checks and blocking invariants;
- cost, token, latency, intervention, and review-burden measures;
- current, best-selected, final, and test checkpoint identities;
- stop reason, residual risk, and human disposition.

The pack becomes immutable when execution starts. Any change creates a new identity
and invalidates prior results.

Acceptance order is:

1. all blocking invariants pass;
2. primary correctness strictly improves outside the measured noise band;
3. secondary efficiency and review measures rank otherwise passing candidates.

Ties and regressions reject. An identical rejected candidate under the same packet
short-circuits without spending evaluation budget again.

## v2.1 — bounded optimizer pilot

[#14](https://github.com/jakebutler/skills/issues/14) tests candidate generation only
after the gate exists.

- Select two or three recurring, objective skills with real headroom.
- Analyze success and failure trajectories.
- Propose structured patches with a hard one-to-four-edit budget.
- Deduplicate edits and preserve rejected/unmatched edits.
- Compare the current skill, bounded optimizer, strong one-shot rewrite, and
  no/minimal-skill baseline where meaningful.
- Use the same frozen route, tasks, budgets, and evaluator across arms.
- Record repeated-run noise, review burden, and intervention/remediation time.
- Produce a proposal or draft PR only.

A flat or negative experiment is an acceptable honest outcome. External benchmark
gains do not satisfy this phase.

## v3 — review-gated session-history harvesting

[#5](https://github.com/jakebutler/skills/issues/5) adds historical evidence without
adding another durable-state owner.

```text
local read-only discovery
  -> metadata relevance gate
  -> bounded extraction
  -> best-effort-redacted staging with reviewed:false
  -> human review/redaction
  -> existing #4/#3/#14 intake paths
```

Default scope is the invoked repo/workspace. The current session is excluded. No
relevance hit is a successful bounded no-op. A real provider may not receive
transcript-derived material before the staged artifact is explicitly reviewed.

Live-capture/harvest duplicates collapse by learning identity and provenance. Current
source evidence and newer explicit corrections outrank stale transcript material.
Conflicts remain staged for human disposition.

Hard budgets cover sessions, bytes, tasks, provider calls, input/output tokens,
wall-clock time, and supported monetary spend. Dry-run does not advance durable
harvest state.

## v4 — supervised offline evolution

[#6](https://github.com/jakebutler/skills/issues/6) is the final implementation phase,
not an automatic activation decision.

Runs require reviewed tasks, an immutable eval pack, allowlisted targets, proven
routes, hard budgets, a frozen clean base, a run nonce, and a named human gate before
provider calls.

Replay occurs in a disposable isolated root. Synthetic/dream examples may augment
training only. Validation selects; untouched test measures milestones. Bounded edits
pass through the v2 gate and independent review, then produce a draft PR.

Hard budgets include calls, tokens, time, cost, tasks, rollouts, optimizer rounds,
edits, remediation generations, diff size, and review-packet size. When the next
operation would exceed a limit, the run stops first and emits a truthful partial
receipt.

Scheduling may be considered only after several supervised runs complete with zero
unauthorized writes, budget overruns, provenance failures, or reverts. Scheduler
activation requires a separate explicit human decision and never includes merge or
production authority.

## Upstream method maintenance

[#15](https://github.com/jakebutler/skills/issues/15) adds a source registry separate
from model-routing evidence.

Each entry records:

- canonical URL and immutable ref;
- license and attribution requirements;
- upstream claims versus local reproduction;
- adopted, deferred, and rejected concepts;
- safety/privacy/isolation/budget limitations;
- local artifact and issue bindings;
- last-reviewed date, owner, and recheck triggers.

A read-only scheduled check may open or refresh one review issue when a newer upstream
source appears. It never vendors code or updates AI OS behavior automatically.

## Hard invariants

1. Maker is not checker.
2. Live capture, harvest, recovery, and offline replay feed one durable-state path.
3. Candidate, tree, scope, evaluator, splits, and actual routes are frozen for a
   decision.
4. Blocking invariants and correctness cannot be traded for speed or cost.
5. Validation selection and untouched testing remain separate.
6. Intended routes are not evidence; actual provider/model/harness provenance is
   required.
7. Headless execution never mutates root instructions, skills, hooks, or routes.
8. Passing gates produce proposals or draft PRs, never live adoption or merge.
9. Budgets are enforced before the next operation.
10. Transcript-derived evidence is reviewed, redacted, retention-bounded, and treated
    as sensitive.
11. Repeated root-cause failures force a smaller unit or redesign.
12. A HITL checkpoint does not authorize the next phase, scheduling, deployment, or
    production mutation.

## Common artifact and verification contract

Implementation must produce versioned, inspectable artifacts rather than relying on
session prose:

- schemas and templates;
- positive and adversarial negative fixtures;
- deterministic candidate/tree/packet hashes;
- actual route provenance;
- accepted, rejected, and unmatched dispositions;
- budget and stop receipts;
- reviewer/resolver records;
- revalidation triggers;
- migration and rollback instructions.

Each implementation PR reports:

- exact validation commands and results;
- skipped checks and reasons;
- known environment/account boundaries;
- changed-file scope;
- residual risk;
- whether evidence is fixture-only, deterministic rehearsal, or account-specific real
  execution.

Green tests without frozen identity, coverage, provenance, or residual-risk accounting
do not satisfy a high-risk phase.

## Completion and activation

The skill-improvement epic is implemented only when #4, #3, #14, #5, #6, and #15
close with their required evidence and this document reflects installed behavior.

Implementation does not activate scheduled proposal runs. Scheduling remains a
separate human decision after the supervised maturity gate.
