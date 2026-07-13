# /prototype

## Name

`/prototype`

## Purpose

Explore UI, state, interaction, or technical uncertainty with a throwaway prototype
before committing to a production implementation.

## Invocation (args)

`/prototype <uncertainty-or-concept> [--ui|--logic] [--repo-scope <paths>]`

## Workflow executed

Execute `../workflows/prototype.md`.

## Output contract

The user sees the prototype path or URL, what question it answers, what was learned,
what should be kept or discarded, and the recommended production path.

## Model routing note

Claude/Fable defines the uncertainty and decides whether the prototype answers it.
Codex builds the prototype, explores code constraints, and performs runtime/browser
verification. Frontend judgment may delegate to `frontend-designer`; implementation
mechanics remain Codex-heavy.

