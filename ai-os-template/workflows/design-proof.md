# Design Proof Workflow

## Trigger

Run this workflow before production implementation only when a change introduces or
materially alters authorization, tenant isolation, destructive or externally
persistent effects, migration semantics, concurrency ownership, historical authority,
or another hard-to-reverse architecture boundary.

Touching sensitive code is not enough. A narrow defect fix, test, refactor, or missing
sibling implementation path that preserves an approved contract stays in the normal
batched implementation workflow. If no exact new authority or irreversible decision
can be named, do not enter design-proof.

The project instance resolves artifact paths, validation commands, invariant registry,
inventory source, and review roles from its machine-readable proof-harness binding.
Never inject the flat invariant registry into an agent prompt.

## Inputs

- Exact baseline commit and tree identity.
- Scope firewall and approved task goal/non-goals.
- Generated effect-surface inventory plus a manually reconciled planner inventory.
- Surface-selected invariant packet, registry hash, selection reasons, and unresolved
  domains.
- Project-specific architecture and security review-role bindings.

Until the deterministic inventory adapter is installed, a project may use a manually
produced inventory only when the packet records that provenance and a fresh reviewer
reconciles every row. An unresolved High-risk surface fails closed.

The dependency-free TypeScript/Convex adapter is a deterministic heuristic index, not
an AST completeness oracle. It marks emitted rows `heuristic`, inventories callable
queries, database reads/writes, internal calls, schedules, storage, fetches, and scans,
and fails on dynamic targets or database aliases it recognizes. Planner enumeration
and independent reviewer reconciliation remain mandatory for aliased, computed,
framework-generated, or otherwise unresolved paths.

## Canonical artifacts

Under `{{TASK_DOCS_DIR}}/{{TASK_ID}}/`:

- `requirements.json`
- `effect-surfaces.json`
- `invariant-selection.json`
- `architecture-proof.json`
- `proof-plan.json`
- `design-snapshot.json`
- `proof-review-state.json`
- `design-review-coverage.json`
- `design-review-resolution.json`
- generated human review views under `rendered/`

Canonical names are unversioned and only one complete candidate generation may be
active. Preserve superseded history in Git, PR review, compact dispositions, or CI
artifacts rather than retaining `v1` through `vN` packets beside the active packet.
JSON is canonical. Rendered Markdown is a disposable, freshness-checked view and never
an independently editable source of truth.

## Steps

1. Freeze baseline identity and task scope.
2. Enumerate every reachable public, internal, direct, scheduled, retry, recovery,
   census, quarantine, and post-retirement path to a sensitive effect.
3. Reconcile generated and planner inventories. Unknown or unclassified High-risk
   surfaces block the workflow.
4. Retrieve the smallest applicable invariant subset from surface metadata, always
   including rules marked `always_apply`. Record inclusions, exclusions, dependencies,
   registry hash, query features, and unresolved coverage.
5. Write singular requirements with stable IDs. Every requirement names affected
   surfaces, an exact verification method, allowed result, and denial-without-effects
   result.
6. Write the architecture proof:
   - authority/effect diagram and trust boundaries;
   - immutable root, canonical projection, cardinality, creation anchor, lifecycle,
     fail-closed result, and enforcement point per decision;
   - complete sibling-path map;
   - coherent-tamper, lifecycle, and worker-progress matrices when applicable; and
   - small review units plus dependency DAG.
7. Write the proof plan mapping every reachable surface and every requirement in both
   directions to invariants, enforcement points, negative evidence, and integration
   evidence. Orphan effects or requirements block.
8. From the live clean baseline, regenerate the adapter inventory, recompute invariant
   selection from the bound index, generate `design-snapshot.json` from the exact raw
   bytes of the five semantic candidate files, and render the review views. Do not run
   the post-review approval validator yet: it requires completed review coverage and
   resolution. `--fixture-only` is reserved for template contract tests and is not an
   instance gate. Raw review output is excluded from the candidate hash.
9. Run the deterministic pre-review command. It must pass placeholder and stable-ID
   checks, reciprocal mappings, source bindings and generator compatibility, active
   generation and packet budgets, rendered freshness, unresolved inventory, resolution
   references, convergence state, process receipts, and reviewer transport preflight.
   This gate consumes no model review round.
10. Dispatch architecture and security reviews concurrently. Both receive the same
   baseline, candidate hash, requirements hash, selected invariants, inventories, and
   assigned questions. Preserve each provider/task run ID and transcript hash; record
    independently observed start/end candidate hashes rather than a bare self-attested
    boolean. Record the selected preflight probe identity as
    `transport_probe_run_id` in each blocking coverage row.
11. Require binary `satisfied`, `violated`, or `not_verifiable` verdicts for every
    assigned requirement from blocking reviewers. A reviewer that cannot reproduce the
    candidate hash is recorded with `authority: advisory`; its findings still enter
    exactly-once resolver fan-in but cannot supply required approval.
12. Run the read-only review resolver. It validates identity, normalizes and clusters
    findings, maps every source item exactly once, detects conflicts, applies the
    precedence policy, and emits one resolution contract.
13. Sol remediates the design contract, not production code. A change to authority,
    requirements, or the architecture decision creates a new candidate hash. Missing
    implementation coverage that fits the same design joins the consolidated code
    batch and does not reopen design.
14. After architecture and security approval of the same exact candidate, compute the
    approved builder-packet hash from the candidate identity, exact review-coverage
    bytes, and a stable canonical form of the resolution contract with the hash field
    excluded. Store the result in the resolution, then run the bound final validator.
    It must reject placeholders and rebind every blocking review to the exact pinned
    request, reviewer policy, eligible transport probe, and retained probe identity.
    Only a reproducible validated packet may enter `implement-tdd`.

## Bounded convergence

- `v1` is the initial candidate, `v2` is the sole remediation/re-review, and `v3` is a
  final replacement decision contract or smaller review unit.
- `v4` or later is refused unless `proof-review-state.json` contains a HITL continuation
  binding actor, timestamp, reason, unresolved decision class, and newly authorized
  direction. Reviewer or resolver prose cannot substitute for this record.
- Repetition of an unresolved root-cause class fails closed instead of creating another
  complete candidate.
- A new trust root, effect boundary, lifecycle model, or requirement set creates a new
  architecture version. A sibling path does so only when it changes the approved
  authority or lifecycle model.
- After three frozen design versions without approval, report `blocked` with the
  unresolved decision graph and require HITL before more review spend.
- Stable finding and requirement IDs carry obligations forward across versions.

The semantic authority identity covers requirements, trust roots, authority rules,
effect boundaries, cardinality, lifecycle, persistence grammar, and denial semantics.
The provenance identity covers review/run IDs, URLs, explanatory wording, rendered
views, and correction-ledger metadata. Provenance-only correction changes the latter
without revoking semantic approval; a semantic identity change requires fresh bound
architecture/security approval.

Default packet budgets are 5 MiB, 50,000 generated lines, one active complete
generation, and a warning when generated artifacts exceed 70 percent of the proposed
diff. The deterministic gate derives diff bytes from the bound repository, including
untracked files; task state cannot self-report a smaller ratio. Exceeding a limit requires a narrow exception binding actor, timestamp, reason,
budget name, and authorized limit. Legacy packets may receive an explicit read-only
exemption; they are never regenerated merely to adopt this policy.

Record time to first meaningful RED or production edit, candidate and full-review
counts, broad-suite count/duration/boundary, generated size/diff ratio, and any SHAs
invalidated by provenance-only changes. Emit a concise checkpoint after 90 minutes
without RED/code, before a second remediation, or before a third unchanged-boundary
broad run. The checkpoint names the unresolved decision, blocker, smallest next action,
and whether HITL is actually required.

## Output contract

The workflow succeeds only when:

- all canonical artifacts validate;
- inventories reconcile with no unresolved High-risk surface;
- requirements and proof traces are complete and bidirectional;
- architecture and security reviewers approved the same exact candidate;
- one resolution includes every source review item exactly once and has no unresolved
  blocking conflict; and
- any finding retained in an approved packet is P2/P3 and terminally rejected with
  evidence or deferred to a named owner; no accepted change remains; and
- `design-review-resolution.json` records an approved builder-packet hash.

The implementation handoff contains the approved packet, not raw reviewer prompts.

## Failure handling

- Missing or stale artifacts: regenerate and refreeze; old verdicts remain historical.
- Reviewer transport preflight verifies tool availability, authentication, exact model,
  effort, read-only capability, and provider/task-run identity capture before dispatch.
  An equivalent authenticated transport with the same model and effort may replace an
  unavailable wrapper; otherwise fail before waiting on review. Final validation
  repeats that binding from current state and the retained coverage probe identity.
- Conflicting valid directives: route the compact conflict to Sol plus the bound
  architecture role or user. Do not send both directives to an implementer.
- A new design decision or contradiction discovered during implementation: revoke the
  builder packet and return here. Missing implementation coverage inside the approved
  design is corrected in one batch without restarting design-proof.
