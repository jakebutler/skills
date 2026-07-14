---
name: fable-consultation
description: Ask Fable for one high-value critique of an advanced architecture, system-design, migration, rollback, harness-policy, conflicting-review, or flagship-positioning decision. Uses the local Claude Code subscription route when available. Do not use for routine orchestration, implementation, summaries, status, ordinary copy drafting, or repeated review.
allowed-tools:
  - Bash(claude:*)
  - Read
---

# Fable Consultation: {{REPO_NAME}}

Use Fable as a bounded external critic. Codex Sol High remains the orchestrator and
decision owner. Fable receives a compact packet and returns feedback; it does not take
over the task, inspect the entire repo, edit files, or approve its own recommendations.

## ROI gate

Run this skill only when every answer is yes:

1. Is the decision durable, high-leverage, or costly to reverse?
2. Can Sol express the decision and evidence in a compact packet?
3. Could an outside critique materially change the decision or expose a missed risk?
4. Will the result be recorded in a plan, ADR, review disposition, or routing experiment?

If any answer is no, use Terra, GLM-5.2, or the orchestrator's normal review path.

## Packet contract

Write `{{TASK_DOCS_DIR}}/{{TASK_ID}}/fable-decision-packet.md` with:

- decision to review, in one sentence
- task tier and why it is High or durable
- relevant constraints and explicit non-goals
- options considered and current recommendation
- evidence, including exact file paths or short diff excerpts when needed
- failure modes, rollback, and unresolved disagreements
- at most five exact questions for Fable
- output request: findings, strongest counterargument, missing evidence, recommendation,
  and confidence

Do not send a repo dump, full transcript, secrets, environment files, or unrelated
history. Pass diffs and decision context, not whole files, unless one small file is the
decision artifact itself.

## Preflight

1. Run `claude --version` and `claude auth status`.
2. Require a successful login with `authMethod: claude.ai` or another credential source
   the user explicitly approved.
3. If auth, model access, quota, or billing fails, mark the Anthropic family Unavailable
   for this task. Do not retry Sonnet or another Claude model as though it were a
   different provider.
4. Never use `--bare` for the subscription-backed route. Bare mode does not read OAuth
   or keychain credentials and therefore requires API-style authentication.
5. Treat cloud, CI, and other machines as unauthenticated until their own preflight
   succeeds.

## Invocation

Run from the trusted target repo with tools disabled so Fable reviews only the packet:

```bash
claude -p --model fable --effort high --tools "" \
  --no-session-persistence --output-format stream-json --verbose \
  --include-partial-messages \
  < "{{TASK_DOCS_DIR}}/{{TASK_ID}}/fable-decision-packet.md"
```

The installed instance may wrap this command to capture JSONL output, exit status, and
timestamps under `{{TASK_DOCS_DIR}}/{{TASK_ID}}/`. The wrapper must not echo credentials
or the full auth response into durable logs.

## Budget and retry policy

- One consultation per decision.
- One focused follow-up only if the first response leaves a named load-bearing question
  unanswered.
- No parallel Fable fan-out.
- Quota, auth, billing, or invalid-model errors: no retry; apply family fallback.
- Dropped stream or transient server failure: one retry from the same packet, then apply
  family fallback.

Fallback order: GLM-5.2 critique, then a fresh-context Terra critique. Sol synthesizes
and tells the user when fallback reduces model-family diversity.

## Return packet

Report:

- why the ROI gate passed
- packet path and exact questions asked
- Fable route and preflight result, without account details
- findings, counterargument, missing evidence, recommendation, and confidence
- whether a focused follow-up was used
- fallback or quota events
- Sol's disposition: accept, reject, investigate, or ask the user
- durable artifact updated with the decision

## Stop condition

One decision-ready critique is captured and dispositioned, or the Anthropic route is
marked unavailable and the packet has moved to the documented fallback. Never continue
using Fable just because quota remains.
