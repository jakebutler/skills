# Source Braindump Synthesis

This file preserves the user's raw ideas in cleaned, organized form. It is not the final design.

## Source Links And Verification Notes

User-provided references:

- `https://github.com/diet103/claude-code-infrastructure-showcase`
- `https://pageai.pro/blog/31-claude-code-setup-tips#what-youll-learn`
- `https://www.thevibemarketer.com/skills`
- `https://code.claude.com/docs/en/chrome`
- `https://github.com/AI-Unleashed/Claude-Skills/blob/main/autoskill/SKILL.md`
- `https://www.youtube.com/watch?v=3EHnp-SH4O8`
- `https://www.youtube.com/watch?v=iC9loBJjduM`
- `https://github.com/coleam00/habit-tracker/tree/main`
- `https://x.com/rohit4verse/article/2033945654377283643`
- `https://chorus-ai.dev/`

Notes:

- The X article was not publicly accessible during packet preparation; rely on the user-provided excerpt unless Fable can access it.
- YouTube links were treated as source leads, not transcript-verified references.
- Fable should inspect references only when they affect design decisions. Do not spend the session exhaustively summarizing links.

## Braindump 1: Current Best Setup

The user wants an overall AI engineering setup with:

- skills
- agents
- tools
- `AGENTS.md`
- `CLAUDE.md`
- documentation and workflow conventions

Most effective spec flow so far:

```text
grill-with-docs -> PRD -> to-issues -> TDD implementation
```

Modified grilling flow:

- agent performs a self-grilling round.
- agent includes all options and reasoning for selected options.
- user reviews the entire round in batch.
- possible pattern: 5 questions with user, 20 self-questions, then review.

Documentation instincts:

- `SPEC.md`
- feature-specific spec files through progressive disclosure
- `CHANGELOG.md`
- `PROJECT-STATUS.md`
- docs updated by hooks at commits, compactions, and checkpoints

Useful skills:

- Impeccable for frontend
- Corey Haines marketing skills
- Convex-specific skills
- Matt Pocock prototype skill
- Compound Engineering skills

Skills to review:

- `publish-slice`
- `prove`
- `research`
- `wrap-session`
- existing `.codex` skills

Model/orchestrator goals:

- Fable as orchestrator.
- maybe later Opus 4.8 extra-high for heavy orchestration.
- Codex-for-Claude-Code so Fable can use Codex models.
- Codex for as much coding as possible.
- GLM-5.2 for frontend design/coding.
- GPT for browser and research.
- Sonnet for written content.
- Z.ai API key available.

Need:

- task complexity mapping to models.
- dynamic workflows in Claude.
- reusable workflows in Codex.
- research subagents and research consolidator subagents.
- Caveman/Ponytail quality/token methodologies.
- run `understand-anything` on owned repos as hygiene.
- include adversarial, steelman, and unbiased audits.

## Braindump 2: Claude Code Infrastructure Patterns

Reference themes:

- skill auto-activation
- hooks
- agents
- slash commands
- dev documentation system
- progressive disclosure in skills

Pattern:

- `UserPromptSubmit` hook analyzes prompt and injects relevant skill reminders.
- stop hook analyzes edited files and risky patterns.
- hooks can be non-blocking reminders or blocking guardrails.
- main `SKILL.md` should stay small with resource files.

Documentation split:

- root `CLAUDE.md` holds critical universal rules and pointers.
- repo `CLAUDE.md` holds quick start, project knowledge, troubleshooting, generated API docs, quirks, commands.
- skills hold how-to guidance.
- docs hold architecture/data flow/integration knowledge.

Dev task docs:

```text
dev/active/[task-name]/
  [task-name]-plan.md
  [task-name]-context.md
  [task-name]-tasks.md
```

Hook pipeline concept:

```text
format -> build/typecheck -> error reminder -> delegate if too many errors
```

Agent categories:

- quality control
- testing/debugging
- planning/strategy
- specialized frontend/research/tour agents

Slash command examples:

- `/dev-docs`
- `/dev-docs-update`
- `/create-dev-docs`
- `/code-review`
- `/build-and-fix`
- `/route-research-for-testing`
- `/test-route`

## Braindump 3: Rules And Workflows

Universal rules:

- read relevant files before edits.
- do not speculate.
- search rigorously.
- write general-purpose solutions.
- do not hard-code tests.
- minimize over-engineering.
- do not add unrelated improvements.
- reflect on tool results.

Workflow ideas:

- commit workflow
- debug mode
- autoskill improver
- cached MCP/tool list
- terminal log folder
- Claude Chrome verification
- slash commands for commit, review-pr, generate-tests, refactor, fix-types
- subagents for architecture, simplification/refactor, app verification, docs

Documentation:

- `SPEC.md`
- `CHANGELOG.md`
- `PROJECT-STATUS.md`
- reference docs for key features

Repo standards:

- no model API keys in client.
- env vars for secrets.
- no committed env files.
- validate/sanitize user input.
- TypeScript strict.
- lint before commit.
- no unjustified `any`.
- prefer shadcn/existing UI system before adding UI libraries.
- minimize dependencies for MVP.
- feature branches for major changes.
- no direct commits to `main`.
- focused commits.
- PRs for changes to `main`.

## Braindump 4: Repo-Resident Operating Loop

Major components:

- `SPEC.md`: high-level architecture, tech stack, user stories, links to GitHub issues.
- Initializer agent creates feature list, `init.sh`, first `PROJECT-STATUS.md`.
- Startup instructions for all agents.
- `FEATURE-LIST.json`: features initially failing, with verification guidance.
- `PROJECT-STATUS.md`: overwritten session/commit checkpoint.
- `/docs`: progressive disclosure for all project knowledge.
- fully bootable app per worktree.
- worktree-local observability/tracing/logs.
- implementation agent.
- linter after every change.
- simple tool set.

Simple coding tool concept:

- file reader keeps line numbers in memory and limits reads.
- edit tool applies patch.
- linter rejects failed edits.
- code search has result limits and asks for more targeted searches when too broad.

Skills:

- TDD
- plan/spec docs with grill-with-docs
- handoff
- prototype
- Chorus

Core loop idea:

- automations
- worktrees
- skills
- connectors
- subagents
- memory on disk

The key point:

- the tool argument matters less than how the system is wired.
