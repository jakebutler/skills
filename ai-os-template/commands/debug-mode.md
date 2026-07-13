# /debug-mode

## Name

`/debug-mode`

## Purpose

Investigate and fix a defect using a log-driven, hypothesis-based loop instead of
unstructured patching.

## Invocation (args)

`/debug-mode <symptom-or-failing-command> [--scope <paths>] [--repro <command-or-url>]`

## Workflow executed

Execute `../workflows/debug.md`.

## Output contract

The user sees the reproduced failure, root-cause hypothesis, evidence gathered, fix
summary, verification results, and any remaining uncertainty or follow-up.

## Model routing note

Claude/Fable owns triage judgment and decides when evidence is sufficient. Codex
handles reproduction, instrumentation, code exploration, implementation, and browser
verification. Specialized verifier or reviewer roles may be used when the fix touches
user-facing, security, or architectural behavior.

