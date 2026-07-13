# destructive-git-guard

## Name

`destructive-git-guard`

## Classification

Blocking.

## Claude Code event

`PreToolUse` on `Bash`

## Trigger condition

Before any `Bash` command containing destructive git operations:

- `git push --force`, `git push --force-with-lease`, or equivalent force push flags
- `git reset --hard`
- `git clean`, especially `git clean -fd`, `git clean -xfd`, or `git clean -dfx`
- branch deletion via `git branch -D`, `git branch -d`, or `git push origin --delete`
- destructive operations targeting `{{MAIN_BRANCH}}`

The hook allows the command only when explicit user permission for that operation is
present in the current conversation context.

## Action

Parse the Bash command and classify the destructive git operation. If the command is
destructive and explicit permission is absent, block it and print:

- operation detected
- branch or ref affected, when parseable
- required permission phrase
- safer alternative, such as inspect status, create a backup branch, or use a
  non-destructive diff command

## Guardrails

- Do not rely on substring checks alone; parse common shell quoting and chained
  commands before classification.
- Treat aliases that expand to destructive git commands as blocked when detectable.
- Require a fresh, operation-specific user permission. Generic "do what you need" is
  not enough for force push, hard reset, clean, or branch deletion.
- Apply stricter checks to `{{MAIN_BRANCH}}`.
- Support local non-production bypass only through `{{BLOCKING_OVERRIDE}}=1`, and
  never for protected production automation unless explicitly configured.

## Failure behavior

If parsing fails for a Bash command that contains `git`, fail closed when destructive
tokens are present. Return a non-zero exit code to block the tool call. When
`{{BLOCKING_OVERRIDE}}=1` is used locally, allow the command and print a warning that
names `destructive-git-guard`, the operation, and the bypass reason.

## Example .claude/settings.json snippet

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/destructive-git-guard.mjs --main-branch {{MAIN_BRANCH}} --override-env {{BLOCKING_OVERRIDE}} --require-explicit-permission"
          }
        ]
      }
    ]
  }
}
```

