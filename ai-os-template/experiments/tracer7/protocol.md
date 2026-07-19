# Tracer 7 paired-builder protocol

Status: template protocol; instantiate in FreshProof only after HT is installed and the
post-harness baseline is frozen.

## Question and decision boundary

Can Composer 2.5 perform most implementation labor for a proof-required backend tracer
when Sol owns planning and resolution and independent models own review, without worse
correctness, security, intervention burden, or review convergence than Sol High?

One tracer cannot establish a permanent routing default. A positive result may support
only a provisional, bounded Composer backend route and a plan for additional tracers.

## Frozen checkpoints

1. **B0:** user-approved integrated Tracer 6 product baseline. Template intake records
   commit `d72b02cfc9f869be78fd62c1ad0cc81eeaab4162`.
2. **HT:** independently reviewed harness-template commit produced in this repository.
3. **H0:** FreshProof B0 plus the HT instance installation and lean `AGENTS.md`, with no
   Tracer 7 product design or implementation.
4. **D0:** H0 plus the shared Tracer 7 requirements, effect inventory, scoped invariant
   selection, architecture/security source reviews, validated resolution, proof plan,
   and approved builder packet. D0 is the exact start commit for both arms.

Any change to D0, the builder-packet hash, prompt bytes, environment, tools, tests, or
budgets after an arm begins is an invalidation event. Re-freeze both arms or record the
comparison as non-equivalent.

## Shared design dogfood gate

Before either model writes product code:

1. Enumerate reachable writes, reads, transitions, external effects, scans, scheduled
   work, and bypass paths with the TypeScript/Convex adapter plus manual reconciliation.
2. Retrieve only matching invariants from the generated index; do not inject the full
   registry.
3. Freeze the design candidate and run architecture, security, correctness, and any
   triggered specialist lenses concurrently.
4. Validate source identities and feed them to the read-only resolver. The resolver
   must disposition every source finding exactly once and produce one coherent change
   list. Security and data-authority requirements outrank performance preferences when
   both cannot be satisfied; unresolved intent returns to HITL.
5. Apply the consolidated design feedback, re-freeze if necessary, and repeat one
   bounded generation. No individual review finding goes directly to a builder.
6. Run one residual adversarial design review. Confirmed novel findings create
   candidate events; deterministic automation may promote only verified,
   non-conflicting advisory rules. Active-blocking promotion remains owner-approved.
7. Approve and hash the builder packet only when every required lens and requirement
   is resolved. Unknown or newly discovered design during development revokes it.

HITL may manually trigger each numbered phase. Automation is not required to sequence
the experiment, but every transition must name its input and output identity.

## Arms and the only intended variable

| Property | Control | Experimental |
|---|---|---|
| Runtime | Cursor Agent | Cursor Agent |
| Model | `gpt-5.6-sol-high` | `composer-2.5` |
| Start | D0 | D0 |
| Prompt and builder packet | byte-identical | byte-identical |
| Allowed paths and tools | identical | identical |
| Timeout, retry, and token policy | identical | identical |
| Visible and held-out checks | identical | identical |
| Post-build review | blinded, independent | blinded, independent |

The exact model IDs were visible through Cursor Agent
`2026.07.16-899851b` on 2026-07-19. Re-run model and authentication preflight when the
FreshProof experiment begins. Do not silently substitute fast variants.

Prepare two clean isolated worktrees at D0 and install dependencies before timing. Run
arms sequentially in a randomly selected, pre-recorded order to avoid resource
contention. Record the order and recognize warm-cache/order bias; elapsed time is a
secondary endpoint. No fallback is allowed inside an arm. A model failure is an
outcome, not a reason to reroute and preserve the score.

The runner, not the arm config, owns the Cursor executable, flags, and environment. It
passes only a small non-secret process environment needed for the local subscription
client and command lookup; provider keys and production variables are not inherited.
Arm configs cannot add executables, argument prefixes, or environment values.
Each config is frozen in D0; the operator passes its separately approved SHA-256 to the
runner, which rejects any byte drift before parsing or executing evaluator commands.
The runner hashes all Git-ignored files before and after the builder and fails on
unexpected drift. `allowed_ignored_paths` is for narrow disposable caches only; never
allow dependency, executable, generated-code, configuration, or evaluator paths such
as `node_modules/` or `dist/`.

Held-out evaluator source stays outside both builder worktrees and outside the prompt
packet. The post-agent runner invokes it only after the model process exits. A held-out
test path committed at D0 is visible to the builder and is not a held-out evaluator.

## Intervention and invalidation policy

- Builders may ask questions but receive no model-specific coaching. A shared answer
  that changes the contract invalidates D0 and must be delivered identically to fresh
  arms.
- Record clarification, restart, timeout, harness failure, manual edit, packet
  invalidation, and environment drift as explicit intervention events.
- Out-of-scope writes invalidate the arm. The runner records evidence and exits nonzero.
- A newly exposed surface or architecture/security decision stops the arm and returns
  to the shared design gate. Do not count design work performed in review as ordinary
  code-review burden.
- Neither external builder may commit, push, publish, deploy, migrate, or access
  production. The orchestrator owns Git and all external state.

## Evaluation

Primary viability gates:

- all deterministic visible and held-out checks pass;
- no unresolved P0/P1 correctness or security finding;
- no harness bypass, Git ref/index mutation, out-of-scope write, or unapproved design decision;
- builder packet remains valid through implementation;
- candidate reaches approval within the predeclared review-generation budget.

Secondary measurements:

- wall-clock and active builder duration;
- time to first green focused test and final green suite;
- number and severity of unique post-build findings;
- number of review generations and review-driven code edits;
- human clarification/intervention count and time;
- changed lines, tests added, revert/rework volume, and residual reviewer confidence.

After the orchestrator commits each validated worktree, create candidate labels with a
private random mapping. Reviewers receive only the labeled diff, D0 design/builder
packet, deterministic evidence, and rubric—not model, transcript, duration, or arm
order. Architecture and security reviewers score independently before resolver fan-in.
Reveal the mapping only after findings, dispositions, and scores are immutable.
Before scoring, run `validate-paired-builder-controls.mjs` over both result packets;
any drift in runtime/version, baseline, prompt, allowed paths, budgets, environment-name
set, or visible/held-out command vectors makes the pair non-comparable.

## Decision rule

- **Not viable:** any primary gate fails, or Composer requires materially more design
  discovery, P0/P1 remediation, or human rescue than control.
- **Promising but inconclusive:** both pass and Composer is faster, but review burden,
  order effects, or the single-tracer sample prevents a robust routing claim.
- **Provisionally viable:** both pass; Composer has no worse blocker/security burden,
  stays within the same intervention and review budgets, and materially reduces elapsed
  builder time. Route only crisp proof-gated backend slices and keep Sol planning plus
  independent review.

Integrate only the candidate selected after unblinding and human approval. Preserve the
other arm and all evidence; do not merge both or opportunistically combine them before
the comparison is frozen.
