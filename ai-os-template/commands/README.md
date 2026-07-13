# Command Specs

The v1 slash command set has exactly ten commands (`/experiment` added in template
v0.2). They are thin Claude Code adapters over workflow specs, not replacements for
the workflows.

| Command | Workflow |
|---|---|
| `/experiment` | `../workflows/experiment.md` |
| `/spec` | `../workflows/spec.md` |
| `/research` | `../workflows/research.md` |
| `/prototype` | `../workflows/prototype.md` |
| `/implement-tdd` | `../workflows/implement-tdd.md` |
| `/debug-mode` | `../workflows/debug.md` |
| `/commit` | `../workflows/commit.md` |
| `/commit-pr` | `../workflows/commit-pr.md` |
| `/review-pr` | `../workflows/review-pr.md` |
| `/wrap-session` | `../workflows/wrap-session.md` |

## Rationale

The command set mirrors the `CLAUDE.md` command table and covers the recurring
operating loop: specify, research, prototype, implement, debug, commit, open/review
PRs, and wrap the session.

Excluded candidates stay out of v1 for clear ownership reasons:

- `/fix-types` is a delegating-hook target for `verify-on-change`, not a user-facing
  command.
- `/update-docs` is automatic maintenance handled by checkpoint hooks, not a command.
- `/prove` and `/publish-slice` remain repo-specific skills until their patterns
  generalize.
- `/autoskill` runs inside `/commit`, `/commit-pr`, and `/wrap-session` as a proposal
  pass; it is not standalone in v1.

Command specs must reference workflow filenames and define invocation, output, and
model routing only. Workflow steps live in `../workflows/`.

