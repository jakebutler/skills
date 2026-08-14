import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

const canonical = read("root/AGENTS.template.md");
for (const required of [
  "breadth-first inspection",
  "one implementation batch",
  "collect the complete available failure set",
  "A third broad run requires a concrete affected-boundary reason",
  "Reuse evidence from the exact unchanged diff",
]) {
  assert.match(canonical, new RegExp(required), `missing policy: ${required}`);
}

const activeGuidance = [
  "root/AGENTS.template.md",
  "root/CLAUDE.template.md",
  "routing/complexity-rubric.md",
  "routing/review-convergence.md",
  "workflows/spec.md",
  "workflows/implement-tdd.md",
  "workflows/debug.md",
  "workflows/commit.md",
  "workflows/commit-pr.md",
  "workflows/review-pr.md",
  "commands/implement-tdd.md",
  "commands/commit.md",
  "commands/commit-pr.md",
  "commands/review-pr.md",
  "skills/codex-implementation/SKILL.template.md",
  "skills/codex-review/SKILL.template.md",
  "hooks/verify-on-change.md",
  "hooks/delegating-review.md",
  "agents/implementer.md",
  "agents/auditor.md",
  "agents/reviewer.md",
]
  .map(read)
  .join("\n");

for (const forbidden of [
  /Delegate by default/i,
  /independent review for non-trivial changes/i,
  /commit workflow plus branch, PR, and review loop/i,
  /The implementer is never the sole reviewer/i,
  /ask the user three to five pointed questions/i,
  /Medium[^\n]*multi-file[^\n]*user-facing/i,
  /Routine implementation and PR review always instantiates/i,
]) {
  assert.doesNotMatch(activeGuidance, forbidden);
}

const registry = JSON.parse(read("routing/task-routes.json"));
const tasks = new Map(registry.tasks.map((task) => [task.id, task]));
assert.equal(tasks.get("bounded-implementation").requiresIndependentReview, false);
assert.equal(tasks.get("frontend-implementation").requiresIndependentReview, false);
assert.deepEqual(
  tasks.get("independent-code-review").requiredCompanionRouteIds ?? [],
  [],
);
assert.deepEqual(tasks.get("proof-required-code-review").requiredCompanionRouteIds, [
  "claude-opus5-high",
]);

const runtimeConfig = JSON.parse(read("runtime/ai-os.config.json"));
const claudeSettings = JSON.parse(read("runtime/claude-settings.template.json"));
assert.equal(runtimeConfig.hooks.delegatingReview, false);
assert.equal(claudeSettings.hooks.PostToolUse, undefined);
const stopCommands = claudeSettings.hooks.Stop.flatMap((group) => group.hooks).map(
  (hook) => hook.command,
);
assert.ok(stopCommands.some((command) => command.includes("verify-on-change")));
assert.ok(!stopCommands.some((command) => command.includes("delegating-review")));

console.log("throughput policy fixtures passed");
