---
name: publish-slice
description: "Stage a lower-db slice by explicit file paths, commit on a codex/<slug> branch, push, open a PR with the house body template, then own the checks/review loop until merge-ready. Use when a slice is implementation-complete and needs to become a PR. Never stages by directory or glob — always by named file."
---

# /publish-slice — lower-db slice → PR + review loop

Turn a completed implementation slice into a reviewable PR and own it through to merge-ready. This skill does the staging, commit, push, PR creation, and review-comment loop so you don't have to.

## Step 1 — Pre-flight

```bash
git fetch origin
git status --short --branch
git diff --name-only origin/main...HEAD
```

Confirm:
- You are on a `codex/<slug>` branch, or one needs to be created.
- The dirty tree has been classified (preserve/hold/remove). If not, do it now.
- `/prove` has been run (or run it now). Do not publish without a passing evidence block.

## Step 2 — Create the branch if needed

If still on an unsliced branch or `main`:

```bash
git checkout -b codex/<slug> origin/main
```

Branch name: `codex/<slug>` where `<slug>` is 2–5 words from the slice name, kebab-cased.

## Step 3 — Stage by explicit path only

List every file that belongs to this slice. Stage them one by one or as a named list — never by directory:

```bash
git add src/lib/foo/bar.ts src/lib/foo/bar.test.ts convex/schema.ts convex/_generated/api.d.ts
```

After staging, run `git status` and review the staged set. If anything unexpected is staged, unstage it. Never proceed with a dirty staged set.

Paths with parentheses must be quoted:

```bash
git add 'src/app/(admin)/admin/digests/[editionId]/page.tsx'
```

## Step 4 — Commit

```bash
git commit -m "$(cat <<'EOF'
<imperative-mood one-line title under 70 chars>

<Optional: 2-3 sentences on why, what invariant this touches, or what ADR it operates under. Skip if the title is self-evident.>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

Commit message rules:
- Imperative mood: "Add", "Fix", "Implement" — not "Added" or "Adding"
- Under 70 characters on the first line
- Body references the ADR if the change touches publish/send/claim gating
- No file lists in the commit message

## Step 5 — Push

```bash
git push -u origin codex/<slug>
```

## Step 6 — Open the PR

```bash
gh pr create \
  --title "<same as commit title>" \
  --body "$(cat <<'EOF'
## Scope

<1-3 sentences: what this slice does and what it explicitly does not do.>

## Non-goals

- <anything a reviewer might expect that is intentionally out of scope>

## Validation evidence

**Node tests**
\`\`\`
<command>
\`\`\`
Result: X passed, 0 failed.

**Typecheck**
\`\`\`
pnpm exec tsc --noEmit --incremental false
\`\`\`
Result: passed.

**Lint**
\`\`\`
pnpm exec eslint --max-warnings=0 <files>
\`\`\`
Result: passed.

**Build** *(if applicable)*
\`\`\`
pnpm build:admin
\`\`\`
Result: passed.

## Risks

- <anything that could go wrong at runtime, in production, or during review>
- <if this touches publish/send/claim gating, name the ADR it operates under>
- <"None identified" is acceptable if genuinely true>

## ADRs / invariants

- <list any §5 domain invariants or ADRs this slice touches, or "N/A">

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

After creation, capture the PR URL and print it.

## Step 7 — Post-open checks

```bash
gh pr checks <PR number> --watch
```

If checks fail:
1. Read the failure output.
2. Fix only what is failing — do not broaden scope.
3. Stage and commit the fix with a clear message referencing the check failure.
4. Push. Checks re-run automatically.

## Step 8 — Review-comment loop

Poll for review comments:

```bash
gh api repos/jakebutler/lower-db/pulls/<PR number>/comments
gh pr view <PR number> --json reviews,comments
```

For each comment, classify:

| Class | Action |
|---|---|
| `must-fix` | Correctness bug, failing check, security issue, missing required test | Fix and push |
| `should-fix` | Clarity or maintainability inside slice scope | Fix and push |
| `orchestrator-decision` | Scope expansion, product tradeoff, destructive action | Stop and ask Jake |
| `wont-fix` | Out of scope or superseded | Reply with rationale, do not change code |

After each push, reply to the review thread with one sentence: what changed and why.

## Step 9 — Merge-ready check

The slice is merge-ready when:

- [ ] PR is open and targets the intended base branch.
- [ ] All required checks pass on the latest head SHA.
- [ ] No `requested changes` review is unresolved.
- [ ] No blocking inline thread is unresolved.

When merge-ready, report to the conversation:

```
PR #<n> is merge-ready.
URL: <url>
Head SHA: <sha>
Checks: all green
Reviews: approved / no blockers
```

Do not merge. Jake merges.

## Hard rules

- **Never `git add -A` or `git add .`** — stage by explicit path only.
- **Never amend a commit that has been pushed** — create a new commit for fixes.
- **Never force-push** without explicit instruction.
- **Never self-approve** — only verify that approvals exist.
- **PRs always target `origin/main`** unless the slice is part of a declared stack with a different base.
- If a pre-commit hook fails, fix the underlying issue and create a new commit. Never use `--no-verify`.
- If staging reveals unexpected files (secrets, large binaries, generated files that shouldn't be committed), stop and ask before proceeding.
