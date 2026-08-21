import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const readJson = (relativePath) => JSON.parse(read(relativePath));

const policy = readJson("docs-templates/hitl-authority-policy.template.json");
assert.equal(policy.schema_version, 1);
assert.equal(policy.policy_id, "solo-operator-hitl-v1");
assert.equal(policy.adoption, "explicit-opt-in");
assert.equal(policy.authority.authenticated_human_required, true);
assert.equal(policy.authority.single_principal_may_hold_multiple_human_roles, true);
assert.equal(policy.authority.second_human_required, false);
assert.equal(policy.authority.simulated_identity_forbidden, true);
assert.equal(policy.candidate_binding.immutable_candidate_hash_required, true);
assert.equal(policy.candidate_binding.current_packet_only, true);
assert.equal(policy.candidate_binding.superseded_packet_approval_forbidden, true);
assert.equal(policy.review_evidence.independent_fresh_context_required_for_high_risk, true);
assert.equal(policy.review_evidence.machine_review_is_human_authority, false);
assert.equal(policy.review_evidence.failed_evaluation_blocks, true);
assert.equal(policy.review_evidence.unresolved_blocking_findings_block, true);
assert.equal(policy.lifecycle.authorization_separate_from_activation, true);
assert.equal(policy.lifecycle.environment_authority_is_not_transitive, true);
assert.equal(policy.lifecycle.dry_run_default_for_provisioning, true);
assert.equal(policy.lifecycle.expected_manifest_hash_required_for_apply, true);
assert.equal(policy.lifecycle.postflight_readback_required, true);
assert.equal(policy.lifecycle.withdrawal_or_rollback_required, true);
assert.equal(policy.history.legacy_records_reinterpreted, false);
assert.equal(policy.history.migration_requires_successor_policy, true);

for (const [name, value] of Object.entries(policy.instance_bindings)) {
  assert.match(value, /^\{\{[A-Z0-9_]+\}\}$/, `instance binding ${name} must remain explicit`);
}

const schema = readJson("schemas/hitl-authority-policy.schema.json");
assert.deepEqual(Object.keys(policy).sort(), [...schema.required].sort());
assert.equal(schema.properties.policy_id.const, policy.policy_id);
assert.equal(schema.properties.adoption.const, policy.adoption);
assert.equal(schema.properties.authority.properties.second_human_required.const, false);
assert.equal(schema.properties.review_evidence.properties.machine_review_is_human_authority.const, false);
assert.equal(schema.properties.history.properties.legacy_records_reinterpreted.const, false);

const canonical = read("root/AGENTS.template.md");
for (const required of [
  "one authenticated human owner may",
  "machine review as evidence only",
  "authorization separate from activation",
  "preserve legacy records under their original policy",
  "generic template does not\\s+grant authority by itself",
  "git rev-parse --is-inside-work-tree",
  "package-manager and runtime identity from the repository's committed source of\\s+truth",
]) {
  assert.match(canonical, new RegExp(required, "i"), `missing canonical policy: ${required}`);
}

const governance = read("HITL-AUTHORITY.md");
for (const required of [
  "human cardinality only",
  "Real human authority",
  "Exact candidate and evidence",
  "Lifecycle separation",
  "Historical integrity",
  "dry-run",
  "postflight",
]) {
  assert.match(governance, new RegExp(required, "i"), `missing governance boundary: ${required}`);
}

const manifestSchema = read("instances/MANIFEST-SCHEMA.md");
assert.match(manifestSchema, /exact source commit and\s+tree/);
assert.match(manifestSchema, /moving `main` URL[^\n]*not the installed identity/);
assert.match(manifestSchema, /solo-operator-hitl-v1/);

console.log("solo-operator HITL policy fixtures passed");
