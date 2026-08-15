# Task Complexity Rubric

**Version 0.2 — 2026-08-13.** Classification controls only the safeguards justified by
the change's actual consequences. It must not turn file count into process.

## Dimensions

Assess consequence, ambiguity, and reversibility:

| Dimension | High looks like |
|---|---|
| Authority/security consequence | changes authorization, tenancy, secrets, payments, or a trust boundary |
| Destructive/external consequence | can delete data, spend money, send/publish, deploy, or create persistent provider state |
| Reversibility | rollback is uncertain, lossy, or operationally expensive |
| Contract permanence | changes a public or historical contract that downstream systems cannot cheaply migrate |
| Ambiguity | product behavior or architecture is genuinely undecided |
| Blast radius | one defect can corrupt or expose many independent tenants, records, or systems |
| Verification cost | confidence requires slow E2E, provider, deployment, or manual evidence |

File count, user-facing scope, cross-repo coordination, or touching a sensitive path
does not make a task High by itself. Treat a narrow fix that preserves an approved
boundary according to its actual new risk.

## Tiering

- **Simple** — localized, known, easily reversible behavior. Use inline intent and
  focused checks.
- **Medium** — bounded new behavior whose intent is clear and reversible. Use an
  inline checklist, one breadth-first impact sweep, one coherent implementation batch,
  and proportional verification. No plan artifact or independent reviewer is required
  by default.
- **High** — actually alters a High-consequence boundary above or is genuinely
  difficult to reverse. Use a written plan with rollback, one breadth-first inventory,
  one implementation batch, and one independent review. Add specialists only for
  concrete diff-triggered risks and run them concurrently.

When uncertain, name the exact irreversible consequence. If none can be named, do not
promote merely for caution.

## Proof-required predicate

`proof_required` is narrower than High. Set it only when the change introduces or
materially changes:

- authorization, tenancy, identity, secret, or sensitive-data authority;
- destructive, allow-capable, externally persistent, or durable-write semantics;
- migration, backfill, deletion, retention, replay, or lifecycle authority;
- concurrency ownership, takeover, idempotency, or reconciliation semantics;
- immutable, historical, or public-contract authority; or
- another hard-to-reverse boundary whose failure can create P0/P1 impact.

A narrow regression fix, test, refactor, or missing sibling implementation path that
preserves an already approved authority model is not proof-required. Discovery returns
to design-proof only when it exposes a new product/authority decision or contradicts
the approved design.

## What each tier requires

| | Simple | Medium | High |
|---|---|---|---|
| Plan | inline intent | inline checklist | written plan + rollback |
| Discovery | relevant local surface | breadth-first affected-surface sweep | reconciled breadth-first risk inventory |
| Implementation | one batch | one coherent batch | one coherent batch under approved boundaries |
| Review | self-review is sufficient | independent review only when uncertainty warrants it | one independent review; concurrent specialists only for concrete risk |
| Verification | focused checks | focused checks, then one warranted broad gate | focused checks, then one relevant release/broad gate |
| Docs | only if durable truth changed | only if behavior or handoff changed | durable decision/operations docs when changed |

Across every tier, collect complete failures and reviewer findings before editing.
Never run one finding -> one fix -> one expensive gate loops.
