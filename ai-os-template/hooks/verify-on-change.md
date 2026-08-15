# verify-on-change

## Classification

Advisory, once at `Stop` when the working tree has changes.

## Purpose

Remind the orchestrator to verify one coherent batch. Never run or request a check
after each tool call.

## Action

- If the working tree is unchanged, emit nothing.
- If changes exist, remind the orchestrator to run the cheapest focused checks not
  already valid for the exact diff.
- Mention a broad gate only when the actual blast radius warrants it. A build is for a
  build/runtime/configuration boundary, a requested release preflight, or a reproduced
  build-only failure.
- If a broad gate fails, collect its complete failure set before one correction batch
  and one confirmation.

## Guardrails

- Never fire on `PostToolUse`.
- Never delegate automatically or make review mandatory.
- Never rerun unchanged exact-diff evidence.
- Never block a response; required failed checks remain visible in the final status.
