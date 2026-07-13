# secrets-guard

## Name

`secrets-guard`

## Classification

Blocking.

## Claude Code event

`PreToolUse`

## Trigger condition

Before `Write`, `Edit`, `MultiEdit`, or `Bash` commands that create commits or modify
files. The hook blocks when the proposed edit, generated file, staged diff, or commit
payload introduces secret-looking values, model API keys, private keys, tokens, or
model provider credentials in code. It also blocks model API keys in client-side paths
such as `app/`, `pages/`, `src/`, `client/`, `web/`, `public/`, and frontend bundle
configuration unless the path is explicitly classified as server-only by repo config.

## Action

Scan the proposed tool input and any target file diff for:

- common secret variable names paired with high-entropy values
- provider key prefixes for OpenAI, Anthropic, Google, Mistral, Cohere, Pioneer, and
  other configured model vendors
- PEM/private key blocks
- bearer tokens and webhook signing secrets
- accidental `.env` contents outside approved example files
- client-side use of model API key variables

If a match is found, block the tool call and print the matched category, path, and
safe remediation: move the value to the repo's secret manager or server-side env
configuration, replace committed examples with placeholders, and keep client code on
server-mediated calls.

## Guardrails

- Do not print the secret value. Redact all but category and path.
- Allow placeholder values in documented example files, such as `.env.example`, when
  they do not contain real-looking tokens.
- Treat client-side model API keys as blocking even if the key is not high entropy.
- Support local non-production bypass only through `{{BLOCKING_OVERRIDE}}=1`.
- Never allow the bypass in CI or protected production workflows unless the repo
  explicitly opts in.

## Failure behavior

If the scanner cannot inspect a proposed edit, fail closed for commits and direct
secret-bearing writes, and fail advisory for unrelated file edits. If blocked, return
a non-zero exit code so Claude Code stops the tool call. If `{{BLOCKING_OVERRIDE}}=1`
is present in a local non-production environment, allow the tool call and print a
warning that names `secrets-guard` and the bypassed category.

## Example .claude/settings.json snippet

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit|Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/secrets-guard.mjs --override-env {{BLOCKING_OVERRIDE}} --client-paths \"app,pages,src,client,web,public\""
          }
        ]
      }
    ]
  }
}
```

