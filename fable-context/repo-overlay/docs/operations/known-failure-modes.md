# Known lower-db agent failure modes

Use this when something feels familiar, risky, or weird. These examples are intentionally concrete so an agent can pattern-match before causing damage.

## 1. Env-pipe faceplant

Symptom: `source .env.local` breaks on `|` in `CONVEX_DEPLOY_KEY`, or half the env silently disappears.

Rule: env-dependent commands run through `node scripts/with-root-env.mjs`.

## 2. Lint crusade

Symptom: repo-wide lint exposes legacy debt and the agent fixes unrelated files.

Rule: changed-file eslint only, with `--max-warnings=0`.

## 3. Wrong-extension test

Symptom: React test written as `.test.ts` runs in node or does not run correctly.

Rule: `.test.ts` is node. `.test.tsx` is React/jsdom.

## 4. Phantom worktree failure

Symptom: imports fail in a fresh worktree because workspace links were never bootstrapped.

Rule: run `pnpm worktree:bootstrap` first.

## 5. Stale-branch hallucination

Symptom: root checkout is an old merged branch, so the agent reimplements work that exists on `origin/main`.

Rule: fetch and compare against `origin/main` before concluding anything is missing.

## 6. Helpful auto-send

Symptom: completing a flow triggers subscriber email delivery.

Rule: agents never send. Publish and Send are separate.

## 7. Public-published upsert

Symptom: pipeline/migration writes `status: "published"` for convenience.

Rule: legacy digest pipeline writes `review` only.

## 8. Trust laundering

Symptom: heuristic `verified` becomes reader-visible semantic proof.

Rule: distinguish heuristic, semantic, and human verification. Never widen reader-visible verified semantics.

## 9. Seed backdoor

Symptom: dev/seed/reset Convex handler is exposed as public `mutation`.

Rule: use `internalMutation` unless it is intentionally public.

## 10. Boundary smuggle

Symptom: public route imports admin code or internal Convex clients.

Rule: extend public query surfaces instead.

## 11. Snapshot fix

Symptom: source/candidate row patched in-place to correct bad evidence.

Rule: new run/packet or appended review decision.

## 12. Design freelance

Symptom: raw Tailwind values, rounded corners, ad-hoc cards.

Rule: Swiss Contrast semantic vocabulary, radius 0, update design docs if primitives change.

## 13. Changelog rewrite

Symptom: editing old changelog entries.

Rule: prepend only. `project-status.md` is the overwrite file.

## 14. Direct model call

Symptom: provider SDK or raw API call appears in feature code.

Rule: model alias registry only.

## 15. Date-string improvisation

Symptom: week labels computed with ad-hoc `Date` math or display ranges.

Rule: use canonical `getWeekLabel()`.

## 16. Generated-file edit

Symptom: hand-editing `convex/_generated/*`.

Rule: fix source and run `pnpm exec convex codegen`.

## 17. Dirty-tree bulldozer

Symptom: `git add -A`, `git stash`, or `git clean` destroys untracked WIP.

Rule: classify dirty paths and stage explicit files only.

## 18. Live-run surprise

Symptom: backfill/queue/repair runs against cloud without dry-run.

Rule: dry-run first, print the plan, get explicit approval for live.
