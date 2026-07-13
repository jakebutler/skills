# Agent quality bars

Use this when a deliverable is being implemented, validated, or published. `CLAUDE.md` keeps the default bar; this file holds task-specific detail.

## Code slice / PR

A code slice is done when:

- Scope matches one slice contract.
- No adjacent-feature edits or drive-by refactors.
- New/changed behavior has colocated tests in the correct runner.
- Targeted node tests, React tests if UI, typecheck, and changed-file lint pass.
- Relevant admin/public builds pass when route topology, config, or shared-boundary code changed.
- PR body includes Scope, Non-goals, Validation evidence, Risks, and ADRs/invariants.
- Branch is `codex/<slug>` off `origin/main`.
- Anything touching publish/send/claim gating names the ADR it operates under.

## Convex schema or function change

- Run `pnpm exec convex codegen`; commit `_generated` diff.
- New tables have indexes their read paths use.
- No unbounded `collect()`-and-filter over growing sets.
- Write-time invariants are enforced in mutations, not callers.
- Public vs `internal*` is deliberate.
- Public return shapes expose no internal metadata.
- V2 work remains additive with respect to legacy rails.
- Large payloads go to artifacts/storage with `contentHash`, not row bodies.

## Trigger task

- Task is idempotent or explicitly guarded against re-run double-writes.
- Failure writes durable `failed` state with error message.
- Task never strands `running`.
- Manual recovery exists where relevant.
- Tests live near `trigger/*.test.ts`.
- Trigger CLI and SDK versions are not changed casually.

## Admin UI

- Composed from Swiss Contrast primitives/tokens.
- Radius 0.
- No new raw Tailwind values.
- Server actions fail with redirect toasts, not uncaught RSC exceptions.
- Destructive/irreversible actions require explicit confirmation.
- Send-class actions require typed confirmation.
- `.test.tsx` coverage exists for new states.
- Manual QA path is listed.
- Data unavailability renders an explicit state.

## Public route

- Public/admin import boundary is respected.
- Data flows through public Convex query surfaces.
- Production fails closed if public data is unavailable.
- Static/ISR-friendly: no request-time full-corpus work.
- No admin/internal metadata leaks into props or HTML.
- JS payload is not meaningfully regressed.

## Operator script

- Runs through `with-root-env.mjs` when env-dependent.
- Registered in `package.json` if it will run more than once.
- Supports `--dry-run` and is safe by default.
- Live mode requires an explicit flag.
- Live mode prints target deployment and counts before acting.
- Summary output includes counts, IDs, and artifact paths.
- One-shot repair scripts move to `scripts/archive/` after use.

## Experiment

- Lives in `experiments/<slug>/`.
- `lab-book.md` is updated per round.
- Each round records goal, run ID, command shape, observed output, conclusion, and fixes before next round.
- Raw vs normalized artifacts are separated.
- Snapshots are frozen in `rounds/`.
- Invalid rounds are declared invalid, not quietly overwritten.
- Experiment code stays out of `src/lib` production modules.

## Docs / ADR

- Absolute dates only.
- Status line: active, accepted, or superseded.
- Names what it supersedes.
- Changelog is prepended, never edited.
- `docs/project-status.md` is fully overwritten.
- `CONTEXT.md` changes when a term's meaning shifts.

## Prompt / model config change

- Alias-level change in `agent-team/config/models.json`.
- Same-tier fallback chain terminates.
- `ModelAlias` type updated.
- Cost entry exists in `src/lib/agent-team/costs.ts`.
- No new `pricing_mode: unknown` traffic.
- Prompt changes go through prompt-ops registry, not inline string edits.
- Judge/verification prompts are validated against frozen human-decision snapshots before default-on.
