# AI Engineering OS — Template

A reusable operating system for AI-assisted software work: root instruction templates,
a repo-resident documentation/memory system, workflow specs, hooks, slash commands,
subagent role definitions, and a quota-aware model routing rubric. Designed Codex-first
with Fable, Claude, GLM, and Composer as bounded specialist lanes.

Start with [WALKTHROUGH.html](WALKTHROUGH.html) for a guided review, then use
[DESIGN-MEMO.md](DESIGN-MEMO.md) for the architecture, contracts, and decisions
record. The directory layout and instantiation procedure are in memo §9–10.

**Status:** routing v0.7. Codex Sol High is the primary orchestrator; Fable is reserved
for advanced architecture and system-design feedback. Composer is the validated
bounded frontend implementation default, Terra is the first fallback, and the
installed GLM route remains experimental after its first timed validation failed.
FreshProof and Lower dB are first, followed by corvo-labs-dot-com.

## Cloud subscription bootstrap

The candidate bootstrap accepts a refresh-capable Codex credential bundle as encrypted
`CODEX_AUTH_JSON_GZIP_B64` and the token produced locally by `claude setup-token` as
encrypted `CLAUDE_CODE_OAUTH_TOKEN`. It rejects API-key fallback, suppresses credential
output, uses restrictive runtime files, and verifies both subscription logins.

Do not activate the bootstrap in Cloud yet. Activation requires working encrypted-secret
provisioning, proof that checkpoint artifacts exclude credential paths, an active
negative egress probe, and a tested credential-revocation runbook. Until those gates
pass, run Codex-only in Cloud and send Claude/Fable review packets out of band.

Cloud platforms may remove secrets before the agent phase. The bootstrap therefore
materializes the minimum runtime credential state needed by the nested CLIs. The task
agent can access that state, so keep agent internet access allowlisted to the required
subscription endpoints and never run untrusted repository setup code after credentials
are installed.
