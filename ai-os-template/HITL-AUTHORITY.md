# Solo-operator HITL authority

`solo-operator-hitl-v1` is an optional AI Engineering OS policy for a project with one
accountable human operator. It lets one authenticated human occupy multiple internal
human roles without pretending that a second account or duplicate approval creates
independence.

The policy changes human cardinality only. It does not reduce the evidence,
authentication, audit, rollback, consent, or environment controls required by the
underlying operation.

## Why this policy exists

Many release and governance systems accidentally couple two separate questions:

1. Who has final human authority?
2. What independent evidence must exist before that person decides?

For a solo-operated project, a fixed two-human quorum can make the correct path
unusable. Creating aliases, duplicate roles, or two approval records from the same
person adds ceremony without adding an independent decision maker. Removing all
review and authorization controls would be unsafe. This profile separates the two:
one real authenticated owner decides, while risk-calibrated independent review remains
non-authoritative evidence bound to the exact candidate.

## Normative contract

An instance may claim `solo-operator-hitl-v1` only when all of the following are true.

### Explicit, versioned adoption

- The instance manifest names this exact policy and its scope.
- The policy is not inferred from team size, environment, email address, or the number
  of approval rows present.
- A stricter or different future rule uses a successor policy version. Staffing
  changes alone do not silently change authority.

### Real human authority

- One human owner is authenticated by the instance's trusted identity provider at the
  decision boundary.
- That owner may also be the builder, operator, evaluator, internal reviewer, or
  approver. No second human, account, email alias, or duplicate record is required.
- Caller-asserted, model-generated, fixture, impersonated, or simulated identity is
  not human authority.
- Machine review is evidence only. A model cannot approve, activate, deploy, spend,
  publish, withdraw, or otherwise exercise the owner's authority.

### Exact candidate and evidence

- The human decision binds the exact current immutable candidate, policy version,
  environment/scope, and required evidence hashes.
- High-risk work retains at least one independent fresh-context review of that exact
  candidate. Additional lenses are triggered by concrete risk rather than by a fixed
  reviewer count.
- Failed evaluation, missing evidence, unresolved blocking findings, future-dated or
  malformed receipts, stale packets, and packets superseded by a newer current packet
  fail closed.
- A second approval cannot repair a bad or incomplete packet.

### Lifecycle separation

- Provisioning human authority is separate from creating or selecting a candidate.
- Human authorization is separate from activation, deployment, spending, publication,
  customer consent, and cross-organization approval.
- Staging or development authority does not imply production authority. Each
  environment binds its own principal, candidate, and decision.
- Provisioning or activation tooling is dry-run by default, applies only an exact
  reviewed manifest hash, and performs an authoritative postflight readback.
- Withdrawal, revocation, or rollback remains available to the authenticated owner.
  Re-enablement or reselection requires a fresh decision over the then-current packet.

### Historical integrity

- Existing records keep the semantics of the policy under which they were issued.
- Adoption does not rewrite approvals, lifecycle events, selections, review receipts,
  or audit history.
- Legacy records that required multiple distinct humans remain governed by that rule
  unless an explicit migration creates new successor records. Read-time
  reinterpretation is forbidden.

## Portable artifacts

- `docs-templates/hitl-authority-policy.template.json` is the instance tailoring
  packet.
- `schemas/hitl-authority-policy.schema.json` defines its portable shape and fixed
  invariants.
- The optional section in `root/AGENTS.template.md` gives agents the operational
  behavior after an instance has adopted the policy.

These artifacts do not authenticate a person or grant live authority. An instance
must bind its identity provider, approval record store, candidate-hash source,
activation action, postflight readback, and withdrawal/rollback path. The bound
runtime must enforce the policy at issuance, lifecycle verification, historical
verification, selection, and recovery boundaries—not only in UI copy or docs.

## Adoption sequence

1. Audit every existing human-separation check across runtime, schema, tests, docs,
   CI/release controls, manifests, and UI or provisioning paths.
2. Record the current legacy policy and immutable records before changing behavior.
3. Tailor and review the policy JSON, including real authentication and lifecycle
   bindings.
4. Add a version-dispatched runtime path; do not relax a global approval count.
5. Prove positive one-owner decisions and negative unauthenticated, stale,
   wrong-scope, replay, superseded-packet, failed-evidence, and legacy cases.
6. Separate authority provisioning from candidate creation/selection and from human
   approval. Use dry-run, exact expected-manifest hash, and postflight readback.
7. Roll out per environment. Never transfer a staging decision into production.

## Advantages

- Makes the honest supported path usable for solo-operated projects.
- Removes fake role separation and duplicate approvals without discarding independent
  evidence.
- Keeps one accountable human decision legible in audit history.
- Preserves exact-candidate, environment, rollback, and legacy guarantees.
- Lets a project add stricter governance later through an explicit successor rather
  than hidden cardinality changes.

## Tradeoffs and retained boundaries

One human remains a concentrated authority and availability risk. Use strong
authentication, short-lived sessions where available, immutable decision subjects,
append-only audit history, environment-specific authority, prompt withdrawal, and
external backups or recovery procedures. Customer consent, regulatory segregation of
duties, contractual approvals, and cross-organization decisions are outside this
internal policy and may still require distinct people.

FreshProof's `solo-builder-hitl-v1` Behavior Release policy supplied the first
production example. This generic profile deliberately omits FreshProof-specific
identity providers, domain roles, databases, and release objects.
