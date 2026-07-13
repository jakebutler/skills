<!--
  TEMPLATE: lab notebook entry — one entry per experiment, prepended newest-first to
  {{LAB_NOTEBOOK_FILE}} (or added as a dated file in a notebook directory, per the
  instance manifest). Write tier: Tier A within the notebook file (the experiment
  workflow owns it), but entries are append-only history — never edit a past entry.

  These entries are written to be SHARED PUBLICLY (blog posts, social, talks):
  - no secrets, keys, internal URLs, or proprietary code beyond what the experiment
    itself needs to show
  - absolute dates, exact model names/versions — "the new Codex model" is useless
    in six months
  - honest results: rejected hypotheses and surprises are the valuable part
-->

## {{DATE}} — {{EXPERIMENT_TITLE}}

**Hypothesis:** {{ONE_SENTENCE_FALSIFIABLE_CLAIM}}

**Verdict:** {{SUPPORTED_REJECTED_OR_INCONCLUSIVE}} — {{ONE_SENTENCE_WHY}}

### Setup

| | |
|---|---|
| Task | {{BOUNDED_TASK_ONE_LINE}} |
| Arms | {{MODELS_SETUPS_WITH_EXACT_VERSIONS}} |
| Success criteria | {{IDENTICAL_CHECKS_ACROSS_ARMS}} |
| Budget | {{CAP_AND_ACTUAL}} |

### Method

{{TWO_TO_FOUR_SENTENCES: what was held constant, what varied, how arms were verified
identically, who judged}}

### Results

| Arm | {{CRITERION_1}} | {{CRITERION_2}} | {{CRITERION_3}} | Notes |
|---|---|---|---|---|
| {{ARM_A}} | | | | |
| {{ARM_B}} | | | | |

### Analysis

{{WHAT_THE_NUMBERS_MEAN. Where arms genuinely differed vs. noise. What would change
the conclusion.}}

### Surprises

{{THE_PART_WORTH_SHARING — what you didn't expect. "None" is allowed but suspicious.}}

### What changes

{{ROUTING_MATRIX_CHANGE_WITH_VERSION, skill proposal staged, or "nothing — binding
confirmed". Link the experiment dir: {{EXPERIMENTS_DIR}}/{{DATE}}-{{SLUG}}/}}

### Next hypothesis

{{WHAT_THIS_EXPERIMENT_MAKES_YOU_WANT_TO_TEST_NEXT}}
