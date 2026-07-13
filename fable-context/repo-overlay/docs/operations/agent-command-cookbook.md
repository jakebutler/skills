# Agent command cookbook

Use this when command shape matters. Root `CLAUDE.md` keeps only the commands that routinely cause damage when forgotten.

## Environment

Never source `.env.local`. `CONVEX_DEPLOY_KEY` can contain `|`, which breaks shell parsing.

```bash
node scripts/with-root-env.mjs <cmd>
```

## Worktree bootstrap

Run once in a fresh worktree before typecheck, Trigger work, or package builds.

```bash
pnpm worktree:bootstrap
```

## Git orientation

Fetch before reasoning about current code.

```bash
git fetch origin
```

```bash
git status --short --branch
```

```bash
git diff --name-only origin/main...HEAD
```

## Typecheck

Always disable incremental cache.

```bash
pnpm exec tsc --noEmit --incremental false
```

## Lint changed files only

Do not run repo-wide lint unless Jake explicitly asks.

```bash
pnpm exec eslint --max-warnings=0 <changed files only>
```

## Node tests

Use for `.test.ts` and non-React TypeScript.

```bash
pnpm exec vitest run -c vitest.node.config.ts <paths>
```

## React tests

Use for `.test.tsx` and React/jsdom tests.

```bash
pnpm exec vitest run -c vitest.react.config.ts <paths>
```

## Convex codegen

Run after `convex/schema.ts` or function-signature changes.

```bash
pnpm exec convex codegen
```

## Builds

Use only when route topology, config, public/admin boundary, or shared runtime code changed.

```bash
pnpm build:admin
```

```bash
pnpm build:public
```

```bash
pnpm build
```

## Design-system audit

Run when adding or changing Swiss Contrast primitives/classes.

```bash
pnpm audit:design-system
```

## Shell paths with route groups

Quote paths with parentheses.

```bash
git add 'src/app/(admin)/admin/digests/[editionId]/page.tsx'
```

## Package manager

Use pnpm. Never use npm or yarn.
