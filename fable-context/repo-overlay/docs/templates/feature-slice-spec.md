# Feature slice spec: <feature name>

> Status: draft
> Date: YYYY-MM-DD
> Owner: Jake
> Branch: `codex/<slug>`
> Related AUD / ADR: <IDs or N/A>

## 1. Product outcome

What user/editor/operator outcome changes when this ships?

## 2. Non-goals

What should not be included in this slice?

## 3. Source of truth

Read before implementation:

- `CONTEXT.md`
- <relevant ADRs>
- <relevant plan/audit docs>
- <existing code paths>

## 4. Slice contract

This slice changes:

- <file/path/behavior>
- <file/path/behavior>

This slice must not change:

- <rail or boundary>
- <related feature not in scope>

## 5. Acceptance criteria

- [ ] <observable behavior>
- [ ] <invariant enforced>
- [ ] <test or verification requirement>

## 6. Invariants touched

- <Publish/Send, verified, patient signal, immutable snapshots, V2 additive-only, etc.>
- <or N/A>

## 7. Validation plan

Node tests:

```bash
pnpm exec vitest run -c vitest.node.config.ts <paths>
```

React tests:

```bash
pnpm exec vitest run -c vitest.react.config.ts <paths>
```

Typecheck:

```bash
pnpm exec tsc --noEmit --incremental false
```

Lint:

```bash
pnpm exec eslint --max-warnings=0 <changed files only>
```

Build if relevant:

```bash
pnpm build:admin
```

```bash
pnpm build:public
```

## 8. Codex packets

### Packet A — <name>

Goal:

Acceptance criteria:

Files to inspect first:

Files to avoid:

Verification:

### Packet B — <name>

Goal:

Acceptance criteria:

Files to inspect first:

Files to avoid:

Verification:

## 9. Risks and stop points

Stop and ask before:

- <high-consequence action>
- <scope expansion>
- <unclear owner decision>
