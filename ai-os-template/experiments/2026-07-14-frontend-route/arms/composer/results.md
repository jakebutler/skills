# Composer arm

| Measure | Result |
|---|---|
| Route | `composer-2.5` through Cursor Agent 2026.07.09-a3815c0 |
| Exit | 0 |
| Wall time | 51.05 seconds |
| Reported tokens | Not exposed by the CLI |
| Target changes | `index.html` only, 544 insertions and 4 deletions |
| Deterministic verifier | Pass |
| Browser behavior | Pass: initial GLM, Z.ai unavailable to Terra, Codex unavailable to Composer, Cursor unavailable to no-route |
| 320-pixel viewport | Pass: no horizontal overflow; provider controls and decision stack structurally |

The result is complete, accessible, and policy-correct. It keeps the provider controls
and route decision visible together on desktop, gives every provider an explicit
current-state line, and uses a quieter product hierarchy than the Terra arm. It is the
larger file, but its added structure directly supports state visibility and responsive
behavior rather than decorative effects.
