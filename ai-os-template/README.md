# AI Engineering OS — Template

A reusable operating system for AI-assisted software work: root instruction templates,
a repo-resident documentation/memory system, workflow specs, hooks, slash commands,
subagent role definitions, and a quota-aware model routing rubric. Designed Codex-first
with Fable, Claude, GLM, and Composer as bounded specialist lanes.

Start with [WALKTHROUGH.html](WALKTHROUGH.html) for a guided review, then use
[DESIGN-MEMO.md](DESIGN-MEMO.md) for the architecture, contracts, and decisions
record. The directory layout and instantiation procedure are in memo §9–10.

**Status:** routing v0.6. Codex Sol High is the primary orchestrator; Fable is reserved
for advanced architecture and system-design feedback. Composer is the validated
bounded frontend implementation default, Terra is the first fallback, and the
installed GLM route remains experimental after its first timed validation failed.
FreshProof and Lower dB are first, followed by corvo-labs-dot-com.

The shift-left proof harness template now provides task-scoped effect/invariant
selection, immutable design and approved-builder packet identities, exact
architecture/security review coverage, deterministic fan-in, append-only novel-rule
capture with advisory-only automated promotion, a TypeScript/Convex inventory adapter,
and deterministic rendered views. A project must still bind and pass its own manifest,
adapter, schema, and positive/negative dogfood fixtures before advertising the gate as
installed.

The paired builder apparatus uses separate honest producers: Cursor Agent is restricted
to Composer 2.5, while native Sol uses a deterministic prepare packet, one ephemeral
high-reasoning `codex exec` process with multi-agent disabled, parent-captured launch and
transcript evidence, a least-privilege `native-proof-builder` permission profile, and
deterministic finalization. The comparison is an end-to-end routing-stack viability
experiment with runtime/producer surface recorded as a confound, not a pure model A/B.

The included TypeScript/Convex adapter is intentionally fail-visible and heuristic;
project installation still requires planner and reviewer reconciliation rather than
claiming that regex discovery is a complete static analysis.
