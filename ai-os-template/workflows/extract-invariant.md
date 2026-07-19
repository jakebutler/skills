# Extract Invariant Workflow

## Trigger

Run after consolidated residual/adversarial review has produced a reproduced finding
whose root-cause class is absent from the selected active and advisory invariants. This
is a bounded closure step, not another review round.

## Inputs

- resolved finding and stable finding ID;
- affected effect-surface IDs and kinds;
- selected invariant packet and possible duplicate IDs;
- exact finding and fixed snapshot identities;
- reproduction command/result and durable counterexample test; and
- project-bound candidate inbox and extraction command.

## Steps

1. The read-only invariant extractor distinguishes novel invariant, known invariant
   missed by inventory/retrieval, duplicate, and instance-specific defect.
2. Only `novel_reproduced` proceeds. Inventory/retrieval misses return to those system
   owners instead of creating a duplicate rule.
3. Validate `novel-finding.json`, then invoke the deterministic append-only writer.
4. The writer derives stable candidate and origin fingerprints, appends atomically,
   and does nothing when the same origin is already recorded.
5. Record the extraction outcome in task closure. Candidate validation, advisory
   promotion, and active-policy owner approval remain separate future gates.

A finding with possible existing invariant IDs is not novel and must be resolved as a
duplicate or retrieval miss before extraction. If a crashed writer leaves the mkdir
lock behind, an operator inspects running writers and the inbox/temp-file state before
removing the lock; automation never guesses staleness and races a live writer.

## Safety boundary

This workflow cannot modify active invariants, generated registry indexes, production
code, review verdicts, or workflow prompts. Failure to extract is visible and blocks
closure accounting, but never silently promotes an unproven rule.
