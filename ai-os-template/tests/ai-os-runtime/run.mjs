import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  buildDoctorReport,
  evaluateHook,
  makeTemporaryDirectory,
  readJson,
  renderToolCache,
  resolveRoute,
  validateRegistry,
} from "../../scripts/ai-os-core.mjs";

const root = path.resolve(import.meta.dirname, "../..");
const registry = readJson(path.join(root, "routing/task-routes.json"));
const evidence = readJson(path.join(root, "routing/model-evidence.json"));
assert.deepEqual(validateRegistry(registry, evidence), []);

const orchestrator = resolveRoute(registry, { task: "plan", risk: "medium" });
assert.equal(orchestrator.status, "selected");
assert.equal(orchestrator.route.id, "codex-sol-high");

const boundedHighRisk = resolveRoute(registry, { task: "bug-fix", risk: "high" });
assert.equal(boundedHighRisk.status, "selected");
assert.equal(boundedHighRisk.route.id, "codex-sol-high");
assert.equal(boundedHighRisk.promotedForRisk, true);

const blockedFallback = resolveRoute(registry, {
  task: "frontend",
  risk: "medium",
  excludedRouteIds: ["cursor-composer25"],
});
assert.equal(blockedFallback.status, "approval-required");
assert.equal(blockedFallback.suggestedFallback.id, "codex-luna-max");

const allowedFallback = resolveRoute(registry, {
  task: "frontend",
  risk: "medium",
  excludedRouteIds: ["cursor-composer25"],
  allowFallback: true,
});
assert.equal(allowedFallback.status, "selected");
assert.equal(allowedFallback.fallbackFrom, "cursor-composer25");

const config = readJson(path.join(root, "runtime/ai-os.config.json"));
const destructive = evaluateHook(
  "safety",
  { hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: { command: "git reset --hard HEAD~1" } },
  config,
  root,
);
assert.equal(destructive.hookSpecificOutput.permissionDecision, "deny");

const secret = evaluateHook(
  "safety",
  {
    hook_event_name: "PreToolUse",
    tool_name: "Write",
    tool_input: { file_path: "notes.txt", content: "OPENAI_API_KEY=sk-123456789012345678901234" },
  },
  config,
  root,
);
assert.equal(secret.hookSpecificOutput.permissionDecision, "deny");

const skillHint = evaluateHook(
  "skill-activation",
  { hook_event_name: "UserPromptSubmit", prompt: "Review this pull request for security issues." },
  config,
  root,
);
assert.match(skillHint.hookSpecificOutput.additionalContext, /independent-code-review/);

const temp = makeTemporaryDirectory();
fs.writeFileSync(path.join(temp, "required.txt"), "fixture\n");
fs.writeFileSync(
  path.join(temp, "routes.json"),
  JSON.stringify({ ...registry, routes: registry.routes, tasks: registry.tasks }),
);
const doctorConfig = {
  version: "0.8.0",
  project: "fixture",
  minimumNodeMajor: 22,
  requiredPaths: ["required.txt"],
  routeRegistry: "routes.json",
  toolCache: "tools.md",
  stacks: ["convex"],
  tools: [
    { id: "node", command: "node", required: true, versionArgs: ["--version"] },
    { id: "missing", command: "definitely-not-a-real-command", required: false, versionArgs: ["--version"] },
  ],
};
const report = buildDoctorReport(doctorConfig, temp);
assert.equal(report.ok, true);
assert.match(renderToolCache(report), /AI OS Tool Cache/);
assert.match(renderToolCache(report), /\| `missing` \| no \| missing \|/);

console.log("PASS ai-os-runtime");
