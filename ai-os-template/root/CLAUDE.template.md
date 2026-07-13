<!--
  TEMPLATE: CLAUDE.md — thin Claude Code adapter over AGENTS.md.
  Keep this file SHORT. Canonical behavior rules, doc map, workflows, and standards
  live in AGENTS.md. This file holds only what is specific to the Claude Code harness:
  the import, slash commands, hook expectations, subagent routing, and skill activation.
  If the repo already has a CLAUDE.md, merge additively — preserve existing imports
  and marker blocks.
-->

@AGENTS.md

# Claude Code adapter — {{REPO_NAME}}

Everything in `AGENTS.md` applies. This file adds Claude Code mechanics only.

## Slash commands

<!-- Keep only the commands wired for this repo. Specs: {{COMMANDS_LOCATION}} -->

| Command | Purpose |
|---|---|
| `/spec` | grill → PRD → issues → TDD plan (calls research/prototype as needed) |
| `/research` | standalone research with consolidation packet |
| `/prototype` | standalone exploration of UI/state/interaction uncertainty |
| `/implement-tdd` | execute a planned change test-first |
| `/debug-mode` | log-driven defect investigation loop |
| `/commit` | verify → review → docs → focused commit |
| `/commit-pr` | commit workflow plus branch, PR, and review loop |
| `/review-pr` | PR review: bugs, regressions, missing tests, security first |
| `/wrap-session` | end-of-session status, docs, changelog, next action |

## Hooks

This repo's hooks are configured in `.claude/settings.json` (specs: {{HOOKS_LOCATION}}).
What to expect:

- **Automatic maintenance** (no approval needed): `{{PROJECT_STATUS_FILE}}` overwrite,
  changelog draft section, tool cache refresh — fired at checkpoints, gated by a
  significance check, each with a recorded update reason.
- **Advisory** notices (docs/tests/error-handling reminders): consider them, then act
  or briefly say why not.
- **Delegating** triggers (type-error pileup, large diff, frontend diff): hand off to
  the named subagent rather than pushing through.
- **Blocking** gates fire only on secrets exposure, client-side API keys, destructive
  git ops, or failed build/typecheck on code changes. Override for local non-production
  work: {{BLOCKING_OVERRIDE}}.

Hooks may inject skill-activation reminders before a prompt is processed. Treat a
named skill as a strong default, not a suggestion.

## Subagent routing

Delegate by default; orchestrate rather than doing all labor directly. Follow the
delegation contract and return-packet format in `AGENTS.md` § Delegation.

| Work | Route to |
|---|---|
| Most implementation | Codex via Codex-for-Claude-Code ({{CODEX_HEAVY_MODEL}} for real work, {{CODEX_LIGHT_MODEL}} for simple) |
| Frontend design/coding | {{FRONTEND_MODEL_ROUTE}} |
| Research sweeps, inventory, mechanical drafting | cheap Claude subagents (Haiku/Sonnet) |
| Offloaded web research | {{RESEARCH_ROUTE}} |
| Written content | Sonnet |
| Architecture, conflicts, synthesis, final review | orchestrator (do not delegate) |

Full matrix and complexity rubric: {{ROUTING_LOCATION}}. The matrix is versioned —
check its date before trusting model bindings.

## Skills

Skills hold reusable how-to guidance; `docs/` holds this repo's knowledge. Check the
curated skill list in `{{TOOL_CACHE_FILE}}` before starting spec, implementation,
review, or session-wrap work — the common failure mode is not using an available skill.

Repo-specific skill notes:

{{SKILL_NOTES}}
