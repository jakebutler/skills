# skill-activation

## Name

`skill-activation`

## Classification

Advisory.

## Claude Code event

`UserPromptSubmit`

## Trigger condition

Every submitted user prompt. The hook compares the prompt text, mentioned files,
detected intent, and file extensions against the cached skill inventory in
`{{TOOL_CACHE_FILE}}`.

## Action

Read `{{TOOL_CACHE_FILE}}`, score likely-relevant skills, and inject a short reminder
before the model handles the prompt. The reminder names each likely skill and gives
the concrete reason it matched, such as a keyword, file path, framework, or requested
workflow.

The injected text should be small and operational:

```text
Skill reminder: consider `tdd` because the prompt asks for test-first implementation;
consider `impeccable` because frontend files are mentioned.
```

If no skill crosses the local relevance threshold, emit nothing.

## Guardrails

- Never block a prompt.
- Keep reminders to likely skills only; do not dump the whole inventory.
- Prefer exact path, file-extension, and explicit intent matches over broad keyword
  matches.
- Do not load skill bodies. This hook only reads the cached inventory.
- Keep the reminder advisory: the orchestrator may ignore it with a brief reason.

## Failure behavior

Fail silent. If the cache is missing, stale, malformed, or the hook script errors,
the user prompt proceeds unchanged.

## Example .claude/settings.json snippet

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/skill-activation.mjs --tool-cache {{TOOL_CACHE_FILE}} --max-reminders 3 --fail-silent"
          }
        ]
      }
    ]
  }
}
```

