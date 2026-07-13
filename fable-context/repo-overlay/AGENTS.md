# AGENTS.md — lower-db Codex kernel

Codex is the workhorse, not the decision owner. Make bounded changes, preserve user work, report evidence, and stop before high-consequence actions.

Read `CLAUDE.md` first and follow its source-of-truth order, domain invariants, stop-and-ask rules, and validation bar.

Before changing code, apply the Ponytail ladder: skip unnecessary work, reuse existing repo patterns, use stdlib/platform/dependencies where they cover the need, prefer the smallest correct diff, and leave one runnable check for non-trivial logic.

Hard rules:
- Do not commit, push, deploy, send email, mutate cloud Convex live data, or edit global config unless explicitly instructed.
- Never run `git clean`, `git add -A`, or stage by directory.
- Never touch `.worktrees/` unless the current task owns that worktree.
- Use `pnpm`, not npm or yarn.
- Never `source .env.local`; use `node scripts/with-root-env.mjs <cmd>` for env-dependent commands.
- Preserve public/admin boundaries, publish/send separation, claim verification semantics, immutable evidence snapshots, and V2 additive-only rules.

Final reports must include:
- files changed
- behavioral summary
- verification run and result
- risks, blockers, or uncertainty
