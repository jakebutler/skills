# lower-db Product Development / IDE Setup Package

This package installs a progressive-disclosure agent setup for lower-db:

- a short root `CLAUDE.md` operating kernel
- a short `AGENTS.md` Codex kernel
- lower-db-specific Claude skills
- support docs that hold the detail removed from the root file
- optional IDE helper config for VS Code-compatible IDEs, Cursor, and Windsurf

The goal is to keep every prompt light while preserving the operational memory that protects lower-db's trust, publish/send separation, evidence rules, dirty-tree safety, and validation discipline.

## Package layout

```text
repo-overlay/
  CLAUDE.md
  AGENTS.md
  .claude/skills/
    codex-implementation/SKILL.md
    codex-review/SKILL.md
    codex-computer-use/SKILL.md
    prove/SKILL.md
    publish-slice/SKILL.md
    wrap-session/SKILL.md
  docs/operations/
    agent-command-cookbook.md
    agent-progressive-disclosure.md
    agent-quality-bars.md
    fable-codex-development-workflow.md
    known-failure-modes.md
  docs/templates/
    feature-slice-spec.md

optional-ide/
  vscode/
  cursor/
  windsurf/
```

## Installation model

Copy `repo-overlay/` into the root of `jakebutler/lower-db`.

Review before overwriting any existing files. The optional IDE files are intentionally outside `repo-overlay/` so they do not overwrite your local editor setup unless you choose to install them.

## Intended behavior

The root `CLAUDE.md` is now the kernel, not the encyclopedia. It tells the agent what must always be loaded and which deeper doc/skill to read only when relevant.

Codex is expected to do bulk work through the skills, but Fable/Claude remains accountable for scope, taste, invariants, verification, and user-facing reporting.

## Recommended next step

After copying the overlay into a clean branch, run `/prove` only if the changed files require validation in your repo. For a docs-only install, targeted lint/typecheck may be enough if your repo treats markdown outside TypeScript tooling as non-build inputs.

Then open a small PR with `/publish-slice`.
