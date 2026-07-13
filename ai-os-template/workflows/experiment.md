# Experiment Workflow

Hypothesis-driven comparison of LLMs, prompts, or setups against the same coding task,
with results recorded in a public-shareable lab notebook. This is a first-class part
of the development methodology: routing-matrix bindings are hypotheses, and this
workflow is how they get validated or revised.

## Trigger

- `{{EXPERIMENT_COMMAND}}` invoked directly with a hypothesis or comparison question.
- The spec workflow hits a "which model/approach can actually do this well?" question.
- The debug workflow suspects a model/setup is underperforming its routing binding.
- A new model or tool becomes available and its routing placement needs evidence.

## Inputs

- A falsifiable hypothesis (e.g., "Composer 2.5 matches Sol on bounded frontend
  slices at a fraction of the latency") — not a vibe ("let's try the new model").
- Success criteria measurable identically across arms: acceptance checks, verification
  commands, and any quality dimensions (diff size, convention adherence, retries needed).
- The arms: which models/setups/prompts to compare (2–5; more is noise).
- A budget cap: max spend/tokens/time per arm. Batch LLM work that can spend real
  money beyond a smoke-sized sample requires explicit user approval first.

## Steps

1. Orchestrator: write the experiment brief to `{{EXPERIMENTS_DIR}}/YYYY-MM-DD-<slug>/brief.md`:
   hypothesis, arms, success criteria, measurement method, budget cap.
2. Orchestrator: prepare ONE bounded implementation packet (delegation-contract
   format) used identically by every arm — same goal, same read-first list, same
   acceptance checks. Differences between arms must be limited to the variable under
   test (model, prompt, setup); everything else is controlled.
3. Implementer (one per arm, isolated worktrees when arms touch code): execute the
   packet on each arm. Arms run in parallel where isolation allows.
4. Verifier (did not run any arm): apply the same acceptance checks and verification
   commands to every arm's output. Record raw results per arm in
   `{{EXPERIMENTS_DIR}}/YYYY-MM-DD-<slug>/arms/<arm>/results.md`.
5. Orchestrator: build the comparison table (arm × criteria) in
   `{{EXPERIMENTS_DIR}}/YYYY-MM-DD-<slug>/comparison.md` and judge the hypothesis:
   supported / rejected / inconclusive — with the evidence that decides it.
6. Orchestrator: write the lab notebook entry ({{LAB_NOTEBOOK_FILE}}) from the
   entry template — public-shareable: no secrets, no proprietary code beyond what the
   experiment needs to show, absolute dates, honest surprises.
7. Orchestrator: if the result changes a routing default, bump the routing matrix
   version with the experiment linked as evidence. If it suggests a skill/instruction
   change, stage a proposal via the autoskill path (Tier C — never auto-applied).
8. Orchestrator: clean up arm worktrees; the experiment directory is the durable record.

## Output contract

- `{{EXPERIMENTS_DIR}}/YYYY-MM-DD-<slug>/` — brief, per-arm results, comparison table.
- A lab notebook entry in {{LAB_NOTEBOOK_FILE}} following the entry template.
- When routing changed: a version-bumped routing matrix entry citing the experiment.
- Experiment code/prototypes are NOT promoted to production paths from this workflow;
  a winning approach goes through spec/implement-tdd like any other change.

## Verification

- Every arm was judged by the same checks — a differing check invalidates the comparison.
- The verifier was not an arm's implementer.
- Budget cap respected; overruns recorded, not hidden.
- Notebook entry contains: hypothesis, setup versions (models + dates), method,
  results, analysis, and the next hypothesis.

## Ceremony scaling

- **Simple** (2 arms, no spend risk, throwaway task): brief + comparison can live in
  one file; notebook entry still required — undocumented experiments are wasted.
- **Medium** (3+ arms or code that could be promoted): full directory structure,
  isolated worktrees, independent verifier.
- **High** (real spend, production data, or results that will rebind routing defaults):
  user approves the brief before arms run; full structure; routing changes cite the
  experiment.

## Failure handling

- An arm failing to complete IS a result — record it with the failure mode; do not
  retry-to-green unless the failure was environmental (and say so).
- Inconclusive is a valid outcome; record what would disambiguate and stop.
- A rejected hypothesis is a success of the method — the notebook entry gets written
  with the same care as a win.
- If arms drift mid-run (a model change, a prompt "fix" applied to one arm only),
  stop and restart the affected arms; note the drift in the brief.
