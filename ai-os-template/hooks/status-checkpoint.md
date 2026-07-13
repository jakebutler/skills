# status-checkpoint

## Name

`status-checkpoint`

## Classification

Automatic maintenance.

## Claude Code event

`Stop` and `SessionEnd`

## Trigger condition

At response stop and session end, after verification hooks have had a chance to run.
The hook writes only when the checkpoint significance check finds that behavior,
state, intent, risk, next action, or user-visible progress changed since the last
checkpoint. It fires at most once for the same checkpoint id.

## Action

Overwrite `{{PROJECT_STATUS_FILE}}` with the current handoff state and update the
`## Unreleased` draft section in the changelog. Each write records a one-line update
reason, for example:

```text
Update reason: implemented account-settings validation and left typecheck passing.
```

The status file is an idempotent handoff snapshot, not a ledger. The changelog draft
captures user-facing or operationally relevant changes at checkpoint granularity.

## Guardrails

- Never append per-response logs.
- Do not write if the significance check is false.
- Do not edit Tier C files such as skills, `AGENTS.md`, `CLAUDE.md`, or hooks.
- Do not promote task-local plans into global docs unless they became stable
  decisions.
- Preserve existing changelog structure and touch only the configured unreleased
  section.
- Record a single update reason for every automatic write.

## Failure behavior

If status or changelog update fails, print an advisory maintenance warning with the
file path and command failure. Do not block the response. If the hook detects that it
already ran for the checkpoint id, exit successfully without writing.

## Example .claude/settings.json snippet

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/status-checkpoint.mjs --event Stop --status-file {{PROJECT_STATUS_FILE}} --changelog-file {{CHANGELOG_FILE}} --section \"## Unreleased\" --once-per-checkpoint"
          }
        ]
      }
    ],
    "SessionEnd": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/status-checkpoint.mjs --event SessionEnd --status-file {{PROJECT_STATUS_FILE}} --changelog-file {{CHANGELOG_FILE}} --section \"## Unreleased\" --once-per-checkpoint"
          }
        ]
      }
    ]
  }
}
```

