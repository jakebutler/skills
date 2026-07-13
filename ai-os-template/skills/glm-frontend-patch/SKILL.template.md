---
name: glm-frontend-patch
description: "STATUS: spec only; implementation queued. Define bounded frontend patches through an external GLM agentic loop using the Z.ai API, with zero Claude/Codex tokens. Do not invoke until implemented and experiment-validated."
---

# GLM Frontend Patch - {{REPO_NAME}}

> **Status: not implemented**
>
> Implementation is queued. Before the first production use, run the experiment
> workflow comparison required by INVENTORY action item 5: GLM vs Composer vs Sol on
> the same bounded frontend slice with identical acceptance checks.

<!-- Bind {{REPO_NAME}}, {{REPO_PATH}}, and {{DESIGN_CONSTRAINTS}} at instantiation. -->

## Intended Runtime

Implement this as a shell skill backed by its own Python virtual environment and its
own `.env` containing the Z.ai API key. The script runs an external GLM agentic loop,
using zero Claude/Codex tokens. Never echo, log, report, or commit the key.

## Intended Invocation

```bash
{{GLM_FRONTEND_SCRIPT}} --packet /path/to/packet.md --target "{{REPO_PATH}}"
```

<!-- Bind {{GLM_FRONTEND_SCRIPT}} to the future skill-owned Python entry point. -->

The Python script accepts one packet file and one target directory, applies a bounded
diff, and refuses to read or write files outside the packet's explicit scope.

## Packet Contract

The packet must contain:

- One exact implementation goal.
- The exhaustive list of files in scope.
- Observable acceptance criteria.
- `{{DESIGN_CONSTRAINTS}}`
  <!-- Bind the target repo's design system, responsive, and accessibility rules. -->
- Read-first instructions and areas to avoid.
- Focused verification commands.
- A requirement to preserve unrelated user changes.
- A stop condition for ambiguity, missing context, or any needed out-of-scope edit.

## Guardrails

- Never touch a file not listed in scope; stop and report instead.
- Never commit, stage, push, deploy, publish, send, mutate cloud data, or edit global
  configuration.
- Never expose secrets or place the skill's `.env` in the target repository.
- Do not run repo-wide rewrites, broad lint, or broad tests unless the packet says so.
- Treat GLM output as evidence, not authority; the orchestrator owns decisions.

## Required Report

Return only:

- Files changed.
- Behavioral summary.
- Verification run and results.
- Uncertainties, blockers, or requested out-of-scope work.

After the run, the orchestrator inspects `git status` and `git diff`, confirms every
changed path was in scope, and independently checks acceptance criteria before use.
