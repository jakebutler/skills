# verify-on-change

## Name

`verify-on-change`

## Classification

Advisory escalating to delegating.

## Claude Code event

`PostToolUse` and `Stop`

## Trigger condition

Run after code-editing tools change source files, and again at `Stop` if the session
has unverified code edits. Code-editing tools include `Write`, `Edit`, `MultiEdit`,
and repo-specific code generators. Documentation-only edits do not trigger typecheck,
but may trigger formatting if the repo formatter owns those files.

## Action

Collect changed files since the last verification checkpoint. Run the repo's scoped
formatter and scoped typecheck commands for those files, using configured placeholders
such as `{{FORMAT_COMMAND}}` and `{{TYPECHECK_COMMAND}}`.

On formatter or typecheck failure, emit an advisory notice containing:

- command run
- changed-file scope
- failure summary
- next recommended action

If type errors exceed `{{TYPE_ERROR_THRESHOLD}}` (default `5`), create a delegation
packet for the `implementer` subagent with a `fix-types` task instead of letting the
orchestrator push through manually.

## Guardrails

- Scope verification to changed files when the repo toolchain supports it.
- If scoped verification is unsupported, use the smallest configured project-level
  command and say that scope widened.
- Do not auto-edit code from the hook script. The hook verifies and delegates only.
- Deduplicate repeated failures within the same checkpoint.
- Use the standard delegation contract when escalating to `implementer`: goal,
  repo/paths, files to inspect, excluded areas, expected output, allowed tools,
  model preference, verification requirement, quality bar, and stop condition.

## Failure behavior

Formatter/typecheck failures are advisory unless the instantiated repo explicitly
promotes them to blocking. Hook infrastructure errors are advisory and must include
the command that failed. When type errors exceed `{{TYPE_ERROR_THRESHOLD}}`, the hook
returns a delegating notice naming the `implementer` target and fix-types scope.

## Example .claude/settings.json snippet

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/verify-on-change.mjs --phase post-tool --format-command \"{{FORMAT_COMMAND}}\" --typecheck-command \"{{TYPECHECK_COMMAND}}\" --type-error-threshold \"{{TYPE_ERROR_THRESHOLD}}\""
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/verify-on-change.mjs --phase stop --format-command \"{{FORMAT_COMMAND}}\" --typecheck-command \"{{TYPECHECK_COMMAND}}\" --type-error-threshold \"{{TYPE_ERROR_THRESHOLD}}\""
          }
        ]
      }
    ]
  }
}
```
