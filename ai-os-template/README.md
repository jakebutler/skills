# AI Engineering OS — Template

A reusable operating system for AI-assisted software work: root instruction templates,
a repo-resident documentation/memory system, workflow specs, hooks, slash commands,
subagent role definitions, and a quota-aware model routing rubric. Designed Codex-first
with Fable, Claude, GLM, and Composer as bounded specialist lanes.

Start with [WALKTHROUGH.html](WALKTHROUGH.html) for a guided review, then use
[DESIGN-MEMO.md](DESIGN-MEMO.md) for the architecture, contracts, and decisions
record. The directory layout and instantiation procedure are in memo §9–10.

**Status:** runtime and routing v0.8. Codex Sol High is the primary orchestrator. Routine code
review pairs a fresh-context native GPT-5.6 Sol reviewer at xhigh reasoning with direct
Claude Opus 5 against one frozen candidate. Fable is reserved for exceptional
principal-engineer/architect escalation. Composer is the validated bounded frontend
implementation default. Luna is the provisional bounded and mechanical route; Terra
is a guarded fallback until repo-local evaluations establish a clearer niche.
FreshProof and Lower dB are first, followed by corvo-labs-dot-com.

The human routing guide now has a machine-readable source of truth:
`routing/task-routes.json`, backed by dated evidence in `routing/model-evidence.json`.
The resolver promotes high-risk work to the Codex backbone, refuses silent fallback,
and returns required companion review lanes:

```bash
node scripts/resolve-model-route.mjs --task bounded-implementation --risk high
node scripts/resolve-model-route.mjs --task frontend --exclude cursor-composer25
```

Executable activation is portable Node code with no runtime dependency on this
checkout. `ai-os-doctor` validates the instance and refreshes its tool cache, while
`ai-os-hook` implements the shared Claude hook contract:

```bash
node scripts/ai-os-doctor.mjs --write
node tests/ai-os-runtime/run.mjs
```

Copy `runtime/claude-settings.template.json` into an instance's project settings only
after binding command paths to that repository. Codex consumes the same route registry
and canonical `AGENTS.md`; Claude Code additionally executes the committed hooks.

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
Failed checks now produce validator-readable terminal evidence, and one explicitly
budgeted remediation generation can continue from the exact authenticated dirty parent
state. Source-inspecting held-out evaluators carry executable semantic self-tests so
formatting or constant indirection cannot masquerade as a product failure.

The included TypeScript/Convex adapter is intentionally fail-visible and heuristic;
project installation still requires planner and reviewer reconciliation rather than
claiming that regex discovery is a complete static analysis.

## Stack tools

Convex is the first-class proof-harness adapter and is discovered through either a
repo dependency or CLI. Cloudflare is a deployment/observability adapter, and
Supabase remains optional until an instance declares that stack. Doctoring records
whether `convex`, `wrangler`, and `supabase` are available or merely declared; it does
not claim that a project is linked, authenticated, or authorized for production.

`runtime/mcp.template.json` starts Convex from the repo-pinned package with data,
logs, arbitrary queries, environment operations, and function execution disabled. It
also includes Cloudflare's documentation-only remote server. Account, observability,
deploy, and production-capable servers are never enabled by the generic template.
Supabase should be added only for a repo that actually uses it, project-scoped and
read-only by default.
