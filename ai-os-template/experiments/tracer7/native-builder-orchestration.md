# Native Codex Sol builder execution contract

This contract is the producer boundary for the native control route. The v4 route
uses one parent-controlled, ephemeral `codex exec` process instead of a collaboration
subagent. That change makes the one-agent boundary and worker capability boundary
launch-time controls rather than unverifiable worker promises.

## Phase 1: deterministic prepare

1. Freeze the route-specific native config from
   `native-builder-arm.template.json` outside the builder worktree.
2. Hash its exact bytes separately and run:

   ```text
   node scripts/prepare-native-builder-arm.mjs <config.json> <approved-sha256>
   ```

3. Preserve the emitted root invocation packet, worker packet, and SHA-256 values.
   Do not edit them. The root packet lives in the root evidence directory; worker
   capability material lives in a separate content-addressed directory.

Preparation fails unless config, prompt, baseline HEAD/tree/index/ref, clean state,
allowed paths, ignored-file state, evaluator vectors, budgets, environment digest,
content-addressed evaluator executables, exact `gpt-5.6-sol` model, and `high`
reasoning route are valid. The approved transitive native Codex executable realpath,
content SHA-256, and version are mandatory and packet-bound. Every external path is
checked after symlink resolution.

## Phase 2: one sealed native Codex process

Run:

```text
node scripts/run-native-builder-execution.mjs \
  <native-invocation-packet.json> <approved-packet-sha256>
```

The parent runner validates the prepared source state and constructs the immutable
`native-codex-exec-launch-v4` contract. The worker receives the exact worker packet
bytes over stdin. It receives no packet pathname, root invocation path, evidence
directory, result path, receipt path, held-out command, or sibling-arm identity.
Before any capability probe or model launch, the runner exclusively creates the
canonical `native-execution-claim.json`. Executable path/hash/version mismatches fail
before that claim; a second sequential or concurrent valid invocation with the same
identity therefore fails before any model process can start.

The launch contract fixes all of these controls and hashes their exact argv/stdin
identity:

- native subscription route `gpt-5.6-sol` with `model_reasoning_effort="high"`;
- `--ignore-user-config`, `--ignore-rules`, `--strict-config`, and `--ephemeral`;
- JSONL transcript output and approval policy `never`;
- custom `native-proof-builder` permission profile: minimal runtime reads, repository
  writes with `.git` read-only, exact visible-check executable reads, and network disabled;
- project instruction discovery disabled with `project_doc_max_bytes=0`;
- both `/tmp` and `$TMPDIR` excluded from writable roots; and
- `multi_agent`, apps, browsers, image generation, memories, plugins, and remote
  plugins disabled.

Disabling `multi_agent` removes the spawn/send/wait agent tools from the worker's
surface, so the experiment has one model process rather than a self-attested
one-agent convention. Ignoring user config and project rules prevents a local route
override or MCP/plugin injection. The Codex host still needs provider transport to
OpenAI; `network_access=false` describes model-generated sandboxed commands, not that
host transport.

Before model launch, the runner records the exact effective feature inventory and
runs the same permission profile through deterministic syscall probes. Finalization
requires observed workspace/visible-executable reads plus denial of held-out and
root-evidence reads, temporary writes, network connection, and a nested `codex exec`
agent. Raw feature/probe stdout and stderr are retained and hash-bound through
`native-capability-probe.json`; configured booleans alone are not accepted as proof.

The worker may modify only `allowed_paths` in the packet repository and may run only
the visible checks named in the packet. It must not stage, commit, change refs, push,
publish, deploy, migrate, access production, use secrets, inspect held-out evidence,
or write outside the repository. The parent independently measures all repository
effects and rejects violations.

The parent captures the CLI version and executable content identity, exact launch
contract and capability-probe hashes, JSONL transcript/session ID, stderr, exit status, timeout status,
start/end Git state, changed paths, working-state hash, and verbatim final completion.
It writes `native-attestation.json` and `native-completion.json`; operators do not
hand-author either artifact.

## Phase 3: deterministic finalize

Hash the runner-emitted attestation, then run:

```text
node scripts/finalize-native-builder-arm.mjs \
  <native-invocation-packet.json> <approved-packet-sha256> \
  <native-attestation.json> <approved-attestation-sha256>
```

Finalization reproduces the launch contract from worker bytes, verifies the CLI
binary, transcript/session/completion bindings, single-use receipt state, route,
status, exact source identities, raw capability evidence, scope, index/ref immutability, ignored drift,
intervention budget, prompt bytes, evaluator executable/environment manifests, and
visible/held-out commands. Repository state and evaluator identity are checked after
every individual evaluator command, so one check cannot mutate state and rely on a
later check to restore it. Only `native-result.json` may enter paired validation.
Before any evaluator runs, finalization exclusively creates the canonical
`native-finalization-claim.json`; concurrent finalizers cannot both execute checks or
overwrite check logs. Results and receipts hash-bind both execution claims and the
native finalization claim, and paired validation reopens them from external evidence.

## Trust boundary

The deterministic layers prove local launch configuration, transcript bytes, process
status, and repository/evaluator evidence. They do not provide a cryptographic
provider signature proving the remote model identity, and a malicious parent process
with the same filesystem authority could fabricate internally consistent local
artifacts. The route therefore retains root-process and HITL trust while removing the
two avoidable worker capabilities: knowledge of root-only evidence paths and access
to descendant-agent tools. No artifact may claim stronger provider proof.

## Paired-arm stop condition

The current host Cursor CLI advertises an unspecified read boundary and can read
external held-out/root evidence even with `--sandbox enabled`. The Composer runner
therefore fails closed before inference unless a separately verified workspace-only
container or VM execution lane is implemented. A host Cursor run is not comparable
and must not be used for Tracer 7.
