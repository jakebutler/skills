# Skills, Agents, Hooks, And Commands

## Skills

Skills contain reusable patterns, best practices, and how-to guidance.

Docs contain system architecture, data flows, API references, project knowledge, and current state.

This separation matters:

- "How to create a controller" belongs in a backend skill.
- "How this repo's workflow engine works" belongs in docs.
- "How to write React components" belongs in a frontend skill.
- "How notifications flow through this system" may need both a data-flow doc and a notification skill.

## Current Skill Families To Evaluate

This repo already contains relevant skill families. Fable should inspect the current checkout before making final recommendations.

Known relevant areas:

- Matt Pocock style planning: `grill-with-docs`, `to-plan`, `to-issues`, `tdd`, `prototype`
- Impeccable for frontend design and UX
- Convex skills
- marketing skills for GTM/copy/content
- BMAD/open spec style planning and implementation skills
- potential Compound Engineering skills
- potential Caveman and Ponytail methodologies/plugins
- candidate skills: `publish-slice`, `prove`, `research`, `wrap-session`
- autoskill-style improvement loop

## Skill Design Rule

Prefer progressive disclosure:

- main `SKILL.md` under roughly 500 lines
- resource files for deeper details
- only load resources relevant to the task

## Skill Auto-Activation

Problem:

- agents often fail to use available skills unless reminded.

Candidate solution:

- pre-submit hook checks prompt, files, intent, and keywords.
- hook injects a skill activation reminder before the model reads the user prompt.
- reminder names the likely relevant skills and why.

Fable should design this for Claude/Fable first and keep Codex portability in mind.

## Autoskill Improvement

Use an autoskill improver at the end of selected workflows:

- commit
- PR
- wrap session
- after repeated correction

Purpose:

- extract durable corrections/preferences
- identify skill-relevant lessons
- propose minimal updates
- avoid one-off noise

Open decision:

- user said hooks should auto-edit docs without human review.
- skill edits are higher risk than doc status updates.
- Fable should decide whether autoskill changes are auto-applied, proposed, or staged for review.

## Hooks

Hooks should be categorized.

### Pre-Submit Hooks

Possible uses:

- skill auto-activation
- reminder of relevant docs
- route prompt to workflow or slash command
- warn on ambiguous task requests

### Stop/Post-Response Hooks

Possible uses:

- formatter
- lint
- typecheck/build
- tests
- browser verification
- console error check
- risk-pattern reminder
- doc update
- changelog/status update
- autoskill scan

### Blocking Hooks

Use sparingly.

Candidates:

- secrets exposure
- client-side model API keys
- failed build/typecheck on code changes
- schema/database guardrail failure
- destructive git operation without explicit permission

### Advisory Hooks

Candidates:

- missing docs update
- missing test consideration
- error handling reminder
- architecture concern
- dependency concern

### Delegating Hooks

Candidates:

- too many type errors -> fix-types agent
- large diff -> architecture reviewer
- frontend diff -> UX/design reviewer
- docs drift -> documentation maintainer

### Automatic Maintenance Hooks

Candidates:

- update `PROJECT-STATUS.md`
- update docs map
- update changelog draft
- capture command/tool inventory
- refresh generated API docs

## Agent Roles

Fable should decide which roles become standard.

Candidate roles:

- initializer agent
- implementation agent
- research agent
- research consolidator
- plan reviewer
- strategic plan architect
- architecture confirmer
- code architecture reviewer
- simplifier/refactor reviewer
- build error resolver
- type fixer
- app verification agent
- browser verification agent
- documentation maintainer
- test generator
- route tester
- frontend UX designer
- web research specialist
- autoskill improver
- PR reviewer

## Subagent Output Contract

Every subagent should return a concise packet:

- task assigned
- files/docs inspected
- facts found
- decisions made
- output artifact or patch summary
- verification run
- risks
- open questions
- recommended next action

## Slash Commands

Candidate core commands:

- `/spec`
- `/research`
- `/prototype`
- `/implement-tdd`
- `/debug-mode`
- `/commit`
- `/commit-pr`
- `/review-pr`
- `/generate-tests`
- `/refactor`
- `/fix-types`
- `/update-docs`
- `/wrap-session`
- `/prove`
- `/publish-slice`
- `/autoskill`

Fable should reduce this list to a v1 command set and define output contracts.
