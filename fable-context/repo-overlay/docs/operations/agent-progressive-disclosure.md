# Agent progressive disclosure map

Root `CLAUDE.md` is the operating kernel. It is intentionally short. Load these files only when the task touches the relevant area.

## Default load

For every task:

1. `CLAUDE.md`
2. `CONTEXT.md`
3. Relevant ADRs under `docs/adr/`
4. `docs/plans/2026-07-06-fable-audit-source-of-truth.md`
5. The code touched by the task

Do not load every operations doc by default.

## Task-to-doc map

| Task | Read additionally |
|---|---|
| New feature or multi-slice epic | `docs/operations/fable-codex-development-workflow.md`, `docs/operations/codex-epic-thread-orchestration.md`, `docs/templates/feature-slice-spec.md` |
| Code validation | `.claude/skills/prove/SKILL.md`, `docs/operations/agent-quality-bars.md` |
| PR publication | `.claude/skills/publish-slice/SKILL.md` |
| Session close | `.claude/skills/wrap-session/SKILL.md` |
| Commands are unclear | `docs/operations/agent-command-cookbook.md` |
| Something feels like a known trap | `docs/operations/known-failure-modes.md` |
| Admin UI | `docs/operations/agent-quality-bars.md`, Swiss Contrast design-system doc, relevant admin route/component files |
| Public route | `docs/operations/agent-quality-bars.md`, public query surfaces, public/admin boundary rules |
| Convex schema/function | `docs/operations/agent-quality-bars.md`, nearest Convex tests, generated API pattern |
| Trigger task | `docs/operations/agent-quality-bars.md`, nearest `trigger/*.test.ts` |
| Operator script | `docs/operations/agent-quality-bars.md`, existing scripts with `--dry-run` |
| Experiment | existing `experiments/<slug>/lab-book.md` pattern |
| Publish/send/claim gating | `CONTEXT.md`, ADR 0001, ADR 0003, relevant owner decision D1-D6 |
| Large Codex implementation | `.claude/skills/codex-implementation/SKILL.md` |
| Independent diff review | `.claude/skills/codex-review/SKILL.md` |
| Browser/app/runtime verification | `.claude/skills/codex-computer-use/SKILL.md` |

## Principle

If a detail is only needed for one kind of task, keep it out of `CLAUDE.md` and put it behind this map.
