# tool-cache-refresh

## Name

`tool-cache-refresh`

## Classification

Automatic maintenance.

## Claude Code event

`SessionStart`.

## Trigger condition

Run at `SessionStart`. Automatic-maintenance hooks fire at checkpoints only
(anti-churn), not per tool use. The script hashes the MCP configuration, command
directory, and skills-directory listing, then compares that fingerprint with the
stored fingerprint in `{{TOOL_CACHE_FILE}}`.

## Action

When the source fingerprint differs, rewrite `{{TOOL_CACHE_FILE}}` with:

- available MCP tools and connector notes
- slash commands enabled for the repo
- curated skill inventory and short activation hints
- subagent roster summary
- refresh timestamp
- source fingerprints used to determine freshness

When the fingerprint matches, leave the cache byte-for-byte unchanged. The cache is
a Tier A generated file and may be overwritten automatically at this checkpoint.

## Guardrails

- Do not edit skill bodies, command specs, agent definitions, or root instruction
  files.
- Keep the cache deterministic and compact enough for pre-prompt lookup.
- Include a refresh timestamp and source fingerprint summary.
- Never refresh on `PostToolUse`; automatic maintenance runs at checkpoints only.
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
            "command": "node .claude/hooks/tool-cache-refresh.mjs --tool-cache {{TOOL_CACHE_FILE}} --mcp-config .mcp.json --commands-dir {{COMMANDS_LOCATION}} --skills-source {{SKILLS_SOURCE}} --fingerprint-compare"
          }
        ]
      }
    ]
  }
}
```
