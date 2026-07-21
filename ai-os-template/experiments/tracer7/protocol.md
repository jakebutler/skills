# Tracer 7 paired routing-stack protocol

Status: template protocol; instantiate in FreshProof only after HT is installed and the
post-harness baseline is frozen.

## Question and decision boundary

Can the Composer 2.5-on-Cursor builder route complete a proof-required backend tracer
with no worse correctness, security, intervention, or convergence outcome than the
native Sol control route, while Sol owns shared planning/resolution and independent
models own blinded review?

This is an end-to-end paired builder-route experiment, not a pure model-isolation A/B
test. Model, runtime, producer surface, authentication path, and orchestration mechanics
move together. Runtime/producer surface is an intentional fixed confound. A result may
establish provisional viability of Composer-on-Cursor for similarly proof-gated slices;
it cannot prove Composer model superiority, attribute a speed difference solely to the
model, or establish a universal default. One tracer still requires replication.

## Frozen checkpoints

1. **B0:** user-approved integrated Tracer 6 product baseline.
2. **HT:** independently reviewed harness-template checkpoint.
3. **H0:** FreshProof B0 plus exact HT installation, with no Tracer 7 design or build.
4. **D0:** H0 plus the approved Tracer 7 requirements, inventory, invariant selection,
   architecture/security reviews, resolution, proof plan, and builder packet. D0 is
   the exact start commit for both arms.

Any change to D0, approved packet/config hashes, prompt bytes, allowed paths, ignored
policy, environment-name set, evaluator commands, budgets, or intervention policy after
an arm begins is an invalidation event. Re-freeze both routes or record the pair as
non-comparable.

## Shared design dogfood gate

Before either builder writes product code:

1. Enumerate reachable effects and bypasses with generated plus manual reconciliation.
2. Retrieve the scoped invariant set; do not inject the flat registry.
3. Freeze one design candidate and run architecture and security review against the
   same exact identity and requirement matrix.
4. Resolve every source finding exactly once into one coherent design change list.
5. Apply at most one consolidated design remediation generation; any material change
   creates a new exact candidate and requires re-review.
6. Run one residual adversarial design review and preserve novel-finding governance.
7. Approve the builder packet only with no unresolved High-risk requirement.

## Paired routes and fixed controls

| Property | Native control route | Experimental route |
|---|---|---|
| Runtime/producer | Ephemeral native `codex exec` with prepare/run/finalize | Cursor Agent hardened runner |
| Model | `gpt-5.6-sol` | `composer-2.5` |
| Reasoning | high | Cursor route setting supplied by the installed model |
| Authentication | native Codex subscription access | Cursor subscription access |
| Filesystem read boundary | minimal runtime, workspace, and visible evaluators | trusted host; external reads allowed and recorded |
| Start | D0 | D0 |
| Prompt and builder packet | byte-identical | byte-identical |
| Allowed paths and ignored policy | identical | identical |
| Evaluator command vectors and budgets | identical | identical |
| Intervention policy | identical | identical |
| Post-build review | blinded, independent | blinded, independent |

The non-model route differences above are not controlled away and must remain visible
after unblinding. No fallback is allowed inside either arm. Route failure is an outcome,
not permission to relabel or substitute another surface. A pre-inference environmental
failure may receive one separately identified retry from the exact clean baseline after
the environment is repaired; both attempts remain evidence.

Prepare two clean isolated worktrees at D0, assign distinct approved run nonces, and
install dependencies before timing. Paired validation rejects equal canonical
repositories or Git worktree identities. Run
active builder phases serially in a pre-recorded randomized order. Record order and
warm-cache bias. Elapsed time is secondary and must be split from preparation, checks,
review, and remediation.

## Producer contracts

### Composer-on-Cursor

`run-builder-arm.mjs` accepts only `composer-2.5`. The executable, flags, and scrubbed
environment are runner-owned. Configs cannot add executables, prefix arguments, or
environment values. The runner emits a nonce-bound result receipt and rejects config
drift, HEAD/index/ref escape, out-of-scope writes, ignored-file drift, prompt drift,
evaluator identity drift, or any repository mutation caused by checks.
Once model execution starts, every terminal check outcome is written as a canonical
hash-receipted result before the runner returns a nonzero process status. A failed check
is evidence, not an exception-shaped hole in the experiment record. When an earlier
scope or Git-control violation prevents evaluator execution, the result preserves the
approved command vector with `skipped: true` and `null` status for every deliberately
skipped check. A timeout-killed evaluator instead records `timed_out: true`, preserving
the distinction while remaining a validator-readable `checks-failed` outcome. An
evaluator terminated by a signal without a harness timeout records that signal as a
third executed-failure outcome rather than being confused with either case.

### Native Sol-on-Codex

Follow `native-builder-orchestration.md` exactly:

1. deterministic prepare validates the separately approved native config and emits a
   canonical source-bound root packet plus a separately stored minimal worker packet
   containing embedded prompt bytes and no held-out/evidence paths;
2. the parent runner launches one ephemeral `gpt-5.6-sol` `codex exec` process at high
   reasoning, sends worker bytes over stdin, and disables multi-agent/tools/config
   surfaces that could expand the capability; a custom permission profile limits reads
   to minimal runtime paths, the repository, and exact visible-check executables while
   denying network, held-out, sibling, and root-evidence access;
3. the parent captures the actual CLI/session/transcript/process identities and writes
   external completion and attestation records; and
4. deterministic finalization binds the packet, completion, route provenance, exact
   start/end source state, worktree identity, prompt/evaluator/environment identities,
   scope/ignored state, interventions, and check results into
   the only admissible native result.

The parent runner owns evidence and finalization. The native worker may not commit, stage,
switch refs, push, publish, deploy, migrate, access production, inspect held-out source,
or modify external state.

Each route atomically claims its canonical run identity before model launch. Native
finalization separately claims its identity before executing evaluators. A duplicate,
including a concurrent duplicate, must fail before model launch, check execution, or
log writes; result validation reopens and hash-checks those external claim artifacts.

The CLI supplies an auditable session/transcript/process identity, not a cryptographic
provider signature. The apparatus detects missing, inconsistent, stale, replayed,
cross-wired, wrong-route, failed, or repository-divergent evidence. It hash-binds the
launch contract, disables descendant-agent tools, denies sandboxed command network,
and explicitly attests the temporary-directory scratch required by the visible test
toolchain. Trust in the local parent process and HITL remains explicit; any observed
breach invalidates the run.

## Held-out and leakage controls

Held-out evaluator source stays outside both builder worktrees and outside the minimal
native worker packet. It runs only after each builder exits. Its resolved executable
bytes, command vector, and execution-environment digest are content-bound in the root
control packet and rechecked around execution. A committed D0 test is visible, not
held-out. The native route enforces read denial. The Composer route is explicitly
trusted-host and can technically read external paths; those paths are not disclosed in
its prompt, and transcript evidence plus HITL review must show no observed sibling,
route-output, transcript, or held-out inspection. Any observed cross-arm contamination
invalidates both arms. The experiment must not claim mechanical Composer blindness.

A held-out evaluator that inspects source structure must implement
`--proof-harness-self-test`. Its self-test must execute both known-positive semantic
variants (including named constants or equivalent indirection) and a known-negative
variant. Lexical proximity, formatting, declaration order, or one exact source spelling
cannot be the oracle. The apparatus runs the content-bound evaluator self-test before
model launch, records the result, and requires identical self-test command vectors in
both arms. Full-suite or runtime-only evaluators may leave this vector empty only when
no source-shape assertion is made.

## Intervention and invalidation policy

- Builders may ask questions but receive no model-specific coaching. A shared answer
  that changes the contract invalidates D0 and requires fresh arms.
- Record clarification, restart, timeout, harness failure, manual edit, packet
  invalidation, and environment drift as explicit intervention events.
- Unrecorded manual editing, out-of-scope writes, HEAD/index/ref mutation, ignored
  drift, producer-version mismatch, and failed/timeout runs cannot finalize as success.
- A `checks-failed` result may seed at most the predeclared number of remediation
  generations. The next config must hash-bind that exact terminal parent, start from its
  exact dirty working state, preserve route/scope/check/budget controls, use the direct
  next generation number, and write evidence beneath a generation-specific directory.
- A newly exposed surface or architecture/security decision stops the arm and returns
  to the shared design gate.
- No builder may commit, push, publish, deploy, migrate, or access production.

## Evaluation

Primary viability gates are deterministic and binary:

- identical content-addressed visible/held-out execution manifests pass with status zero;
- no unresolved P0/P1 correctness or security finding;
- no harness bypass, source-identity mutation, scope violation, ignored drift, or
  unapproved design decision;
- every requirement is satisfied and bidirectionally traced;
- the builder packet remains valid; and
- the candidate reaches approval inside the same predeclared review/remediation budget.

Secondary measurements include builder/remediation duration, time to first and final
green, initial finding burden, intervention count, review generations, churn, and
available quota/cost evidence. Speed is diagnostic; the protocol never attributes a
route-level speed difference solely to model quality.

After deterministic validation, create private neutral candidate labels. Reviewers see
only the labeled diff, D0 packet, deterministic evidence, and rubric. They must not see
model, runtime, producer, transcript, duration, route order, or sibling output before
scores and findings are frozen. Run the same requirement-level architecture/security
lenses and resolver fan-in for both candidates.

Before scoring, run `validate-paired-builder-controls.mjs`. It verifies exact route
bindings, route-specific producer receipts, exact result paths, distinct worktrees and
run nonces, while requiring equality of baseline, prompt, scope, ignored baseline,
environment digest, evaluator manifests, evaluator self-tests, remediation generation,
and budgets. It can authenticate completed, failed, and remediated terminal results;
only a pair of completed results at the same generation is eligible for blinded scoring. Runtime
and agent version are intentionally not equal and are reported as confounds.

## Decision rule

- **Not viable:** the Composer-on-Cursor route fails a primary gate or requires worse
  blocker/security, intervention, design-discovery, or remediation burden.
- **Apparatus or pair inconclusive:** a packet, producer, source identity, evaluator,
  blindness, or control is not reproducible; do not turn missing parity into a score.
- **Provisionally viable:** both routes pass; Composer-on-Cursor is no worse on primary
  gates and stays within identical intervention/review budgets. Any speed advantage is
  supportive route-level evidence only.

A successful single tracer may authorize only a bounded Composer-on-Cursor route for
similarly crisp proof-gated slices. It cannot prove model superiority or a general
backend default. Replication or representative production telemetry is required for a
broader routing change. Candidate integration and any routing change remain separate
HITL decisions after unblinding.
