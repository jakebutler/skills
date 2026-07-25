import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  buildDoctorReport,
  evaluateHook,
  makeTemporaryDirectory,
  readJson,
  renderToolCache,
  resolveToolCachePath,
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

const boundedHighRisk = resolveRoute(registry, {
  task: "bug-fix",
  risk: "high",
});
assert.equal(boundedHighRisk.status, "selected");
assert.equal(boundedHighRisk.route.id, "codex-sol-high");
assert.equal(boundedHighRisk.promotedForRisk, true);

const blockedHighRiskDowngrade = resolveRoute(registry, {
  task: "bug-fix",
  risk: "high",
  excludedRouteIds: ["codex-sol-high"],
  allowFallback: true,
});
assert.equal(blockedHighRiskDowngrade.status, "blocked");
assert.match(blockedHighRiskDowngrade.reason, /high-risk work requires/);

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
  {
    hook_event_name: "PreToolUse",
    tool_name: "Bash",
    tool_input: { command: "git reset --hard HEAD~1" },
  },
  config,
  root,
);
assert.equal(destructive.hookSpecificOutput.permissionDecision, "deny");

const quotedForcePush = evaluateHook(
  "safety",
  {
    hook_event_name: "PreToolUse",
    tool_name: "Bash",
    tool_input: {
      command: "echo ready && sh -c 'git push origin main --force-with-lease'",
    },
  },
  config,
  root,
);
assert.equal(quotedForcePush.hookSpecificOutput.permissionDecision, "deny");

const globalOptionForcePush = evaluateHook(
  "safety",
  {
    hook_event_name: "PreToolUse",
    tool_name: "Bash",
    tool_input: { command: "git -C repo push origin topic -f" },
  },
  config,
  root,
);
assert.equal(
  globalOptionForcePush.hookSpecificOutput.permissionDecision,
  "deny",
);

const secret = evaluateHook(
  "safety",
  {
    hook_event_name: "PreToolUse",
    tool_name: "Write",
    tool_input: {
      file_path: "notes.txt",
      content: "OPENAI_API_KEY=sk-123456789012345678901234",
    },
  },
  config,
  root,
);
assert.equal(secret.hookSpecificOutput.permissionDecision, "deny");

const cursorSecret = evaluateHook(
  "safety",
  {
    hook_event_name: "PreToolUse",
    tool_name: "Write",
    tool_input: {
      file_path: "notes.txt",
      content: "CURSOR_API_KEY=cursor-secret-value",
    },
  },
  config,
  root,
);
assert.equal(cursorSecret.hookSpecificOutput.permissionDecision, "deny");

const clientSecretReference = evaluateHook(
  "safety",
  {
    hook_event_name: "PreToolUse",
    tool_name: "Write",
    tool_input: {
      file_path: "src/components/model-picker.client.tsx",
      content: "const key = process.env.OPENAI_API_KEY;\n",
    },
  },
  config,
  root,
);
assert.equal(
  clientSecretReference.hookSpecificOutput.permissionDecision,
  "deny",
);

for (const clientPath of [
  "src/pages/dashboard.tsx",
  "web/model-picker.ts",
  "src/components/server/model-picker.tsx",
  "src/components/pages/api/model-picker.tsx",
  "src/pages/api/../../components/model-picker.tsx",
]) {
  const exposedReference = evaluateHook(
    "safety",
    {
      hook_event_name: "PreToolUse",
      tool_name: "Write",
      tool_input: {
        file_path: clientPath,
        content: "const key = process.env.OPENAI_API_KEY;\n",
      },
    },
    config,
    root,
  );
  assert.equal(exposedReference.hookSpecificOutput.permissionDecision, "deny");
}

for (const serverPath of [
  path.join(root, "src/pages/api/generate.ts"),
  "src/server/model-provider.ts",
  "src/lib/model-provider.server.ts",
]) {
  const serverReference = evaluateHook(
    "safety",
    {
      hook_event_name: "PreToolUse",
      tool_name: "Write",
      tool_input: {
        file_path: serverPath,
        content: "const key = process.env.OPENAI_API_KEY;\n",
      },
    },
    config,
    root,
  );
  assert.deepEqual(serverReference, {});
}

const skillHint = evaluateHook(
  "skill-activation",
  {
    hook_event_name: "UserPromptSubmit",
    prompt: "Review this pull request for security issues.",
  },
  config,
  root,
);
assert.match(
  skillHint.hookSpecificOutput.additionalContext,
  /independent-code-review/,
);

const temp = makeTemporaryDirectory();
fs.writeFileSync(path.join(temp, "required.txt"), "fixture\n");
fs.writeFileSync(
  path.join(temp, "routes.json"),
  JSON.stringify({
    ...registry,
    routes: registry.routes,
    tasks: registry.tasks,
  }),
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
    {
      id: "missing",
      command: "definitely-not-a-real-command",
      required: false,
      versionArgs: ["--version"],
    },
  ],
};
const report = buildDoctorReport(doctorConfig, temp);
assert.equal(report.ok, true);
assert.match(renderToolCache(report), /AI OS Tool Cache/);
assert.match(renderToolCache(report), /\| `missing` \| no \| missing \|/);
assert.throws(
  () => resolveToolCachePath({ ...doctorConfig, toolCache: undefined }, temp),
  /toolCache must be a non-empty relative path/,
);

fs.writeFileSync(
  path.join(temp, "package.json"),
  JSON.stringify({ devDependencies: { "missing-required-package": "1.0.0" } }),
);
const declaredRequiredReport = buildDoctorReport(
  {
    ...doctorConfig,
    tools: [
      {
        id: "declared-required",
        command: "still-not-a-real-command",
        package: "missing-required-package",
        required: true,
        requiredInCi: true,
      },
    ],
  },
  temp,
);
assert.equal(declaredRequiredReport.ok, false);
assert.match(
  declaredRequiredReport.failures.join("\n"),
  /missing required tool: declared-required/,
);

const malformedRegistry = structuredClone(registry);
delete malformedRegistry.routes[0].capabilities;
assert.match(
  validateRegistry(malformedRegistry, evidence).join("\n"),
  /capabilities must be an array/,
);

console.log("PASS ai-os-runtime");
