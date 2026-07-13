# Conflicts And Decisions For Fable

Fable should resolve these into a final design. Do not preserve all options by default.

## 1. `AGENTS.md` vs `CLAUDE.md`

Question:

- Are these mirrors, layered files, or harness-specific siblings?

Initial recommendation:

- `AGENTS.md` should hold harness-neutral agent behavior and repo map.
- `CLAUDE.md` should hold Claude/Fable-specific routing, hooks, and commands.
- If duplication is needed for tool compatibility, generate one from the other.

## 2. Global Docs Plus Task Docs

User preference:

- both, with clear ownership boundaries.

Potential risk:

- duplicate plans and drift.

Initial recommendation:

- use global docs for durable project knowledge.
- use `dev/active` for temporary task working memory.
- close/archive task docs when work is done.
- update `PROJECT-STATUS.md` with only the current handoff summary.

## 3. `FEATURE-LIST.json`

Question:

- Is this core or optional?

Initial recommendation:

- optional by default.
- strong for greenfield apps, acceptance-test driven builds, or feature completeness drives.
- not required for every mature repo.

## 4. Automatic Doc Editing

User preference:

- hooks should automatically edit docs without human approval.

Risk:

- noisy churn, stale summaries, false confidence.

Initial recommendation:

- allow automatic updates to `PROJECT-STATUS.md`, tool inventory, generated docs, and changelog draft sections.
- put guardrails on `SPEC.md`: update only stable high-level facts and links.
- require hooks to include a concise update reason in the file or in metadata.

## 5. Blocking Hooks

User concern:

- aggressive blocking hooks are frustrating.

Initial recommendation:

- block only on hard safety/correctness failures.
- advise or delegate on softer quality issues.
- allow explicit override for non-production local work where safe.

## 6. Changelog Granularity

Original idea:

- commit-by-commit ledger.

Concern:

- too noisy.

Initial recommendation:

- maintain meaningful checkpoint/release/user-facing changelog.
- use git history for exact commit ledger.
- optionally generate commit summaries for internal review.

## 7. Research And Prototype Placement

Question:

- Are research and prototype separate workflows or part of spec?

Initial recommendation:

- both.
- spec workflow can call them.
- standalone commands exist for tasks that are only research or only prototype.

## 8. Audit Lens Frequency

User preference:

- auto-trigger for medium/high complexity.
- simple plans use one combined audit.

Initial recommendation:

- adopt this.
- Fable defines complexity thresholds.

## 9. GTM Skills

Question:

- same OS or separate swarm?

User preference:

- parallel GTM swarm, but engineering OS needs copywriting and landing page conversion skills.

Initial recommendation:

- create an interface between engineering OS and GTM swarm through shared docs and handoff packets.

## 10. Autoskill Approval

Question:

- Should skill updates be automatic like docs?

Initial recommendation:

- documentation status updates can be automatic.
- skill modifications should be staged or clearly reviewable until trust is established.
- Fable can propose a later auto-apply policy for low-risk skill metadata updates.

## 11. Model Routing Hard Rules

Question:

- hard defaults or dynamic rubric?

User preference:

- combination.

Initial recommendation:

- keep explicit defaults, but require complexity/risk override.
- model routing should be versioned because model quality changes.

## 12. Template Scope

Question:

- one generic template or instances first?

User goal:

- template, then FreshProof and Lower dB instances.

Initial recommendation:

- design generic template from first principles.
- instantiate it in FreshProof and Lower dB.
- feed repo-specific learnings back into template only when they generalize.
