# Comparison and routing decision

## Result

The hypothesis is **rejected**. The GLM-5.2 runner did not produce a complete bounded
patch inside ten minutes. Both fallbacks completed in one pass and passed the same
corrected deterministic and browser checks. Composer was 41.5 seconds faster than
Terra and produced the stronger product-register hierarchy.

| Criterion | GLM-5.2 | Terra | Composer 2.5 |
|---|---:|---:|---:|
| Completed in one arm call | No | Yes | Yes |
| Wall time | More than 600 s, stopped | 92.58 s | 51.05 s |
| Only `index.html` changed | Yes, no change | Yes | Yes |
| Deterministic checks | Fail, unchanged baseline | Pass | Pass |
| Browser route transitions | Not testable | Pass | Pass |
| Responsive check | Not testable | Static rules pass | 320 px browser pass |
| Product hierarchy | Not testable | Functional, title over-weighted | Strongest |

## Verification correction

The first verifier draft required exact IDs and `data-provider` attributes that were
not specified in the shared packet. It was corrected before either completed arm was
scored. The corrected verifier checks labeled native selects, state options, ordered
fallbacks, live-region behavior, safe DOM primitives, responsive and reduced-motion
rules, route literals, and banned visual or execution patterns. Neither model received
the verifier output or a repair pass.

## Routing change

- Use Composer 2.5 for crisp, bounded frontend implementation.
- Use Terra when Composer is unavailable or the slice benefits from stronger repo
  reasoning. Use Sol High when frontend scope or judgment becomes High complexity.
- Keep GLM-5.2 installed but experimental. It may run only with the same allowlisted
  packet, preview checkpoint, ten-minute total deadline, content-free heartbeats, and
  automatic Composer then Terra fallback.
- Keep frontend design and UX judgment on Impeccable with Sol High. No implementation
  arm self-approves design quality.

This is one deliberately small sample, so it supports a conservative demotion rather
than a claim that Composer is universally better. GLM can be reconsidered after it
completes two bounded runs inside the deadline with no scope violations.
