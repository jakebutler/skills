---
name: codex-computer-use
description: Ask Codex CLI (gpt-5.5) to run lower-db local app verification that needs browser automation, screenshots, app launching, simulator/device state, or independent runtime inspection. Use when Claude/Fable needs Codex to test a flow, verify UI behavior, inspect a running app, capture screenshots, or report confirmation and feedback about implemented behavior. Never use it to send email, mutate production data, or bypass auth.
---

# Codex Computer Use — lower-db

Use Codex as a separate local verification agent when the task needs real UI interaction, screenshots, browser/device state, or an independent runtime check outside Claude/Fable's current context.

Do not use this for ordinary code reading, typechecking, linting, or tests Claude can run directly. Launching local apps, simulators, or browsers to verify requested work is acceptable without asking. Ask first if the run could disrupt Jake's environment beyond that.

## Workflow

1. Identify the verification target: public app, admin app, local route, browser flow, UI state, or runtime behavior.
2. Define exactly what should be verified, observed, and captured.
3. Name forbidden actions, especially Send-class actions, live cloud mutations, destructive actions, or production account actions.
4. Create a temporary artifact directory for screenshots and the report.
5. Run `codex exec` with computer-use permissions.
6. Inspect the report, screenshots, console output, and runtime errors yourself.
7. Summarize confirmed observations, uncertainty, and whether the behavior satisfies the requirements.

## Command shape

```bash
ARTIFACT_DIR="$(mktemp -d "${TMPDIR:-/tmp}/codex-computer-use.XXXXXX")"
```

```bash
REPORT="$ARTIFACT_DIR/report.md"
```

```bash
PROMPT="$ARTIFACT_DIR/prompt.md"
```

Write a self-contained prompt to `$PROMPT`, then run:

```bash
codex exec -C "$PWD" --add-dir "$ARTIFACT_DIR" -s danger-full-access -o "$REPORT" "$(cat "$PROMPT")"
```

Computer-use tasks normally require `danger-full-access` because they may need to launch browsers, inspect local apps, or access machine resources outside the repository.

## Prompt requirements

Tell Codex:

- The exact verification goal.
- Which app/route to use: public, admin, legacy root, local URL, or production/staging URL.
- Which environment is safe to mutate.
- Which workflow to execute.
- What successful behavior looks like.
- What screenshots should be captured.
- Which console logs, network requests, or runtime errors to inspect.
- Whether accessibility, keyboard navigation, responsiveness, or visual regressions should be checked.
- Forbidden actions.
- Report format.

If authentication is required:

- Prefer existing logged-in local sessions.
- Stop and report if credentials are required.
- Never invent credentials.
- Never bypass authentication.

## Forbidden unless explicitly approved

Codex must not:

- click Send or trigger subscriber email delivery
- approve/publish against production
- run live cloud backfills/repairs/imports
- mutate production Convex data
- delete data
- purchase anything
- send messages
- change system settings
- close Jake's apps
- act on real accounts beyond the requested local verification

## Example prompt

```text
You are independently verifying a lower-db implementation.

Repository:
/absolute/path/to/lower-db

Artifact directory:
/tmp/codex-computer-use.xxxxxx

Goal:
Verify that the admin digest review page shows staleness flags and that the public weekly page renders the approved digest state.

Environment:
Use local dev URLs only. If no local server is running, report that and stop. Do not launch production. Do not click Send. Do not mutate production data.

Workflow:
1. Open the public homepage.
2. Open /weekly.
3. Open the latest /weekly/[slug] route.
4. Open /admin/digests if an authenticated local session exists.
5. Open a digest detail page.
6. Check keyboard navigation and responsive layout.
7. Inspect browser console errors.

Capture:
- Homepage screenshot
- Weekly archive screenshot
- Weekly detail screenshot
- Admin digest list screenshot if accessible
- Admin digest detail screenshot if accessible
- Console/runtime errors

Report:
- What passed
- What failed
- Screenshots captured
- Any blocked auth or missing local server
- Anything uncertain
```

## Reporting back

Treat Codex's observations as evidence rather than authority.

Before telling Jake verification succeeded, inspect:

- screenshots
- console output
- reported runtime errors
- the observed route/environment
- whether forbidden actions were avoided

If the workflow could not be completed, clearly explain where it stopped and why.

If `codex` is not installed or computer-use support is unavailable, report the error and offer the best direct verification available.
