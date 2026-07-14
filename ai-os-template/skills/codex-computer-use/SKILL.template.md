---
name: codex-computer-use
description: Ask a fresh Codex route to run local app verification that needs browser automation, screenshots, app launching, simulator or device state, or independent runtime inspection. Use when the Sol orchestrator needs an independent route to test a flow, verify UI behavior, inspect a running app, capture screenshots, or report confirmation about implemented behavior.
---

# Codex Computer Use - {{REPO_NAME}}

<!-- Bind {{REPO_NAME}} and {{REPO_PATH}} from the instance manifest. -->

Use Codex as a separate local verification agent when the task needs real UI
interaction, screenshots, browser/device state, or an independent runtime check outside
the orchestrator's current context.

Do not use this for ordinary code reading, typechecking, linting, or tests that the
orchestrator can run directly. Launching local apps, simulators, or browsers to verify requested
work is acceptable without asking. Ask first if the run could disrupt the user's
environment beyond that.

## Workflow

1. Identify the verification target: app, local route, browser flow, UI state, or
   runtime behavior.
2. Define exactly what should be verified, observed, and captured.
3. Name forbidden actions, especially send-class actions, live external mutations,
   destructive actions, or production account actions.
4. Create a temporary artifact directory for screenshots and the report.
5. Run `codex exec` with computer-use permissions.
6. Inspect the report, screenshots, console output, and runtime errors yourself.
7. Summarize confirmed observations, uncertainty, and whether the behavior satisfies
   the requirements.

## Command Shape

```bash
ARTIFACT_DIR="$(mktemp -d "${TMPDIR:-/tmp}/codex-computer-use.XXXXXX")"
REPORT="$ARTIFACT_DIR/report.md"
PROMPT="$ARTIFACT_DIR/prompt.md"
```

Write a self-contained prompt to `$PROMPT`, then run:

```bash
codex exec -C "$PWD" --add-dir "$ARTIFACT_DIR" -s danger-full-access -o "$REPORT" "$(cat "$PROMPT")"
```

Computer-use tasks normally require `danger-full-access` because they may need to
launch browsers, inspect local apps, or access machine resources outside the repository.

## Prompt Requirements

Tell Codex:

- The exact verification goal.
- Which app/route/environment to use.
- Which environment is safe to mutate.
- Which workflow to execute.
- What successful behavior looks like.
- What screenshots should be captured.
- Which console logs, network requests, or runtime errors to inspect.
- Whether accessibility, keyboard navigation, responsiveness, or visual regressions
  should be checked.
- Forbidden actions.
- Report format.
- `{{ENV_WRAPPER}}`
  <!-- Bind any required local env wrapper, server command prefix, or safe launch rule. -->
- `{{VERIFICATION_COMMANDS}}`
  <!-- Bind app launch and smoke-check commands when they are safe for computer use. -->

If authentication is required:

- Prefer existing logged-in local sessions.
- Stop and report if credentials are required.
- Never invent credentials.
- Never bypass authentication.

## Forbidden Unless Explicitly Approved

Codex must not:

- trigger send-class actions
- approve, publish, or deploy against production
- run live external backfills, repairs, or imports
- mutate production data
- delete data
- purchase anything
- send messages
- change system settings
- close the user's apps
- act on real accounts beyond the requested local verification
- bypass repo invariants: `{{REPO_INVARIANTS}}`
  <!-- Bind from the repo's AGENTS.md/CLAUDE.md invariants section. -->

## Example Prompt

```text
You are independently verifying a {{REPO_NAME}} implementation.

Repository: {{REPO_PATH}}
Artifact directory: /tmp/codex-computer-use.xxxxxx

Goal:
Verify <specific UI/runtime behavior>.

Environment:
Use <safe local/staging environment>. If the required server/session is unavailable,
report that and stop. Do not use production unless explicitly approved. Do not trigger
forbidden actions. Do not mutate production data.

Workflow:
1. Open <route>.
2. Perform <safe interaction>.
3. Inspect browser console errors.
4. Check responsive layout if relevant.

Capture:
- <required screenshot>
- <required runtime evidence>

Report:
- What passed
- What failed
- Screenshots captured
- Any blocked auth or missing local server
- Anything uncertain
```

## Reporting Back

Treat Codex's observations as evidence rather than authority.

Before telling the user verification succeeded, inspect screenshots, console output,
reported runtime errors, observed route/environment, and whether forbidden actions were
avoided.

If the workflow could not be completed, clearly explain where it stopped and why.

If `codex` is not installed or computer-use support is unavailable, report the error
and offer the best direct verification available.
