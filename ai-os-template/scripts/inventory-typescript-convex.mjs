#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const GENERATOR_ID = "typescript-convex-static";
const GENERATOR_VERSION = "0.1.0";
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".mts", ".cts"]);
const DATABASE_WRITES = new Map([
  ["insert", "database_insert"],
  ["patch", "database_update"],
  ["replace", "database_update"],
  ["delete", "database_delete"],
]);
const DATABASE_READS = new Map([
  ["get", "database_read"],
  ["query", "database_query"],
]);
const DATABASE_KNOWN_NON_EFFECTS = new Set(["normalizeId", "system"]);

function fail(message) {
  throw new Error(message);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function maskNonCode(source) {
  const chars = [...source];
  let state = "code";
  let escaped = false;
  for (let index = 0; index < chars.length; index += 1) {
    const char = chars[index];
    const next = chars[index + 1];
    if (state === "code") {
      if (char === "/" && next === "/") {
        chars[index] = chars[index + 1] = " ";
        index += 1;
        state = "line-comment";
      } else if (char === "/" && next === "*") {
        chars[index] = chars[index + 1] = " ";
        index += 1;
        state = "block-comment";
      } else if (char === "'") {
        chars[index] = " ";
        state = "single";
        escaped = false;
      } else if (char === '"') {
        chars[index] = " ";
        state = "double";
        escaped = false;
      } else if (char === "`") {
        chars[index] = " ";
        state = "template";
        escaped = false;
      }
      continue;
    }
    if (state === "line-comment") {
      if (char === "\n") state = "code";
      else chars[index] = " ";
      continue;
    }
    if (state === "block-comment") {
      if (char === "*" && next === "/") {
        chars[index] = chars[index + 1] = " ";
        index += 1;
        state = "code";
      } else if (char !== "\n") chars[index] = " ";
      continue;
    }
    if (char === "\n") {
      escaped = false;
      continue;
    }
    chars[index] = " ";
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (
      (state === "single" && char === "'") ||
      (state === "double" && char === '"') ||
      (state === "template" && char === "`")
    ) {
      state = "code";
    }
  }
  return { masked: chars.join(""), finalState: state };
}

function lineAt(source, index) {
  return source.slice(0, index).split("\n").length;
}

function symbols(masked) {
  const rows = [];
  for (const pattern of [
    /(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/g,
    /(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g,
  ]) {
    for (const match of masked.matchAll(pattern)) rows.push({ index: match.index, name: match[1] });
  }
  return rows.sort((left, right) => left.index - right.index);
}

function enclosingSymbol(symbolRows, index) {
  let answer = "<module>";
  for (const row of symbolRows) {
    if (row.index > index) break;
    answer = row.name;
  }
  return answer;
}

function firstLiteralArgument(source, index) {
  const match = source.slice(index, index + 240).match(/\(\s*["'`]([^"'`]+)["'`]/);
  return match?.[1];
}

function tagsFor(kind, symbol, entities) {
  const tags = new Set([kind]);
  const haystack = `${symbol} ${entities.join(" ")}`.toLowerCase();
  const mappings = [
    ["outbox", /outbox/],
    ["webhook", /webhook/],
    ["cache", /cache/],
    ["replay", /replay/],
    ["census", /census|reconcile|scanner|scan/],
    ["retention", /retention|cleanup|delete/],
    ["authorization", /auth|tenant|attempt|capability|grant/],
  ];
  for (const [tag, pattern] of mappings) if (pattern.test(haystack)) tags.add(tag);
  return [...tags].sort();
}

function guardsNear(source, index) {
  const nearby = source.slice(Math.max(0, index - 240), index + 360);
  const matches = nearby.match(/\b(?:attempt\w*|auth\w*|tenant\w*|apiClient\w*|token\w*|grant\w*|capability\w*)\b/gi) ?? [];
  return [...new Set(matches)].sort();
}

function collectFiles(root, config) {
  const files = [];
  const unresolved = [];
  function visit(target) {
    const stat = fs.lstatSync(target);
    if (stat.isSymbolicLink()) {
      unresolved.push({
        file: path.relative(root, target).split(path.sep).join("/"),
        line: 1,
        symbol: "<filesystem>",
        risk: "high",
        reason: "symbolic link in an inventory include path requires manual source-boundary review",
      });
      return;
    }
    if (stat.isDirectory()) {
      for (const name of fs.readdirSync(target).sort()) visit(path.join(target, name));
      return;
    }
    if (SOURCE_EXTENSIONS.has(path.extname(target))) files.push(target);
  }
  for (const includePath of config.include_paths) {
    const target = path.resolve(root, includePath);
    if (!target.startsWith(`${path.resolve(root)}${path.sep}`) && target !== path.resolve(root)) {
      fail(`include path escapes source root: ${includePath}`);
    }
    if (fs.existsSync(target)) visit(target);
  }
  const filtered = files.filter((target) => {
    const relative = `/${path.relative(root, target).split(path.sep).join("/")}`;
    return !config.exclude_path_fragments.some((fragment) => relative.includes(fragment));
  });
  return { files: filtered, unresolved };
}

function inventoryFile(root, target) {
  const source = fs.readFileSync(target, "utf8");
  const { masked, finalState } = maskNonCode(source);
  const symbolRows = symbols(masked);
  const relativeFile = path.relative(root, target).split(path.sep).join("/");
  const surfaces = [];
  const unresolved = [];

  function add(kind, index, entities, detail = kind) {
    const symbol = enclosingSymbol(symbolRows, index);
    const line = lineAt(source, index);
    const identity = `${kind}:${relativeFile}:${line}:${symbol}:${detail}`;
    surfaces.push({
      id: `SURF-${sha256(identity).slice(0, 16).toUpperCase()}`,
      kind,
      risk: "high",
      file: relativeFile,
      symbol,
      line,
      boundary: symbol === "<module>" ? "module scope" : symbol,
      entities: entities.length > 0 ? entities : ["unresolved_entity"],
      tags: tagsFor(kind, symbol, entities),
      callers: [],
      observed_guards: guardsNear(source, index),
      confidence: "heuristic",
    });
  }

  if (finalState !== "code" && finalState !== "line-comment") {
    unresolved.push({
      file: relativeFile,
      line: source.split("\n").length,
      symbol: "<module>",
      risk: "high",
      reason: `lexical masker ended in ${finalState}; regex or unterminated literal may hide effects`,
    });
  }
  for (const match of masked.matchAll(/export\s+const\s+([A-Za-z_$][\w$]*)\s*=\s*(mutation|internalMutation|action|internalAction|httpAction|query|internalQuery)\s*\(/g)) {
    const kind = `callable_${match[2].replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase()}`;
    add(kind, match.index, ["callable"], match[1]);
  }

  for (const match of masked.matchAll(/\.\s*db\s*\.\s*([A-Za-z_$][\w$]*)\s*\(/g)) {
    const method = match[1];
    if (DATABASE_WRITES.has(method)) {
      const entity = firstLiteralArgument(source, match.index);
      add(DATABASE_WRITES.get(method), match.index, [entity ?? "dynamic_record"], method);
    } else if (DATABASE_READS.has(method)) {
      const entity = firstLiteralArgument(source, match.index);
      add(DATABASE_READS.get(method), match.index, [entity ?? "dynamic_record"], method);
    } else if (!DATABASE_KNOWN_NON_EFFECTS.has(method)) {
      unresolved.push({
        file: relativeFile,
        line: lineAt(source, match.index),
        symbol: enclosingSymbol(symbolRows, match.index),
        risk: "high",
        reason: `unsupported database method: ${method}`,
      });
    }
  }

  for (const match of masked.matchAll(/\.\s*storage\s*\.\s*(store|delete)\s*\(/g)) {
    add(match[1] === "store" ? "storage_write" : "storage_delete", match.index, ["storage"], match[1]);
  }
  for (const match of masked.matchAll(/\bfetch\s*\(/g)) {
    add("external_request", match.index, [firstLiteralArgument(source, match.index) ?? "external_service"], "fetch");
  }
  for (const match of masked.matchAll(/\.\s*scheduler\s*\.\s*(runAfter|runAt)\s*\(/g)) {
    add("scheduler_invocation", match.index, ["scheduler"], match[1]);
  }
  for (const method of ["Mutation", "Query", "Action"]) {
    const callPattern = new RegExp(`\\.\\s*run${method}\\s*\\(`, "g");
    for (const match of masked.matchAll(callPattern)) {
      const tail = masked.slice(match.index, match.index + 320);
      const target = tail.match(/\(\s*([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)+)/)?.[1];
      if (target) add(`internal_${method.toLowerCase()}_call`, match.index, [target], `run${method}`);
      else unresolved.push({
        file: relativeFile,
        line: lineAt(source, match.index),
        symbol: enclosingSymbol(symbolRows, match.index),
        risk: "high",
        reason: `dynamic ctx.run${method} target`,
      });
    }
  }
  for (const match of masked.matchAll(/\.\s*(interval|hourly|daily|weekly|monthly|cron)\s*\(/g)) {
    add("scheduled_registration", match.index, [firstLiteralArgument(source, match.index) ?? "scheduled_job"], match[1]);
  }
  for (const match of masked.matchAll(/(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*=\s*[A-Za-z_$][\w$]*\.db\b/g)) {
    unresolved.push({
      file: relativeFile,
      line: lineAt(source, match.index),
      symbol: enclosingSymbol(symbolRows, match.index),
      risk: "high",
      reason: "database context alias requires manual effect enumeration",
    });
  }
  for (const match of masked.matchAll(/(?:const|let|var)\s*\{[^}]*\b(?:db|scheduler|storage)\b[^}]*\}\s*=\s*[A-Za-z_$][\w$]*/g)) {
    unresolved.push({
      file: relativeFile,
      line: lineAt(source, match.index),
      symbol: enclosingSymbol(symbolRows, match.index),
      risk: "high",
      reason: "destructured database context requires manual effect enumeration",
    });
  }
  for (const match of masked.matchAll(/\.\s*paginate\s*\(/g)) {
    add("cursor_scan", match.index, ["cursor"], "paginate");
  }

  return { surfaces, unresolved };
}

export function inventoryTypeScriptConvex(root, configPath, taskId, sourceTreeHash) {
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (config.schema_version !== 1) fail("inventory config schema_version must be 1");
  if (!Array.isArray(config.include_paths) || config.include_paths.length === 0) fail("include_paths must not be empty");
  if (!Array.isArray(config.exclude_path_fragments)) fail("exclude_path_fragments must be an array");
  if (!taskId || !sourceTreeHash) fail("task ID and source tree hash are required");

  const collected = collectFiles(root, config);
  const rows = collected.files.map((target) => inventoryFile(root, target));
  const surfaces = rows
    .flatMap((row) => row.surfaces)
    .sort((left, right) =>
      left.file.localeCompare(right.file) || left.line - right.line || left.kind.localeCompare(right.kind) || left.id.localeCompare(right.id),
    );
  const unresolved = rows
    .flatMap((row) => row.unresolved)
    .concat(collected.unresolved)
    .sort((left, right) => left.file.localeCompare(right.file) || left.line - right.line || left.reason.localeCompare(right.reason));

  return {
    schema_version: 1,
    task_id: taskId,
    generator: {
      id: GENERATOR_ID,
      version: GENERATOR_VERSION,
      source_tree_hash: sourceTreeHash,
    },
    surfaces,
    unresolved,
  };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const [root, configPath, taskId, sourceTreeHash] = process.argv.slice(2);
  if (!root || !configPath || !taskId || !sourceTreeHash) {
    console.error("usage: inventory-typescript-convex.mjs <source-root> <config.json> <task-id> <source-tree-hash>");
    process.exit(2);
  }
  try {
    const packet = inventoryTypeScriptConvex(path.resolve(root), path.resolve(configPath), taskId, sourceTreeHash);
    process.stdout.write(`${JSON.stringify(packet, null, 2)}\n`);
    if (packet.unresolved.length > 0) process.exitCode = 1;
  } catch (error) {
    console.error(`typescript-convex inventory failed: ${error.message}`);
    process.exit(1);
  }
}
