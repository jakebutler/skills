# Proof Harness and Composer-on-Cursor vs Native-Sol Routing-Stack Experiment

**Status (2026-07-19):** generic template implementation is authorized and in progress
in this task. The contracted design-gate slice, surface-driven invariant retrieval,
immutable design/builder identities, review fan-in contracts, and append-only candidate
capture are implemented with focused fixtures. The TypeScript/Convex inventory adapter,
full resolution validator, rendered-view freshness checks, and broader workflow/hook
integration remain before template baseline `HT` can be frozen. FreshProof instance
installation remains gated on user acceptance of `B0` from task
`019f7bed-b4ab-7e03-ade3-f89645f28370`.

**Decision state:** the bounded v1 proof-harness scope and paired experiment topology
are approved for implementation. Manual HITL gates still control `B0` acceptance,
FreshProof instance installation, experiment-arm start, candidate selection, and any
routing promotion.

**Native producer correction (2026-07-20):** the control builder now uses one ephemeral
native `gpt-5.6-sol` `codex exec` process at high reasoning with multi-agent disabled
and deterministic prepare/run/finalize evidence. Composer remains Cursor-only. The comparison is an
end-to-end routing-stack experiment with runtime/producer surface as a fixed confound,
not a pure model-isolation A/B test.

## 1. Executive decision

The Agent OS should move from reviewer-led bug discovery toward a code-grounded proof
workflow:

1. maintain a small durable catalog of canonical invariants;
2. generate a current inventory of effects and authority-bearing surfaces from code;
3. retrieve a task-specific invariant subset from those surfaces rather than injecting
   the global catalog into every agent context;
4. require each High-risk task to map reachable surfaces to applicable invariants and
   executable evidence before implementation;
5. review one frozen snapshot with parallel, coverage-bearing reviewer packets;
6. fan parallel reviews into one conflict-resolved remediation contract;
7. automatically extract novel, reproduced findings into a governed candidate inbox;
8. use explicit convergence and forced-replan rules instead of an indefinite sequence
   of fresh-context reviews; and
9. validate the Composer 2.5-on-Cursor route against native Sol High on the paired
   Tracer 7 build before granting that complete route provisional eligibility for
   similar proof-complete backend work.

The experiment uses a split ownership model:

- **This `skills` repository owns:** the generic experiment protocol, runner contract,
  sanitized results, lab-notebook entry, and any resulting routing-matrix change.
- **The FreshProof repository owns:** private benchmark definitions, historical baseline
  commits, held-out tests, and one isolated worktree per model arm.
- **The live FreshProof implementation worktree is never an experiment arm.** The
  experiment starts only after the active Phase 1 work has a durable checkpoint and
  uses separate clean worktrees created from explicit historical commits.

## 2. Problem and evidence

The recent FreshProof Phase 1 run repeatedly reached green deterministic suites and was
then rejected by a fresh reviewer for another reachable path or lifecycle interaction.
The findings clustered around:

- authorization and attempt fencing outside the main path;
- external-effect dispatch, retries, takeover, and accounting;
- cache and manifest integrity;
- deletion and reverse-reference safety;
- mutable integrity roots and temporal coherence;
- incomplete or starvation-prone background censuses;
- contract-version and demo-path preservation; and
- fixtures that did not establish the same authority as production.

The current harness has useful plan, audit, TDD, independent-review, and model-routing
contracts, but it does not require a plan to prove its code-path coverage. Reviewers are
asked to read a diff and find issues; they are not given a reconciled, mechanically
derived inventory that they must exhaust. Review approval therefore remains attention
sampling over a large and changing search space.

This proposal does not promise exhaustive correctness. It makes known-risk coverage
inspectable, prevents known invariants from depending on reviewer memory, and gives the
orchestrator a measurable reason either to accept a slice or stop and re-plan it.

### 2.1 Tracer 6 audit update

The 2026-07-18 FreshProof audit at
`docs/operations/dev-agent-harness-tracer6-audit-2026-07-18.md` strengthens the case and
adds requirements that were not explicit enough in the first proposal.

Tracer 6 required 14 consecutive candidate review rounds, candidates 13 through 26,
and produced 31 completed reviewer verdicts inside one retention closure. The final
packet covered 52 modified or untracked paths. Review ultimately protected correctness,
but three architecture questions were answered only after production implementations
had already been written:

- what state can independently authorize an allow-capable or destructive decision;
- which direct, scheduled, retry, recovery, census, quarantine, and post-retirement
  siblings reach the effect; and
- how worker progress behaves under early return, throw, poison rows, retries, bounded
  pages, transaction rollback, and exact idempotent completion.

The audit therefore converts several earlier soft recommendations into blocking harness
requirements:

1. High-risk work needs an independently reviewed architecture proof packet before its
   first production RED/GREEN cycle.
2. Requirements must be singular, uniquely identified, bidirectionally traceable, and
   paired with an exact verification method.
3. Authority and destructive decisions must specify immutable root, canonical
   projection, exact cardinality, creation anchor, lifecycle behavior, and failure mode.
4. Every effect sibling must map to one enforcement point before implementation.
5. Coherent-tamper, lifecycle, and worker-progress matrices are mandatory when those
   concerns apply.
6. Two review candidates reporting the same root-cause class trigger an enforced stop,
   independent replacement-design approval, and slice reduction before production code
   resumes.
7. Cross-family approval counts only when the reviewer reproduces the exact snapshot
   and checks the same requirements matrix. Model diversity alone is advisory.
8. Exact freezing is necessary but does not make a 52-path review unit cognitively
   acceptable; architecture-approved implementation units must remain small.

Tracer 6's converged snapshot hashes become historical evidence, not the Tracer 7
execution baseline until that state is materialized as a clean private experiment ref.

### 2.2 Tracer 6 audit-to-control traceability

| Audit evidence | Blocking harness control | Required verification |
|---|---|---|
| Authority roots were decided after code existed | Per-decision immutable-root, canonical-projection, cardinality, creation-anchor, lifecycle, and fail-closed contract | Architecture schema fixture plus Fable architecture and Opus security verdicts |
| Direct/scheduled/retry/recovery siblings surfaced incrementally | Generated and manual effect inventories reconciled to a complete sibling-to-enforcement map | Known bypass fixtures retrieve the expected surfaces and invariants |
| Worker liveness and progress semantics arrived late | Required worker-progress matrix | Early-return, throw, poison, retry, page-bound, rollback, and idempotent-completion fixtures |
| Coherent tamper could preserve internally consistent but unauthorized state | Required coherent-tamper and lifecycle matrices | Missing, duplicate, foreign, extra, retired, replaced, and resealed negative cases |
| Requirements changed meaning across review rounds | Singular stable requirement IDs with bidirectional requirement/code/evidence traceability | Compound, orphan, and unverified requirements fail schema validation |
| Repeated-root stop advice did not stop patching | Executable second-same-root circuit breaker | Fixture proves production authority is revoked until replacement design approval |
| A 52-path packet exceeded dependable reviewer cognition | Architecture-approved small review units and semantic size gate | Split/waiver validator plus per-unit snapshot and dependency-DAG checks |
| Cross-model review could be advisory rather than comparable | Same candidate hash, same requirements matrix, and binary per-row verdicts | Snapshot mismatch and missing-coverage rejection fixtures |
| Independent work could proceed but needed safe synchronization points | Dependency DAG with synchronization only at approved schemas and immutable identities | Parallel-lane fixture rejects shared mutable authority or undocumented merge points |

### 2.3 Repository-reconciliation update — 2026-07-19

The post-Tracer 6 Git cleanup changes baseline construction, but not the harness design
or experiment question. The verified current state is:

- `main` and `origin/main` are at
  `cb45a532d1c052dc6ffd0ae8ae51ca9ff5d82e40` after PRs #254, #255, #256, #257,
  #258, #259, #260, #261, #263, #264, and #265;
- the Tracer 6 worktree remains at
  `b85d2fe5f1e68cc2b6ba1316cb3c1e79330c68ef`, but its live dirty tree no longer
  reproduces the accepted snapshot: it now reports 53 paths because the audit session
  subsequently changed harness/status documents and added the audit artifact;
- Tracer 6 is **not** an ancestor of current `main`; their verified merge base is the
  former PR #259 head `a4351e6d05bfbebd8fb0b4f0be683d1ad3db9b68`;
- the registered `codex/ai-os-instance` worktree is clean at
  `94ac4c49be662a323fdb5bce0db9ee3052f5889e`, four commits ahead of and 35 commits
  behind current `main`; and
- the root checkout contains protected local notes and additional untracked research
  or generated residue, so it remains unsuitable for harness or experiment mutation.

Consequences:

1. The historical Tracer 6 hashes remain the acceptance identity for its source change
   set. The source must first be recovered exactly in a disposable worktree; the live
   behavior-replay tree must not be mistaken for that frozen state.
2. The product-integration task combines current mainline content and the exact
   accepted Tracer 6 source first, then freezes clean reviewed baseline `B0`.
3. Only after `B0` is accepted should the existing clean `ai-os-instance` worktree be
   refreshed onto it and receive the reviewed template, producing post-harness `H0`.
4. Any product conflict resolution is a reviewed integration decision with a durable ledger;
   it may not silently choose Tracer 6's older version or reintroduce superseded
   heuristics.
5. `B0` and `H0` receive separate commit, tree/diff/status manifests and test packets.
   Only a shared approved `D0` commit descended from final post-harness `H0` may seed
   the Composer and Sol arms.

Snapshot recovery is fail-closed. Use the audit/session evidence to separate the
post-convergence harness-document edits from the accepted 52-path implementation
snapshot, then reproduce all recorded hashes. If exact reproduction fails, stop and
recover an archived patch/bundle or obtain an explicit user-approved replacement
baseline; do not approximate the Tracer 6 source from the current 53-path tree.

If `origin/main` advances before execution, the orchestrator must either freeze the
verified `cb45a53` anchor or repeat reconciliation against the newer explicit anchor.
It may not silently substitute “latest main” after design approval.

## 3. Goals

### 3.1 Harness goals

- Catch recurring bug classes during design and TDD planning.
- Detect newly introduced effect surfaces and callable bypasses mechanically.
- Make reviewer coverage as important as reviewer findings.
- Keep every review verdict bound to one exact repository snapshot.
- Consolidate simultaneous review lenses before remediation.
- Keep growing registry context bounded through deterministic, surface-driven retrieval.
- Convert parallel review disagreement into one explicit resolution artifact rather
  than competing implementation instructions.
- Capture novel invariant candidates automatically without letting a reviewer silently
  rewrite active blocking policy.
- Distinguish a missed implementation from a failed plan or incomplete surface map.
- Stop repeated patch-and-review loops when the architecture or slice boundary is the
  real problem.
- Preserve clear ownership between durable project rules, generated code truth,
  task-local proof, and historical findings.

### 3.2 Routing-experiment goals

- Measure net time to an accepted patch, not merely time to first patch.
- Compare first-pass defect burden, remediation burden, scope fidelity, and final
  correctness under an identical harness.
- Decide whether Composer is viable—and, if sufficiently faster, provisionally
  preferable—for Tracer-style backend slices with complete proof packets.
- Preserve Sol as planner, control plane, adjudicator, and escalation route regardless
  of the experiment outcome.

## 4. Explicit non-goals

The v1 proposal will not:

- build a general multi-language static-analysis platform;
- claim the generated inventory is mathematically complete;
- introduce a formal model checker or theorem prover;
- auto-promote reviewer findings into durable policy;
- let a reviewer or hook edit production code automatically;
- auto-approve, commit, push, merge, deploy, or spend provider money;
- benchmark whole-epic autonomous execution;
- use production data, live provider egress, or secrets in experiment arms;
- make Fable the routine code-review model; or
- promote Composer based on the existing single frontend experiment;
- complete FreshProof issues #262 or #217 beyond consuming their settled boundaries as
  baseline guards;
- fix the Trigger.dev/`systeminformation` dependency advisory inside either builder
  arm; or
- deploy FreshProof or address homepage/marketing launch findings as part of the
  harness or routing experiment.

TypeScript plus Convex is the only required code-inventory adapter for v1. Other stacks
are deferred until the FreshProof dogfood run demonstrates value.

## 5. Target artifact model

Five artifact classes separate stable policy, retrieval, current code, task-local proof,
and historical findings.

### 5.1 Durable invariant registry

Suggested instantiated paths:

```text
.ai/invariants/
  active.json
  candidates.jsonl
  index.json
```

`active.json` contains canonical invariants, not a list of historical bugs. JSON is
canonical in v1 so indexing, hashing, and fixtures remain dependency-free and
byte-reproducible; YAML may be rendered for people but is not independently editable.
`candidates.jsonl` is an append-only automated inbox. `index.json` is generated from
both and is the only registry-wide artifact used by retrieval. Every entry has:

```yaml
- id: INV-ATTEMPT-FENCE-001
  title: Exact active attempt fences reachable durable work
  statement: >-
    Every durable write or pre-request external effect reachable after attempt
    acquisition validates the exact live attempt at the transaction or request-entry
    boundary, except documented post-entry accounting reconciliation.
  applies_when:
    - flow acquires or adopts an attempt identity
    - reachable surface writes durable state or starts an external request
  surfaces:
    - durable_write
    - external_effect
    - outbox_enqueue
  allowed_exceptions:
    - post_request_accounting_reconciliation
  required_evidence:
    - reachability inventory
    - takeover negative test
    - zero-write or zero-egress assertion
  owner: security
  status: active
  version: 1
  origin:
    finding_class: stale_attempt_bypass
    evidence: task-local finding reference
```

Required fields:

- stable ID and version;
- normative statement;
- applicability rules;
- affected surface kinds and lifecycle transitions;
- permitted exceptions;
- required evidence types;
- owner and review date;
- status: candidate, advisory, active-blocking, superseded, or rejected; and
- origin and counterexample references.

Promotion protocol:

`candidate -> reproduced -> normalized -> counterexample added -> advisory -> owner approved -> active-blocking`

A finding never becomes active blocking policy merely because a reviewer stated it.
Candidate capture is automatic. A deterministic validator may promote a candidate to
`advisory` when the finding is reproduced, deduplicated, linked to a passing
counterexample test, and does not conflict with an active invariant. Promotion to
`active-blocking` changes governance and therefore still requires explicit owner or
orchestrator approval.

This distinction solves the maintenance problem without making the harness
self-poisoning: no human must remember to record the discovery, but an incorrect model
finding cannot silently block every future task.

### 5.2 Surface-driven invariant retrieval

Task artifact: `${task_artifact_root}/<task>/invariant-selection.json`, where
`task_artifact_root` is a required project-instance binding. The FreshProof instance
sets it to root `plans/`; it must not create `dev/active/`.

Reviewers and implementers must not receive the flat global registry. The retrieval
step uses the generated surface inventory and planned state transitions to select the
smallest relevant invariant set.

V1 retrieval is deterministic and metadata-based, not embedding-first. Query features
include:

- surface IDs and kinds;
- tables, entities, services, APIs, and symbols;
- transaction/action boundaries;
- lifecycle transitions;
- auth, tenant, data-classification, deletion, cache, retry, and external-effect tags;
- directly reachable callers and callees; and
- task tier and explicit threat domains.

Retrieval sequence:

1. derive query features from generated and planner-enumerated surfaces;
2. always include global invariants explicitly marked `always_apply`;
3. select exact applicability matches from `index.json`;
4. expand through declared invariant dependencies and exceptions;
5. include advisory candidates only as clearly labeled non-blocking review context;
6. fail closed when a high-risk surface or transition has no classified domain;
7. write selected and excluded invariant IDs, reasons, registry hash, query features,
   and unresolved coverage to `invariant-selection.json`; and
8. split the proof/review packet by subsystem when the selected set exceeds the context
   budget rather than truncating the middle of the list.

Selection records must make recall auditable. A reviewer can challenge the selection,
but cannot silently substitute a hand-picked subset. Historical regression fixtures
must prove that each known FreshProof bug class retrieves its canonical invariant.

Semantic/vector retrieval is deferred. It may later supplement exact metadata matching,
but it cannot be the sole blocking-policy selector because an opaque similarity miss
would create false coverage.

### 5.3 Generated effect-surface inventory

Suggested instantiated path: `.ai/generated/effect-surfaces.json`.

V1 surface kinds:

- database insert, update, delete, and state transition;
- storage write and delete;
- external network/provider request;
- scheduler invocation and deferred continuation;
- webhook/outbox creation;
- cache acceptance and replay;
- authorization or integrity-bearing read;
- exported/public/internal callable entry point; and
- census/reconciliation loop with cursor or filtering behavior.

Every row records:

- stable generated surface ID;
- file, symbol, and line location;
- surface kind;
- containing transaction/action boundary;
- direct callers when statically discoverable;
- affected entities/tables/services;
- observed guard or token arguments;
- confidence: exact, heuristic, or unresolved; and
- generator version and source-tree hash.

The generator must fail the gate when it sees an unclassified high-risk construct. It
must not silently omit a surface it does not understand.

### 5.4 Task-local proof plan

Suggested paths:

```text
${task_artifact_root}/<task>/
  requirements.json
  architecture-proof.json
  proof-plan.json
  rendered/
    requirements.md
    architecture-proof.md
    proof-plan.md
```

The three JSON files are canonical, schema-validated records. The Markdown files are
deterministically generated review views and must never become independently editable
sources of truth.

`requirements.json` contains singular requirements with stable task-local IDs. Each row
has exactly one normative statement, source/rationale, applicability, affected surface
IDs, verification method, expected result, and expected denial-without-effects result.
Compound requirements must be split before design approval.

`architecture-proof.json` is required before the first production RED/GREEN cycle for
High-risk work. It contains:

- data-flow, authority, and effect diagram with trust boundaries;
- one decision contract for every allow-capable or destructive decision: immutable
  root, canonical projection, exact cardinality, creation anchor, lifecycle semantics,
  and fail-closed behavior;
- every public, internal, direct, scheduled, retry, recovery, census, quarantine, and
  post-retirement sibling mapped to one enforcement point;
- coherent-tamper matrix covering missing, duplicate, foreign, extra, retired,
  replaced, detached, and internally resealed alternatives;
- lifecycle matrix covering creation, activation, supersession, revocation, expiry,
  retirement, deletion, replay, and recovery as applicable;
- worker-progress matrix covering early return, throw, poison data, retry, page bound,
  cursor corruption, transaction rollback, duplicate scheduling, and exact-idempotent
  completion as applicable;
- dependency DAG and parallel work lanes, with synchronization only at approved schemas
  and immutable identities; and
- unresolved assumptions and explicit human decisions.

The architecture packet is a feasibility proof, not a narrative design memo. A design
reviewer must be able to point to the exact requirement, trust root, sibling path, and
negative proof for every approval.

`proof-plan.json` is the implementation traceability matrix. Its rendered view includes
the following row for every directly changed
or transitively reachable surface:

| Surface or transition | Why reachable | Applicable invariants | Enforcement point | Negative evidence | Integration evidence | Disposition |
|---|---|---|---|---|---|---|

The plan also includes:

- lifecycle/state-transition table;
- trust and integrity roots;
- concurrency, retry, takeover, and replay cases;
- destructive-action reverse-reference analysis;
- public-contract and historical-compatibility obligations;
- fixture/factory migrations required by stronger production guards;
- explicit Phase N versus deferred Phase N+1 boundary; and
- residual risks and human decisions.

Blank cells block implementation. `Not applicable` requires a reason.

Traceability is bidirectional:

- every approved requirement maps to at least one enforcement point and verification;
- every production enforcement point maps back to one approved requirement; and
- implementation review reports orphan requirements and orphan effects as blockers.

### 5.5 Findings, review resolution, and coverage records

Suggested task paths:

- `${task_artifact_root}/<task>/findings.jsonl`
- `${task_artifact_root}/<task>/design-review-coverage.json`
- `${task_artifact_root}/<task>/design-review-resolution.json`
- `${task_artifact_root}/<task>/review-coverage.json`
- `${task_artifact_root}/<task>/review-resolution.json`

Each finding records:

- stable task-local ID;
- snapshot hash;
- reviewer and model route;
- severity and blocking disposition;
- concrete counterexample;
- affected surface IDs and invariant IDs;
- root-cause class;
- reproduction/test status;
- fix snapshot;
- disposition; and
- durable-invariant promotion state.

The coverage record contains:

- base commit, tree hash, and diff hash;
- generated surface inventory version;
- reviewer-enumerated surfaces;
- reconciliation differences;
- surfaces and invariant rows inspected by each lens;
- checks run or skipped;
- known blind spots; and
- final convergence-gate result.

`review-resolution.json` is the only review packet handed to the implementation agent.
Raw reviewer outputs remain durable evidence but cannot independently issue work.

Design review uses the same finding, coverage, and resolution contracts but remains
separate from implementation review. Hashing is deliberately two-stage to avoid a
circular packet:

1. `design-candidate-hash` covers requirements, architecture proof, proof plan,
   inventory, invariant selection, and baseline identity, but excludes reviewer output;
2. every Fable/Opus verdict and the design resolver bind to that exact candidate hash;
3. remediation creates a new candidate hash and makes old approvals historical; and
4. `approved-builder-packet-hash` covers the final design candidate plus its exact
   architecture/security verdicts and resolved design-feedback packet.

Implementation fixes the circularity explicitly. `design-snapshot.json` is a generated
sidecar, not an input to its own identity: `raw-bytes-manifest-v1` hashes the sorted raw
bytes of `requirements.json`, `effect-surfaces.json`, `invariant-selection.json`,
`architecture-proof.json`, and `proof-plan.json`. The approved builder identity hashes
that design-candidate identity, the exact review-coverage bytes, and a stable canonical
form of the resolution contract with only its derived
`approved_builder_packet_hash` field excluded. Any design, verdict, evidence, conflict,
or disposition edit therefore invalidates the relevant downstream identity without a
self-referential hash.

Builders receive only the approved builder packet. A verdict for an older candidate
hash cannot approve a newer design.

### 5.6 Automated invariant extraction

After a novel adversarial finding has been reproduced and fixed, the harness runs a
bounded background operation equivalent to:

```text
Extract_Invariant(
  bug_description,
  counterexample,
  affected_surface_ids,
  existing_invariant_ids,
  fix_diff_hash,
  failing_test_evidence,
  passing_test_evidence
)
```

The extractor:

1. normalizes the symptom into a root-cause statement and applicability rule;
2. generates a canonical fingerprint from root cause, surface kinds, and applicability;
3. deduplicates against active, advisory, rejected, and candidate entries;
4. appends a provenance-bound `candidate` record to `candidates.jsonl` atomically;
5. rebuilds and validates `index.json`;
6. runs a retrieval regression proving the originating surfaces select the candidate;
7. records whether the candidate was merged, rejected as a duplicate, promoted to
   advisory, or left for governance review; and
8. never edits `active.yaml`, agent prompts, workflow code, or production code directly.

Extraction failure is visible in the task closure packet and retried once. It does not
invalidate a correct code fix, but the task cannot claim that the feedback loop was
captured successfully.

## 6. Workflow changes

### 6.1 Complexity and slice-size gate

Extend `routing/complexity-rubric.md` with semantic size dimensions:

- number of lifecycle boundaries;
- number of external/destructive subsystems;
- number of reachable effect surfaces;
- public-contract plus persistence/concurrency combinations; and
- non-generated diff size as a secondary warning.

High-risk work must be split or explicitly waived when it crosses one of these soft
limits:

- more than two lifecycle boundaries;
- more than one destructive or external-effect subsystem;
- more than approximately eight sensitive/effect surfaces; or
- more than approximately 1,000 non-generated changed lines.

The orchestrator may waive a threshold only in the proof plan, with the reason,
additional integration evidence, and reviewer topology named before implementation.

### 6.2 Spec/design gate

Update `workflows/spec.md` so High-tier planning runs this sequence:

1. capture the exact baseline and scope firewall;
2. generate the effect-surface inventory;
3. write singular, uniquely identified requirements and enumerate intended state
   transitions and reachable sibling paths;
4. reconcile the generated inventory with Sol's plan inventory;
5. retrieve and record the task-specific invariant subset;
6. write the architecture proof packet, including authority/effect diagram, decision
   contracts, coherent-tamper, lifecycle, and worker-progress matrices as applicable;
7. map one verification and expected denial-without-effects assertion to each
   requirement;
8. identify slice-size violations, build the dependency DAG, and split implementation
   into architecture-approved review units;
9. freeze and hash the reviewable design candidate, excluding reviewer output;
10. run fresh-context architecture and security design reviews concurrently against
    the exact same packet and requirements matrix;
11. fan those design reviews into one resolved feedback contract;
12. revise as a new design candidate and re-review when required;
13. assemble and hash the approved builder packet from the accepted candidate, exact
    verdicts, and resolution; and
14. block the first production RED/GREEN cycle until the approved builder packet has
    exact-snapshot architecture and security approval.

Default High-risk design topology:

- Sol High owns requirements, design synthesis, decomposition, and final disposition;
- Fable reviews architecture, trust boundaries, authority models, lifecycle coherence,
  and slice boundaries;
- Claude Opus 4.8 reviews security requirements, threat coverage, destructive effects,
  tamper matrices, and denial-without-effects proofs;
- deterministic checks validate schemas, traceability, cardinality of requirement
  mappings, and packet hashes; and
- the review resolver produces the one design-remediation contract.

Fable and Opus receive compact, code-grounded packets: baseline, effect graph, state
table, selected invariant matrix, requirements, options, unresolved assumptions, and
exact questions. They do not explore the entire repository or perform routine code
review. A cross-model verdict that cannot reproduce the design-packet hash or does not
check the shared requirements matrix is retained as advisory diversity, not approval.

Design review is bounded as well as shifted left:

- the first concurrent review produces one resolution contract;
- Sol may remediate and re-freeze the same architecture version once;
- a second verdict with the same root-cause class invalidates that architecture
  version and forces a replacement decision contract or smaller review unit;
- a new finding that changes the trust root, effect boundary, lifecycle model, or
  requirement set immediately creates a new architecture version rather than extending
  the old packet; and
- after three frozen design versions without approval, the design gate reports
  `blocked` with the unresolved decision graph and requires an explicit user decision
  before more review spend.

Reviewer feedback is carried forward by stable finding and requirement IDs so a fresh
design version does not rediscover or silently lose earlier obligations.

### 6.3 TDD implementation gate

Update `workflows/implement-tdd.md` and the implementer contract:

- replace “one first failing test” for High-tier work with the approved verification
  matrix: every requirement needs a failing proof or executable pre-implementation
  check for its intended reason;
- implement one architecture-approved review unit at a time rather than accumulating
  a tracer-wide 52-path packet;
- require the implementer to report any surface or invariant missing from the plan;
- stop and return to Sol when a new architecture decision, trust root, sibling path, or
  failure behavior is required;
- distinguish fixture migration from production behavior changes;
- rerun the effect inventory after implementation and reconcile new surfaces;
- generate a bidirectional trace report from requirement ID to code/enforcement point
  to RED/GREEN evidence;
- prohibit implementation completion when the proof matrix contains an unresolved
  reachable surface; and
- bind the return packet to the final tree/diff hash.

Composer's stop condition must explicitly include ambiguity, new reachable surfaces,
conflicting invariants, required scope expansion, or a missing production convention.

### 6.4 Frozen-snapshot review gate

Update `agents/reviewer.md` and `workflows/review-pr.md`:

1. Freeze the implementation snapshot before dispatch.
2. Give every reviewer the same base, tree hash, diff hash, plan, retrieved invariant
   selection, generated inventory, and proof matrix. Do not inject the flat registry.
3. Require each reviewer to independently enumerate relevant surfaces before judging.
4. Reconcile reviewer enumeration against the generated inventory.
5. Have reviewers check assigned surface/invariant rows and record coverage even when
   there are no findings.
6. Run applicable lenses concurrently against the frozen snapshot.
7. Run the strict review fan-in before any code changes.
8. Convert accepted findings into failing tests or executable reproductions.
9. Remediate the single resolved packet once.
10. Re-review affected rows plus any newly reachable surfaces on a new frozen snapshot.

Default High-tier topology after this change:

- fresh-context Sol reviewer: runtime correctness, scope, and plan conformance;
- Claude Opus 4.8 reviewer: security, concurrency, integrity, and destructive effects;
- deterministic verifier: tests, generated artifacts, runtime behavior, and scope;
- specialist lens only when the proof plan identifies a distinct domain; and
- Fable escalation only for architecture disputes, system-boundary uncertainty, or
  reviewer conflict that can change the design.

The Sol orchestrator synthesizes and dispositions. Its synthesis is not counted as an
independent review.

#### Strict review fan-in

Add a dedicated read-only `review-resolver` role. It receives normalized reviewer
packets, the proof matrix, selected invariants, acceptance criteria, and the frozen
snapshot identity. It does not receive implementation authority and does not change
code.

The resolver performs:

1. schema validation and snapshot-hash equality checks;
2. finding normalization and duplicate/root-cause clustering;
3. mapping of every finding to surfaces, invariant IDs, and acceptance criteria;
4. explicit detection of directives that cannot both be satisfied;
5. deterministic precedence evaluation;
6. evidence-backed rejection, deferral, combination, or escalation; and
7. production of exactly one ordered remediation contract.

Precedence is:

1. legal/compliance constraints and user-approved safety, tenant-isolation, data, and
   destructive-action no-go boundaries;
2. explicit product intent and accepted behavior contracts within those boundaries;
3. authorization, integrity, correctness, historical compatibility, and public
   contracts;
4. reliability, recoverability, and availability;
5. performance and cost;
6. maintainability and style.

Precedence does not make a higher-ranked reviewer's assertion automatically true. The
finding must still be applicable and evidenced. It means a lower-ranked optimization
cannot be accepted by violating a proven higher-ranked invariant. When satisfying both
requires changing user intent or architecture, the resolver marks the conflict
`unresolved` and routes a compact decision packet to Sol plus Fable or the user.

Required `review-resolution.json` fields:

- frozen snapshot identity;
- every source finding ID exactly once;
- duplicate and conflict groups;
- applied precedence rule;
- final disposition and evidence;
- one non-contradictory ordered change list;
- required regression/evidence per change;
- deferred work with owner and phase;
- rejected findings with reason; and
- unresolved decisions that block implementation handoff.

A deterministic validator blocks remediation if a blocking source finding is missing,
appears more than once outside a declared duplicate group, or belongs to an unresolved
conflict. The implementation agent receives the resolved contract, not several raw
reviewer prompts.

### 6.5 Convergence and forced-replan policy

Add `routing/review-convergence.md` with these acceptance gates:

- generated and reviewer surface inventories reconcile;
- every reachable surface has an invariant disposition;
- every applicable invariant has executable evidence or a named accepted residual;
- deterministic checks pass against the reviewed snapshot;
- all concurrent verdicts refer to the same snapshot;
- no unresolved P0/P1 remains;
- one residual adversarial pass finds no new blocking class;
- post-review changes are mapped back to the proof matrix; and
- deferrals name an owner and prove they do not invalidate the current milestone;
- every approved requirement has bidirectional code/evidence traceability; and
- code review identifies implementation deviations and genuinely novel threats rather
  than silently redesigning an already approved authority/effect model.

Escalation:

- first rejection for an implementation defect inside the approved design: consolidate
  and remediate once;
- second candidate review in one slice reporting the same root-cause class: production
  patching stops automatically; local extensions of the old design are prohibited;
- after that stop, Sol writes a replacement architecture packet, reduces the review
  unit, and obtains fresh-context Fable architecture plus Opus security design approval
  before any more production edits;
- the replacement requirements matrix must fail for the intended reasons before
  implementation resumes;
- a new root-cause class that invalidates the approved authority/effect model triggers
  the same replacement-design gate immediately;
- the same invariant missed on another path is classified as inventory failure and
  requires rebuilding and rechecking the complete sibling set; and
- reviewer disagreement on an architecture premise: compact Fable adjudication or
  explicit human decision.

After final adversarial findings are reproduced and fixed, convergence also runs the
automated invariant extractor. Successful code review is not allowed to silently drop
the new reusable rule; extraction status is recorded in the closure packet.

The round limit applies to repeating the same strategy. It never authorizes accepting
known blocking defects.

Cross-family approval contributes to convergence only when the reviewer reproduces the
mandatory packet hashes at start and end and reports coverage against the identical
requirements matrix. Quota-limited, broadened, or non-reproducible reviews remain
advisory evidence and cannot outvote an exact-snapshot rejection.

## 7. V1 implementation plan

### 7.0 Cross-session orchestration and immutable handoffs

Two Codex tasks share the program but never share write authority at the same time:

- **Product-integration task `019f7bed-b4ab-7e03-ade3-f89645f28370`:** owns only
  recovery of the approved Tracer 6 implementation state, reconciliation with pinned
  main, verification/review, and production of `B0`. It must not install the new
  harness, rewrite the lean canonical `AGENTS.md`, start Tracer 7, or run either model
  arm. It was launched from the handoff produced after task
  `019f6ceb-12a2-7430-903c-81976ce0013f` converged the recovery plan.
- **Harness/experiment task `019f71e5-a689-74d0-850f-c21ed8389aeb`:** remains
  read-only against FreshProof until the user accepts `B0`, but may implement and
  review generic template `HT` in the `skills` repository concurrently. After `B0`, it
  owns the FreshProof instance update, post-harness baseline `H0`, Tracer 7 design gate,
  paired build, comparison, and sanitized results. It must not reconstruct or silently
  amend Tracer 6 product decisions.

Immutable handoff identities:

| ID | Meaning | Required contents |
|---|---|---|
| `T6` | Recovered approved Tracer 6 source snapshot | Recorded 52-path hashes, recovery provenance, exact manifest |
| `B0` | Clean product-integration baseline | Pinned main + `T6`, conflict ledger, architecture firewall, tests, fresh correctness/security verdicts |
| `HT` | Reviewed generic harness-template version | Template commit, schemas, workflows, fixtures, migration/instance manifest |
| `HI` | FreshProof harness-instance change | Exact `HT` source, lean `AGENTS.md`, `plans/` task-root binding, instance parity report |
| `H0` | Final Tracer 7 experiment baseline | `B0` + `HI`, clean commit/tree/lockfile/environment hashes, passing harness and product gates |
| `D0` | Shared approved Tracer 7 design baseline | `H0` plus requirements, architecture proof, selected invariants, proof plan, Fable/Opus verdicts, fan-in resolution, and approved builder packet |
| `CA` / `CB` | Frozen blinded candidates | Candidate hashes, traces, deterministic/held-out results, independent reviews, resolution packets |

An output is not a handoff because a task says it is finished. The receiving task
reproduces its identity and validates its manifest before acquiring write authority.
If reproduction fails, control returns to the producing task; the receiver does not
repair the predecessor artifact implicitly.

Integrated execution order:

1. Recover `T6` exactly in a disposable worktree.
2. Reconcile `T6` product changes with pinned `main@cb45a53`, preserving persisted
   policy decisions and recording every integration choice.
3. Run integration verification plus fresh-context correctness and security review.
4. Freeze clean product baseline `B0`.
5. Hand `B0` to the harness/experiment task and relinquish product-integration write
   authority.
6. Finish and review `HT` if it was not completed in parallel; apply it as `HI` on top
   of `B0`, including the lean FreshProof `AGENTS.md` and project-specific bindings.
7. Verify and freeze final post-harness baseline `H0`.
8. Run the shared Tracer 7 design dogfood gate on `H0` and freeze `D0`.
9. Run the paired Composer 2.5-on-Cursor and native-Sol builder routes from byte-identical `D0`.
10. Resolve blinded reviews, reveal routes, let the user select at most one integration
    candidate, and make at most a provisional routing change.

Permitted manual/HITL triggers:

1. **Accept `B0` / start harness:** user supplies or approves the exact `B0` identity.
2. **Accept `H0` / start design:** user confirms the harness-instance diff and baseline
   packet; no builder runs yet.
3. **Accept `D0` / start paired build:** user approves the exact design-baseline commit,
   resolved architecture/security packet, and execution budget.
4. **Select candidate and routing disposition:** user chooses `CA`, `CB`, or neither,
   and separately approves any provisional routing update.

All deterministic work between those triggers may run without additional questions.
An approval advances only the named gate; it does not authorize publication,
deployment, production mutation, provider egress, or later experiment stages.

### Phase A — Contracts and schemas

Deliverables in `ai-os-template`:

- `docs-templates/INVARIANTS.template.json`
- `docs-templates/INVARIANT-CANDIDATES.template.jsonl`
- `docs-templates/task-docs/requirements.template.json`
- `docs-templates/task-docs/architecture-proof.template.json`
- `docs-templates/task-docs/proof-plan.template.json`
- `docs-templates/task-docs/requirements.template.md`
- `docs-templates/task-docs/architecture-proof.template.md`
- `docs-templates/task-docs/proof-plan.template.md`
- `docs-templates/task-docs/findings.template.jsonl`
- `docs-templates/task-docs/invariant-selection.template.json`
- `docs-templates/task-docs/review-coverage.template.json`
- `docs-templates/task-docs/review-resolution.template.json`
- `schemas/effect-surfaces.schema.json`
- `schemas/invariant-selection.schema.json`
- `schemas/review-coverage.schema.json`
- `schemas/review-resolution.schema.json`
- `schemas/requirements-trace.schema.json`
- `schemas/architecture-proof.schema.json`
- `schemas/proof-plan.schema.json`
- `routing/review-convergence.md`
- lean high-risk routing update in `root/AGENTS.template.md`
- required `task_artifact_root`, package-manager-source, and proof-harness bindings in
  `instances/MANIFEST-SCHEMA.md`
- ownership and lifecycle updates in `DESIGN-MEMO.md`

Acceptance:

- schemas validate positive fixtures and reject missing IDs, registry/snapshot hashes,
  surface dispositions, unresolved review conflicts, and evidence fields;
- compound or unverified High-risk requirements fail validation;
- authority/effect, lifecycle, tamper, and worker-progress matrices have explicit
  applicability/disposition fields rather than optional prose sections;
- rendered Markdown is byte-stable and fails a freshness check when it does not match
  the canonical JSON;
- the root instruction template contains universal safety/routing rules and pointers,
  not the flat invariant catalog or task-specific closure checklists;
- the instance manifest resolves project-local task paths and tool versions without
  contradictory hard-coded guidance;
- write tiers and promotion authority are explicit; and
- no artifact duplicates `PROJECT-STATUS.md`, `SPEC.md`, or task execution checklists.

### Phase B — TypeScript/Convex inventory and retrieval adapter

Deliverables:

- a generic inventory entrypoint under `ai-os-template/scripts/`;
- a TypeScript/Convex adapter and configuration contract;
- deterministic JSON output sorted by stable surface ID;
- deterministic invariant indexing and surface-driven selection;
- unknown-pattern reporting;
- source-tree and generator-version binding; and
- focused fixture tests for mutations, actions, storage deletion, fetch, scheduler,
  outbox, cache replay, and cursor scans.

Acceptance:

- running twice on the same tree produces byte-identical output;
- adding a fixture entry point, write, delete, fetch, or scheduler changes the manifest;
- an unsupported high-risk construct fails as unresolved rather than disappearing;
- known historical bug-class fixtures retrieve their expected invariant IDs;
- selection records explain every inclusion, exclusion, dependency expansion, and
  unresolved domain;
- oversized selections split into complete subsystem packets rather than truncating;
- generated output contains no secrets or source bodies; and
- v1 remains adapter-based rather than growing a general analyzer framework.

### Phase C — Planning and implementation integration

Update:

- `routing/complexity-rubric.md`
- `workflows/spec.md`
- `workflows/implement-tdd.md`
- `agents/auditor.md`
- `agents/implementer.md`
- task plan/TDD templates

Acceptance:

- a High-tier fixture task cannot enter implementation with a blank proof row;
- a High-risk fixture task cannot enter implementation without exact-snapshot
  architecture and security design verdicts;
- every requirement maps bidirectionally to a surface, enforcement point, and
  verification method;
- no High-tier agent receives the flat registry when a selection packet exists;
- a slice-size threshold produces split-or-waiver output;
- Fable routing is limited to durable plan/system judgment; and
- implementers stop when the accepted proof plan becomes invalid.

### Phase D — Review and convergence integration

Update:

- `agents/reviewer.md`
- new `agents/review-resolver.md`
- `agents/verifier.md`
- `workflows/review-pr.md`
- `workflows/commit.md`
- `workflows/commit-pr.md`
- `hooks/delegating-review.md`
- `routing/model-routing.md`

Acceptance:

- mismatched tree or diff hashes invalidate review synthesis;
- reviewers return coverage rows even with no findings;
- parallel reviews are frozen before dispatch and consolidated before fixes;
- all blocking findings appear exactly once in a validated resolution packet;
- conflicting directives cannot reach the implementer unresolved;
- the repeated-root second-rejection path enforces a production stop, replacement
  architecture approval, smaller review unit, and rebuilt failing requirements matrix;
  and
- no hook auto-edits or auto-approves code.

### Phase E — Automated invariant feedback loop

Deliverables:

- bounded `extract-invariant` workflow and role contract;
- append-only candidate writer with atomic/deduplicated writes;
- active/candidate registry index builder;
- candidate-to-advisory deterministic validation;
- retrieval regression generation; and
- closure-packet reporting for extraction outcomes.

Acceptance:

- a novel reproduced finding automatically creates one provenance-bound candidate;
- rerunning extraction is idempotent;
- duplicates merge without losing origin evidence;
- an unproven or conflicting candidate cannot become active blocking policy;
- a validated advisory candidate is retrievable for its originating surfaces; and
- extraction cannot modify active policy, workflow prompts, or production code.

### Phase F — FreshProof instance update and Tracer 7 design dogfood

Phase F begins only after the user accepts exact clean product-integration baseline
`B0` from task `019f7bed-b4ab-7e03-ade3-f89645f28370`. The harness task must first
reproduce the `B0` handoff identity. It does not repeat product reconciliation or take
the current dirty behavior-replay worktree as an input.

Update the FreshProof harness instance in the existing
`freshproof/.worktrees/ai-os-instance` worktree if it can be safely refreshed onto
`B0`; otherwise create one replacement instance worktree from `B0` after explicitly
retiring the stale registration. Never modify the dirty root or the historical Tracer
6 recovery worktree in place.

Instance-update sequence:

1. reproduce `B0` commit, tree, manifest, lockfile, test packet, conflict ledger, and
   architecture-firewall verdicts;
2. verify that `ai-os-instance` is clean and record its head/divergence before any
   refresh or transplant;
3. refresh the prior instance commits onto `B0`, preserving only still-applicable
   instance behavior;
4. instantiate reviewed template version `HT` and record its exact source commit and
   template manifest;
5. update FreshProof's lean canonical `AGENTS.md` to retain universal rules and route
   High-risk work into the proof harness without injecting the invariant catalog,
   tracer-specific closure checklist, or conditional workflow detail into every
   request;
6. bind `${task_artifact_root}` to root `plans/`, reconcile the live package-manager
   declaration rather than copying a stale version string, and remove conflicting
   `dev/active/` guidance;
7. review `HI` against `B0`, the prior instance, and `HT` manifests so no product code,
   architecture choice, or unrelated WIP changes silently;
8. run harness schema, retrieval, design-review, fan-in, circuit-breaker,
   exact-snapshot, no-auto-edit, and no-flat-registry fixtures inside FreshProof;
9. rerun the `B0` architecture-firewall and product regression gates to prove the
   harness installation did not change product semantics; and
10. freeze clean post-harness baseline `H0`, including commit/tree/lockfile/environment
    hashes, template/instance provenance, test packet, and approved instance review.

Merging or publishing `HI` may use a separate manual approval. The Tracer 7 experiment
requires an exact reviewed `H0`; it does not require silently coupling publication or
deployment authority to baseline acceptance.

FreshProof baseline architecture firewall:

- production APIs and report paths use persisted policy decisions through
  `readPublicClaimDecision()` and fail-closed report-snapshot reads;
- `inferEvidenceSufficiencyDebug` remains absent from `convex/api*.ts`,
  `convex/articleReports.ts`, and `src/lib/api/*`;
- the debug helper remains eval-only and the research policy remains quarantined at
  `evals/lib/lowerdb-seeded-evidence-policy.ts`;
- production policy remains `lowerdb-advisory-pilot@2026-07-19.1` unless changed by a
  separately approved policy task; and
- the `premature` and `insufficient` negative-language regressions remain covered.

These are deterministic baseline guards, not questions for either builder to redesign.
The experiment preflight may run a read-only grep guard for the debug-helper boundary;
it does not absorb the remaining #262 or #217 issue scope.

Tracer 7 design is the real dogfood gate. Before either builder arm receives code
authority, the updated FreshProof harness must produce:

- singular Tracer 7 requirements;
- the complete architecture proof packet;
- generated and manual effect inventories;
- retrieved invariant subset plus global rules;
- authority/effect and trust-boundary diagram;
- coherent-tamper, lifecycle, and worker-progress matrices where applicable;
- architecture-approved small review units and dependency DAG;
- exact-snapshot Fable architecture and Opus security design verdicts;
- one resolved, non-contradictory design-remediation packet; and
- an approved frozen builder packet with no unresolved High-risk requirement.

Dogfood acceptance:

- no production provider calls, deploys, or live data;
- reviewers reproduce the same design-packet hash and requirements matrix;
- generated and manual inventories reconcile or document exact gaps;
- every requirement has a verification and denial-without-effects expectation;
- conflicting design directives are resolved before implementation;
- the repeated-root circuit breaker is executable rather than advisory;
- context retrieval avoids flat-registry injection; and
- lessons change the generic template only through reviewed follow-up edits.

The paired routing-stack Tracer 7 build does not start until this design dogfood gate passes.

## 8. Composer-on-Cursor vs native-Sol routing-stack experiment

### 8.1 Decision question

Can Composer 2.5 through Cursor perform the primary implementation work for FreshProof
Tracer 7, from the same fully approved design packet as native Sol High, with comparable
correctness and no worse intervention or remediation burden?

This does not test whether Composer should plan epics, change architecture, review its
own work, or replace Sol as control plane. It also does not isolate model quality:
runtime, producer surface, authentication path, and model move together as an explicit
fixed confound.

### 8.2 Falsifiable hypothesis

> Given the same approved Tracer 7 architecture proof packet and exact clean
> post-harness baseline `H0`, the Composer 2.5-on-Cursor route produces an independently
> accepted Tracer 7 candidate within the same two-round budget as native Sol High, with
> zero residual P0/P1 defects, no scope or architecture deviation, complete requirement
> traceability, and no worse intervention or remediation burden.

Design, deterministic verification, and independent review time are shared or matched
experimental overhead and are recorded separately. Builder/remediation duration remains
a secondary route-level measurement; a speed difference cannot be attributed solely to
the model.

The paired treatment is the complete primary implementation/remediation route:

- experimental arm: Composer 2.5 through Cursor performs approved builder work;
- control arm: native `gpt-5.6-sol` at high reasoning through one ephemeral `codex exec`
  process performs approved builder work under prepare/run/finalize controls; and
- both arms use the same `D0`, updated harness, design history, allowed paths,
  ignored policy, evaluator vectors, budgets, intervention policy, verification,
  reviewer models, fan-in, convergence rules, and HITL gates.

Any arm-specific hint, extra planning conversation, reviewer substitution, retry, or
scope change invalidates the paired comparison unless applied symmetrically from a new
freeze.

### 8.3 Staged execution

#### Stage 0 — Apparatus rehearsal

Run one non-production micro-fixture through both wrappers to validate exact baseline
creation, packet equality, timer boundaries, held-out check injection, blinded review,
artifact capture, and cleanup. The rehearsal does not evaluate model quality and cannot
change routing.

The architecture/security review prompts also receive a small retrospective Tracer 6
validation fixture with known authority-root and sibling-path defects. This is not a
claim that the LLM reviewers are calibrated judges; it is a preflight proving that the
new design-review contract can express and detect the failure classes it was built for.

#### Stage 1 — Shared Tracer 7 design gate

Sol High creates one Tracer 7 architecture proof packet. Fable architecture review and
Opus security review run concurrently against the same hash and requirements matrix.
The resolver produces one remediation contract. Design iterates until approved or is
declared blocked.

This shared design work is not attributed to either builder. Neither model receives
production code authority before design approval.

#### Stage 2 — Paired Tracer 7 builders

Create two arms from the exact same clean baseline and give them byte-identical approved
packets:

- Arm A: Composer 2.5 through Cursor is primary builder.
- Arm B: native `gpt-5.6-sol` through one ephemeral `codex exec` process at high
  reasoning, with multi-agent disabled and the least-privilege
  `native-proof-builder` permission profile, is primary builder.

Each arm implements the same architecture-approved Tracer 7 review units. It may stop
and escalate a missing design requirement, but may not independently redesign the
tracer.

#### Stage 3 — Blinded verification and review

Run the same deterministic and held-out checks, fresh-context Sol correctness review,
Opus security review, and resolution workflow on both frozen candidates. Reviewers see
blind arm IDs and do not see timing, route identity, or the sibling output.

#### Stage 4 — Comparison and candidate integration decision

Reveal routes only after both resolution packets are final. The user reviews the
comparison and decides whether either candidate may proceed through the normal
commit/PR/integration gate. No experiment arm is automatically promoted.

#### Stage 5 — Optional replication

Tracer 7 is a strong viability test but an `n=1` comparison. It can establish that
Composer is viable for similarly bounded, design-approved work; it cannot establish a
universal backend default by itself. A broader routing promotion requires later paired
replication or continued production telemetry. Replication is deferred unless Tracer 7
is inconclusive or the user wants a general default rather than provisional eligibility.

### 8.4 Baseline construction

- Treat the exact converged Tracer 6 snapshot as one immutable source input:

  | Component | Expected value |
  |---|---|
  | HEAD | `b85d2fe5f1e68cc2b6ba1316cb3c1e79330c68ef` |
  | Binary diff SHA-256 | `95720168d212797c814006ff9f3a8fb5d16c5311cceb31a8ec74a96aed48c3d2` |
  | NUL status SHA-256 | `54616ff88fb2e191484211123ee63d7f446f7a932895eefc57c6b9311494a0a1` |
  | Modified/untracked paths | `52` |
  | Path/mode/content manifest SHA-256 | `aabe39ecc48f27f11e9296fa248470b69565936762f03cce2108ea2ce190e201` |

- The product-integration task reproduces those hashes before extracting or
  materializing the source change set. It must not hash the current 53-path
  post-audit behavior-replay tree and call it equivalent.
- That task pins current-main input initially to
  `cb45a532d1c052dc6ffd0ae8ae51ca9ff5d82e40`, records divergence at
  `a4351e6d05bfbebd8fb0b4f0be683d1ad3db9b68`, reconciles product behavior under the
  architecture firewall, and freezes reviewed clean product baseline `B0`.
- The harness task begins by reproducing the complete `B0` handoff. It does not recover
  Tracer 6 again or reinterpret the conflict ledger.
- Pin reviewed generic-template commit `HT`, instantiate it on top of `B0`, and verify
  that only harness, instruction, and task-artifact bindings changed.
- Rerun `B0` product gates plus harness schema, retrieval, review-resolution,
  circuit-breaker, exact-snapshot, and no-auto-edit fixtures.
- Freeze `H0` with its commit, tree hash, complete path/mode/content manifest,
  dependency lockfile, environment contract, `B0`/`HT` provenance, and combined test
  packet. `H0`, not the historical Tracer 6 hashes or pre-harness `B0`, is the sole
  starting point for the shared Tracer 7 design gate. The gate then freezes `D0`, the
  exact approved builder-packet start commit for both arms.
- Create a private benchmark manifest with baseline commit, approved design packet,
  invariant selection, visible and held-out evaluators, allowed paths, budget, and
  cleanup instructions.
- Create both builder worktrees from that exact ref. Do not reconstruct or manually
  copy the baseline separately per arm.

`B0` is expected to preserve the reviewed `systeminformation >=5.31.7` override. If a
dependency audit still fails on `H0`, treat it as baseline infrastructure evidence,
resolve it before the run or declare the identical failure quarantined in both arms;
never let either builder opportunistically change dependencies to improve its score.

### 8.5 Worktree topology

Keep the read-only `D0` source plus two FreshProof git worktrees from that same baseline:

```text
${FRESHPROOF_EXPERIMENT_ROOT}/
  tracer7/
    baseline/
    composer/
    sol/
```

Requirements:

- separate branches or detached experiment refs;
- `baseline/` is read-only after `D0` and its manifest are frozen;
- identical dependency lockfiles and environment configuration;
- no shared writable caches except explicitly measured package caches;
- no access to the other arm's diff or results;
- no production environment variables;
- mocked provider/network boundaries only; and
- teardown only after raw results and tree hashes are captured.

The worktrees are registered to the FreshProof repository even though their directories
live outside its root checkout. This avoids adding experiment files to existing dirty
checkouts.

### 8.6 Controlled implementation packet

Every paired arm receives byte-identical task content:

- exact baseline commit and worktree;
- goal and non-goals;
- allowed/excluded paths;
- singular requirements and bidirectional traceability schema;
- approved architecture proof and design-resolution packet;
- accepted proof plan;
- retrieved invariant subset and registry/selection hashes;
- generated effect-surface inventory;
- authority/effect diagram and trust boundaries;
- coherent-tamper, lifecycle, worker-progress, state-transition, and negative-test
  matrices as applicable;
- visible verification commands;
- stop and escalation conditions; and
- maximum execution/remediation budget.

Runtime wrappers may only specify the model invocation and packet location. They may
not add hints, acceptance criteria, or solution guidance.

### 8.7 Preventing benchmark leakage

- Visible tests prove the explicit contract.
- Held-out tests probe adjacent reachable paths and are injected only by the verifier.
- Tracer 7 has no prior solution commit; neither arm may inspect the sibling branch,
  worktree, prompts, process output, or artifacts.
- Review packets are labeled Arm A/Arm B and stripped of model-identifying metadata.
- Reviewers do not see timing results until verdicts are finalized.
- Arm start order is randomized; resource contention is avoided by measuring model and
  test phases separately or running the active builder phases serially.
- Any cross-arm contamination invalidates the comparison and requires both arms to
  restart from the frozen baseline.

### 8.8 Identical review topology

Every initial and remediated arm is reviewed by:

- the same deterministic verifier and held-out checks;
- one blinded Claude Opus 4.8 security/concurrency/integrity review; and
- one blinded fresh-context Sol correctness/scope review.

The Sol implementer arm therefore has same-family review in one lane, but Opus supplies
the required cross-family independence. Both arms receive the exact same topology.
Fable is used only if the two reviewers disagree about an architectural premise; such
adjudication is recorded separately and cannot silently change one arm's task.

Each reviewer must reproduce the frozen candidate hashes and return a binary
`satisfied`/`violated`/`not-verifiable` verdict for every applicable requirement and
selected invariant. Holistic scores, approval counts, and prose confidence are not
primary evidence. Deterministic checks and concrete, reproducible findings outrank an
LLM's general approval.

### 8.9 Standardized remediation policy

- Initial implementation call.
- Review/verification round 1.
- At most one consolidated remediation call to the same implementer route.
- Review/verification round 2.
- If blocking findings remain, the arm is recorded as not accepted within budget.

Environmental failures may receive one exact retry from the clean baseline. Quality
failures do not receive extra retries.

### 8.10 Metrics

Primary metrics:

- active builder plus remediation time to independently accepted snapshot;
- accepted within the two-round budget;
- P0 and P1 findings on the initial patch; and
- held-out test failures on the initial patch;
- percentage of requirements satisfied by the initial candidate; and
- unapproved architecture, authority, effect-surface, or scope deviations.

Secondary metrics:

- time to first patch;
- implementation and remediation model time;
- deterministic test time and reviewer time, recorded separately;
- number of review rounds;
- P2 findings;
- newly discovered invariant classes;
- scope violations and unexpected files;
- diff size and churn between initial and accepted patch;
- test additions and mutation/negative-case quality where measurable;
- plan-deviation or escalation events; and
- token/quota/cost evidence available from each route.

Time is split into infrastructure, implementation, verification, review, and remediation
so environment failures are not misreported as model-quality differences. Shared
Tracer 7 design time is reported once and is not charged to either builder arm.

Objective behavior is judged by code-based checks wherever possible. LLM reviewers are
used for narrowly defined architecture, security, correctness, and scope claims, with
binary requirement-level evidence. The user's integration decision remains the final
human gate.

### 8.11 Tracer 7 viability and routing decision rule

Composer is viable for similarly bounded, design-approved implementation when its
Tracer 7 arm:

- is accepted within the same two-round budget as Sol;
- has zero residual P0/P1 findings;
- satisfies and traces every requirement;
- introduces no unapproved scope, tenant, authority, effect-surface, or architecture
  deviation;
- passes the same visible and held-out checks; and
- stops and escalates when the proof packet is incomplete instead of improvising.

The **Composer-on-Cursor route** becomes provisionally viable for similar Tracer-style
work only if it is viable, its initial and accepted severity profile is no worse than
native Sol's, and it needs no more intervention or review/remediation generations.
Lower builder-plus-remediation time may strengthen that route-level result but is not a
causal model-superiority claim.

Interpretation is predeclared:

- both arms pass and Composer-on-Cursor has no worse primary-gate burden: record that
  route as provisionally viable for similar proof-complete tracers;
- both pass but order effects or route-level timing dominate interpretation: record
  viability and keep performance conclusions inconclusive;
- Composer is faster but has worse correctness, traceability, or design adherence: do
  not promote it;
- the shared design packet is incomplete: classify the run as a harness/design failure,
  not a builder failure; and
- the environment, snapshot, packet, or review topology is not reproducible: classify
  the comparison as inconclusive.

Because Tracer 7 is one paired task with a runtime/producer confound, a win establishes
provisional eligibility of the complete Composer-on-Cursor route, not Composer model
superiority or a universal routing default. A general default requires later paired
evidence or production telemetry across representative task classes. Native Sol High
remains the control builder and planner; Fable remains architecture critic; Opus
remains security critic.

If both candidates pass, candidate selection uses, in order: lower initial P0/P1
burden, fewer design deviations, fewer remediation rounds, faster active builder time,
and smaller unexplained churn. Integration still requires user approval and the normal
FreshProof commit/PR gates.

Any later routing change affects only the bounded implementation row in
`routing/model-routing.md`; independent review remains mandatory.

### 8.12 Experiment artifacts and privacy boundary

Durable public-safe artifacts here:

```text
ai-os-template/experiments/YYYY-MM-DD-composer-vs-sol-backend/
  brief.md
  protocol.md
  packet-template.md
  results.schema.json
  arms/tracer7/<blind-arm>/results.md
  comparison.md
```

FreshProof-private artifacts:

- benchmark manifest;
- baseline refs or bundles;
- task packets containing proprietary file paths or code context;
- visible and held-out evaluator tests;
- raw diffs; and
- full reviewer outputs that quote private code.

The skills-repo comparison records task aliases, model versions, timings, counts,
verdicts, and sanitized reasoning. It does not copy proprietary FreshProof source or
patches into a potentially public harness repository.

## 9. Verification strategy for the harness change

Before FreshProof dogfood:

- schema positive/negative fixtures;
- singular-requirement and bidirectional-traceability fixtures;
- architecture-proof completeness fixtures for decision contracts, sibling maps,
  coherent-tamper, lifecycle, and worker-progress matrices;
- deterministic inventory fixtures;
- invariant retrieval recall and context-budget fixtures;
- byte-stability test for generated manifests;
- design-packet and requirements-matrix hash reproduction tests;
- snapshot-mismatch rejection test;
- incomplete-proof-plan rejection test;
- new-surface-after-implementation test;
- parallel-review consolidation fixture;
- contradictory-review precedence and escalation fixtures;
- missing/duplicate finding rejection in fan-in output;
- duplicate-finding normalization fixture;
- repeated-root second-rejection forced-stop and replacement-architecture fixture;
- review-unit size and dependency-boundary fixtures;
- retrospective Tracer 6 architecture/security fixture containing known
  authority-root and sibling-path defects;
- reviewer-output validation requiring binary requirement/invariant verdicts rather
  than a holistic score;
- invariant extraction, idempotency, deduplication, and promotion fixtures; and
- no-auto-edit/no-auto-approval guard tests.

Human review checks:

- the invariant catalog remains small and canonical;
- retrieval preserves all applicable high-risk rules without sending the flat registry;
- task artifacts do not duplicate durable docs;
- coverage claims clearly distinguish exact, heuristic, and unresolved inventory;
- thresholds guide splitting without becoming arbitrary approval loopholes;
- Tracer 7 conclusions distinguish a single-task viability result from evidence for a
  general routing default; and
- public experiment artifacts reveal no private code or credentials.

## 10. Rollout and rollback

### Rollout

1. In the product-integration task, recover the exact 52-path `T6`, reconcile it with
   pinned main under the architecture firewall, and run integration verification plus
   fresh-context correctness/security review.
2. Concurrently in this task, implement and independently review generic template
   Phases A-E in the `skills` repository without changing FreshProof or default routing.
3. Freeze product baseline `B0`; merge or otherwise freeze `HT` only after the schema,
   inventory, retrieval, design-review, fan-in, circuit-breaker, and extraction fixtures
   pass.
4. At HITL gate 1, reproduce and accept `B0`, then acquire FreshProof instance-write
   authority.
5. Refresh the existing clean `ai-os-instance` worktree onto `B0`, apply exact `HT` as
   `HI`, and update the lean `AGENTS.md` plus `plans/` binding.
6. Verify old-instance-to-new-instance and template-to-instance parity; rerun product
   and harness gates; freeze clean post-harness baseline `H0`.
7. At HITL gate 2, accept `H0` and run the non-production apparatus rehearsal.
8. Run the Tracer 7 design gate: Sol plan, parallel Fable architecture and Opus
   security reviews, deterministic validation, and one resolved remediation contract.
9. Freeze design packet `D0`, including the approved architecture proof, requirements
   matrix, selected invariants,
   verification plan, baseline, and builder packet by hash.
10. At HITL gate 3, approve `D0` and the execution budget, then run the blinded Composer
    2.5-on-Cursor and native-Sol Tracer 7 builder routes from the exact same
   frozen baseline and packet.
11. Independently verify, review, resolve, and compare both frozen candidates under the
    same two-round policy.
12. At HITL gate 4, ask the user to select or reject an integration candidate; route
    any selection through normal FreshProof commit/PR gates.
13. Record only provisional Composer eligibility if the Tracer 7 decision rule passes;
    require later evidence before a universal routing default.

### Rollback

- Schemas and templates are additive and can remain as non-blocking documentation.
- Inventory enforcement can revert from blocking to advisory without deleting evidence.
- Review convergence can fall back to the existing review workflow while preserving
  findings and coverage records.
- No model-routing default changes automatically from the Tracer 7 experiment.
- Either experiment candidate may be discarded without affecting the verified
  FreshProof harness update, historical Tracer 6 evidence, product baseline `B0`, or
  post-harness baseline `H0`.
- Experiment worktrees and refs are disposable after evidence capture; production
  branches never depend on their commits.

## 11. Definition of done

The improvement project is complete when:

- the five artifact classes exist with validated schemas/templates;
- the TypeScript/Convex inventory and retrieval adapter is deterministic, reports
  unknowns, and avoids flat-registry injection;
- spec, TDD, review, commit, and routing contracts use the new artifacts coherently;
- High-tier work has slice-size, frozen-snapshot, coverage, and convergence gates;
- parallel reviews fan into one validated, non-contradictory remediation contract;
- novel reproduced findings are automatically captured in the candidate registry;
- the FreshProof harness instance matches the reviewed template and passes its local
  fixtures without production mutation;
- product baseline `B0` preserves the accepted Tracer 6 source identity, current-main
  architecture firewall, conflict ledger, and passing integration gates;
- post-harness baseline `H0` preserves `B0` product semantics and binds exact `HT`/`HI`
  provenance plus passing harness fixtures;
- Tracer 7 clears an exact-snapshot Fable architecture and Opus security design gate
  before either builder writes production code;
- the paired Tracer 7 experiment is run exactly as approved or recorded as
  inconclusive/infeasible;
- results are sanitized and durable in the skills repo;
- any provisional routing decision cites the experiment, states the `n=1` limitation,
  and preserves Sol/Fable/Opus authority; and
- deferred ideas remain explicitly out of v1 rather than being implemented implicitly.

## 12. Proposed approval gates

The user reviews and approves separately:

1. this proposal and v1 scope;
2. product baseline `B0` and its integration ledger, which triggers FreshProof harness
   installation;
3. generic template `HT`, FreshProof instance `HI`, and post-harness baseline `H0`,
   which triggers the apparatus rehearsal and Tracer 7 design gate;
4. complete design packet `D0` after Fable/Opus review and fan-in resolution, plus the
   paired-builder execution budget;
5. integration of either blinded Tracer 7 candidate after results are revealed; and
6. any provisional or later general routing-matrix promotion.

Approval of one gate does not imply approval of later execution, branch publication,
deployment, production mutation, or provider spend.
