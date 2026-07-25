import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const RISK_LEVELS = new Set(["simple", "medium", "high"]);
const SECRET_PATTERNS = [
  /\bsk-[A-Za-z0-9_-]{20,}\b/,
  /\b(?:ANTHROPIC|CURSOR|OPENAI|PIONEER|TAVILY)_API_KEY\s*=\s*[^\s"'$<{][^\s"']{7,}/i,
  /\bSUPABASE_SERVICE_ROLE_KEY\s*=\s*[^\s"'$<{][^\s"']{7,}/i,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
];
const MODEL_KEY_REFERENCE_PATTERN =
  /\b(?:(?:process|import\.meta)\.env\.|env\.)(?:ANTHROPIC|CURSOR|OPENAI|PIONEER|TAVILY)_API_KEY\b/i;
const PUBLIC_MODEL_KEY_PATTERN =
  /\b(?:NEXT_PUBLIC_|PUBLIC_|VITE_)(?:ANTHROPIC|CURSOR|OPENAI|PIONEER|TAVILY)_API_KEY\b/i;
const CLIENT_FILE_PATTERN =
  /(?:^|\/)(?:client|components|pages|public|web)(?:\/|$)|(?:^|[./-])client\.[cm]?[jt]sx?$/i;
const SERVER_ONLY_FILE_PATTERN =
  /(?:^|\/)(?:src\/)?pages\/api(?:\/|$)|(?:^|[./-])server\.[cm]?[jt]sx?$/i;
const DESTRUCTIVE_COMMAND_PATTERNS = [
  /\bgit\s+reset\s+--hard\b/,
  /\bgit\s+clean\s+-[a-z]*f/i,
  /\bgit\s+(?:checkout|restore)\s+--\s+/,
  /\bgit\b[^;&|\n]*\bbranch\s+(?:-[dD]\b|--delete\b)/i,
  /\bgit\b[^;&|\n]*\bpush\b[^;&|\n]*(?:--force(?:-with-lease|-if-includes)?\b|(?:^|\s)-[a-z]*f[a-z]*\b)/i,
  /\bgit\b[^;&|\n]*\bpush\b[^;&|\n]*\s--delete\b/i,
  /\bgit\b[^;&|\n]*\btag\s+(?:-d\b|--delete\b)/i,
  /\bgit\b[^;&|\n]*\bupdate-ref\s+-d\b/i,
  /\brm\s+-[a-z]*r[a-z]*f\b/i,
];

export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function normalizeTask(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateStringArray(value, label, errors, { required = true } = {}) {
  if (value === undefined && !required) return [];
  if (!Array.isArray(value) || value.some((item) => !nonEmptyString(item))) {
    errors.push(`${label} must be an array of non-empty strings`);
    return [];
  }
  if (new Set(value).size !== value.length)
    errors.push(`${label} must contain unique values`);
  return value;
}

export function validateRegistry(registry, evidence) {
  const errors = [];
  if (!registry || typeof registry !== "object" || Array.isArray(registry)) {
    return ["registry must be an object"];
  }
  if (!/^0\.8(?:\.\d+)?$/.test(registry.version ?? "")) {
    errors.push("registry.version must be 0.8 or 0.8.x");
  }
  if (registry.policies?.noSilentSubstitution !== true) {
    errors.push("registry must enable noSilentSubstitution");
  }
  if (!nonEmptyString(registry.backboneRouteId)) {
    errors.push("backboneRouteId must be a non-empty string");
  }

  const routeIds = new Set();
  if (!Array.isArray(registry.routes) || registry.routes.length === 0) {
    errors.push("registry.routes must be a non-empty array");
  }
  for (const [index, route] of (Array.isArray(registry.routes)
    ? registry.routes
    : []
  ).entries()) {
    if (!route || typeof route !== "object" || Array.isArray(route)) {
      errors.push(`route ${index} must be an object`);
      continue;
    }
    if (!nonEmptyString(route.id) || routeIds.has(route.id)) {
      errors.push(`duplicate or missing route id: ${route.id ?? "<missing>"}`);
    }
    routeIds.add(route.id);
    for (const field of [
      "runtime",
      "providerFamily",
      "model",
      "effort",
      "availability",
    ]) {
      if (!nonEmptyString(route[field]))
        errors.push(
          `route ${route.id ?? index}.${field} must be a non-empty string`,
        );
    }
    validateStringArray(
      route.capabilities,
      `route ${route.id ?? index}.capabilities`,
      errors,
    );
    validateStringArray(
      route.evidenceIds,
      `route ${route.id ?? index}.evidenceIds`,
      errors,
      {
        required: false,
      },
    );
  }
  if (!routeIds.has(registry.backboneRouteId))
    errors.push("backboneRouteId must reference a route");

  const taskIds = new Set();
  if (!Array.isArray(registry.tasks) || registry.tasks.length === 0) {
    errors.push("registry.tasks must be a non-empty array");
  }
  for (const [index, task] of (Array.isArray(registry.tasks)
    ? registry.tasks
    : []
  ).entries()) {
    if (!task || typeof task !== "object" || Array.isArray(task)) {
      errors.push(`task ${index} must be an object`);
      continue;
    }
    if (!nonEmptyString(task.id) || taskIds.has(task.id)) {
      errors.push(`duplicate or missing task id: ${task.id ?? "<missing>"}`);
    }
    taskIds.add(task.id);
    validateStringArray(
      task.aliases,
      `task ${task.id ?? index}.aliases`,
      errors,
    );
    const fallbackRouteIds = validateStringArray(
      task.fallbackRouteIds,
      `task ${task.id ?? index}.fallbackRouteIds`,
      errors,
    );
    const companionRouteIds = validateStringArray(
      task.requiredCompanionRouteIds,
      `task ${task.id ?? index}.requiredCompanionRouteIds`,
      errors,
      { required: false },
    );
    if (!nonEmptyString(task.primaryRouteId)) {
      errors.push(
        `task ${task.id ?? index}.primaryRouteId must be a non-empty string`,
      );
    }
    if (!nonEmptyString(task.confidence)) {
      errors.push(
        `task ${task.id ?? index}.confidence must be a non-empty string`,
      );
    }
    if (!nonEmptyString(task.stopRule)) {
      errors.push(
        `task ${task.id ?? index}.stopRule must be a non-empty string`,
      );
    }
    for (const routeId of [
      task.primaryRouteId,
      ...fallbackRouteIds,
      ...companionRouteIds,
    ]) {
      if (nonEmptyString(routeId) && !routeIds.has(routeId)) {
        errors.push(`task ${task.id} references missing route ${routeId}`);
      }
    }
  }

  if (evidence) {
    if (
      !evidence ||
      typeof evidence !== "object" ||
      !Array.isArray(evidence.sources)
    ) {
      errors.push("evidence.sources must be an array");
      return errors;
    }
    const evidenceIds = new Set(
      evidence.sources
        .filter((source) => nonEmptyString(source?.id))
        .map((source) => source.id),
    );
    for (const route of Array.isArray(registry.routes) ? registry.routes : []) {
      for (const evidenceId of Array.isArray(route?.evidenceIds)
        ? route.evidenceIds
        : []) {
        if (!evidenceIds.has(evidenceId))
          errors.push(
            `route ${route.id} references missing evidence ${evidenceId}`,
          );
      }
    }
    if (
      evidence.policy?.communityWeightCap >
      registry.policies?.communityEvidenceWeightCap
    ) {
      errors.push("evidence community weight exceeds registry policy");
    }
  }
  return errors;
}

function findTask(registry, taskName) {
  const wanted = normalizeTask(taskName);
  return (registry.tasks ?? []).find(
    (task) =>
      task.id === wanted ||
      (task.aliases ?? []).some((alias) => normalizeTask(alias) === wanted),
  );
}

export function resolveRoute(registry, options) {
  const task = findTask(registry, options.task ?? "");
  if (!task) {
    return {
      status: "invalid-task",
      requestedTask: options.task,
      validTasks: (registry.tasks ?? []).map((item) => item.id),
    };
  }
  const risk = options.risk ?? "medium";
  if (!RISK_LEVELS.has(risk)) {
    return {
      status: "invalid-risk",
      requestedRisk: risk,
      validRisks: [...RISK_LEVELS],
    };
  }

  const routeMap = new Map(registry.routes.map((route) => [route.id, route]));
  const excludedRoutes = new Set(options.excludedRouteIds ?? []);
  const unavailableProviders = new Set(options.unavailableProviders ?? []);
  const capability = options.capability;
  const eligible = (routeId) => {
    const route = routeMap.get(routeId);
    return Boolean(
      route &&
      !excludedRoutes.has(route.id) &&
      !unavailableProviders.has(route.providerFamily) &&
      (!capability ||
        (Array.isArray(route.capabilities) &&
          route.capabilities.includes(capability))),
    );
  };

  let primaryRouteId = task.primaryRouteId;
  let promotedForRisk = false;
  if (
    risk === "high" &&
    ["codex-luna-max", "codex-terra-medium", "cursor-composer25"].includes(
      primaryRouteId,
    )
  ) {
    primaryRouteId = registry.backboneRouteId;
    promotedForRisk = true;
  }

  const companionRoutes = (task.requiredCompanionRouteIds ?? []).map(
    (routeId) => routeMap.get(routeId),
  );
  const missingCompanion = companionRoutes.find(
    (route) =>
      !route ||
      excludedRoutes.has(route.id) ||
      unavailableProviders.has(route.providerFamily),
  );
  if (missingCompanion) {
    return {
      status: "blocked",
      task: task.id,
      reason: `required companion route unavailable: ${missingCompanion?.id ?? "<missing>"}`,
      stopRule: task.stopRule,
    };
  }

  if (eligible(primaryRouteId)) {
    return {
      status: "selected",
      task: task.id,
      risk,
      route: routeMap.get(primaryRouteId),
      companionRoutes,
      promotedForRisk,
      confidence: task.confidence,
      requiresRepoEval: task.requiresRepoEval ?? false,
      requiresIndependentReview: task.requiresIndependentReview ?? false,
      stopRule: task.stopRule,
    };
  }

  if (promotedForRisk) {
    return {
      status: "blocked",
      task: task.id,
      reason:
        "high-risk work requires the promoted backbone route; lower-tier fallback is not permitted",
      stopRule: task.stopRule,
    };
  }

  const fallbackId = (task.fallbackRouteIds ?? []).find(eligible);
  if (!fallbackId) {
    return {
      status: "blocked",
      task: task.id,
      reason: "primary and eligible fallbacks are unavailable",
      stopRule: task.stopRule,
    };
  }
  if (!options.allowFallback) {
    return {
      status: "approval-required",
      task: task.id,
      unavailablePrimaryRouteId: primaryRouteId,
      suggestedFallback: routeMap.get(fallbackId),
      reason: "noSilentSubstitution is enabled",
      stopRule: task.stopRule,
    };
  }
  return {
    status: "selected",
    task: task.id,
    risk,
    route: routeMap.get(fallbackId),
    companionRoutes,
    promotedForRisk,
    fallbackFrom: primaryRouteId,
    confidence: task.confidence,
    requiresRepoEval: task.requiresRepoEval ?? false,
    requiresIndependentReview: task.requiresIndependentReview ?? false,
    stopRule: task.stopRule,
  };
}

function executablePath(command, cwd) {
  const local = path.join(cwd, "node_modules", ".bin", command);
  if (fs.existsSync(local)) return local;
  const result = spawnSync("which", [command], {
    cwd,
    encoding: "utf8",
    timeout: 3_000,
  });
  return result.status === 0 ? result.stdout.trim() : null;
}

function declaredPackage(cwd, packageName) {
  const packagePath = path.join(cwd, "package.json");
  if (!packageName || !fs.existsSync(packagePath)) return false;
  const manifest = readJson(packagePath);
  return Boolean(
    manifest.dependencies?.[packageName] ||
    manifest.devDependencies?.[packageName] ||
    manifest.optionalDependencies?.[packageName],
  );
}

function probeVersion(executable, args, cwd) {
  if (!executable) return null;
  const result = spawnSync(executable, args ?? ["--version"], {
    cwd,
    encoding: "utf8",
    timeout: 5_000,
  });
  if (result.status !== 0) return null;
  return (result.stdout || result.stderr).trim().split(/\r?\n/)[0] || null;
}

export function buildDoctorReport(config, cwd) {
  const requiredPaths = (config.requiredPaths ?? []).map((relativePath) => ({
    path: relativePath,
    present: fs.existsSync(path.join(cwd, relativePath)),
  }));
  const tools = (config.tools ?? []).map((tool) => {
    const executable = executablePath(tool.command, cwd);
    const declared = declaredPackage(cwd, tool.package);
    return {
      id: tool.id,
      required: Boolean(tool.required),
      requiredInCi: Boolean(tool.requiredInCi),
      status: executable ? "available" : declared ? "declared" : "missing",
      executable,
      version: probeVersion(executable, tool.versionArgs, cwd),
    };
  });
  const nodeMajor = Number(process.versions.node.split(".")[0]);
  const registryPath = path.join(cwd, config.routeRegistry);
  const registryErrors = fs.existsSync(registryPath)
    ? validateRegistry(readJson(registryPath))
    : [`route registry not found: ${config.routeRegistry}`];
  const failures = [
    ...(nodeMajor < config.minimumNodeMajor
      ? [
          `Node ${config.minimumNodeMajor}+ required; found ${process.versions.node}`,
        ]
      : []),
    ...requiredPaths
      .filter((item) => !item.present)
      .map((item) => `missing required path: ${item.path}`),
    ...tools
      .filter(
        (tool) =>
          tool.required &&
          (!process.env.CI || tool.requiredInCi) &&
          tool.status !== "available",
      )
      .map((tool) => `missing required tool: ${tool.id}`),
    ...registryErrors,
  ];
  return {
    version: config.version,
    project: config.project,
    cwd,
    node: {
      version: process.versions.node,
      minimumMajor: config.minimumNodeMajor,
      ok: nodeMajor >= config.minimumNodeMajor,
    },
    stacks: config.stacks ?? [],
    requiredPaths,
    tools,
    failures,
    ok: failures.length === 0,
  };
}

export function renderToolCache(report) {
  const lines = [
    "# AI OS Tool Cache",
    "",
    `Generated by AI OS doctor v${report.version}. Re-run after tool, dependency, or auth changes.`,
    "",
    `- Project: \`${report.project}\``,
    `- Node: \`${report.node.version}\` (${report.node.ok ? "meets" : "does not meet"} >=${report.node.minimumMajor})`,
    `- Stacks: ${report.stacks.length ? report.stacks.map((stack) => `\`${stack}\``).join(", ") : "none declared"}`,
    "",
    "| Tool | Required | Status | Version |",
    "|---|---:|---|---|",
    ...report.tools.map(
      (tool) =>
        `| \`${tool.id}\` | ${tool.required ? "yes" : "no"} | ${tool.status} | ${tool.version ? `\`${tool.version.replaceAll("|", "\\|")}\`` : "—"} |`,
    ),
    "",
    "## Required paths",
    "",
    ...report.requiredPaths.map(
      (item) => `- ${item.present ? "[x]" : "[ ]"} \`${item.path}\``,
    ),
    "",
    "## Result",
    "",
    report.ok
      ? "PASS"
      : `FAIL\n\n${report.failures.map((failure) => `- ${failure}`).join("\n")}`,
    "",
    "This cache records local discovery, not remaining provider quota or production authorization.",
    "",
  ];
  return lines.join("\n");
}

export function resolveToolCachePath(config, cwd) {
  if (!nonEmptyString(config?.toolCache)) {
    throw new Error("AI OS config toolCache must be a non-empty relative path");
  }
  return path.resolve(cwd, config.toolCache);
}

function normalizeShellCommand(command) {
  return command
    .replace(/\\\r?\n/g, "")
    .replace(/\\([;&|])/g, "$1")
    .replace(/["']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function hookOutput(eventName, additionalContext) {
  return {
    hookSpecificOutput: {
      hookEventName: eventName,
      additionalContext,
    },
  };
}

function denyPreToolUse(reason) {
  return {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: reason,
    },
  };
}

function askPreToolUse(reason) {
  return {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "ask",
      permissionDecisionReason: reason,
    },
  };
}

export function evaluateHook(hookName, input, config, cwd) {
  const eventName = input.hook_event_name ?? input.hookEventName ?? "";
  const toolName = input.tool_name ?? "";
  const toolInput = input.tool_input ?? {};
  const overrideName = config.hooks?.blockingOverrideEnv;
  const overrideActive = Boolean(
    overrideName && process.env[overrideName] === "1" && !process.env.CI,
  );

  if (hookName === "safety") {
    const command = String(toolInput.command ?? "");
    const normalizedCommand = normalizeShellCommand(command);
    const content = String(
      toolInput.content ?? toolInput.new_string ?? command,
    );
    const filePath = String(toolInput.file_path ?? toolInput.path ?? "");
    const destructive =
      toolName === "Bash" &&
      DESTRUCTIVE_COMMAND_PATTERNS.some(
        (pattern) => pattern.test(command) || pattern.test(normalizedCommand),
      );
    const secret = SECRET_PATTERNS.some((pattern) => pattern.test(content));
    const clientExposedPath =
      CLIENT_FILE_PATTERN.test(filePath) &&
      !SERVER_ONLY_FILE_PATTERN.test(filePath);
    const clientSecretReference =
      (PUBLIC_MODEL_KEY_PATTERN.test(content) ||
        (MODEL_KEY_REFERENCE_PATTERN.test(content) &&
          (clientExposedPath || /^\s*["']use client["'];?/m.test(content)))) &&
      !/\.env\.(?:example|sample|template)$/.test(filePath);
    const sensitivePath =
      /(^|\/)\.env(?:\.[^/]+)?$/.test(filePath) &&
      !/(^|\/)\.env\.(?:example|sample|template)$/.test(filePath);
    if ((destructive || secret || clientSecretReference) && !overrideActive) {
      const reason = destructive
        ? `AI OS blocked a destructive command. Obtain explicit approval or set ${overrideName}=1 for a local non-CI exception.`
        : clientSecretReference
          ? "AI OS blocked a model-provider credential reference from a client-exposed surface."
          : `AI OS blocked content that resembles a committed secret. Use an environment variable or secret store instead.`;
      return denyPreToolUse(reason);
    }
    if (sensitivePath && !overrideActive) {
      return askPreToolUse(
        `Sensitive environment file detected. Confirm the file remains uncommitted and contains no exposed credentials.`,
      );
    }
    if (overrideActive && (destructive || secret || clientSecretReference)) {
      return askPreToolUse(
        `Local override ${overrideName}=1 is active; confirm this exceptional operation.`,
      );
    }
    return {};
  }

  if (hookName === "skill-activation") {
    const prompt = String(input.prompt ?? "");
    const mappings = [
      [/\b(?:review|audit)\b/i, "independent-code-review"],
      [
        /\b(?:architecture|system design|migration|auth|payments?)\b/i,
        "architecture-critique",
      ],
      [/\b(?:frontend|ui|css|component)\b/i, "frontend-implementation"],
      [/\b(?:copy|editorial|marketing)\b/i, "copy"],
      [/\b(?:research|investigate|feasibility)\b/i, "research"],
    ];
    const matched = mappings.find(([pattern]) => pattern.test(prompt));
    return matched
      ? hookOutput(
          eventName || "UserPromptSubmit",
          `AI OS task hint: classify this as \`${matched[1]}\`, resolve the route from the machine-readable registry, and preserve its stop rule.`,
        )
      : {};
  }

  if (hookName === "verify-on-change") {
    return hookOutput(
      eventName || "PostToolUse",
      config.hooks?.verificationReminder ??
        "Run focused verification for the changed surface before treating the task as complete.",
    );
  }

  if (hookName === "delegating-review") {
    if (!config.hooks?.delegatingReview || input.stop_hook_active) return {};
    const status = spawnSync("git", ["status", "--porcelain"], {
      cwd,
      encoding: "utf8",
      timeout: 5_000,
    });
    if (status.status !== 0 || !status.stdout.trim()) return {};
    return hookOutput(
      eventName || "Stop",
      "Tracked or untracked changes remain. Before stopping, run the configured independent review topology or explicitly record why review is deferred.",
    );
  }

  if (hookName === "status-checkpoint") {
    const status = spawnSync("git", ["status", "--short", "--branch"], {
      cwd,
      encoding: "utf8",
      timeout: 5_000,
    });
    return status.status === 0
      ? {
          systemMessage: `AI OS checkpoint: ${status.stdout.trim().split(/\r?\n/).slice(0, 8).join(" | ")}`,
        }
      : {};
  }

  return {};
}

export function findConfigPath(cwd, explicitPath) {
  if (explicitPath) return path.resolve(cwd, explicitPath);
  for (const relativePath of [".ai/ai-os.json", "runtime/ai-os.config.json"]) {
    const candidate = path.join(cwd, relativePath);
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error(
    "No AI OS config found; expected .ai/ai-os.json or runtime/ai-os.config.json",
  );
}

export function parseCliArgs(argv) {
  const result = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) {
      result._.push(item);
      continue;
    }
    const key = item.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) result[key] = true;
    else {
      result[key] = next;
      index += 1;
    }
  }
  return result;
}

export function makeTemporaryDirectory(prefix = "ai-os-") {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}
