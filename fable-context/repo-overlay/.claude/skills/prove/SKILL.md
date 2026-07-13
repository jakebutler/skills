---
name: prove
description: "Run the diff-scoped validation suite for lower-db and emit the standard evidence block. Use before every PR: it figures out what changed, runs the right vitest/tsc/eslint commands, and formats the result for the PR body. Never use repo-wide lint or test runners — always scoped to changed files."
---

# /prove — lower-db diff-scoped validation

Run the correct validation suite for whatever changed on this branch and emit a copy-pasteable evidence block for the PR body.

## When to use

Any time you're about to open or update a PR in lower-db. Also useful mid-session to verify a slice is clean before writing the next piece.

## Step 1 — Discover changed files

```bash
git fetch origin
git diff --name-only origin/main...HEAD
```

Classify every changed path:

| Path pattern | What to run |
|---|---|
| `*.test.ts` or `*.ts` (non-tsx) | node vitest |
| `*.test.tsx` or `*.tsx` | react vitest |
| `convex/schema.ts` or `convex/*.ts` function signatures | convex codegen first |
| `src/app/(admin)/**` or `apps/admin/**` | `pnpm build:admin` |
| `src/app/(public)/**` or `apps/public-site/**` | `pnpm build:public` |
| `src/lib/config/env.ts` or `next.config.ts` | both builds |
| Any of the above | `tsc --noEmit --incremental false` (always) |

## Step 2 — Run convex codegen if needed

If `convex/schema.ts` or any convex function signatures changed:

```bash
pnpm exec convex codegen
```

Then include the `_generated` diff in the commit. If codegen produces no diff, note that explicitly.

## Step 3 — Run node tests (if any `.test.ts` changed or their source changed)

Collect the exact changed `.ts` source files and their colocated `.test.ts` counterparts. Run only those:

```bash
pnpm exec vitest run -c vitest.node.config.ts <paths>
```

If the changed source has no `.test.ts` pair, note "no node tests — no colocated test file."

## Step 4 — Run react tests (if any `.test.tsx` changed or their source changed)

```bash
pnpm exec vitest run -c vitest.react.config.ts <paths>
```

Note: react tests run with jsdom and maxWorkers 1. Do not run the full suite (`pnpm test:react`) unless explicitly requested — it takes minutes.

## Step 5 — Typecheck

Always:

```bash
pnpm exec tsc --noEmit --incremental false
```

The `--incremental false` flag is mandatory — the incremental cache can mask real errors across worktrees.

## Step 6 — Lint (changed files only)

```bash
pnpm exec eslint --max-warnings=0 <only the files you changed>
```

Never run `pnpm lint` (repo-wide). Never fix warnings in files outside your diff.

## Step 7 — Build (if route topology, config, or shared boundaries changed)

```bash
pnpm build:admin   # if admin routes or shared libs changed
pnpm build:public  # if public routes or shared libs changed
```

Both are run via `with-root-env.mjs` already in the package.json scripts so env loads correctly.

## Step 8 — Emit the evidence block

Format the results exactly like this and output it so Jake can paste it into the PR body:

```
## Validation evidence

**Node tests**
```
pnpm exec vitest run -c vitest.node.config.ts <paths>
```
Result: X passed, 0 failed.

**React tests**
```
pnpm exec vitest run -c vitest.react.config.ts <paths>
```
Result: X passed, 0 failed.  *(or: skipped — no tsx changes)*

**Typecheck**
```
pnpm exec tsc --noEmit --incremental false
```
Result: passed.

**Lint**
```
pnpm exec eslint --max-warnings=0 <files>
```
Result: passed.

**Build**
```
pnpm build:admin
```
Result: passed.  *(or: skipped — no config/route changes)*
```

If any step fails: stop, report the exact error output, and do not emit a passing evidence block. Fix the failure first.

## Hard rules

- `.test.ts` = node runner. `.test.tsx` = react runner. Extension is the router — never mix them.
- Never `source .env.local`. All env-dependent commands go through `node scripts/with-root-env.mjs`.
- Never quote commands that ran but weren't actually needed — only include steps that were executed.
- If a test file doesn't exist for changed source, note the gap explicitly rather than omitting it silently.
