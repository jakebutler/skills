<!--
  TEMPLATE: AGENTS.md — canonical, harness-neutral root instructions.
  Instantiation: replace {{PLACEHOLDERS}}, delete sections marked OPTIONAL if unused,
  and bind the Doc Map to the repo's actual files via instances/<repo>/manifest.md.
  CLAUDE.md (and any future harness adapter) layers on top of this file — keep
  harness-specific mechanics OUT of this file.
-->

# {{REPO_NAME}} — Agent Instructions

This file is the canonical instruction set for all AI agents working in this repo,
regardless of harness. Harness-specific mechanics (hooks, slash commands, subagent
routing) live in the adapter file for that harness (`CLAUDE.md` for Claude Code).

## Startup

Scale startup to the task. For repo-mutating work:

1. Confirm the working directory (`pwd`) — especially inside worktrees.
2. Confirm `git rev-parse --is-inside-work-tree` succeeds before trusting repository
   files. A repository storage path may be bare and may contain stale physical files;
   use a registered checkout or worktree for edits.
3. Read files named by the user and the source/tests directly in scope.
4. Read `{{PROJECT_STATUS_FILE}}`, recent history, and task docs only when resuming,
   overlapping, or reporting on tracked work. Stale or unrelated status does not
   impose gates on a new task.

For larger sessions or autonomous continuation, additionally:

5. Read `{{SPEC_FILE}}` and the relevant `docs/` pages from the Doc Map.
6. Run the bootstrap/smoke check ({{BOOTSTRAP_COMMAND}}) to confirm a known-good start state.

A trivial, well-scoped edit does not need the full sequence — but never skip steps
1–2, and never edit a file you have not read.

## Behavior rules

These are non-negotiable regardless of task size:

- Read and understand relevant files before proposing or making edits. If the user
  references a file or path, inspect it before explaining or fixing anything.
- Search rigorously for existing conventions, styles, and abstractions before writing
  new code. Reuse existing abstractions where possible.
- Do not speculate about code you have not inspected.
- Write general-purpose solutions for valid inputs. Do not hard-code for tests, and do
  not create helper scripts or workarounds just to satisfy tests faster.
- If a task is unreasonable or infeasible, or tests are wrong, say so instead of
  contorting the code.
- Make only requested or clearly necessary changes. No opportunistic refactors, no
  over-engineering, no unrelated improvements.
- Validate at system boundaries; trust internal code and framework guarantees unless
  evidence says otherwise.
- Reflect on tool results before choosing the next action.
- Plan proportional to risk (see Complexity, below). Run the relevant verification
  before declaring work done. Leave clean handoff state.

## Throughput and batch rule

The default development loop is:

`breadth-first inspection -> one implementation batch -> focused checks -> one consolidated review when warranted -> broad verification once`

- Before editing, inspect the requested surface and its nearby callers, sibling paths,
  tests, configuration, contracts, and runtime/build boundary. Keep one short impact
  or defect list. Finish the sweep before fixing the first item.
- For a failing command or review, collect the complete available failure set before
  editing. Apply one coherent correction batch; never alternate one finding, one edit,
  and one expensive build.
- Use the cheapest reliable feedback while editing. Run an expensive broad gate only
  after the batch is internally consistent and focused checks pass. If it fails,
  collect all failures, make one consolidated correction, then run one confirmation.
  A third broad run requires a concrete affected-boundary reason.
- Reviews fan in before remediation. Parallel lenses share one frozen diff and return
  one findings list. A residual review is targeted and runs only when a correction
  materially changed sensitive logic.
- Reuse evidence from the exact unchanged diff. Commit, PR creation, and review are
  separate entry points, not a mandatory chain that repeats checks or review.
- Reversible repository-local work inside scope needs no extra approval. Human gates
  remain for production/external effects, credentials, destructive or
  difficult-to-recover actions, spend, publication/send actions, and explicit product
  decisions.
- Proof review is machine-bounded: deterministic preflight precedes dispatch; `v1` is
  initial, `v2` is the only remediation, and `v3` is a final replacement or smaller
  review unit. A later candidate requires an explicit HITL continuation record, while
  a repeated unresolved root-cause class fails closed.
- Treat semantic authority identity separately from review/provenance identity.
  Metadata-only corrections do not revoke semantic approval or restart paired review.
- Record convergence receipts and use the configured packet budgets. Checkpoint after
  90 minutes without meaningful RED/code, before a second remediation, or before a
  third broad run with no changed affected boundary.

## Doc map

<!-- Bind each role to the repo's ACTUAL file via the instance manifest. -->

| Role | File | Notes |
|---|---|---|
| Durable product/architecture intent | `{{SPEC_FILE}}` | High-level only; details live in feature docs and issues |
| Current state & handoff | `{{PROJECT_STATUS_FILE}}` | Overwritten checkpoint — never a history ledger |
| Change ledger | `{{CHANGELOG_FILE}}` | Checkpoint/user-facing entries; git history is the commit ledger |
| Deep project knowledge | `{{DOCS_DIR}}/` | {{DOCS_DIR_SUMMARY}} |
| Selective solution knowledge | `{{DOCS_DIR}}/solutions/` | Search by category, module, tags, and semantic slug only when relevant; never bulk-load the corpus |
| Task working memory | `{{TASK_DOCS_DIR}}/<task>/` | plan / context / tasks files; archived when done |
| Tool & command cache | `{{TOOL_CACHE_FILE}}` | Refresh on config change or explicit command |

Rules of the road:

- Plans live in task docs; **decisions** get promoted to global docs — never the reverse.
- `{{PROJECT_STATUS_FILE}}` holds only the current handoff. History belongs to git and
  the changelog.
- When work reveals a durable repo convention or recurring trap, record it in the
  nearest relevant doc (or propose an update to this file).
- Before re-investigating a recurring problem, selectively search solution frontmatter
  and filenames for the relevant module/tags. Do not preload unrelated solutions.

## Workflows

Standard workflows for this repo are summarized below. Optional detailed specs resolve
from `{{WORKFLOWS_LOCATION}}`. That binding must be repo-relative or use the documented
`AI_OS_HOME` environment variable; never bind it to an author's absolute checkout. If
the optional shared specs are unavailable, this table is the usable fallback and work
must not block.

| Workflow | Use when |
|---|---|
| spec | User-requested planning or genuinely ambiguous/high-risk product change |
| design-proof | Proof-required change: enumerate effects → prove architecture → independent architecture/security approval |
| implement-tdd | Executing a planned change test-first |
| debug | Investigating a defect: logs → reproduce → assess → fix → lesson |
| commit | Inspect the exact diff, reuse current evidence, create a focused commit |
| commit-pr | Commit and publish without duplicating unchanged checks or review |
| review-pr | Reviewing a PR: bugs, regressions, missing tests, security first |
| wrap-session | End of session: status, docs, changelog, next action |
| init | First-time repo/worktree setup |

Research and prototype are callable from the spec workflow or standalone.

## Verification

<!-- Fill with the repo's exact commands from the instance tailoring packet. -->

| Check | Command |
|---|---|
| Lint | `{{LINT_COMMAND}}` |
| Typecheck | `{{TYPECHECK_COMMAND}}` |
| Tests | `{{TEST_COMMAND}}` |
| Build | `{{BUILD_COMMAND}}` |
| Dev server | `{{DEV_COMMAND}}` |

Scope verification to the change: focused checks while editing, then broader checks
once when the actual blast radius requires them. A build is not a generic code-change
gate; reserve it for build/runtime/configuration boundaries, a requested release
preflight, or a reproduced build-only failure. {{VERIFICATION_SCOPING_NOTES}}

Derive package-manager and runtime identity from the repository's committed source of
truth (for example `package.json#packageManager`, a lockfile, or a toolchain file).
Instruction tables may mirror those values for operators, but must not become a second
authority that silently drifts.

## Complexity and ceremony

Classify by consequence, ambiguity, and reversibility rather than file count (full
rubric: {{RUBRIC_LOCATION}}):

- **Simple** — localized, known, easily reversible. Inline intent and focused checks.
- **Medium** — bounded new behavior whose intent is clear and reversible. Inline
  checklist, one implementation batch, and proportional verification. No plan
  artifact or independent reviewer is required by default.
- **High** — actually alters authorization/tenancy, destructive migration, credential
  or payment authority, externally persistent production effects, an irreversible
  public contract, or similarly costly-to-recover behavior. Written plan with
  rollback and one independent review.

User-facing scope, multiple files, cross-repo coordination, a sensitive-path label, or
the word "security" does not promote a task by itself. A narrow fix preserving an
approved boundary is not High merely because the boundary is sensitive.

## Human authority policy <!-- OPTIONAL: bind explicitly in the instance manifest -->

When the instance opts into `solo-operator-hitl-v1`, one authenticated human owner may
hold multiple internal human roles, including builder, operator, reviewer, and
approver. Do not manufacture a second account, approval record, or nominally distinct
human merely to satisfy role separation. This changes human cardinality, not evidence
or safety requirements:

- bind the decision to the exact current immutable candidate and recorded policy;
- keep required independent fresh-context review as evidence for High-risk work;
- treat machine review as evidence only, never as human approval or activation
  authority;
- reject failed evaluation, unresolved blocking findings, stale or superseded
  packets, unauthenticated actors, and simulated identity;
- keep authorization separate from activation, deployment, spend, publication, and
  environment-specific promotion; and
- preserve legacy records under their original policy. A successor policy never
  rewrites or reinterprets historical approvals.

The instance must bind authentication, approval storage, candidate hashing,
activation, and withdrawal/rollback in its manifest. The generic template does not
grant authority by itself. Use `HITL-AUTHORITY.md` and the policy template/schema for
the complete adoption contract. Delete this section when the repository does not opt
in.

Proof-required work is the subset that introduces or materially changes authority,
trust boundaries, destructive/external effects, migration semantics, concurrency
ownership, historical authority, or hard-to-reverse architecture. It enters the bound
`design-proof` workflow before production edits. Narrow implementation fixes that
preserve an approved design stay in the batched loop. Only a new design decision or a
contradiction of the approved authority model invalidates the builder packet; newly
noticed implementation paths join the consolidated defect list.

## Model routing and provider failure

The machine registry at `{{ROUTING_LOCATION}}` is authoritative. Resolve task,
complexity, availability, and fallback from that registry before invoking a worker;
the human routing guide explains the policy but does not override JSON. Codex Sol High
is the default orchestrator. Model workers receive bounded contracts; decision
authority does not transfer merely because a route is stronger or cheaper.

Routine implementation has no mandatory delegated review. When independence is
warranted, use one fresh-context reviewer. Proof-required or exceptional High-risk
work may use multiple concurrent specialist lanes against one frozen candidate.
Fable remains an optional principal-engineer/architect consultation after a concrete
exceptional trigger.

Treat availability at the provider-family level:

- quota, billing, authentication, or invalid-model failure marks the whole family
  unavailable for the current task; do not try a sibling model as a false fallback
- transient timeout, dropped stream, or server error gets one checkpointed retry, then
  the same packet moves to the first eligible cross-family fallback
- acceptance criteria, review independence, and stop conditions never weaken on reroute
- preserve partial output, exact failure, last verified checkpoint, and fallback route
  in task context

The orchestrator reports material route changes, failures, verification, skipped
checks, and residual risk. Routine internal phase boundaries do not need ceremonial
status or artifact production. A failed command is never described as still running.

## Delegation

Delegate only when work can run independently and expected parallel speedup or
fresh-context value exceeds coordination cost. File count alone is not a delegation
trigger. Routine delegations name a concise goal, scope, exclusions, expected result,
verification, and stop condition; heavyweight packets and provenance are reserved for
proof-required, external, or experimental work.

Routine returns include findings or changes, verification, risks, and next action. Do
not require an output artifact that nobody will use.

Subagents must not perform unbounded repo-wide rewrites, make irreversible external
changes without permission, touch secrets, self-approve High-risk work, or substitute
passing tests for understanding. Routine reversible work does not require a separate
reviewer solely to satisfy process.

## Worktrees <!-- OPTIONAL: delete if this repo never uses worktrees -->

Use an isolated worktree when collision risk exists (parallel agents, risky changes).
A worktree must support only the checks its task needs; documentation or static work
does not need app boot or runtime credentials. Worktree-local logs/traces are
disposable; durable knowledge goes in the shared docs above before deletion.

## Repo standards

<!-- Merge with the repo's existing standards; delete lines that don't apply. -->

- No model/API keys in client-side code. Secrets via env vars; never commit env files.
- Validate and sanitize user input at boundaries.
- {{LANGUAGE_STANDARDS}} <!-- e.g., TypeScript strict; no unjustified `any` -->
- Lint before commit. Focused commits; no direct commits to `{{MAIN_BRANCH}}`.
- Feature branches and PRs for changes to `{{MAIN_BRANCH}}`.
- Prefer the existing UI system ({{UI_SYSTEM}}) before adding UI libraries; minimize
  new dependencies.

## Repo quirks

<!-- Instance-specific traps and non-obvious facts agents must know. -->

{{REPO_QUIRKS}}
