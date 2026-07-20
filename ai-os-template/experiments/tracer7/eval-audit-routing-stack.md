# Tracer 7 routing-stack evaluation audit

Date: 2026-07-20

Scope: the generic protocol, runner/finalizer evidence, paired comparator, and blinded
review rubric. This audit assesses whether the decision rule supports its stated claim;
it is not Tracer 7 product evidence.

## Evaluator design

### The prior model-isolation claim was unsupported

**Status:** Problem corrected in this candidate

Composer runs through Cursor while Sol runs through native Codex collaboration. Model,
runtime, producer surface, authentication, and orchestration mechanics therefore move
together. The old protocol could not attribute correctness or speed differences solely
to the model.

**Fix:** The protocol now names an end-to-end paired routing-stack experiment, treats
runtime/producer surface as a fixed confound, keeps timing secondary, and limits a
positive conclusion to provisional viability of Composer-on-Cursor for similar slices.

### Objective gates must stay code-based

**Status:** OK with a preserved boundary

Config/prompt/baseline identities, scope, Git/index/ref state, ignored drift, command
vectors, budgets, completion hashes, route bindings, status, and check exits are
deterministically verified. LLM review is reserved for architecture, security,
correctness, and scope judgments that require interpretation.

**Fix:** Do not replace these binary checks with reviewer confidence or aggregate
scores. Any apparatus/control failure makes the pair inconclusive before scoring.

## Judge validation

### Independent reviewers are not calibrated statistical judges

**Status:** Problem remains if their scores are treated as a metric

Fable/Opus/Sol reviews have not been calibrated against a human-labeled Tracer 7
distribution with measured TPR/TNR. Their verdicts can expose concrete, reproducible
failures, but approval counts or confidence scores cannot establish comparative model
quality.

**Fix:** Use binary requirement/invariant rows plus executable findings as review gate
evidence, preserve the human integration decision, and avoid statistical claims from
reviewer scores. If a future program wants judge-derived metrics, first validate each
judge against held-out human labels with TPR/TNR and a clean train/dev/test split.

## Human review process

### Blinding can leak through route metadata

**Status:** Controlled procedurally; must be verified per run

Model, runtime, transcript format, duration, producer artifacts, and arm order can reveal
the route and bias review. The revised rubric forbids them before scoring, but a run can
still fail this control through its review packet.

**Fix:** Build neutral candidate packets that contain only D0, labeled diff,
deterministic evidence, and the rubric. Record a blindness manifest and freeze all
scores/findings before route reveal.

## Labeled data and sample size

### One tracer cannot support a universal routing default

**Status:** Inherent limitation

An `n=1` paired task cannot estimate performance across representative backend task
classes, separate order/cache effects, or demonstrate general Composer superiority.

**Fix:** Permit only provisional route viability for similarly proof-gated slices.
Require later paired replications or representative production telemetry before a
general backend default.

## Pipeline hygiene

### Apparatus rehearsal is not quality evidence

**Status:** Explicitly controlled

A micro-fixture can prove source binding, native collaboration execution, finalization,
and paired comparison mechanics. It cannot measure Tracer 7 implementation quality.

**Fix:** Label rehearsal results apparatus-only, record any unavailable Composer parity
as incomplete, and re-run this audit if route surfaces, reviewer topology, or decision
rules change.
