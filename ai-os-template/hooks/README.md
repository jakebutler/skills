# Hook Specs

These specs define the v1 Claude Code hook set for the AI Engineering OS template.
Hooks are repo safety rails and workflow accelerators, not a second orchestrator.

## Classification Model

| Classification | Authority | v1 use |
|---|---|---|
| Blocking | Stop a tool call when continuing would create a safety or correctness risk. Use sparsely. | `secrets-guard`, `destructive-git-guard` |
| Advisory | Surface a reminder or verification result. Never blocks the prompt or response. | `skill-activation`, low-error `verify-on-change` |
| Delegating | Convert a detected condition into a bounded subagent task using the standard delegation contract. | high-error `verify-on-change`, `delegating-review` |
| Automatic maintenance | Update Tier A files or generated caches without user approval. | `status-checkpoint`, `tool-cache-refresh` |

Blocking hooks are limited to secrets exposure, client-side model API keys,
destructive git operations without explicit permission, and instantiated repos that
choose to treat failed build/typecheck gates as blocking. Most quality concerns are
advisory or delegating so the OS avoids interrupting normal engineering flow.

## Anti-Churn Guardrails

Automatic maintenance hooks follow the documentation-layer guardrails:

- Fire only at checkpoints such as session start, session end, commit, compaction, or
  configuration change. They do not update docs on every response.
- Run a significance check before writing: behavior, state, intent, tooling, or user
  visible status must have changed since the last checkpoint.
- Overwrite status-style files idempotently instead of appending noisy logs.
- Record a one-line update reason with every automatic write.
- Keep Tier A writes automatic: `{{PROJECT_STATUS_FILE}}`, changelog draft, generated
  docs, and `{{TOOL_CACHE_FILE}}`.
- Keep Tier B writes guarded: `SPEC.md` and `docs/` receive stable facts and links
  only, with an update reason.
- Keep Tier C writes review-gated: skills, `AGENTS.md`, `CLAUDE.md`, and hooks are
  proposed as diffs or artifacts, never silently rewritten by v1 hooks.

## Blocking Override Convention

Every blocking hook supports the same local override convention:

- The instantiated repo defines `{{BLOCKING_OVERRIDE}}` as an environment variable
  name, for example `AI_OS_ALLOW_LOCAL_BLOCKING_OVERRIDE`.
- Local, non-production experiments may set `{{BLOCKING_OVERRIDE}}=1`.
- The hook must print a warning when the override is used and include the hook name,
  file or command matched, and reason bypassed.
- The override must not apply to CI, protected production commands, or committed
  configuration unless the repo explicitly opts into that behavior.
- The override is documented in `CLAUDE.md` so users know it is exceptional, not the
  default path.

## v1 Hook Set

| Hook | Classification | Event |
|---|---|---|
| `skill-activation.md` | Advisory | `UserPromptSubmit` |
| `verify-on-change.md` | Advisory escalating to delegating | `PostToolUse`, `Stop` |
| `secrets-guard.md` | Blocking | `PreToolUse` |
| `destructive-git-guard.md` | Blocking | `PreToolUse` on `Bash` |
| `status-checkpoint.md` | Automatic maintenance | `Stop`, `SessionEnd` |
| `delegating-review.md` | Delegating | `Stop` |
| `tool-cache-refresh.md` | Automatic maintenance | `SessionStart` (config changes detected via fingerprint compare) |

