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

Scale the startup to the task. For any repo-mutating work:

1. Confirm the working directory (`pwd`) — especially inside worktrees.
2. Read `{{PROJECT_STATUS_FILE}}` for current state and handoff notes.
3. Check recent git history (`git log --oneline -10`) for context.
4. If resuming a tracked task, read all files in `{{TASK_DOCS_DIR}}/<task>/` before acting.

For larger sessions or autonomous continuation, additionally:

5. Read `{{SPEC_FILE}}` and the relevant `docs/` pages from the Doc Map.
6. Run the bootstrap/smoke check ({{BOOTSTRAP_COMMAND}}) to confirm a known-good start state.

A trivial, well-scoped edit does not need the full sequence — but never skip step 1,
and never edit a file you have not read.

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

## Doc map

<!-- Bind each role to the repo's ACTUAL file via the instance manifest. -->

| Role | File | Notes |
|---|---|---|
| Durable product/architecture intent | `{{SPEC_FILE}}` | High-level only; details live in feature docs and issues |
| Current state & handoff | `{{PROJECT_STATUS_FILE}}` | Overwritten checkpoint — never a history ledger |
| Change ledger | `{{CHANGELOG_FILE}}` | Checkpoint/user-facing entries; git history is the commit ledger |
| Deep project knowledge | `{{DOCS_DIR}}/` | {{DOCS_DIR_SUMMARY}} |
| Task working memory | `{{TASK_DOCS_DIR}}/<task>/` | plan / context / tasks files; archived when done |
| Tool & command cache | `{{TOOL_CACHE_FILE}}` | Refresh on config change or explicit command |

Rules of the road:

- Plans live in task docs; **decisions** get promoted to global docs — never the reverse.
- `{{PROJECT_STATUS_FILE}}` holds only the current handoff. History belongs to git and
  the changelog.
- When work reveals a durable repo convention or recurring trap, record it in the
  nearest relevant doc (or propose an update to this file).

## Workflows

Standard workflows for this repo (full specs: {{WORKFLOWS_LOCATION}}):

| Workflow | Use when |
|---|---|
| spec | New feature or significant change: grill → PRD → issues → TDD plan |
| implement-tdd | Executing a planned change test-first |
| debug | Investigating a defect: logs → reproduce → assess → fix → lesson |
| commit | Any commit: verify → review → docs → focused commit |
| commit-pr | Commit plus branch, PR, and review loop |
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

Scope verification to the change: focused checks for small diffs, broader runs when the
blast radius requires it. {{VERIFICATION_SCOPING_NOTES}}

## Complexity and ceremony

Classify each task before starting (full rubric: {{RUBRIC_LOCATION}}):

- **Simple** — single file, known pattern, easily reversible, no data/security surface.
  Minimal ceremony; one combined audit of the plan; focused verification.
- **Medium** — multi-file, new behavior, or user-facing. Written plan; adversarial,
  steelman, and unbiased audit passes; reviewer independent of the implementer.
- **High** — architecture, auth/security/payments/data migration, cross-repo, or low
  reversibility. Full plan with rollback; independent audit agents; explicit release plan.

Any single high-risk dimension (security, data loss, irreversibility) promotes the tier
regardless of size.

## Model routing and provider failure

The current matrix at `{{ROUTING_LOCATION}}` is authoritative. Codex Sol High is the
default orchestrator. Model workers receive bounded contracts; decision authority does
not transfer merely because a route is stronger or cheaper.

Treat availability at the provider-family level:

- quota, billing, authentication, or invalid-model failure marks the whole family
  unavailable for the current task; do not try a sibling model as a false fallback
- transient timeout, dropped stream, or server error gets one checkpointed retry, then
  the same packet moves to the first eligible cross-family fallback
- acceptance criteria, review independence, and stop conditions never weaken on reroute
- preserve partial output, exact failure, last verified checkpoint, and fallback route
  in task context

The orchestrator reports the chosen route and next checkpoint at start, every phase
boundary with evidence, every retry or fallback immediately, and the final implementer,
reviewers, verification, skipped checks, fallback events, and residual risk. A failed
command is never described as still running.

## Delegation

When work is delegated to subagents, every delegation must specify: goal, paths, files
to inspect, excluded areas, expected output artifact, allowed tools, verification
requirement, and stop condition. Every subagent returns a packet: files inspected,
facts found, decisions made, output summary, verification run, risks, open questions,
recommended next action.

The return packet also includes the route used, provider-family state changes,
continuation or retry count, checkpoint path, and any reduction in review diversity.

Subagents must not: perform unbounded repo-wide rewrites, make irreversible external
changes without permission, touch secrets, self-approve their own work, or substitute
passing tests for understanding. The implementer is never the sole reviewer.

## Worktrees <!-- OPTIONAL: delete if this repo never uses worktrees -->

Use an isolated worktree when collision risk exists (parallel agents, risky changes).
Each worktree must be able to boot the app, reach required env vars via
{{ENV_ACCESS_PROCESS}}, capture logs locally, and run verification. Worktree-local
logs/traces are disposable; durable knowledge goes in the shared docs above before a
worktree is deleted.

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
