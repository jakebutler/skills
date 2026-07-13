# Fable Context Packet Index

Use this packet to start a Fable-led design session for a cohesive AI-assisted engineering operating system.

The packet is intentionally progressive. Start with the summary and kickoff prompt, then open the detail files only when Fable needs that layer.

## Reading Order

1. `00-summary.md` - concise goal, target outputs, and current best thinking.
2. `01-kickoff-prompt.md` - paste this into Fable to start the session.
3. `02-design-brief.md` - operating model, principles, and target deliverables.
4. `03-docs-and-memory.md` - repo-resident documentation, checkpointing, and knowledge layout.
5. `04-skills-agents-hooks.md` - skills, subagents, hooks, slash commands, and quality gates.
6. `05-model-routing.md` - model routing, Fable orchestration, and delegation guardrails.
7. `06-workflows.md` - standard workflows for spec, implementation, debug, commit, PR, review, wrap, and skill improvement.
8. `07-conflicts-and-decisions.md` - unresolved decisions, tensions, and items Fable should evaluate.
9. `08-source-braindump-synthesis.md` - cleaned synthesis of the user's raw notes.

## Target Outcome For Fable

Fable should help design and then create:

- a reusable AI engineering OS template
- workflow specs
- root instruction templates for `AGENTS.md` and `CLAUDE.md`
- documentation templates for `SPEC.md`, `PROJECT-STATUS.md`, `CHANGELOG.md`, feature docs, active task docs, and optional `FEATURE-LIST.json`
- skills, hooks, slash commands, and subagent definitions
- the first two repo-specific instances for FreshProof and Lower dB
- a follow-on path for `corvo-labs-dot-com`

## Priority Guidance

Treat `08-source-braindump-synthesis.md` as supporting material, not as final design. The user's most current thinking is summarized in `00-summary.md` and `02-design-brief.md`.

Fable should resolve conflicts and remove vestigial components rather than preserving every idea.
