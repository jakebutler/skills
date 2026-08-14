# delegating-review

## Classification

Disabled by default. Advisory when a project explicitly enables it for High-risk or
proof-required work.

## Trigger condition

An instance may enable this hook only when its task state explicitly marks the current
candidate High-risk/proof-required and names the required review topology. A dirty
working tree, large diff, frontend change, documentation drift, or file count does not
trigger review.

## Action

Remind the orchestrator to launch all warranted independent/specialist lenses
concurrently against one frozen candidate, wait for every expected finding packet,
then remediate one consolidated list.

## Guardrails

- Routine reversible work has no mandatory delegated review.
- Do not emit standard paired reviewers for every commit or PR.
- Do not forward individual findings before expected lenses finish.
- Do not rerun review at commit and PR creation when the candidate is unchanged.
- A residual review is targeted and runs only after a correction materially changes
  sensitive logic or a P0/P1 remains.
- Hook failure never blocks ordinary work.
