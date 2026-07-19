#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function read(directory, file) {
  const bytes = fs.readFileSync(path.join(directory, file));
  return { bytes, value: JSON.parse(bytes.toString("utf8")) };
}

function cell(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", "<br>");
}

function banner(file, bytes) {
  return `<!-- Generated from \`${file}\`; source-sha256: ${sha256(bytes)}. Do not edit. -->\n`;
}

function renderRequirements(document) {
  const { bytes, value } = document;
  const lines = [
    banner("requirements.json", bytes).trimEnd(),
    `# Requirements — ${value.task_id}`,
    "",
    `Baseline commit: \`${value.baseline.commit}\`  `,
    `Baseline tree: \`${value.baseline.tree}\``,
    "",
    "| ID | Requirement | Source | Applies to |",
    "|---|---|---|---|",
  ];
  for (const row of value.requirements) {
    lines.push(`| ${cell(row.id)} | ${cell(row.statement)} | ${cell(row.source)} | ${cell(row.applies_to.join(", "))} |`);
  }
  for (const row of value.requirements) {
    lines.push(
      "",
      `## ${row.id} verification`,
      "",
      `- Method: ${row.verification.method}`,
      `- Command: \`${row.verification.command}\``,
      `- Expected: ${row.verification.expected}`,
      `- Denial without effects: ${row.verification.denial_without_effects}`,
    );
  }
  return `${lines.join("\n")}\n`;
}

function renderArchitecture(document) {
  const { bytes, value } = document;
  const lines = [
    banner("architecture-proof.json", bytes).trimEnd(),
    `# Architecture proof — ${value.task_id}`,
    "",
    "## Authority and effect diagram",
    "",
    `\`\`\`${value.authority_effect_diagram.format}`,
    value.authority_effect_diagram.content,
    "```",
    "",
    `Trust boundaries: ${value.authority_effect_diagram.trust_boundaries.map((row) => `\`${row}\``).join(", ")}`,
    "",
    "## Decisions",
    "",
    "| ID | Requirements | Immutable root | Canonical projection | Cardinality | Enforcement | Fail closed |",
    "|---|---|---|---|---|---|---|",
  ];
  for (const row of value.decisions) {
    lines.push(`| ${cell(row.id)} | ${cell(row.requirement_ids.join(", "))} | ${cell(row.immutable_root)} | ${cell(row.canonical_projection)} | ${cell(row.cardinality)} | ${cell(row.enforcement_point)} | ${cell(row.fail_closed_behavior)} |`);
  }
  lines.push(
    "",
    "## Reachable sibling paths",
    "",
    "| ID | Kind | Entry point | Effects | Enforcement | Requirements |",
    "|---|---|---|---|---|---|",
  );
  for (const row of value.sibling_paths) {
    lines.push(`| ${cell(row.id)} | ${cell(row.kind)} | ${cell(row.entry_point)} | ${cell(row.effect_surface_ids.join(", "))} | ${cell(row.enforcement_point)} | ${cell(row.requirement_ids.join(", "))} |`);
  }
  for (const [name, rows] of Object.entries(value.matrices)) {
    lines.push("", `## ${name.replaceAll("_", " ")} matrix`, "");
    if (rows.length === 0) lines.push("No rows.");
    else {
      lines.push("| Case | Applicability | Expected | Requirements |", "|---|---|---|---|");
      for (const row of rows) lines.push(`| ${cell(row.case)} | ${cell(row.applicability)} | ${cell(row.expected)} | ${cell(row.requirement_ids.join(", "))} |`);
    }
  }
  return `${lines.join("\n")}\n`;
}

function renderProofPlan(document) {
  const { bytes, value } = document;
  const lines = [
    banner("proof-plan.json", bytes).trimEnd(),
    `# Proof plan — ${value.task_id}`,
    "",
    "| Surface | Reachability | Requirements | Invariants | Enforcement | Negative evidence | Integration evidence | Disposition |",
    "|---|---|---|---|---|---|---|---|",
  ];
  for (const row of value.entries) {
    lines.push(`| ${cell(row.surface_id)} | ${cell(row.reachable_because)} | ${cell(row.requirement_ids.join(", "))} | ${cell(row.invariant_ids.join(", "))} | ${cell(row.enforcement_point)} | ${cell(row.negative_evidence)} | ${cell(row.integration_evidence)} | ${cell(row.disposition)} |`);
  }
  lines.push("", "## Requirement trace", "", "| Requirement | Enforcement points | Verification evidence | Status |", "|---|---|---|---|");
  for (const row of value.requirement_trace) {
    lines.push(`| ${cell(row.requirement_id)} | ${cell(row.enforcement_points.join(", "))} | ${cell(row.verification_evidence.join(", "))} | ${cell(row.status)} |`);
  }
  return `${lines.join("\n")}\n`;
}

function writeAtomic(target, content) {
  const temporary = `${target}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(temporary, content, { encoding: "utf8", flag: "wx" });
    fs.renameSync(temporary, target);
  } catch (error) {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
    throw error;
  }
}

export function renderProofHarness(directory, { check = false } = {}) {
  const renderedDirectory = path.join(directory, "rendered");
  const outputs = new Map([
    ["requirements.md", renderRequirements(read(directory, "requirements.json"))],
    ["architecture-proof.md", renderArchitecture(read(directory, "architecture-proof.json"))],
    ["proof-plan.md", renderProofPlan(read(directory, "proof-plan.json"))],
  ]);
  if (!check) fs.mkdirSync(renderedDirectory, { recursive: true });
  for (const [file, content] of outputs) {
    const target = path.join(renderedDirectory, file);
    if (check) {
      if (!fs.existsSync(target) || fs.readFileSync(target, "utf8") !== content) {
        throw new Error(`stale rendered artifact: rendered/${file}`);
      }
    } else writeAtomic(target, content);
  }
  return Object.fromEntries([...outputs].map(([file, content]) => [file, `sha256:${sha256(content)}`]));
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const directory = process.argv[2];
  const check = process.argv[3] === "--check";
  if (!directory) {
    console.error("usage: render-proof-harness.mjs <task-artifact-directory> [--check]");
    process.exit(2);
  }
  try {
    console.log(JSON.stringify({ valid: true, mode: check ? "check" : "write", files: renderProofHarness(path.resolve(directory), { check }) }, null, 2));
  } catch (error) {
    console.error(`proof-harness rendering failed: ${error.message}`);
    process.exit(1);
  }
}
