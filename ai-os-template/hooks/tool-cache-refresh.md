# tool-cache-refresh

## Name

`tool-cache-refresh`

## Classification

Automatic maintenance.

## Claude Code event

`SessionStart` or config-change detection.

## Trigger condition

Run at `SessionStart` and whenever configured tool, command, MCP, skill, or plugin
metadata changes. Config-change detection may be implemented by comparing fingerprints
of `.claude/`, skill directories, MCP configuration, command specs, and plugin
manifest files against the last cache refresh.

## Action

Refresh `{{TOOL_CACHE_FILE}}` with:

- available MCP tools and connector notes
- slash commands enabled for the repo
- curated skill inventory and short activation hints
- subagent roster summary
- refresh timestamp
- source fingerprints used to determine freshness

The cache is a Tier A generated file and may be overwritten automatically.

## Guardrails

- Do not edit skill bodies, command specs, agent definitions, or root instruction
  files.
- Keep the cache deterministic and compact enough for pre-prompt lookup.
- Include a refresh timestamp and source fingerprint summary.
- If a tool source is unavailable, record that fact instead of inventing capabilities.
- Do not fetch remote package data unless the instantiated repo explicitly enables
  that behavior.

## Failure behavior

If refresh fails, keep the existing cache and print an advisory warning. If the cache
does not exist and cannot be created, warn that skill activation may be degraded. Do
not block the session.

## Example .claude/settings.json snippet

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/tool-cache-refresh.mjs --tool-cache {{TOOL_CACHE_FILE}} --commands-dir {{COMMANDS_LOCATION}} --agents-dir {{AGENTS_LOCATION}} --skills-source {{SKILLS_SOURCE}} --refresh-if-stale"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/tool-cache-refresh.mjs --tool-cache {{TOOL_CACHE_FILE}} --config-change-detection --refresh-if-changed"
          }
        ]
      }
    ]
  }
}
```

