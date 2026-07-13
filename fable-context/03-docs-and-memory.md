# Docs And Memory

## Goal

Everything an agent needs should be accessible in the repo or in a clearly referenced local project resource.

The documentation system should prevent context loss without creating noisy churn.

## Recommended Documentation Layers

### Root Instructions

Files:

- `AGENTS.md`
- `CLAUDE.md`

Purpose:

- agent behavior rules
- startup instructions
- doc map
- workflow references
- tool/model routing guidance
- skill activation expectations
- repo-specific quirks

Open design question:

- Decide whether `AGENTS.md` and `CLAUDE.md` are duplicate mirrors, layered files, or harness-specific siblings.

### `SPEC.md`

Purpose:

- high-level product and architecture intent
- tech stack
- major user stories
- links to implementation details and GitHub issues

Risk:

- high drift risk if treated as a living implementation ledger.

Mitigation:

- hooks should review and update it at session end and commit/checkpoint time.
- keep it high-level enough to stay stable.
- move details into feature specs and issues.

### `docs/`

Purpose:

- progressive disclosure for project knowledge.

Potential contents:

- full specs
- feature specs
- operational information
- architecture notes
- data flow diagrams
- semantic data layer descriptions
- experiments
- GTM strategy
- sales decks
- integration notes
- troubleshooting

`AGENTS.md` should map this directory.

### `PROJECT-STATUS.md`

Purpose:

- overwritten checkpoint file
- current state
- recent work
- recommended next steps
- known issues
- handoff instructions

Important:

- this is not a ledger.
- reference git history and changelog for historical updates.

### `CHANGELOG.md`

Purpose:

- meaningful running ledger.

Concern:

- commit-by-commit updates can become noisy.

Recommended direction for Fable to evaluate:

- checkpoint-level or user-facing change ledger by default.
- commit-level only when the repo has a strong reason.
- hooks can maintain draft sections automatically.

### `dev/active/[task-name]/`

Purpose:

- task-local working memory.

Suggested files:

- `[task-name]-plan.md`
- `[task-name]-context.md`
- `[task-name]-tasks.md`

Behavior:

- create when starting a large task or accepted plan.
- read all three before resuming.
- update checklist as work completes.
- update timestamps.
- archive or remove when the task is done.

### `FEATURE-LIST.json`

Proposed source idea:

- full list of features, initially failing.
- includes completion criteria.
- marks which features require browser verification, Puppeteer/Playwright, E2E, or other checks.

Status:

- not yet adopted.

Fable should evaluate intended use before recommending it.

Likely fit:

- strong for greenfield apps, templates, acceptance-test driven work, and feature-complete product builds.
- potentially too heavy for mature repos or libraries unless scoped to major initiatives.

### `.ai/mcp/` Or Equivalent

Purpose:

- cached MCP/tool inventory
- command list
- available skills
- refresh timestamp

Reason:

- avoid re-discovering stable tool lists on every session.

Refresh:

- explicit command
- detected config change
- scheduled maintenance

### `logs/` Or Worktree-Local Log Directory

Purpose:

- searchable server/browser/terminal traces for debug mode.

Guidance:

- logs should be worktree-local.
- logs can be cleaned when a worktree is deleted.
- agents should grep logs before asking the user to reproduce obvious traceable issues.

## Startup Instructions For Agents

Candidate standard startup:

1. Run `pwd` to confirm working directory.
2. Read `PROJECT-STATUS.md`.
3. Inspect recent git history.
4. Read relevant feature list or active task docs.
5. Choose the highest-priority incomplete feature only when the workflow asks for autonomous continuation.
6. Run `init.sh` or repo bootstrap if present.
7. Run basic smoke/E2E test to verify app starts from a known working state.

Fable should adapt this by workflow. Not every tiny task needs the full startup sequence.

## Initializer Agent

Candidate role:

- separate from coding agents.

Responsibilities:

- create initial feature list
- create `init.sh`
- create first `PROJECT-STATUS.md`
- establish documentation skeleton
- verify the app is bootable per worktree

## Worktree Requirements

The system should assume serious work happens in isolated worktrees when collision risk exists.

Each worktree should be able to:

- boot the app
- access required env vars through safe symlink/copy process
- capture logs/traces locally
- run verification
- be deleted without losing durable project memory

Fable should define which repo files are shared durable docs vs worktree-local traces.
