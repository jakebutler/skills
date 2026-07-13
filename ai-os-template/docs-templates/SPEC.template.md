<!--
  TEMPLATE: SPEC.md — durable product/architecture intent.

  WRITE TIER: B — guarded automatic (see DESIGN-MEMO.md §7.4).
  - Agents may update this file automatically, but only stable facts and links:
    confirmed architecture, shipped stack choices, durable user stories, links out.
  - Every automatic edit must record a one-line update reason (see log at bottom).
  - Keep this file high-level. Push detail into docs/ feature docs and issues, and
    link out rather than inlining. High-level content resists drift; detail rots.
  - Target: stay under 800 lines. If this file is approaching that limit, that is a
    signal to push sections into docs/ rather than trim prose.
  - This file is never a status log or a task ledger. Current state lives in
    PROJECT-STATUS.md; history lives in git and CHANGELOG.md.

  Instantiation: replace {{PLACEHOLDERS}}, delete OPTIONAL sections that don't apply,
  bind this file's role in the instance manifest (instances/<repo>/manifest.md).
-->

# {{REPO_NAME}} — Spec

**Last reviewed:** {{LAST_REVIEWED_DATE}}

## Purpose

<!-- One paragraph: what this product/system is and the problem it solves. Durable —
     should rarely need to change once true. -->

{{PURPOSE_SUMMARY}}

## Users

<!-- Who uses this, and the jobs they hire it for. Keep to durable segments, not
     personas that will churn. -->

| User / segment | Primary job to be done |
|---|---|
| {{USER_SEGMENT_1}} | {{JOB_TO_BE_DONE_1}} |
| {{USER_SEGMENT_2}} | {{JOB_TO_BE_DONE_2}} |

## Tech stack

<!-- Confirmed, shipped choices only. Do not record choices under evaluation — those
     belong in a task doc until decided. -->

| Layer | Choice | Notes |
|---|---|---|
| Language(s) | {{LANGUAGES}} | |
| Frontend | {{FRONTEND_STACK}} | |
| Backend | {{BACKEND_STACK}} | |
| Data store(s) | {{DATA_STORES}} | |
| Infra / hosting | {{INFRA}} | |
| Auth | {{AUTH_APPROACH}} | |
| CI/CD | {{CI_CD}} | |

## Architecture overview

<!-- High-level system shape: major components and how they talk to each other.
     A diagram reference or a short component list, not an implementation guide.
     Implementation detail belongs in docs/<feature>.md. -->

{{ARCHITECTURE_OVERVIEW}}

<!-- OPTIONAL: link to a diagram file if one exists, e.g. docs/architecture.excalidraw -->
Diagram: {{ARCHITECTURE_DIAGRAM_LINK}}

## Major user stories

<!-- Durable, high-level stories — the handful that define the product, not a backlog.
     Link to issues for anything more granular or time-bound. -->

- {{USER_STORY_1}}
- {{USER_STORY_2}}
- {{USER_STORY_3}}

## Links out

<!-- Do not duplicate content that lives elsewhere — link to it. -->

- Feature docs: `{{DOCS_DIR}}/`
- Open work / issues: {{ISSUE_TRACKER_LINK}}
- Workflow specs: {{WORKFLOWS_LOCATION}}
- Model routing: {{ROUTING_DOC_LINK}}

## Update log

<!-- Tier B guardrail: every automatic edit records a one-line reason here. Prune
     entries older than a few cycles once they're no longer useful context. -->

| Date | Reason |
|---|---|
| {{DATE}} | {{UPDATE_REASON}} |
