# /research

## Name

`/research`

## Purpose

Run standalone research that produces a consolidated, cited packet for a design,
implementation, market, library, or operational question.

## Invocation (args)

`/research <question> [--repo-scope <paths>] [--web] [--depth <quick|standard|deep>]`

## Workflow executed

Execute `../workflows/research.md`.

## Output contract

The user sees the answer, evidence summary, sources inspected, repo facts discovered,
confidence level, risks, and recommended next action. If artifacts are created, their
paths are included.

## Model routing note

Codex Sol High frames the research question and judges the final answer. Terra handles
repo exploration, web/tool-heavy research, and browser verification. The researcher
and research-consolidator roles may be delegated, with Sol retaining synthesis and
decision authority.
