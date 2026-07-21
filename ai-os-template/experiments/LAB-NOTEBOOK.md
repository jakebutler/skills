# AI Engineering OS lab notebook

## 2026-07-14 - Streamed frontend route validation

**Hypothesis:** The globally installed streamed GLM-5.2 runner can complete the same
bounded interactive frontend slice as Terra and Composer with all checks passing and
within its retry and continuation allowance.

**Verdict:** Rejected. GLM-5.2 did not complete inside the ten-minute cap; Terra and
Composer both passed, with Composer faster and visually better matched to a product
tool.

### Setup

| | |
|---|---|
| Task | Build an accessible one-file provider availability and frontend failover console. |
| Arms | `glm-5.2`, `gpt-5.6-terra`, `composer-2.5` on 2026-07-14 |
| Success criteria | Identical packet, one changed file, deterministic checks, browser route transitions, responsive and visual review |
| Budget | One call and ten minutes per arm; actual: GLM stopped at cap, Terra 92.58 s, Composer 51.05 s |

### Method

Each arm started from its own clean temporary Git repository with the same baseline,
packet, and no-repair instruction. The deterministic verifier was corrected to remove
unstated exact-ID requirements before scoring. Codex then checked both completed arms
through the same route transitions in the local browser and reviewed the desktop and
320-pixel layouts against the shared Impeccable product guidance.

### Results

| Arm | Completed | Checks | Interaction | Notes |
|---|---|---|---|---|
| GLM-5.2 | No | Baseline fails | Not testable | Active stream, no complete checkpoint inside ten minutes |
| Terra | Yes | Pass | Pass | Explicit reasoning, oversized title weakens task hierarchy |
| Composer 2.5 | Yes | Pass | Pass | Fastest and strongest product hierarchy |

### Analysis

Streaming solved the original non-streamed read-timeout mechanism, but transport
liveness alone did not make the GLM route usable. A worker also needs a total deadline,
periodic evidence of progress, partial checkpoints, and honest cancellation state.
Composer provided the best first bounded default in this sample; Terra remains the
stronger reasoning fallback.

### Surprises

The GLM connection stayed alive for the full budget without completing. The first
verifier also accidentally tested implementation details that the packet did not
require. Correcting the judge before scoring mattered as much as checking the models.

### What changes

Routing moves to v0.6: Composer becomes the bounded frontend implementation default,
Terra is first fallback, and GLM remains an installed experimental route with enforced
deadlines and automatic takeover. Evidence lives in
`experiments/2026-07-14-frontend-route/`.

### Next hypothesis

With a smaller full-file task or a structured diff protocol, GLM-5.2 can complete two
consecutive frontend runs inside ten minutes while preserving the allowlist and passing
the same checks.
