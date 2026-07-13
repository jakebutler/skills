# CLAUDE.md — lower-db operating kernel

You are working on **the lower dB**, a patient-first GLP-1 intelligence desk. Trust is the product. A bad change can label an unverified claim as verified or send email to subscribers. Optimize for small, reversible, evidence-backed changes.

## 1. Source of truth

Always orient from:

1. `CONTEXT.md` — domain glossary. If terms conflict, glossary wins.
2. `docs/adr/*.md` on `origin/main` — binding architecture decisions.
3. `docs/plans/2026-07-06-fable-audit-source-of-truth.md` — current AUD-1…AUD-20 roadmap, D1–D6 owner decisions, and adopted `digestV2*` schema.
4. Current code.
5. `README.md`, `docs/spec.md`, `docs/project-status.md` only for orientation. They are known stale; trust code and flag drift.

Precedence: glossary > ADRs > audit source of truth > code > everything else.

Use progressive disclosure. Do not load every operations doc by default. Read deeper docs only when the task touches that area.

## 2. Work style

Use Fable/Claude as orchestrator and verifier. Use Codex as the workhorse for bounded implementation, independent review, and local UI/runtime verification.

Before writing code, apply the Ponytail ladder:

1. Does this need to exist?
2. Does this already exist in the repo?
3. Does stdlib or the platform do it?
4. Does an installed dependency already cover it?
5. Can the fix be one line?
6. Only then write the minimum code that works.

Small does not mean careless. Do not cut validation, data-loss protection, security, accessibility, or explicitly requested behavior. Non-trivial logic needs one runnable check.

## 3. Git and workspace rules

- Before reasoning about current code, fetch and compare against `origin/main`. New branches start from `origin/main` and use `codex/<slug>`.
- `.worktrees/` contains live Codex worktrees. Never prune, clean, or edit them unless the task explicitly owns one.
- Root checkout is often dirty. Before git operations that could touch files, classify dirty paths as preserve / hold / remove.
- Never run `git clean`, never restore a path you did not create, never `git add -A`, and never stage by directory.
- In a fresh worktree, run `pnpm worktree:bootstrap` before typecheck, Trigger work, or package builds.
- For multi-slice epics, read `docs/operations/codex-epic-thread-orchestration.md` and maintain a slice ledger.

## 4. Commands that matter

Use pnpm. Never use npm or yarn.

| Need | Command / rule |
|---|---|
| Env-dependent command | `node scripts/with-root-env.mjs <cmd>`; never `source .env.local` |
| Node tests | `pnpm exec vitest run -c vitest.node.config.ts <paths>` |
| React tests | `pnpm exec vitest run -c vitest.react.config.ts <paths>` |
| Typecheck | `pnpm exec tsc --noEmit --incremental false` |
| Lint | `pnpm exec eslint --max-warnings=0 <changed files only>` |
| Convex codegen | `pnpm exec convex codegen` after schema/function-signature changes |
| Builds | `pnpm build:admin`, `pnpm build:public`, or legacy root `pnpm build` only when relevant |
| Paths with parens | Quote them, e.g. `'src/app/(admin)/admin/...'` |

No CI gate exists yet. Local validation is the gate. Record exact commands and results in PRs.

## 5. Repo map

- `apps/admin`, `apps/public-site` — real Next.js apps.
- `src/` — legacy root app plus shared library code used by both apps.
- `convex/` — sole datastore. Do not build on dead Drizzle/Postgres paths.
- `trigger/` — durable pipeline tasks.
- `agent-team/` — prompts and model alias registry.
- `scripts/` — operator tooling.
- `experiments/` — experiment artifacts only.
- `docs/` — ADRs, plans, runbooks, changelog, project status.

## 6. Core conventions

- Env vars go through `src/lib/config/env.ts`. No bare `process.env` in `src/`.
- LLM calls go through `agent-team/config/models.json` and `src/lib/agent-team/models.ts` / `providers.ts`. Never hardcode provider model IDs or call provider SDKs directly.
- Tests are colocated. `.test.ts` is node runner; `.test.tsx` is React/jsdom runner.
- Public routes may not import admin code, internal Convex clients, or `convex/_generated/api`. Add or extend public query surfaces instead.
- Dev/seed/reset Convex handlers are `internalMutation`, never public.
- Public queries return only approved/live data and no internal metadata.
- Production fails closed when public Convex data is unavailable; dev may fall back.
- Swiss Contrast design system only: semantic classes/tokens, radius 0, no new raw Tailwind values. Run `pnpm audit:design-system` for design-system changes.
- Docs use absolute dates.

## 7. Domain invariants

Violating these is worse than a broken build.

1. **Publish ≠ Send.** Publish means live web archive. Send means email delivery. Agents may publish only where allowed; they never send. Send is always distinct, human-gated, and only offered for the latest edition unless a typed week-label override is required.
2. Legacy `digestEditions` pipeline writes status `review` only, never `published`.
3. **Approved == Published.** Do not invent a separate approval state.
4. `patientSignal: true` means anecdotal; clinical and regulatory citation eligibility are false.
5. Reader-visible **verified** is trust. Do not widen verified semantics, and do not treat heuristic lexical overlap as semantic verification.
6. Editing edition prose after claim extraction re-blocks publish until re-extraction.
7. Week targeting uses the canonical `getWeekLabel()` ISO `YYYY-Www`; display ranges are presentation only.
8. Finalized evidence snapshots are immutable. Correct by new run/packet or appended review decision, never in-place mutation.
9. Digest V2 persistence is additive-only; V2 slices do not modify legacy digest rails, claim-ledger tables, publish/send logic, or subscriber rails.
10. Respect `CLAIM_LEDGER_READ_ONLY`.
11. Deterministic style guardrails are intentional; do not loosen them to pass output.
12. Citations are real or absent. Never fabricate, pad, or improve citations. `grokipedia.com` is blocked.

## 8. Validation and PR bar

Default deliverable bar:

- Scope is one slice; no drive-by refactors.
- Changed behavior has the smallest useful colocated test.
- Run targeted tests, typecheck, and changed-file lint.
- Run admin/public builds if route topology, config, or shared boundary code changed.
- Convex schema/function changes run codegen and commit `_generated`.
- Trigger tasks are idempotent or guarded, and failures write durable failed state.
- Operator scripts are dry-run by default and require explicit live flags.
- PR body includes scope, non-goals, validation evidence, risks, and exact commands/results.

For task-specific detail, read the support doc or skill only when needed:
- code validation: `/prove`
- PR publication: `/publish-slice`
- session close: `/wrap-session`
- progressive disclosure map: `docs/operations/agent-progressive-disclosure.md`
- full quality bars: `docs/operations/agent-quality-bars.md`
- command cookbook: `docs/operations/agent-command-cookbook.md`
- known traps: `docs/operations/known-failure-modes.md`
- Fable/Codex workflow: `docs/operations/fable-codex-development-workflow.md`

## 9. Stop-and-ask rules

Proceed without asking when the action is reversible, inside the current slice/AUD scope, and violates no invariant.

Stop and ask before:

1. Any Send-class action or code path that can trigger cloud email delivery.
2. Any live non-dry-run cloud Convex mutation, backfill, repair, import, queue, or deploy.
3. Batch LLM/scraping/provider work that can spend real money beyond a smoke-sized sample.
4. Deleting or archiving anything, especially untracked files or named boundaries.
5. Changing publish/send/claim-gating semantics or D1–D6 owner-decision territory.
6. Force-push, shared-branch rebase, or history edits.
7. Authoritative sources conflict in a way that changes behavior.
8. Required validation fails and the fix would expand scope.

When asking: state the blocker, 2–3 options, your recommendation, and what reversible work you will do meanwhile.

## 10. Codex delegation

Use Codex for bulk work, but keep Fable/Claude accountable.

- `codex-implementation`: bounded patches. Claude scopes, reviews diff, and verifies.
- `codex-review`: independent review of uncommitted changes, branch diffs, commits, or implementation slices.
- `codex-computer-use`: browser/app verification, screenshots, simulator/device/runtime checks.

Parallel Codex implementation agents must use isolated worktrees. Label wrapper agents with `gpt-5.5:<task>`. Treat Codex output as evidence, not authority.

## 11. Skills

- `/prove` — build and run diff-scoped validation; emit evidence block.
- `/wrap-session` — changelog/project-status/spec/design-doc ritual plus dirty-tree classification.
- `/publish-slice` — stage explicit paths, branch, commit, PR body, checks, review loop.
