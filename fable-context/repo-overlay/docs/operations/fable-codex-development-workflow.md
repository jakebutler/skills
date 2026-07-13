# Fable + Codex development workflow

This is the operating model for ambitious lower-db work.

## Roles

| Role | Owns | Does not own |
|---|---|---|
| Fable/Claude orchestrator | product shape, scope, source-of-truth reading, invariants, review, final explanation | bulk typing or blind acceptance of generated work |
| Codex implementation | bounded code patches, tests, fixture updates, mechanical refactors | product decisions, Send actions, deploys, commits |
| Codex review | independent review of diffs and branch state | final authority |
| Codex computer use | local browser/app verification and screenshots | destructive actions or production mutations |

## Standard flow

1. Read `CLAUDE.md`, `CONTEXT.md`, relevant ADRs, audit source-of-truth, and touched code.
2. Write or update a feature slice spec if the task is larger than one obvious patch.
3. Split the task into small independently reviewable packets.
4. Send each packet to `codex-implementation`.
5. Inspect `git status` and `git diff`.
6. Run `/prove`.
7. Send the diff to `codex-review`.
8. Fix confirmed findings only.
9. Use `codex-computer-use` for UI/runtime verification.
10. Publish with `/publish-slice`.
11. End the session with `/wrap-session`.

## Worktree strategy

Use the root checkout for orchestration and clean inspection.

Use isolated worktrees for parallel Codex implementation packets. Never touch existing `.worktrees/` unless the packet owns that worktree.

Parallel work only works when each slice has:
- a named scope
- files to inspect first
- files or areas to avoid
- acceptance criteria
- verification commands
- an explicit report format

## Slice size rule

A slice should be small enough that:

- changed files can be staged by explicit path
- validation can be targeted
- review comments can be fixed without broadening scope
- the PR body can explain the behavioral change in 1-3 sentences

If a feature cannot meet that bar, split it.

## Codex prompt shape

Every Codex implementation packet must include:

- repository path
- artifact directory
- exact goal
- acceptance criteria
- relevant source-of-truth docs
- files/patterns to inspect first
- constraints and files to avoid
- lower-db invariants touched
- verification commands
- report format

## Review stance

Treat Codex output as evidence, not authority. Fable/Claude confirms the diff, the tests, screenshots, and whether the change matches the product intent.
