# Research Workflow

## **Trigger**

This workflow starts when the user invokes `/research` or the spec workflow needs a research step.

## **Inputs**

- The bounded research question or questions.
- Allowed repo, documentation, web, or other source types, including any excluded sources.
- Output location: `{{TASK_DOCS_DIR}}/{{TASK_ID}}/research.md` when attached to a task, otherwise `{{DOCS_DIR}}/research/YYYY-MM-DD-<slug>.md`.
- Research depth and budget, including the timebox, source-count target, and any spend or token cap.
- `{{TASK_DOCS_DIR}}`, `{{TASK_ID}}`, and `{{DOCS_DIR}}` are bound by the instance manifest before this workflow runs.

## **Steps**

1. Orchestrator: define the bounded research questions, allowed sources, output location, depth, budget, and decision the research must inform.
2. Orchestrator: fan out independent questions to `researcher` subagents when useful. Use Codex Terra for read-only research packets and the GLM research skill for offloaded web sweeps.
3. Each `researcher`: return facts with source links or file:line evidence, confidence, contradictions, and unknowns; do not make the final decision.
4. `research-consolidator`, who was not one of the researchers: merge the packets into one consolidated brief preserving source links, confidence, disagreement, and unknowns, and return it (the consolidator is read-only and does not write files).
5. Orchestrator: write the consolidated brief to the selected output file, review it, verify decision-critical claims against their evidence, and decide or name the remaining blocker.

## **Output contract**

- The selected research packet file contains facts with file:line or URL evidence.
- Every finding has a confidence level.
- Disagreements and contradicting evidence remain visible rather than being averaged away.
- The packet includes actionable recommendations and what remains unknown.

## **Verification**

- Every material factual claim has file:line or URL evidence, or is explicitly labeled unsupported.
- Confidence, disagreements, and unknowns are present where applicable.
- The orchestrator confirms the packet answers the defined questions within the allowed-source and budget constraints.

## **Ceremony scaling**

- Single bounded question: one `researcher`, no `research-consolidator`; the orchestrator reviews the packet directly.
- Multi-question or high-stakes research: researcher fan-out, a separate `research-consolidator`, and orchestrator review.

## **Failure handling**

- Unreachable sources are recorded with the attempted URL or location and failure; they are never skipped silently.
- Contradicting evidence is flagged as the packet's first item.
- If the timebox is exceeded, return a partial packet with completed findings and named gaps.
