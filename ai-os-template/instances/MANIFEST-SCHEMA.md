# Instance Manifest Schema

Every instantiated repo gets `docs/ai-os-manifest.md` (or the repo's docs dir
equivalent). It is the single source of truth for how template roles bind to that
repo's actual files. **House conventions win over template defaults** (decision #13);
the manifest records the winner, it never renames existing files.

## Required sections

1. **Header** — template version + date, template source path/URL, one line on the
   instance's character (e.g. "overlay package", "fresh scaffold").
2. **Role bindings table** — one row per template role, columns: `Template role`,
   `Bound to`, `Notes`. Every role must appear; unbound roles say
   `not installed in v1` with a reason. Roles:
   - root instructions (canonical + harness adapter)
   - durable product/architecture intent
   - project status / handoff
   - change ledger
   - task working memory
   - deep knowledge (docs dir)
   - tool/command cache
   - each workflow (spec, implement-tdd, debug, commit, commit-pr, review-pr,
     wrap-session, init, experiment, research, prototype) — may bind to existing repo skills
   - hooks
   - subagent roles
   - Codex delegation skills
   - model routing
   - FEATURE-LIST module (default: not installed)
3. **Follow-ups** — numbered list of deferred decisions and unwired pieces, each with
   enough context that a future session can act without re-deriving it.

## Routing matrix distribution (D3, 2026-07-12)

The canonical routing matrix lives in the template repo
(`ai-os-template/routing/model-routing.md`). Instances **reference** it in the
manifest's role-bindings row with a **version pin** (e.g. "routing → template repo,
matrix v0.3"). When the canonical matrix bumps, the next session in an instance repo
updates the pin deliberately.

Symlinks were considered and rejected: a committed symlink to an absolute local path
dangles on GitHub, CI, other machines, and fresh clones — the repo would carry a
pointer only one machine can resolve. The manifest pin gives the same single-source
behavior with an explicit, reviewable update step instead of silent drift.

## Instantiation checklist

1. Recon packet from codemap + existing docs (Codex, read-only).
2. Fable makes binding decisions; anything unresolvable goes to the user.
3. Isolated worktree, branch `codex/ai-os-instance` off `origin/main` — never the
   (possibly dirty) root checkout.
4. Codex writes the bound files per packet; no git ops, no deletions, no renames;
   marker blocks and imports in existing files preserved byte-identical.
5. Fable inspects the diff, verifies no `{{PLACEHOLDER}}` survivors, commits by
   named file.
6. Promote repo learnings to the template only when they generalize (decision #12).

Reference instances: `docs/ai-os-manifest.md` in lower-db (overlay-based, house
conventions dominant) and freshproof (template-based, mostly fresh roles).
