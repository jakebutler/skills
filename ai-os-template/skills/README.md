# AI OS Codex Skills

These are the canonical external-worker surfaces for the AI Engineering OS routing
matrix v0.7:

- `codex-implementation/` delegates bounded code changes to Codex CLI.
- `codex-review/` supplies the fresh-context native `gpt-5.6-sol` xhigh half of the
  standard paired code-review topology; Claude Opus 5 supplies the other half.
- `codex-computer-use/` delegates browser, screenshot, app-launch, and runtime
  verification to Codex CLI.
- `fable-consultation/` invokes one quota-aware principal-engineer/architect critique
  only after an exceptional escalation trigger; it is not a routine code-review lane
  or a replacement for Sol or Opus.
- `glm-frontend-patch/` is the thin target binding for the installed experimental GLM
  route. Its canonical runner source is `../../skills/glm-frontend-patch/`.
- `composer-implementation/` delegates bounded implementation to Cursor Composer.

Each `SKILL.template.md` is copied into the target repo's supported skill directory
during instantiation. Fill `{{PLACEHOLDER}}` markers from the instance manifest and
keep harness-specific adapters thin. Runtime worker targets must resolve from the
active repository/worktree with `git rev-parse --show-toplevel`; never bind a skill to
the checkout or temporary worktree used during installation.

Lower-db already has its own bound copies of these skills. Do not double-install these
templates there; update the bound copies only through that repo's normal review path.
