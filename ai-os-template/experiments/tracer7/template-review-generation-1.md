# HT review generation 1 resolution

Date: 2026-07-19
Frozen index tree reviewed: `641bf46f47bc46d69db44df385704c01def9b29a`
Routes: `claude-fable-5-thinking-high` architecture; `claude-opus-4-8-thinking-high` security
Verdict: not approved; remediated as one consolidated generation

Both reviewers ran in Cursor Ask mode, which allowed repository reads but refused
shell commands. The operator reproduced `git write-tree` as the expected value while
the candidate remained frozen; the reviewer packets were therefore advisory for
identity and blocking for their substantive findings. The second generation uses a
mode that permits read-only Git reproduction.

| Consolidated root cause | Source severity | Disposition and evidence |
|---|---:|---|
| Builder could commit and evade `HEAD`-relative scope checks | Fable P0 | Fixed: final HEAD and index must match baseline; changed paths diff from baseline; fixture commits and proves fail-closed. |
| Approved resolver contradicted rejected/deferred dispositions | Fable P0 | Fixed: approved permits only fully dispositioned P2/P3 rejected/deferred findings; P0/P1, accepted changes, blockers, or conflicts fail. |
| B0 verifier accepted Git option injection and hardcoded lockfile | Opus P1, Fable P2 | Fixed: full object-ID validation, `--end-of-options`, safe repo-relative lockfile binding, malicious-base fixture. |
| Arm config controlled executable/environment and inherited secrets | Opus P1 | Fixed: CLI owns exact Cursor executable/flags and a scrubbed environment; config fields are strict; config bytes require a separately approved hash. Evaluator commands remain an explicit owner-approved capability in the frozen config. |
| Inventory and invariant selection were self-declared | Opus/Fable P1 | Fixed: production validation requires a clean live repo and regenerates both artifacts from the bound tree, adapter config, and registry; fixture-only validation is explicit. |
| Adapter overstated completeness and missed reads/internal/scheduled paths | Fable P1, Opus P2 | Fixed: query/read, internal-call, cron, alias, symlink, and lexical-ambiguity handling; emitted confidence is `heuristic`; planner and independent reconciliation remain mandatory. |
| Held-out evaluator was visible in the worktree | Fable P1 | Fixed: evaluator source and executable stay outside the arm and run only after the agent exits. |
| Review independence and snapshot reproduction were bare booleans | Opus P2 | Fixed: coverage records provider/task run ID, transcript hash, and matching start/end snapshot hashes; advisory packets remain in resolver accounting but cannot approve. |
| Advisory reviews, always-apply coverage, and registry-lock liveness were ambiguous | Fable P2 | Fixed: explicit advisory authority; surface-specific classification rationale; possible duplicates are rejected from novel capture; stale locks require inspected manual recovery. |
| Experiment controls/interventions were not auditable | Fable P2 | Fixed: runner records agent version, config hash, budgets, environment-name set, Git state, and check vectors; a paired-control validator rejects drift. Interventions live in the run ledger instead of a hardcoded empty assertion. |

Residual boundaries carried into generation 2:

- the dependency-free adapter is deliberately heuristic, not an AST completeness
  claim;
- evaluator commands are trusted only because their exact config hash is separately
  approved at D0 and they run in disposable, non-production worktrees with a scrubbed
  environment; and
- cryptographic provider signatures are not available, so transcript/run identities
  plus independently reproduced hashes provide operational rather than PKI attestation.

Generation 2 subsequently found one new P1: ignored-file state was not included in the
builder scope snapshot. Final hardening adds before/after ignored-content identities,
fails unexpected ignored drift before checks, and mechanically requires both the
approved config and held-out evaluator executable to live outside the builder worktree.
