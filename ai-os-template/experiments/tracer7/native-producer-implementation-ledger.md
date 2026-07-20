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
| P1 remediation: per-check state | A first evaluator could mutate the repository and a later evaluator could restore it before the phase snapshot. | Both routes snapshot repository state and re-hash the evaluator manifest immediately after every individual check; mutate-then-restore fixtures fail before the restoring check runs. |
| P1 remediation: atomic replay claims | A duplicate Composer identity ran the agent and overwrote logs before detecting the existing result/receipt; an exact-candidate review then showed that existence preflight alone had a concurrent check-then-launch race. | Composer execution, native execution, and native finalization each create a canonical file with exclusive-create semantics before agent launch or evaluator execution. Sequential and concurrent fixtures prove that one identity launches/finalizes at most once, and paired validation reopens and hash-binds every claim. |
| P1 remediation: resolved containment | A lexically external output path could be a symlink resolving into the builder repository. | Config, evaluator, output, evidence, attestation, completion, transcript, result, and receipt boundaries resolve existing symlink ancestors before use; fixtures prove rejection before writes. |
| P1 remediation: root evidence disclosure | The collaboration worker received a packet path adjacent to the full root packet and could infer root-only evidence. | Worker capability material is stored separately, exact worker bytes are delivered over stdin, and the v3 permission profile denies reads outside minimal runtime paths, the repository, and exact visible-check executables. |
| P1 remediation: descendant agents | The collaboration worker could itself spawn another agent, defeating the one-agent condition. | The native route is now one ephemeral `codex exec` process with `multi_agent` disabled at launch; the immutable argv also disables config/rules/apps/plugins/browser surfaces and hash-binds the control. |
| Exact-candidate remediation: broad reads and ambient capabilities | The v2 exact-candidate review proved that legacy `workspace-write` still allowed the worker to inspect external root/sibling evidence, left web-search capability available, injected ambient project instructions, and attested only the JavaScript launcher rather than the transitive runtime. | v3 replaces legacy sandbox flags with a validated custom permission profile, disables current and legacy web/MCP/browser/fan-out features, sets `project_doc_max_bytes=0`, requires absolute content-bound visible executables, and resolves, launches, and hashes the native Codex binary. |

Initial baseline command: `npm run test:proof-harness` passed before changes. Final GREEN
command: `npm run test:proof-harness`, including native exec launch and end-to-end
fixtures, plus syntax and JSON validation for every changed script/schema/template.

## Live rehearsal

`native-sol-rehearsal-2026-07-20.json` records the historical v1 collaboration rehearsal
that exposed the five P1s and is not evidence for v3.
`native-sol-exec-v2-rehearsal-2026-07-20.json` is historical v2 rehearsal evidence and
is not admissible for the v3 permission-profile route.
`native-sol-exec-v3-rehearsal-2026-07-20.json` records the replacement live run: actual
native Codex and Cursor subscription routes both completed from distinct clones of one
baseline, produced equal working state, passed the same content-addressed visible and
held-out checks, and passed paired validation. This is apparatus-only evidence.

## Trust boundary

The deterministic apparatus rejects absent, inconsistent, stale, replayed, cross-wired,
wrong-route, failed, or repository-divergent evidence. The v3 runner captures exact
CLI executable/version, launch contract, session transcript, process status, and local
effects, but Codex supplies no cryptographic provider signature for the requested model.
The local parent process and HITL therefore remain explicit trust roots.
