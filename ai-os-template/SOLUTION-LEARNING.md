# Grounded solution-learning contract

This is the executable v1.1 contract for issue
[#4](https://github.com/jakebutler/skills/issues/4). It upgrades the existing
Tier B solution-document route without widening its write authority.

## Public interface

Create one JSON candidate conforming to
`schemas/solution-learning.schema.json`, then run:

```bash
node scripts/process-solution-learning.mjs \
  <candidate.json> <repository-root> <solutions-directory> [--headless]
```

The command returns exactly one disposition:

- `created`: a new stable semantic-slug document was written;
- `updated`: a high-overlap document at the same stable identity was updated
  in place and received `last_updated`;
- `reused`: the deterministic fingerprint already exists, so no write occurred;
- `stale`: older evidence attempted to replace a newer stored learning;
- `skipped`: the episode was explicitly judged trivial, unverified,
  task-specific, or already recorded;
- `rejected`: schema, grounding, path, placeholder, or trust checks failed.

The fingerprint binds the frozen source candidate and normalized
problem/root-cause/solution identity. Invocation route is recorded as provenance
but is not part of identity, so commit and wrap-session cannot duplicate one
episode.

## Tracks

Bug learnings require observable symptoms, investigation/dead ends, root cause,
verified solution, why it works, prevention, and verification.

Knowledge learnings require context, reusable guidance, why it matters,
applicability boundaries, and examples/counterexamples.

Both tracks require stable identity, creation/update dates, category, module,
tags, source identity, capture reason, provenance, grounding, and related
documents/issues.

## Overlap and correction precedence

- Same fingerprint: reuse the existing disposition without rewriting.
- Same semantic slug with newer evidence: update the stable path in place.
- Same module with a distinct identity: keep the new document and return a
  narrow `moderate-overlap` refresh recommendation naming only related paths.
- Distinct identity/module: create normally.
- A candidate observed before a stored document's effective date cannot replace
  it. Current-tree evidence and newer explicit corrections outrank historical
  session material.

The processor never launches a broad corpus-maintenance sweep.

## Grounding

Mechanical validation rejects unsafe/malformed frontmatter, unresolved
placeholders, non-relative or missing paths, broken internal links, malformed
GitHub issue references, missing source quotes, non-independent validators, and
contradicted claims.

The independent semantic validator must:

1. quote the defining current source for code/documentation claims;
2. check merge state through live GitHub first;
3. record `github-live` for a verified merge-state claim;
4. mark an offline or git-reachability fallback `degraded`, never verified;
5. retain a deleted historical path only with an explicit historical commit and
   degraded status;
6. correct, soften, or drop claims that current evidence does not support.

A contradicted claim blocks trusted solution knowledge.

## Write authority and headless behavior

Research workers may write candidate/research material only to run-scoped
scratch space. The orchestrator is the only tracked-file writer.

The processor writes only under the supplied solution directory. It cannot edit
skills, `AGENTS.md`, `CLAUDE.md`, hooks, or routes. In headless mode a
`discoverability_gap` is returned as `report-only`; it never authorizes an
instruction edit.

Solution documents are retrieved selectively by category/module/tags. They are
never bulk-loaded into every prompt.

## Migration from date-prefixed paths

Existing `YYYY-MM-DD-<slug>.md` files remain readable and must not be silently
renamed or orphaned. Migrate them in a reviewed PR:

1. validate and ground the existing content;
2. preserve its original `date`;
3. choose the semantic slug as the stable path;
4. update internal references in the same change;
5. record the old path in the PR migration inventory;
6. reject collisions for human consolidation.

Until migrated, retrieval searches both legacy date-prefixed and stable paths.
The next normal capture must not opportunistically rename a legacy document.
