# Packet contract

The runner accepts one UTF-8 JSON object with this shape:

```json
{
  "version": 1,
  "goal": "Add a compact provider-quota status control to the settings panel.",
  "read_files": [
    "DESIGN.md",
    "src/components/settings/provider-routing.tsx"
  ],
  "write_files": [
    "src/components/settings/provider-routing.tsx",
    "src/components/settings/provider-routing.test.tsx"
  ],
  "acceptance_criteria": [
    "The active, degraded, and unavailable states are visually distinct.",
    "Status changes are announced with aria-live=polite."
  ],
  "design_constraints": [
    "Reuse existing status tokens.",
    "Do not add dependencies or gradients."
  ],
  "avoid": [
    "Do not change routing policy or server behavior."
  ],
  "verification_commands": [
    "pnpm test -- provider-routing",
    "pnpm typecheck"
  ]
}
```

## Required fields

- `version`: integer `1`.
- `goal`: one non-empty implementation goal.
- `read_files`: exhaustive array of relative files the model may read. Every
  writable existing file must also be readable.
- `write_files`: exhaustive non-empty array of relative files the model may
  create or replace.
- `acceptance_criteria`: non-empty array of observable checks.
- `design_constraints`: array of target-specific interface rules.
- `avoid`: array of boundaries and areas not to change.
- `verification_commands`: non-empty array of focused commands. The runner
  records these but never executes them.

Unknown top-level fields are rejected so packet typos cannot silently weaken the
boundary.

## Path rules

- Use normalized POSIX-style paths relative to the target root.
- Do not use absolute paths, `..`, `.`, empty segments, `.git`, `.env` files, or
  paths that resolve through a symlink outside the target.
- A `write_files` path may name a new file, but its closest existing parent must
  remain inside the target root.
- The combined readable input is capped at 1 MiB. Split larger tasks.

## Output protocol

The model must return full replacement contents for every writable file:

```text
<<<AI_OS_FILE path="src/example.tsx">>>
complete file content
<<<AI_OS_END_FILE>>>
<<<AI_OS_END_RESPONSE>>>
```

The runner rejects missing files, duplicate files, extra files, malformed
markers, and content after the final response marker. If a model completion ends
before the final marker, the runner continues from the accumulated assistant
partial up to the configured continuation limit.
