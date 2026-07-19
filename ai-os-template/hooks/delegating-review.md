# delegating-review

## Name

`delegating-review`

## Classification

Delegating.

## Claude Code event

`Stop`

## Trigger condition

At response stop, when any of these conditions are true:

- changed diff is larger than `{{LARGE_DIFF_THRESHOLD}}` lines
- frontend files changed, such as `*.tsx`, `*.jsx`, CSS, route components, design
  tokens, or UI test fixtures
- docs drift is detected: behavior changed without corresponding Tier A/B doc update,
  or docs mention old file paths, commands, states, or intent
- proof-required files changed, or a proof-required builder packet is present

## Action

Emit one or more bounded subagent delegation packets:

- Large diff: route to `reviewer` with architecture focus.
- Frontend file changes: route to `frontend-designer` for UX and visual review.
- Docs drift: route to `doc-maintainer` for Tier A/B maintenance.
- Proof-required change: freeze one candidate identity; emit bounded architecture,
  security, correctness, and other triggered lens packets against that same identity;
  then emit a `review-resolver` packet only after every durable source packet exists.

Each packet follows the delegation contract: goal, repo/paths, files to inspect,
excluded areas, expected output artifact, allowed tools, model preference,
verification requirement, quality bar, and stop condition.

## Guardrails

- Do not run unbounded repo-wide reviews from the hook.
- Do not auto-apply reviewer or doc-maintainer edits; the orchestrator decides.
- Keep review independence: the implementer is not the sole reviewer of its own work.
- Deduplicate routes when the same file set triggers multiple checks.
- Respect doc write tiers: `doc-maintainer` may handle Tier A/B only; Tier C changes
  become proposals.
- A hook never auto-approves a candidate, applies review fixes, promotes an invariant
  to blocking policy, or edits the active registry.
- Do not forward individual source findings to implementation. Only a validated
  resolution packet may become actionable feedback.
- If the candidate identity changes, invalidate all outstanding source and resolution
  packets and begin a new bounded review generation.

## Failure behavior

If diff analysis fails, print an advisory note and include enough context for the
orchestrator to decide whether to review manually. Do not block the response. If
delegation infrastructure is unavailable, emit the packet text so the orchestrator can
run the subagent explicitly.

## Example .claude/settings.json snippet

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/delegating-review.mjs --large-diff-threshold {{LARGE_DIFF_THRESHOLD}} --frontend-globs \"**/*.{tsx,jsx,css,scss,vue,svelte}\" --docs-drift-check"
          }
        ]
      }
    ]
  }
}
```
