# Frontend route validation

Date: 2026-07-14

## Hypothesis

The globally installed streamed GLM-5.2 runner can complete the same bounded,
interactive frontend slice as Terra and Composer with all deterministic acceptance
checks passing, no scope violations, and no more than its built-in continuation and
single transient retry allowance.

## Controlled task

Turn one intentionally incomplete HTML operations panel into an accessible provider
availability control that visibly recalculates the frontend route and ordered
fallbacks. Every arm receives the same baseline, packet, and acceptance checks.

## Arms

| Arm | Route | Execution surface |
|---|---|---|
| GLM | `glm-5.2` | Global `glm-frontend-patch` streamed Z.ai runner |
| Terra | `gpt-5.6-terra` | `codex exec` |
| Composer | `composer-2.5` | `cursor-agent --print` |

The runtime-specific wrapper may tell an agent where the shared packet is and forbid
extra edits. It may not add design or acceptance guidance.

## Success criteria

- The arm exits successfully and changes only `index.html`.
- `python3 verify.py <arm>/index.html` passes every deterministic check.
- The resulting control is keyboard-usable, responsive, non-color-dependent, and
  honest about Available, Limited, and Unavailable provider states.
- A manual review finds the route decision, reason, fallback order, and latest event
  easy to scan without generic dashboard decoration.
- Failure, continuation, retries, latency, and fallback events are recorded as
  evidence rather than hidden.

## Budget

One implementation call per arm, ten minutes wall time per arm. GLM may use up to four
continuation rounds and one transient retry because those are part of the runner under
test. No model gets a repair pass after verification. The user approved this
three-route smoke comparison in the sequence preceding the 2026-07-14 run.
