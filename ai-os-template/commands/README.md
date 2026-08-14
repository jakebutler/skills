# Command Specs

The v1 slash command set has exactly ten commands (`/experiment` added in template
v0.2). They are thin harness adapters over workflow specs, not replacements for the
workflows.

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

- `/fix-types` is unnecessary: verification is end-of-batch and failures return as one
  consolidated implementation/debug list.
- `/update-docs` is automatic maintenance handled by checkpoint hooks, not a command.
- `/prove` and `/publish-slice` remain repo-specific skills until their patterns
  generalize.
- `/autoskill` is not an automatic commit/PR phase; invoke durable-learning work only
  when a recurring lesson warrants it.

Command specs must reference workflow filenames and define invocation, output, and
model routing only. Workflow steps live in `../workflows/`.
