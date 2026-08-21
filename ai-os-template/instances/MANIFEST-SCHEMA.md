# Instance Manifest Schema

Every instantiated repo gets `docs/ai-os-manifest.md` (or the repo's docs dir
equivalent). It is the single source of truth for how template roles bind to that
repo's actual files. **House conventions win over template defaults** (decision #13);
the manifest records the winner, it never renames existing files.

## Required sections

1. **Header** — reconciliation date, template/runtime version, exact source commit and
   tree, portable template source URL and optional local `AI_OS_HOME` configuration,
   and one line on the instance's character (e.g. "overlay package", "fresh
   scaffold"). A moving `main` URL is for discovery; it is not the installed identity.
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
   - each workflow (spec, design-proof, implement-tdd, debug, commit, commit-pr, review-pr,
     wrap-session, init, experiment, research, prototype, extract-invariant) — may bind
     to existing repo skills
   - hooks
   - subagent roles
   - Codex delegation skills
   - model routing, including exact standard code-review routes
   - HITL authority policy (`solo-operator-hitl-v1` only when explicitly adopted;
     otherwise `not installed` with the retained human-authority rule)
   - FEATURE-LIST module (default: not installed)
3. **Follow-ups** — numbered list of deferred decisions and unwired pieces, each with
   enough context that a future session can act without re-deriving it.

## Machine-readable proof-harness binding

Instances that enable proof-required work also install `.ai/proof-harness.json` from
`docs-templates/proof-harness-config.template.json` and validate it against
`schemas/proof-harness-config.schema.json`. This file is the machine source of truth;
the human role-bindings table points to it rather than duplicating values.

Required bindings:

- `task_artifact_root`: existing project-local task directory, relative to repo root;
- proof-harness workflow, schema root, active invariant registry, generated invariant
  index, generated effect inventory, and inventory-adapter configuration;
- `package_manager_source`: derive the current tool declaration from a repo file rather
  than copying a version string into root instructions;
- exact inventory, invariant-index build, invariant-selection, design-hash,
  builder-hash, invariant-extraction, advisory-promotion, review-resolution validation,
  rendered-view generation/freshness, and design-validation commands; and
- architecture, security, and resolver role bindings.

House conventions win. For example, FreshProof binds `task_artifact_root` to `plans`,
never `dev/active`. Absolute paths and `..` escapes are invalid.

## Routing runtime distribution (D3, revised 2026-07-24)

The canonical registry and evidence ledger live in the template repo under
`ai-os-template/routing/`. Instances vendor an explicit v0.8 snapshot so routing works
without `AI_OS_HOME`, and record its source commit in the manifest. The human matrix
may remain a version-pinned reference; the vendored JSON is the executable contract.

For runtime v0.8, the model-routing row must record:

- standard code review: fresh-context native `gpt-5.6-sol` at xhigh plus direct
  `claude-opus-5`, both against one frozen candidate;
- provider/model provenance and start/end candidate identity requirements;
- Fable as optional principal-engineer/architect escalation only, with the qualifying
  trigger recorded and no authority to replace either standard lane; and
- any project-bound `design-proof` architecture/security roles separately, so the
  implementation/PR review update does not silently rewrite an accepted proof protocol.
- the local task registry, evidence ledger, resolver, doctor config, generated tool
  cache, and whether Claude project hooks are active.

Symlinks were considered and rejected: a committed symlink to an absolute local path
dangles on GitHub, CI, other machines, and fresh clones — the repo would carry a
pointer only one machine can resolve. The manifest pin gives the same single-source
behavior with an explicit, reviewable update step instead of silent drift.

## Portable external bindings

An instance may vendor detailed specs repo-locally or resolve them from a separate
template checkout configured as `AI_OS_HOME=/path/to/ai-os-template`. Every manifest
must also record a portable source URL, such as
`https://github.com/jakebutler/skills/tree/main/ai-os-template`.

- Never write an author's absolute checkout path into an instantiated file.
- Express shared paths as `${AI_OS_HOME}/workflows`, `${AI_OS_HOME}/commands`,
  `${AI_OS_HOME}/hooks`, `${AI_OS_HOME}/agents`, and `${AI_OS_HOME}/routing`.
- Deferred commands are workflow labels, not advertised installed slash commands.
- Root instructions must contain a self-contained summary that remains usable when
  `AI_OS_HOME` is unset, the template checkout is absent, or the network is unavailable.
- Missing optional shared specs must not block ordinary repository work.
- Record exact source commit/tree for every selectively vendored executable component.
  Distinguish `installed`, `adopted with instance overlay`, `referenced`, and `deferred`;
  never imply that a newer template `main` has been absorbed automatically.

## Instantiation checklist

1. Confirm `git rev-parse --is-inside-work-tree` succeeds, then create the recon packet
   from codemap + existing docs (Codex, read-only). Never treat a bare repository
   storage directory as the editable checkout.
2. Codex Sol High makes binding decisions; anything unresolvable goes to the user.
3. Isolated worktree, branch `codex/ai-os-instance` off `origin/main` — never the
   (possibly dirty) root checkout.
4. Codex writes the bound files per packet; no git ops, no deletions, no renames;
   marker blocks and imports in existing files preserved byte-identical.
5. Codex Sol High inspects the diff, verifies no `{{PLACEHOLDER}}` survivors and no
   host-specific absolute paths, and tests the documented fallback with `AI_OS_HOME`
   unset before committing by named file.
6. When proof-required work is enabled, validate `.ai/proof-harness.json`, inventory
   adapter config, active registry, and one positive/negative design-packet fixture;
   run rendered-view freshness before advertising the gate as installed.
7. Verify that the installed code-review adapter pins native Sol 5.6 xhigh in a fresh
   context, that the Claude adapter pins Opus 5 and records the resolved model, and
   that an unavailable lane fails visibly rather than silently selecting Fable.
8. Promote repo learnings to the template only when they generalize (decision #12).

Reference instances: `docs/ai-os-manifest.md` in lower-db (overlay-based, house
conventions dominant) and freshproof (template-based, mostly fresh roles).
