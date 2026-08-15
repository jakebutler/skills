# Commit Workflow

## **Trigger**

Run only when the user authorizes a commit or an explicitly authorized delivery flow
reaches commit.

## **Inputs**

- Intended diff and branch.
- Existing exact-candidate verification/review evidence.
- Repository commit conventions.

## **Steps**

1. Confirm the worktree, branch, commit authority, and `git status --short`.
2. Inspect the complete intended diff and intended untracked files. Preserve unrelated
   work and resolve genuinely ambiguous ownership before staging.
3. Reuse checks and review against the exact unchanged diff. Run only a missing check
   justified by actual blast radius. Reaching commit does not require a full suite,
   build, new reviewer, doc pass, or autoskill pass.
4. Require one independent review only for genuinely High-risk work, material
   uncertainty, or explicit request. If it runs, freeze all findings, apply one
   correction batch, and rerun only affected checks plus one warranted confirmation.
5. Update status/changelog/durable docs only when handoff truth, user/operator-visible
   behavior, or durable intent changed.
6. Review the final diff/status, stage explicit intended paths, and create one focused
   commit.

## **Output contract**

- One focused commit containing only intended files.
- Concise report: hash, paths, checks reused/run, review state, and residual risk.
- No mandatory commit narration artifact for routine mechanics.
- Durable-learning work is optional and signal-driven. When invoked, it returns one
  grounded solution, staged proposal, reused disposition, or explicit skip through
  `SOLUTION-LEARNING.md`; it never expands routine commit ceremony.

## **Verification**

- Status and full intended diff were inspected.
- Required checks pass or valid exact-diff evidence was reused.
- Final commit contains only intended files.
- Solution-learning processing passed its schema, grounding, overlap, path, and
  headless-safety checks; contradicted or stale candidates did not write.

## **Ceremony scaling**

- Simple/Medium: diff inspection, reuse current evidence, run only missing focused
  checks, commit.
- High: one independent review and one relevant broad/release gate; reuse both if the
  candidate is unchanged.

## **Failure handling**

- Ambiguous unrelated work: stop only for the affected file; preserve everything else.
- Required check failure: collect the complete failure set and return one consolidated
  batch to implementation/debug.
- Do not bypass checks, rewrite unrelated history, or commit secrets/transient output.
