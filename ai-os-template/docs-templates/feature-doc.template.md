<!--
  TEMPLATE: docs/<feature>.md — progressive knowledge doc for one feature/area.

  WRITE TIER: B — guarded automatic (see DESIGN-MEMO.md §7.4), same as SPEC.md.
  - Stable facts and links only: how the feature actually works today, not plans or
    in-flight work. In-flight work belongs in dev/active/[task]/ until it lands.
  - Every automatic edit must record a one-line update reason (see log at bottom).
  - Keep to what's true and durable. If a section would only be accurate for one
    sprint, it belongs in a task doc or the changelog, not here.
  - Referenced from AGENTS.md's Doc Map under {{DOCS_DIR}}/ — keep the filename stable
    once linked, since other docs and agents will reference it by path.

  Instantiation: copy this file to {{DOCS_DIR}}/{{FEATURE_SLUG}}.md, replace
  {{PLACEHOLDERS}}, delete sections that don't apply to this feature.
-->

# {{FEATURE_NAME}}

**Last reviewed:** {{LAST_REVIEWED_DATE}}

## What it does

<!-- One or two paragraphs: the feature's purpose and scope, in plain terms. -->

{{FEATURE_SUMMARY}}

## How it flows through the system

<!-- The path a request/event/data takes through this feature, end to end. Name the
     components involved and the order they're touched in, not implementation detail. -->

{{FLOW_DESCRIPTION}}

## Key files

<!-- The files an agent needs to read before changing this feature. Paths, not prose. -->

| File | Role |
|---|---|
| `{{FILE_PATH_1}}` | {{FILE_ROLE_1}} |
| `{{FILE_PATH_2}}` | {{FILE_ROLE_2}} |

## Invariants

<!-- Things that must always hold true. If an agent violates one of these, it's a bug
     even if tests pass. -->

- {{INVARIANT_1}}
- {{INVARIANT_2}}

## Verification

<!-- Exact commands (or manual steps) to confirm this feature works, scoped to it. -->

| Check | Command / steps |
|---|---|
| {{CHECK_NAME_1}} | `{{COMMAND_1}}` |
| {{CHECK_NAME_2}} | `{{COMMAND_2}}` |

## Gotchas

<!-- Non-obvious traps: things that look wrong but aren't, things that look fine but
     break, historical footguns. Save the next agent a rediscovery. -->

- {{GOTCHA_1}}
- {{GOTCHA_2}}

## Update log

<!-- Tier B guardrail: every automatic edit records a one-line reason here. -->

| Date | Reason |
|---|---|
| {{DATE}} | {{UPDATE_REASON}} |
