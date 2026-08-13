# Debug Workflow

## **Trigger**

Run for a reported bug, failing check, or unexplained runtime behavior. Diagnosis alone
does not authorize a fix.

## **Inputs**

- Symptom, complete failing output, or reproduction hint.
- Relevant source, tests, logs, configuration, and recent changes.
- Safe focused reproduction and verification commands.

## **Steps**

1. Confirm whether the user requested diagnosis only or diagnosis plus a fix.
2. Reproduce with the smallest safe command/path and capture complete output.
3. Before editing, search relevant logs and inspect every plausible in-scope entry
   point, caller, sibling path, configuration, and runtime/build boundary. Maintain one
   short register of observations, hypotheses, ruled-out causes, and unknowns.
4. Test hypotheses using read-only or focused diagnostics. Do not patch the leading
   symptom while the affected surface is still being mapped.
5. If a fix is authorized, add a failing regression check and implement all confirmed
   in-scope root causes as one coherent batch.
6. Run the reproduction and focused checks. Collect their complete failures before any
   next edit. Run a broad gate once only after focused checks pass and only when the
   blast radius requires it.
7. Add independent reproduction/review only for genuinely High-risk behavior,
   substantial unresolved uncertainty, or explicit request. Concurrent lenses return
   one consolidated list before remediation.
8. Record root cause, change, verification, and residual uncertainty concisely. Update
   durable docs only for a reusable project fact.

## **Output contract**

- Reproduction evidence, breadth-first cause map, confirmed root cause or bounded
  unknown, scoped fix when authorized, verification, and residual risk.
- A debug artifact only for long-running/High-risk incidents or explicit request.

## **Verification**

- Existing evidence was searched before asking for another reproduction.
- The complete affected surface was inspected before the first edit.
- Focused reproduction/checks pass after one coherent batch.
- Broad verification ran only if the affected boundary justified it.

## **Ceremony scaling**

- Simple/Medium: inline defect register, one batch, focused verification.
- High: durable incident note/rollback, one independent verifier, and one relevant
  broad or release check.

## **Failure handling**

- Two unsuccessful coherent strategies trigger a stop and evidence handoff, not a
  sequence of smaller patches.
- Credentials or live effects required for reproduction: provide exact safe steps and
  stop before speculative mutation.
- Out-of-scope root cause: report boundary/owner; do not widen the task silently.
