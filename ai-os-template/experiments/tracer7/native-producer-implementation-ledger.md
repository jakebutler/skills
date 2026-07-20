# Native Sol producer implementation ledger

Date: 2026-07-20

Scope: generic template producer, source-bound attestation/finalization, paired routing
controls, experiment-claim correction, and disposable apparatus rehearsal only.

## TDD record

| Boundary | RED evidence | GREEN behavior |
|---|---|---|
| Missing native producer packet | `tests/paired-controls/run.mjs` first failed because the old comparator accepted a hand-written Sol-looking result. | Native results require a hashed invocation packet, attestation, completion evidence, and single-use finalize receipt; paired validation reopens and cross-checks them. |
| Exact native route | The producer module did not exist and wrong-model/reasoning fixtures failed at import/implementation boundaries. | Prepare/finalize accept only `gpt-5.6-sol` with `high` reasoning; legacy `gpt-5.6-sol-high` labeling is rejected. |
| Completion binding | Finalization initially had no completion evidence contract. | Missing/mismatched completion hashes, incomplete status, cross-run task IDs, and working-state mismatches fail closed. |
| Cross-wiring/replay | Before native finalization there was no way to bind experiment, worktree, prompt, baseline, config, or run identity. | Fixtures reject each mismatch and a second finalize of one invocation. |
| Git/scope/ignored state | The existing Cursor runner did not detect a ref switch at the same commit. | Both routes enforce HEAD, index tree, symbolic ref/target, allowed paths, and ignored before/after state; fixtures cover HEAD, index, ref, out-of-scope, and ignored drift. |
| Route exclusivity | Cursor still accepted legacy `gpt-5.6-sol-high`. | Cursor accepts only Composer 2.5; paired validation rejects Sol-through-Cursor and Composer-through-native. |
| Controls and versions | The old comparator equated runtime versions yet omitted explicit intervention/remediation budgets. | Runtime/version are intentional confounds; baseline, prompt, scope, ignored baseline, environment names, visible/held-out command vectors, timeouts, intervention budget, and remediation budget must match. Producer/finalizer versions are pinned. |
| Failed/intervened runs | A native-looking status could be hand-authored without execution evidence. | Failed/timeout status, manual edits, unrecorded working-state changes, or intervention-budget excess cannot finalize as success. |
| Review remediation: worker leakage and prompt TOCTOU | Architecture review showed the full packet exposed held-out/evidence paths and a mutable prompt path could diverge after prepare. | Prepare now emits a minimal worker packet with embedded prompt bytes and no held-out/evidence paths; attestation/completion/finalize bind its hash and the independently observed prompt hash. |
| Review remediation: evaluator mutation/identity | Architecture and security reviews showed checks ran after the last state snapshot and only argv was controlled. | Both routes bind resolved executable bytes plus environment digest and revalidate the complete Git/scope/ignored/content state and evaluator manifest after each check phase. |
| Review remediation: synthetic paired evidence | The original paired positive fixture hand-built incomplete evidence and accepted missing check statuses. | The positive fixture now consumes real Cursor producer and native prepare/finalize outputs; validator requires status zero, exact result/receipt paths, distinct worktrees/nonces, and live executable identity. |

Initial baseline command: `npm run test:proof-harness` passed before changes. Final GREEN
command: `npm run test:proof-harness`, including the new native builder fixtures, plus
syntax checks for all five builder scripts and JSON parsing for every schema/template.

## Live rehearsal

The exact live identities and outcomes are recorded in
`native-sol-rehearsal-2026-07-20.json`. The native collaboration run completed and both
checks passed. The first Cursor attempt stopped before inference on authentication; it
was preserved, the user reauthenticated, and one distinct clean-baseline retry completed.
The paired comparator accepted the exact controlled fields and equal output state.

## Trust boundary

The deterministic apparatus rejects absent, inconsistent, stale, replayed, cross-wired,
wrong-route, failed, or repository-divergent evidence. Codex currently supplies an
auditable canonical collaboration task but no cryptographic provider signature or
opaque agent ID through the roster. The root orchestrator's truthful recording of the
actual call therefore remains an explicit HITL-reviewed trust root.
