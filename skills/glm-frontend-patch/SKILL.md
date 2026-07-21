---
name: glm-frontend-patch
description: Run an experimental bounded frontend implementation through the streamed Z.ai GLM coding endpoint. Use when Codex explicitly needs to validate GLM on an allowlisted set of UI files or attempt a cross-family frontend route with a deadline and Composer then Terra fallback. Do not use as the default frontend worker until the routing revalidation gate is satisfied.
---

# GLM Frontend Patch

Use the bundled runner for one bounded frontend slice. Treat its output as an
untrusted proposal until the runner validates framing and paths and the
orchestrator inspects the checkpoint.

## Prepare

1. Read `references/packet-contract.md`.
2. Create a JSON packet outside the target repository or in an ignored local
   artifact directory.
3. List every readable path in `read_files` and every writable path in
   `write_files`. Paths must be relative to the target root.
4. Keep secrets, `.env` files, generated credentials, and unrelated user work out
   of the packet.

The runner loads `ZAI_API_KEY` from the process environment, an explicit
`--env-file`, `$GLM_FRONTEND_ENV_FILE`, its own `.env`, or the existing local
research-skill `.env`, in that order. Never copy that credential into a target
repository.

## Generate a checkpoint

Run preview mode first:

```bash
python3 "$HOME/.codex/skills/glm-frontend-patch/scripts/glm_frontend_patch.py" \
  --packet /absolute/path/to/packet.json \
  --target /absolute/path/to/repo
```

The command streams GLM output and stores `response.txt`, validated proposed
files, and `run.json` beneath `~/.codex/state/glm-frontend-patch/runs/`. It does
not mutate the target in preview mode.

## Inspect and apply

Inspect the reported checkpoint and proposed files. Then apply that exact
checkpoint without another model call:

```bash
python3 "$HOME/.codex/skills/glm-frontend-patch/scripts/glm_frontend_patch.py" \
  --packet /absolute/path/to/packet.json \
  --target /absolute/path/to/repo \
  --response-file /absolute/path/to/checkpoint/response.txt \
  --apply
```

Use `--apply` on the initial generation only when the user already authorized the
bounded mutation and the target checkout is isolated. The runner never stages,
commits, pushes, deploys, or executes packet-provided verification commands.

## Verify and route

After apply:

1. Inspect `git status` and `git diff` independently.
2. Confirm every changed path appears in `write_files`.
3. Run the packet's focused verification commands yourself.
4. Review responsive behavior, accessibility, error states, and design-system
   fidelity.

If the runner exits with code `20`, mark the Z.ai family unavailable and reroute
the unchanged packet to Composer, then Terra. Do not retry quota,
authentication, billing, or model-access failures. A transient transport or 5xx
failure receives one checkpoint-aware retry inside the runner.

Report the route, checkpoint path, continuation and retry counts, files changed,
verification results, and any requested out-of-scope work.
