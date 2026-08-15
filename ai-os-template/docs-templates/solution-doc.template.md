<!--
  TEMPLATE: {{DOCS_DIR}}/solutions/{{SEMANTIC_SLUG}}.md

  WRITE TIER: B — guarded automatic, written only by the autoskill-improver's
  grounded solution-learning route after mechanical and independent semantic
  validation. Skills, root instructions, hooks, and routes remain Tier C proposals.

  Use schemas/solution-learning.schema.json and scripts/process-solution-learning.mjs.
  Replace every {{PLACEHOLDER}} and delete comments before use.
-->

---
schema_version: 1
track: {{BUG_OR_KNOWLEDGE}}
title: "{{TITLE}}"
slug: {{SEMANTIC_SLUG}}
date: {{CREATED_DATE}}
# last_updated: {{UPDATED_DATE}} # Add only for an update-in-place.
category: {{CATEGORY}}
module: {{MODULE}}
tags:
  - "{{TAG}}"
problem_type: {{PROBLEM_TYPE}}
capture_reason: "{{ONE_LINE_WHY_THIS_WAS_CAPTURED}}"
source_candidate_id: "{{FROZEN_SOURCE_CANDIDATE_ID}}"
source_git_commit: {{SOURCE_GIT_COMMIT}}
source_route: {{LIVE_OR_HARVEST_ROUTE}}
observed_at: "{{ISO_8601_TIMESTAMP}}"
source_kind: {{SOURCE_KIND}}
author_id: "{{AUTHOR_OR_WORKER_ID}}"
learning_fingerprint: sha256:{{FINGERPRINT}}
grounding_status: {{VERIFIED_OR_DEGRADED}}
grounding_validator_id: "{{INDEPENDENT_VALIDATOR_ID}}"
---

# {{TITLE}}

<!-- BUG TRACK: retain these sections and delete the knowledge-track sections. -->

## Problem

{{OBSERVABLE_SYMPTOMS}}

## Investigation and dead ends

{{INVESTIGATION}}

## Root cause

{{ROOT_CAUSE}}

## Verified solution

{{SOLUTION}}

## Why it works

{{WHY_IT_WORKS}}

## Prevention

{{PREVENTION_AND_REGRESSION_EVIDENCE}}

## Verification

{{HOW_THE_FIX_WAS_CONFIRMED}}

<!-- KNOWLEDGE TRACK: retain these sections and delete the bug-track sections. -->

## Context

{{CONTEXT_OR_FRICTION}}

## Reusable guidance

{{GUIDANCE}}

## Why it matters

{{WHY_IT_MATTERS}}

## Applicability boundaries

{{BOUNDARIES}}

## Examples and counterexamples

{{EXAMPLES_AND_COUNTEREXAMPLES}}

<!-- BOTH TRACKS -->

## Grounding

- {{STATUS}}: {{CLAIM}} ({{REPO_RELATIVE_SOURCE_PATH}}) — quote: "{{SOURCE_QUOTE}}"

## Related

- {{RELATED_DOC_OR_ISSUE}}
