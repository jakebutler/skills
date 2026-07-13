---
name: wrap-session
description: "End-of-session docs ritual for lower-db: prepend a dated changelog entry, overwrite project-status.md with current git state and next-session pick-up point, update touched sections of spec.md, classify the dirty tree, and update the design-system docs if UI primitives changed. Run at the end of every coding session."
---

# /wrap-session — lower-db session close ritual

Execute the mandatory end-of-session documentation ritual. Every session ends with this. It is the primary handoff mechanism between sessions.

## Step 1 — Gather current state

Run these in parallel:

```bash
git status --short --branch
git log --oneline -10
git diff --name-only origin/main...HEAD
```

Also recall what was accomplished this session: what changed, what was validated, what was merged, what's still in progress.

## Step 2 — Classify the dirty tree

For every untracked or modified file not part of this session's slice:

| Label | Meaning | Action |
|---|---|---|
| `preserve` | Active WIP that must survive | Note in project-status; do NOT stage or clean |
| `hold` | Prototype or ambiguous — keep it but don't touch it | Note in project-status |
| `remove` | Generated/runtime noise safe to recreate | Can clean, but confirm first if unsure |

**Never `git clean`, never `git stash -u`, never `git add -A`.**

## Step 3 — Prepend to `docs/changelog.md`

**Prepend only — never edit past entries.**

The format:

```markdown
## YYYY-MM-DD

### <Title of what was done>

<2-5 sentences describing the behavioral change: what was built, why, what invariants it touches. Not a file list — a reader should understand the system change.>

**Validation**
- `<exact command>` — <result>
- `<exact command>` — <result>
```

Use the exact date from the session (today's date is in the system context). If multiple distinct things were done, use multiple H3 sections under one H2.

## Step 4 — Overwrite `docs/project-status.md`

Overwrite the file completely. Structure:

```markdown
# the lower dB - Project Status

> **Handoff doc for new sessions.** Overwrite when context shifts.
> Last updated: **YYYY-MM-DD** (<one-line summary of session work>)
> History: `docs/changelog.md` · architecture: `docs/spec.md`

---

## YYYY-MM-DD snapshot

### Status: <what state is the system in right now>

<1-3 paragraphs: what was done, what's complete, what's in flight.>

### Git state (read this first)

- **Current branch:** `<branch>`
- **PRs open:** #<n> — <status>
- **Local dependency state:** `node_modules` is restored with `pnpm worktree:bootstrap`
- **Dirty paths:**
  - `preserve`: <list>
  - `hold`: <list>

### Validation completed on YYYY-MM-DD

<paste the evidence block from /prove or from the session>

### Known residual risks and follow-ups

- <anything that should block a future session from proceeding without reading this>

---

## Pick up here next session

1. <first concrete action>
2. <second concrete action>
```

If there are open AUD items being worked, name them by ID (AUD-1…AUD-20).

## Step 5 — Update `docs/spec.md` (touched sections only)

`docs/spec.md` is known-stale (AUD-16). Only update sections you actually changed this session. Keep the file under 800 lines. Do not rewrite sections you didn't touch. If spec.md contradicts current code in a section you're touching, bring that section current and note the correction.

## Step 6 — Update design-system docs (if UI primitives changed)

If this session added new Swiss Contrast primitives or changed existing ones:

1. Update `design/stitch/swiss-contrast-design-system.md` with the new class names and their roles.
2. Verify `/design-system` route (`src/app/design-system/page.tsx`) shows the new primitives.
3. Run `pnpm audit:design-system` and confirm it passes.

If no UI primitives changed, skip this step entirely — don't touch the design-system docs.

## Step 7 — Output a handoff summary

After completing all file updates, output this to the conversation:

```
Session wrap complete.

Changelog: prepended entry for YYYY-MM-DD
Project-status: overwritten — pick up at [first action from the pick-up list]
Spec: [updated §X.Y and §X.Z / no changes needed]
Design docs: [updated / no UI primitive changes]

Dirty tree:
  preserve: [list or "none"]
  hold: [list or "none"]

Open AUD items in flight: [list by ID or "none"]
```

## Hard rules

- `docs/changelog.md` is **prepend-only (newest entries at the top); never edit past entries**.
- `docs/project-status.md` is **fully overwritten** every session. Don't append — replace.
- All dates are absolute (`2026-07-07`, never "today" or "last Tuesday").
- If you can't determine what was accomplished (e.g., this is called mid-session by mistake), ask before writing anything.
