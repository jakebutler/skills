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
