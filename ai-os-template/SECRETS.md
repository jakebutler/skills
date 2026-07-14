# Secrets Handling — Harness and Repo Conventions

**Version 0.1 — 2026-07-13.** Prompted by a misdiagnosed GLM timeout: when a route
fails, it must be obvious whether the cause is auth/secrets or network/runtime. This
convention makes secret locations predictable and keeps secrets out of prompts, repos,
and agent transcripts.

## Two scopes

### Repo-level secrets (per project)

- Env vars only, loaded through the repo's own safe process (e.g. lower-db's
  `node scripts/with-root-env.mjs`; never `source .env.local`).
- Never committed, never echoed into logs/PR bodies/status docs. The secrets-guard
  blocking hook enforces the commit side.
- Worktrees get env access via the repo's documented symlink/copy process
  ({{ENV_ACCESS_PROCESS}} in the instance's `AGENTS.md`).

### Harness-level secrets (user-global, power the OS's own routes)

- **Per-skill `.env` files inside the skill's directory** (current pattern:
  `~/.claude/skills/research/.env` holds the Z.ai key), `chmod 600`, with a matching
  `.env.example` documenting required keys without values.
- **CLI runtimes authenticate themselves**: Codex via `codex login` (ChatGPT auth),
  Claude Code via `claude.ai` OAuth for local Pro-subscription Fable/Sonnet routes,
  and Composer via `cursor-agent login` or `CURSOR_API_KEY`. The orchestrator never
  passes these credentials through prompts, packet files, or subagent arguments —
  a subagent that needs an authed runtime invokes that runtime and inherits its auth.
- **Registry, names only:** the tool cache (`.ai/tools.md` per repo, or the harness
  skill list) records *which* secrets exist and *where* they live — never values.
  Example row: `Z.ai API key — ~/.claude/skills/research/.env (GLM research +
  glm-frontend-patch)`.

## Rules that hold everywhere

1. Secrets never appear in: prompts, delegation packets, return packets, lab notebook
   entries (they're public), changelogs, PR bodies, or error reports. Report "auth
   failed for <route>" — never the credential.
2. A new route's secret gets: a home per the scopes above, an `.env.example` line,
   and a registry entry — before the route is used in anger.
3. Treat full-account credentials (CURSOR_API_KEY, ChatGPT login, Claude subscription login) as blast-radius-High:
   they are not per-task tokens; anything invoking them runs under the delegation
   contract's no-irreversible-actions rule.
4. On any suspected exposure: rotate first, investigate second, then record the
   incident (what leaked, where, rotation time) in the repo's changelog — the fact of
   rotation is not a secret.

## Failure diagnosis order (learned 2026-07-12)

When an external route fails: (1) read the actual error, because timeout is not auth;
(2) check auth state with the route's own status command (`codex login status`,
`claude auth status`, `cursor-agent status`); (3) check the `.env` or key presence per
the registry; (4) only then suspect the service. Record the diagnosis in the return
packet so the routing matrix's reliability notes stay evidence-based.

Never persist full CLI auth-status output in task docs because it may include account
identity and organization identifiers. Record only route, auth method class, success or
failure, and timestamp. Claude Code `--bare` deliberately skips OAuth/keychain login and
must not be used for the subscription-backed route.
