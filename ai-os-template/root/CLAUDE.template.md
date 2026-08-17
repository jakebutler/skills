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

Keep only slash-command adapters actually installed in this repo. If adapters are
deferred, the names below are workflow labels rather than executable slash commands.
Optional detailed specs resolve from `{{COMMANDS_LOCATION}}`; the self-contained
summaries below remain the fallback when that portable binding is unavailable.

<!-- {{COMMANDS_LOCATION}} must be repo-relative or use the documented AI_OS_HOME variable. -->

| Command | Purpose |
|---|---|
| `/spec` | user-requested planning or genuinely ambiguous/high-risk product work |
| `/research` | standalone research with consolidation packet |
| `/prototype` | standalone exploration of UI/state/interaction uncertainty |
| `/implement-tdd` | execute a planned change test-first |
| `/debug-mode` | log-driven defect investigation loop |
| `/commit` | inspect exact diff, reuse current evidence, create focused commit |
| `/commit-pr` | commit and publish without duplicating unchanged checks or review |
| `/review-pr` | PR review: bugs, regressions, missing tests, security first |
| `/wrap-session` | end-of-session status, docs, changelog, next action |

## Hooks

This repo's installed hooks are configured in `.claude/settings.json`. Optional hook
specs resolve from `{{HOOKS_LOCATION}}`; their absence does not imply hooks are wired.
What to expect:

- **Automatic maintenance** (no approval needed): `{{PROJECT_STATUS_FILE}}` overwrite,
  changelog draft section, tool cache refresh — fired at checkpoints, gated by a
  significance check, each with a recorded update reason.
- **Advisory** notices (docs/tests/error-handling reminders): consider them, then act
  or briefly say why not.
- **Delegation hints** are advisory. Hand off only when independent parallel work or
  fresh context is likely to save more time than coordination costs. File count and a
  frontend diff do not force delegation.
- **Blocking** gates fire only on secrets exposure, client-side API keys, destructive
  git ops, or an explicitly required check that has failed. Hooks do not create a
  requirement to run an expensive check. Override for local non-production work:
  {{BLOCKING_OVERRIDE}}.

Hooks may inject skill-activation reminders before a prompt is processed. Treat a
named skill as a strong default, not a suggestion.

## Claude lane

The primary control plane is Codex Sol High. Claude Code supplies an independent Opus
review only when risk or uncertainty warrants one, Fable reviews exceptional advanced
architecture or system design, and Sonnet writes copy from a bounded brief. Claude
becomes the fallback orchestrator only when Codex is unavailable and the user accepts
Anthropic quota use.

Follow the delegation contract and return-packet format in `AGENTS.md` § Delegation.
Return decisions, evidence, risks, and the next action to the Sol orchestrator. Do not
expand a consultation packet into repo-wide implementation work.

When Codex launches this lane locally, use Claude Code print mode with the authenticated
Claude subscription. Preflight `claude auth status`; invoke
`claude -p --model claude-opus-5` for code review, `--model fable` for exceptional
architecture consultation, or `--model sonnet` for copy. Do not use `--bare`, which
does not read the subscription OAuth/keychain session. Remote and CI environments must
not assume this local authentication exists. Record the provider-returned exact model;
an `opus` alias is valid only when it resolves to `claude-opus-5`.

Before proof review dispatch, use the repository's deterministic transport preflight.
It verifies executable availability, authentication, exact model and effort, read-only
capability, and provider/task-run identity capture. An equivalent wrapper is acceptable
when those semantics match; wrapper identity alone is not authority.

| Work | Route to |
|---|---|
| Orchestration, framing, synthesis | Codex Sol High; Fable only as quota-approved fallback |
| Most implementation | Codex (Sol for hard work, Terra for scoped work, Luna for light work) |
| Frontend implementation | Composer for a crisp bounded slice; Terra fallback; GLM-5.2 experimental only |
| Frontend design judgment | Impeccable on Sol; Fable only for a high-value critique gate |
| Research sweeps, inventory, mechanical drafting | Terra or Luna; GLM for offloaded web research |
| Offloaded web research | {{RESEARCH_ROUTE}} |
| Written content | Sonnet; Terra fallback |
| Advanced architecture and system-design feedback | Fable on a compact Sol decision packet |
| Routine code review | one fresh-context reviewer when independence is warranted |
| Proof-required/high-risk review | concurrent diff-triggered reviewers against one frozen candidate |
| Principal engineer / architect escalation | Fable only after a concrete exceptional trigger |

Optional full matrix and complexity rubric: {{ROUTING_LOCATION}}. The binding must be
repo-relative or use the documented `AI_OS_HOME` variable. When it is unavailable, use
the installed routing summary and manifest version pin. Check the matrix date before
trusting model bindings. If Claude quota, auth, or model access fails, report the exact
failure and return the packet immediately; do not retry another Claude model as though
it were a different provider family.

## Skills

Skills hold reusable how-to guidance; `docs/` holds this repo's knowledge. Check the
curated skill list in `{{TOOL_CACHE_FILE}}` before starting spec, implementation,
review, or session-wrap work — the common failure mode is not using an available skill.

Repo-specific skill notes:

{{SKILL_NOTES}}
