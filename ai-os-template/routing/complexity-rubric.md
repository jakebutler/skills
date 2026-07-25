# Task Complexity Rubric

**Version 0.1 — 2026-07-08.** Classify every non-trivial task before starting. The tier
drives planning depth, audit lenses, review independence, and model routing.

## Dimensions

Score each dimension Low / Medium / High:

| Dimension | High looks like |
|---|---|
| Risk to production, data, or security | auth, payments, migrations, secrets, PII |
| Blast radius | many modules, shared abstractions, public contracts |
| Reversibility | hard to roll back once shipped or run |
| Ambiguity | requirements or approach genuinely unclear |
| Cross-module dependencies | change threads through several subsystems |
| Architectural permanence | future work will build on this decision |
| Creative design judgment | UX, API shape, or product behavior needs taste |
| External research need | facts, libraries, or prior art must be gathered |
| Verification cost | browser/E2E/manual checks needed to trust it |
| User-facing impact | visible behavior or copy changes for real users |

## Tiering

- **Simple** — all dimensions Low: single file or known pattern, easily reversible,
  no data/security surface. Examples: copy edit, tiny fix in a known file, simple UI
  polish, test update with clear behavior.
- **Medium** — any dimension Medium, none High: multi-file change, new behavior,
  non-trivial component, API route with persistence, workflow update.
- **High** — any dimension High: architecture change, auth/security/payments/data
  migration, cross-repo work, production rollout, significant product direction.

**Promotion rule:** a single High on *risk, reversibility, or blast radius* makes the
task High regardless of size. When in doubt between tiers, take the higher one; the
extra ceremony is one audit pass, not a process tax.

## Proof-required predicate

Complexity tier controls ceremony volume. `proof_required` independently controls
whether production edits need the shift-left design-proof gate.

Set `proof_required: true` when a task changes or relies on any of:

- authorization, tenancy, identity, secrets, or sensitive-data boundaries;
- allow-capable, destructive, external, or durable-write effects;
- migrations, backfills, lifecycle transitions, retention, deletion, or replay;
- concurrency, retries, takeover, worker progress, idempotency, or reconciliation;
- immutable, historical, or public-contract authority; or
- a hard-to-reverse architecture boundary whose failure can create P0/P1 impact.

A High-tier copy, research, or reversible UX task may be `proof_required: false` with a
recorded reason. A small security or destructive-state change is proof-required even if
its diff is Simple. Proof-required work runs `workflows/design-proof.md` before the
first production RED/GREEN edit.

## What each tier requires

| | Simple | Medium | High |
|---|---|---|---|
| Plan | inline intent | written plan in task docs | full plan + rollback in task docs |
| Audit | one combined audit (adversarial + steelman + neutral baked in) | three lens passes by one auditor subagent | three independent lens subagents, orchestrator synthesizes |
| Review | paired fresh-context Sol 5.6 xhigh + Opus 5 | paired fresh-context Sol 5.6 xhigh + Opus 5 | paired fresh-context Sol 5.6 xhigh + Opus 5, specialist lenses as diff dictates, optional Fable principal/architect escalation only after a concrete trigger |
| Verification | focused checks on the change | scoped checks + affected-area tests | full relevant suite + release/rollback plan |
| Docs | status checkpoint | status + changelog + touched docs | status + changelog + spec/ADR update |
