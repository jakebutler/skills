# Native Codex Sol builder orchestration contract

This contract is the producer boundary for the native control route. A local Node
process cannot invoke Codex collaboration tools, so the root Codex orchestrator owns
the single collaboration call and records what the platform actually returned.

## Phase 1: deterministic prepare

1. Freeze the route-specific native config from
   `native-builder-arm.template.json` outside the builder worktree.
2. Hash its exact bytes separately and run:

   ```text
   node scripts/prepare-native-builder-arm.mjs <config.json> <approved-sha256>
   ```

3. Preserve the emitted root invocation packet and minimal worker packet paths and
   SHA-256 values. Do not edit either packet.
   Preparation fails unless the config, prompt, baseline HEAD/tree/index/ref, clean
   state, allowed paths, ignored-file state, evaluator vectors, budgets, environment
   name/value digest, content-addressed evaluator executables, exact `gpt-5.6-sol`
   model, and `high` reasoning route are valid. The root packet binds its own canonical
   worker, evidence, result, and finalize-receipt paths;
   copying it to another directory does not create a new admissible run.

## Phase 2: exactly one native collaboration call

The root orchestrator spawns exactly one fresh-context collaboration subagent with
model `gpt-5.6-sol` and reasoning effort `high`. No fallback is permitted. The task
name must be unique and its canonical `/root/...` name plus returned agent ID are the
run identity.

The delegation contains only:

- the absolute **worker-packet** path and its approved SHA-256;
- an instruction to decode and verify the exact embedded prompt bytes;
- permission to modify only `allowed_paths` in the packet repository;
- a requirement to run only visible checks named in the packet; and
- the prohibitions and return contract below.

Do not add model-specific hints, solution coaching, acceptance criteria, or a summary
of the sibling route. The subagent must not inspect held-out evaluator source, another
arm, or post-run evidence.

The worker packet deliberately omits held-out commands, evidence directories, result
paths, and receipt paths. The subagent must not commit, stage, switch or create refs, push, publish, deploy,
migrate, access production, use secrets, modify external state, or write outside the
packet repository. It stops on ambiguity, missing design, scope expansion, timeout, or
any requested intervention.

Its final response must report the verified packet hash; canonical task; repository;
start and end HEAD/index/ref identities; actual changed paths; working-state SHA-256
using the producer's path/mode/content algorithm; visible checks; any intervention;
and a concise completion. It must echo the worker-packet hash and independently
observed prompt hash. A failed or timed-out call remains a failed outcome.

## Phase 3: root evidence and deterministic finalize

The root writes the verbatim returned completion into an external completion-evidence
record using `native-completion.template.json`. It then writes
`native-attestation.template.json` from the actual collaboration call, without
claiming unavailable provider metadata. Every intervention or manual edit is listed;
an empty ledger is an assertion that none occurred.

Hash both files, then run:

```text
node scripts/finalize-native-builder-arm.mjs \
  <native-invocation-packet.json> <approved-packet-sha256> \
  <native-attestation.json> <approved-attestation-sha256>
```

Finalization independently checks root/worker packet, attestation, and completion hashes and bindings,
single-use receipt state, route/version/status, exact source identities, scope, index
and ref immutability, ignored drift, completion working-state evidence, intervention
budget, prompt bytes, evaluator executable/environment manifests, visible and held-out
commands, and check results. It re-attests the complete repository state and evaluator
identity after each check phase. Only its `native-result.json`
may enter paired validation.

## Trust boundary

This is an auditable orchestration attestation, not cryptographic provider proof. The
deterministic layers can reject missing, inconsistent, stale, cross-wired, replayed,
wrong-route, failed, or repository-divergent evidence. They cannot stop a malicious
root operator with filesystem write access from fabricating an internally consistent
packet and transcript. The collaboration surface also does not currently expose a
capability sandbox that proves network, credential, or external-write denial. Those
prohibitions are therefore honest-worker/root-HITL assumptions: any observed violation
invalidates the run, but the artifacts do not claim prevention the platform cannot
enforce. Human review therefore verifies the root task/run identity and
retained Codex task evidence at the checkpoint gate; no artifact may claim a provider
signature that the platform did not supply.
