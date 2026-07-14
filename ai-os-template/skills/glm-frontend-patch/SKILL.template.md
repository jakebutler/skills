---
name: glm-frontend-patch
description: Delegate an explicitly bounded {{REPO_NAME}} frontend slice to the globally installed streamed GLM runner. Use for GLM route experiments or a deliberate cross-family implementation attempt with preview-first checkpoints and automatic Composer then Terra fallback. Do not use as the default frontend route until the validation gate in the routing matrix is satisfied.
---

# GLM Frontend Patch - {{REPO_NAME}}

Use the canonical runner installed at
`~/.codex/skills/glm-frontend-patch`. The source lives in the skills repository at
`skills/glm-frontend-patch/`. This target repository owns only this thin binding and
per-task packets. Never install a runtime or copy a Z.ai credential into
`{{REPO_PATH}}`.

## Preconditions

1. Read the target's root instructions, product context, design system, and files in
   scope.
2. Confirm the design direction is approved. GLM implements; it does not own UX or
   architecture judgment.
3. Confirm the task is bounded and all readable and writable paths can be named
   exhaustively.
4. Confirm the global runner exists. If it does not, route to Composer, then Terra if
   Composer is unavailable.

## Packet

Follow
`~/.codex/skills/glm-frontend-patch/references/packet-contract.md`. Bind the packet to:

- Repository: `{{REPO_NAME}}`
- Target: `{{REPO_PATH}}`
- Design constraints: `{{DESIGN_CONSTRAINTS}}`
- Focused verification: `{{VERIFICATION_COMMANDS}}`

Include a requirement to preserve unrelated user changes and stop for any needed
out-of-scope read or write.

## Run

Generate a preview checkpoint first:

```bash
python3 "$HOME/.codex/skills/glm-frontend-patch/scripts/glm_frontend_patch.py" \
  --packet /absolute/path/to/packet.json \
  --target "{{REPO_PATH}}"
```

Inspect the proposed files, then apply the saved response explicitly:

```bash
python3 "$HOME/.codex/skills/glm-frontend-patch/scripts/glm_frontend_patch.py" \
  --packet /absolute/path/to/packet.json \
  --target "{{REPO_PATH}}" \
  --response-file /absolute/path/to/checkpoint/response.txt \
  --apply
```

Streaming, a ten-minute total deadline, 15-second content-free heartbeats, partial
checkpoints, at most four continuation rounds, and one transient retry are enforced by
the runner. Exit code `20` reroutes the unchanged packet to Composer, then Terra.

## Guardrails and report

- Never read or write a path outside the packet allowlist.
- Never commit, stage, push, deploy, publish, send, mutate cloud data, or edit global
  configuration.
- Never expose a secret or put the global skill's `.env` in the target.
- Treat output as evidence. Inspect `git status` and `git diff` independently and run
  the focused verification yourself.
- Report route, checkpoint, streamed character count, continuation and retry counts,
  files changed, verification, fallback events, and out-of-scope requests.
