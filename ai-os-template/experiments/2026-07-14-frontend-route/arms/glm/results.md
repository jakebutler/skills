# GLM-5.2 arm

| Measure | Result |
|---|---|
| Route | `glm-5.2` through the globally installed streamed runner |
| Exit | Stopped by the operator at the 10-minute experiment cap (`130`) |
| Target changes | None |
| Complete checkpoint | None |
| Initial checkpoint | `~/.codex/state/glm-frontend-patch/runs/20260714T072122Z-90fba52a` |
| Continuations / retries | 0 / 0 reported before stop |
| Deterministic verifier | Fail because the baseline remained unchanged |

The Z.ai endpoint accepted authentication and held an active streamed request. The
socket did not time out, which implies data continued arriving inside the 180-second
read windows, but the first runner version suppressed delta content and emitted no
periodic byte-count heartbeat. It produced no complete framed response within the
agreed ten minutes.

This is an operational failure, not an auth or quota failure. Per the experiment
contract, the arm was not retried. The run exposed four runner requirements that were
implemented afterward: a total route deadline, content-free progress heartbeats,
partial-response checkpoints, and an explicit cancelled state.
