# AI OS Codex Skills

These are the canonical external-worker surfaces for the AI Engineering OS routing
matrix v0.5:

- `codex-implementation/` delegates bounded code changes to Codex CLI.
- `codex-review/` delegates independent review to Codex CLI.
- `codex-computer-use/` delegates browser, screenshot, app-launch, and runtime
  verification to Codex CLI.
- `fable-consultation/` invokes one quota-aware architecture or system-design critique
  through local Claude Code subscription auth, with GLM/Terra fallback.
- `glm-frontend-patch/` defines the streamed frontend implementation route; its
  skill-owned runner is still queued.
- `composer-implementation/` delegates bounded implementation to Cursor Composer.

Each `SKILL.template.md` is copied into the target repo's supported skill directory
during instantiation. Fill `{{PLACEHOLDER}}` markers from the instance manifest and
keep harness-specific adapters thin.

Lower-db already has its own bound copies of these skills. Do not double-install these
templates there; update the bound copies only through that repo's normal review path.
