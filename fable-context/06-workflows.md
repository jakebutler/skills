# Workflows

## Workflow 1: Spec

Default path:

```text
grill-with-docs -> PRD -> to-issues -> TDD implementation plan
```

Research and prototype can be embedded in this workflow:

- use research when facts, prior art, libraries, market, or external docs matter.
- use prototype when UI, state machines, interaction design, or uncertain product behavior needs exploration.

They should also exist as standalone commands.

Preferred grill pattern:

1. Ask the user up to 5 critical questions if needed.
2. Run 20-question self-grilling.
3. Include options considered for each question.
4. Explain the selected option.
5. Batch results for user review.
6. Update docs and PRD.

## Workflow 2: TDD Implementation

Expected loop:

```text
read relevant files
understand conventions
write failing test or define executable acceptance check
implement minimum correct solution
run focused verification
refactor only when justified
run broader verification if blast radius requires it
update docs/status
```

Rules:

- do not hard-code for tests.
- do not add unnecessary abstractions.
- keep the change scoped.
- use existing local patterns.

## Workflow 3: Debug Mode

Expected loop:

```text
start searchable logs
inspect existing traces
reproduce or observe issue
assess
plan
code
test
repeat
capture durable lesson if needed
clear transient logs
run commit workflow
```

Persistent lesson rule:

- if the issue reveals a durable repo convention or recurring trap, update the nearest relevant `AGENTS.md`, `CLAUDE.md`, docs page, or skill.

## Workflow 4: Commit

Candidate flow:

```text
confirm working directory
inspect git status
review diff
run formatter/linter
run tests/build appropriate to change
run self review or reviewer agent
address findings
update docs/status/changelog
run autoskill scan if applicable
commit focused changes
```

Fable should define exact verification by repo and task type.

## Workflow 5: Commit + PR

Candidate flow:

```text
run commit workflow
push branch
create PR
write PR message
run PR review agent
await or collect code review report
address findings
update PR
leave final status
```

PR message structure:

```md
## Summary

## Why

## Changes

## Verification

## Risks / Rollback

## Follow-up
```

## Workflow 6: PR Review

Review stance:

- prioritize bugs, regressions, missing tests, security risks, and broken contracts.
- findings first.
- cite files and lines.
- avoid vague style-only feedback unless it affects maintainability or product quality.

Possible subagents:

- architecture reviewer
- security reviewer
- UX reviewer
- test coverage reviewer
- docs reviewer

## Workflow 7: Wrap Session

Expected outputs:

- update `PROJECT-STATUS.md`
- update docs if needed
- update changelog if meaningful
- run autoskill scan
- record next recommended action
- ensure no unreported running processes
- list verification completed and skipped

`PROJECT-STATUS.md` should be overwritten, not appended as a history ledger.

## Workflow 8: Skill/Plugin Inventory

Fable should inspect:

- current repo skills
- installed Claude/Codex skills
- plugins and external skill repos
- candidate skills from braindumps

Output:

- keep
- adopt
- adapt
- merge
- deprecate
- needs experiment

## Workflow 9: Repo Initialization

Initializer agent creates:

- doc skeleton
- initial `PROJECT-STATUS.md`
- `init.sh`
- optional `FEATURE-LIST.json`
- tool/command inventory cache
- baseline verification command
- worktree boot guidance

Then verifies:

- app can boot
- env access works safely
- logs are captured
- basic E2E/smoke passes

## Workflow 10: Publish Slice / Prove

Fable should evaluate `publish-slice` and `prove` as standard workflows.

Possible meaning:

- `prove`: gather evidence that a change is correct and ready.
- `publish-slice`: take a verified slice through PR, review, deploy, and status update.

Do not add these until Fable resolves names, triggers, and output contracts.
