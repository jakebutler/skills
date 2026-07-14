# Terra arm

| Measure | Result |
|---|---|
| Route | `gpt-5.6-terra` through Codex CLI 0.144.3 |
| Reasoning | `xhigh`, inherited from the local Codex configuration |
| Exit | 0 |
| Wall time | 92.58 seconds |
| Reported tokens | 31,756 |
| Target changes | `index.html` only, 373 insertions and 3 deletions |
| Deterministic verifier | Pass |
| Browser behavior | Pass: initial GLM, Z.ai unavailable to Terra, Codex unavailable to Composer, Cursor unavailable to no-route |

The result is complete, accessible, and policy-correct. The route reason and event
ledger are particularly explicit. Visual review found an implementation-quality
tradeoff: the fluid, oversized title consumes most of the initial desktop viewport
and conflicts with the product-register guidance to keep task UI hierarchy compact.
The provider control therefore appears later than it should.
