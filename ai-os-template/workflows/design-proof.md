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
- `design-review-coverage.json`
- `design-review-resolution.json`
- generated human review views under `rendered/`

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
8. Validate the candidate locally against the live clean repository: reproduce the
   baseline commit/tree, regenerate the adapter inventory, and recompute invariant
   selection from the bound index before structural validation. `--fixture-only` is
   reserved for template contract tests and is not an instance gate. Then generate
   `design-snapshot.json` from the exact
   raw bytes of requirements, effect inventory, invariant selection, architecture
   proof, and proof plan. Raw review output is excluded from the candidate hash.
9. Dispatch architecture and security reviews concurrently. Both receive the same
   baseline, candidate hash, requirements hash, selected invariants, inventories, and
   assigned questions. Preserve each provider/task run ID and transcript hash; record
   independently observed start/end candidate hashes rather than a bare self-attested
   boolean.
10. Require binary `satisfied`, `violated`, or `not_verifiable` verdicts for every
    assigned requirement from blocking reviewers. A reviewer that cannot reproduce the
    candidate hash is recorded with `authority: advisory`; its findings still enter
    exactly-once resolver fan-in but cannot supply required approval.
11. Run the read-only review resolver. It validates identity, normalizes and clusters
    findings, maps every source item exactly once, detects conflicts, applies the
    precedence policy, and emits one resolution contract.
12. Sol remediates the design contract, not production code. A change to authority,
    requirements, or the architecture decision creates a new candidate hash. Missing
    implementation coverage that fits the same design joins the consolidated code
    batch and does not reopen design.
13. After architecture and security approval of the same exact candidate, compute the
    approved builder-packet hash from the candidate identity, exact review-coverage
    bytes, and a stable canonical form of the resolution contract with the hash field
    excluded. Store the result in the resolution. Only a reproducible packet may enter
    `implement-tdd`.

## Bounded convergence

- First concurrent review produces one resolution contract.
- The same architecture version may receive one remediation and re-review.
- A second verdict with the same root-cause class invalidates that architecture version
  and forces a replacement decision contract or smaller review unit.
- A new trust root, effect boundary, lifecycle model, or requirement set creates a new
  architecture version. A sibling path does so only when it changes the approved
  authority or lifecycle model.
- After three frozen design versions without approval, report `blocked` with the
  unresolved decision graph and require HITL before more review spend.
- Stable finding and requirement IDs carry obligations forward across versions.

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
- Reviewer quota/auth/model failure: disclose it and stop or request HITL; never silently
  weaken a project-pinned review role.
- Conflicting valid directives: route the compact conflict to Sol plus the bound
  architecture role or user. Do not send both directives to an implementer.
- A new design decision or contradiction discovered during implementation: revoke the
  builder packet and return here. Missing implementation coverage inside the approved
  design is corrected in one batch without restarting design-proof.
