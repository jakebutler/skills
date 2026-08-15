---
name: codex-review
description: Ask Codex for one independent findings-first review of an exact diff when risk, uncertainty, or the user warrants fresh context.
---

# Codex Review - {{REPO_NAME}}

Routine reversible work does not need delegated review solely because it is non-trivial
or multi-file.

1. Identify the exact uncommitted diff, base range, commit, or PR plus acceptance
   criteria and task-relevant invariants.
2. Ask one findings-first reviewer to inspect the full diff and enough surrounding
   source, tests, contracts, and docs to understand affected entry points, callers,
   sibling paths, configuration, retries, recovery, and runtime/build boundaries.
3. Add specialist lenses only for concrete diff-triggered risk and run them
   concurrently against the same candidate. Routine review does not require two model
   families.
4. Freeze all findings before remediation, verify important claims, deduplicate them
   into one actionable list, then make one correction batch.
5. Run a targeted residual review only when the correction materially changed
   sensitive logic or a P0/P1 remains.

The reviewer never edits. Findings include severity, file/line, concrete failure mode,
and fix direction. If none qualify, say `No findings above threshold` and name residual
test gaps. Report confirmed findings, rejected non-issues, and omitted checks concisely.
