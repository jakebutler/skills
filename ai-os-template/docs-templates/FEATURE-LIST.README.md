<!--
  This file documents the FEATURE-LIST.json optional module. It is not itself a
  template to instantiate with placeholders — copy it alongside FEATURE-LIST.json
  when the module is adopted, or skip both when it isn't.
-->

# FEATURE-LIST.json — optional module

**Write tier:** opt-in module (DESIGN-MEMO.md §4). Off by default; not part of the
core doc layer. When adopted, treat it like Tier A: fully automatic status flips,
idempotent per feature, updated at checkpoints — never mid-response. A feature's
`status` moves from `"failing"` to `"passing"` only after its `verification_method`
has actually been run and observed to pass, never on completion of the implementation
work alone. This file is not a ledger — it holds current status only; history of when
a feature passed belongs in CHANGELOG.md if it's worth recording at all.

## When to use this

- **Greenfield builds** where the feature set is known up front and you want an
  explicit, checkable acceptance list before writing code.
- **Acceptance-driven builds**, where "done" needs to be objectively verifiable
  (unit/e2e/browser/manual) rather than judged by reading the diff — e.g. a scoped
  deliverable for a client, a hackathon build, or a demo with a hard acceptance bar.
- Situations where an orchestrator is coordinating multiple subagents against a fixed
  scope and needs a shared, unambiguous source of truth for "is this feature actually
  done," independent of any single agent's self-report.

## When not to use this

- **Mature repos** with an established feature set. Ongoing work is better tracked as
  issues/PRs plus SPEC.md's durable user stories — a static feature list drifts out of
  date fast once the product is past its initial build.
- **Libraries and infrastructure code** without a fixed, user-facing feature surface —
  "features" don't map cleanly to acceptance criteria the way they do in an
  application.
- Any repo where maintaining this file would become its own source of churn (large
  teams, frequent scope changes, features that don't decompose into discrete
  pass/fail units). If most features would sit at `"failing"` indefinitely because
  they're never fully "done," this module isn't earning its keep.

## Schema

See `FEATURE-LIST.template.json` for the schema-by-example. Fields per feature:

| Field | Meaning |
|---|---|
| `id` | Stable short identifier, referenced from tasks/issues. |
| `name` | Human-readable feature name. |
| `status` | `"failing"` or `"passing"`. Starts `"failing"`; flips only after verification runs. |
| `completion_criteria` | Plain-language definition of done, independent of implementation. |
| `verification_method` | One of `unit`, `e2e`, `browser`, `manual`. |
| `verification_command` | Exact command for automated methods, or the manual steps for `manual`. |
| `notes` | Anything else worth recording (owner, blocking dependency, etc). |

## Instantiating

1. Copy `FEATURE-LIST.template.json` to `FEATURE-LIST.json` at repo root (or the path
   bound in the instance manifest).
2. Copy this README alongside it, or link to it from the manifest — don't duplicate
   its content into the repo's other docs.
3. Populate features with `status: "failing"` and real verification commands before
   any implementation work starts; flipping status is then a mechanical, auditable act.
4. Bind it in the instance manifest as an adopted optional module so agents know to
   check it.
