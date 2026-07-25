#!/usr/bin/env node
import path from "node:path";
import {
  parseCliArgs,
  readJson,
  resolveRoute,
  validateRegistry,
} from "./ai-os-core.mjs";

const args = parseCliArgs(process.argv.slice(2));
const registryPath = path.resolve(
  process.cwd(),
  args.registry ?? "routing/task-routes.json",
);
const evidencePath = path.resolve(
  process.cwd(),
  args.evidence ?? "routing/model-evidence.json",
);
const registry = readJson(registryPath);
const evidence = readJson(evidencePath);
const errors = validateRegistry(registry, evidence);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
if (!args.task) {
  console.error(
    "Usage: node scripts/resolve-model-route.mjs --task <task> [--risk simple|medium|high] [--capability <capability>] [--exclude <route-id,...>] [--unavailable-providers <provider,...>] [--allow-fallback]",
  );
  process.exit(2);
}
const result = resolveRoute(registry, {
  task: args.task,
  risk: args.risk,
  capability: args.capability,
  allowFallback: Boolean(args["allow-fallback"]),
  excludedRouteIds: String(args.exclude ?? "")
    .split(",")
    .filter(Boolean),
  unavailableProviders: String(args["unavailable-providers"] ?? "")
    .split(",")
    .filter(Boolean),
});
console.log(JSON.stringify(result, null, 2));
if (!["selected", "approval-required"].includes(result.status))
  process.exitCode = 1;
