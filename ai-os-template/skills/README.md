# AI OS Codex Skills

These are the canonical Codex delegation surfaces for the AI Engineering OS routing
matrix v0.2:

- `codex-implementation/` delegates bounded code changes to Codex CLI.
- `codex-review/` delegates independent review to Codex CLI.
- `codex-computer-use/` delegates browser, screenshot, app-launch, and runtime
  verification to Codex CLI.

Each `SKILL.template.md` is copied into the target repo's `.claude/skills/` directory
during instantiation. Fill `{{PLACEHOLDER}}` markers from the instance manifest and
keep the HTML comments only when they help future tailoring.

Lower-db already has its own bound copies of these skills. Do not double-install these
templates there; update the bound copies only through that repo's normal review path.
