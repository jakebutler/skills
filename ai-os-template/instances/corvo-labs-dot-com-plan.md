# corvo-labs-dot-com — Instantiation Plan

**Status:** queued (third instance, after FreshProof and Lower dB). 2026-07-08.

## Approach

Follow `MANIFEST-SCHEMA.md`'s checklist. Expected profile differences from the first
two instances:

- **Likely a marketing/brand site**, not a product app: the GTM interface (decision
  #9) matters more here than anywhere — expect the `docs/gtm/` handoff-packet
  convention to be load-bearing, and the fenced marketingskills subset (copywriting,
  landing-page conversion) plus Impeccable to be the dominant skill routes.
- **Frontend-heavy** means Composer should receive crisp bounded implementation
  packets after Impeccable/Sol design judgment, with Terra fallback. The global GLM
  runner is already wired but remains experimental after exceeding the first
  ten-minute validation cap; revalidate only on a deliberately smaller slice.
- **FEATURE-LIST module: skipped** (owner decision D7, 2026-07-12). The full `init`
  workflow (initializer agent, `init.sh`, smoke check) still applies if the repo is
  greenfield.

## Steps

1. Run `understand-anything` on the repo (hygiene rule from the braindump) if no
   codemap exists.
2. Codex recon packet: stack, verification commands, existing doc roles, conventions,
   collision risks — same packet shape as the first two.
3. Codex Sol High binding decisions; interview the user only on GTM-boundary questions
   (what belongs to the engineering OS vs the GTM swarm for this repo).
4. Instantiate via Codex packet in an isolated worktree on `codex/ai-os-instance`.
5. Sol diff review with cross-family frontend review; commit by named file.

## Learnings to carry forward from instances 1–2

- Lower dB: when a repo already has strong house rituals, the instance is a *binding*
  exercise, not an authoring one — the manifest does the work.
- FreshProof: when root instructions are near-empty, preserve any existing marker
  blocks byte-identical and expand around them.
- Codex sandbox may write to the artifact dir instead of the repo when instructions
  emphasize caution — tell it explicitly which tree owns the output, and check where
  files landed before assuming failure.
