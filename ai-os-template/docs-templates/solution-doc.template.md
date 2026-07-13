<!--
  TEMPLATE: {{DOCS_DIR}}/solutions/YYYY-MM-DD-{{SLUG}}.md — searchable solved-problem doc.

  WRITE TIER: B — guarded automatic, written only by the autoskill-improver's solutions route.
  - Use the filename YYYY-MM-DD-<slug>.md. Stale docs move to {{DOCS_DIR}}/solutions/archive/;
    doc-maintainer flags candidates during wrap-session.
  - Solutions are searched when relevant and never bulk-loaded into prompts.
  - Replace {{PLACEHOLDERS}} and delete comments before use.
-->

---
title: {{TITLE}}
date: {{DATE}}
category: {{CATEGORY}}
module: {{MODULE}}
tags:
  - {{TAG}}
problem_type: {{PROBLEM_TYPE}}
---

# {{TITLE}}

## Problem

<!-- Symptom as observed, including error text if any. -->

{{PROBLEM}}

## Context

<!-- Where and when it bites: files, versions, and relevant conditions. -->

{{CONTEXT}}

## Solution

<!-- What actually fixed it, with file:line or command evidence. -->

{{SOLUTION}}

## Verification

<!-- How it was confirmed fixed. -->

{{VERIFICATION}}

## Gotchas

<!-- What looked like the fix but was not; related traps. -->

{{GOTCHAS}}
