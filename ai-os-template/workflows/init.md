# Init Workflow

## **Trigger**

This workflow starts when the user requests `{{INIT_COMMAND}}`, a repo is first instantiated with the AI Engineering OS template, a new worktree needs boot guidance, or the orchestrator detects missing baseline AI OS scaffolding before feature work.

## **Inputs**

- Target repository path `{{REPO_ROOT}}` and instance manifest path `{{INSTANCE_MANIFEST}}`.
- Existing root instructions, package manifests, CI config, docs, scripts, and env guidance.
- Template doc paths for `{{SPEC_FILE}}`, `{{PROJECT_STATUS_FILE}}`, `{{CHANGELOG_FILE}}`, `{{DOCS_DIR}}/`, `{{TASK_DOCS_DIR}}/`, and `{{TOOL_CACHE_FILE}}`.
- Repo-specific safe env process `{{ENV_ACCESS_PROCESS}}`, baseline verification command `{{BASELINE_VERIFICATION_COMMAND}}`, dev boot command `{{DEV_COMMAND}}`, smoke command `{{SMOKE_COMMAND}}`, and log path `{{TRANSIENT_LOG_DIR}}`.
- Instance decision for optional `{{FEATURE_LIST_FILE}}`; default is disabled unless explicitly opted in.

## **Steps**

1. Orchestrator: confirm repo path, branch/worktree context, and whether this is first-time instantiation or worktree boot.
2. `initializer` through the Codex implementation route: read existing root docs, package manifests, CI config, scripts, env docs, and current docs before writing.
3. `initializer`: create or merge the doc skeleton bound by `{{INSTANCE_MANIFEST}}`; never overwrite existing repo docs silently.
4. `initializer`: create initial `{{PROJECT_STATUS_FILE}}` if missing, or update it idempotently if the instance manifest maps to an existing status file.
5. `initializer`: create `init.sh` or the repo-mapped bootstrap script with safe env access via `{{ENV_ACCESS_PROCESS}}`, dependency/bootstrap steps, dev boot, log capture, and baseline verification.
6. `initializer`: create `{{FEATURE_LIST_FILE}}` only if the instance manifest explicitly opts in; otherwise record that the optional module is disabled.
7. `initializer`: create or refresh `{{TOOL_CACHE_FILE}}` with tool, command, hook, MCP, connector, and skill inventory plus refresh timestamp.
8. `initializer`: write baseline verification command and worktree boot guidance into the mapped docs or `{{PROJECT_STATUS_FILE}}`.
9. `initializer`: verify app boot with `{{DEV_COMMAND}}` or `./init.sh`, confirm env access works safely without printing secrets, confirm logs are captured under `{{TRANSIENT_LOG_DIR}}`, and run `{{SMOKE_COMMAND}}` or `{{BASELINE_VERIFICATION_COMMAND}}`.
10. `verifier`: independently repeat baseline verification for Medium and High initialization, including boot, env-safe check, log capture, and smoke.
11. Orchestrator: write initializer and verifier results to `{{TASK_DOCS_DIR}}/init/verification.md`, including commands run, results, env-safety confirmation, log path, smoke result, skipped checks, and failures.
12. Orchestrator: review initializer and verifier packets, resolve conflicts, then update `{{PROJECT_STATUS_FILE}}` with final initialized state and next recommended action.

## **Output contract**

- Doc skeleton exists at the instance-mapped paths for `{{SPEC_FILE}}`, `{{PROJECT_STATUS_FILE}}`, `{{CHANGELOG_FILE}}`, `{{DOCS_DIR}}/`, `{{TASK_DOCS_DIR}}/`, and `{{TOOL_CACHE_FILE}}`.
- `init.sh` or mapped bootstrap script exists with safe env access, boot, log capture, and verification commands.
- `{{FEATURE_LIST_FILE}}` exists only when the instance opted in; otherwise the disabled decision is recorded.
- `{{TOOL_CACHE_FILE}}` contains available tools, commands, hooks, MCP/connectors, skills, refresh timestamp, and refresh command.
- `{{PROJECT_STATUS_FILE}}` records initialization state, baseline verification command, worktree boot guidance, known gaps, and next recommended action.
- `{{TASK_DOCS_DIR}}/init/verification.md`: commands run, results, env-safety confirmation, log path, smoke result, skipped checks, and failures.

## **Verification**

- App boots with `{{DEV_COMMAND}}` or `./init.sh`.
- Env access works through `{{ENV_ACCESS_PROCESS}}` without exposing secret values.
- Logs are captured under `{{TRANSIENT_LOG_DIR}}`.
- `{{SMOKE_COMMAND}}` or `{{BASELINE_VERIFICATION_COMMAND}}` passes, or failure is precisely documented.
- Existing files were not overwritten silently; conflicts are listed in the initializer return packet.
- Medium and High tiers have independent verifier confirmation.

## **Ceremony scaling**

- Simple: worktree boot only, reuse existing docs, refresh status/tool cache if needed, run baseline verification.
- Medium: first-time repo initialization with doc skeleton, `init.sh`, tool cache, status, smoke verification, independent verifier.
- High: complex repo or production-bound initialization with manifest conflict review, env-safety review, worktree guidance, independent verifier, rollback notes for any generated scaffolding.

## **Failure handling**

- If existing docs conflict with template roles, initializer records the conflict in `{{TASK_DOCS_DIR}}/init/conflicts.md` and does not overwrite.
- If boot fails, initializer records exact command, output summary, suspected cause, and next action in `{{TASK_DOCS_DIR}}/init/verification.md`.
- If env access would expose secrets, stop the env check and record the unsafe path; do not print or persist secret values.
- If log capture fails, record the missing log path and required command change before proceeding to feature work.
- If optional `{{FEATURE_LIST_FILE}}` was not explicitly opted in, do not create it.
