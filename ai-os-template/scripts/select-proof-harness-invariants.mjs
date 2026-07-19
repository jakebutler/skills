#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function fail(message) {
  throw new Error(message);
}

function readJson(target) {
  const bytes = fs.readFileSync(target);
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  if (text.includes("\r")) fail(`${path.basename(target)} must use LF line endings`);
  return { bytes, value: JSON.parse(text) };
}

function sha256(bytes) {
  return `sha256:${crypto.createHash("sha256").update(bytes).digest("hex")}`;
}

function sortedUnique(values) {
  return [...new Set(values)].sort();
}

function intersects(left, right) {
  const rightSet = new Set(right);
  return left.some((value) => rightSet.has(value));
}

function matches(invariant, surface) {
  const dimensions = [
    [invariant.applies_to.kinds, [surface.kind]],
    [invariant.applies_to.entities, surface.entities],
    [invariant.applies_to.tags, surface.tags],
    [invariant.applies_to.risks, [surface.risk]],
  ];
  const declared = dimensions.filter(([selectors]) => selectors.length > 0);
  return declared.length > 0 && declared.every(([selectors, values]) => intersects(selectors, values));
}

function validateRegistry(registry) {
  if (registry?.schema_version !== 1) fail("registry schema_version must be 1");
  if (!Array.isArray(registry.invariants) || registry.invariants.length === 0) {
    fail("registry invariants must be a non-empty array");
  }
  const ids = new Set();
  for (const invariant of registry.invariants) {
    if (typeof invariant.id !== "string" || invariant.id === "") fail("invariant ID missing");
    if (ids.has(invariant.id)) fail(`duplicate invariant ID ${invariant.id}`);
    ids.add(invariant.id);
    if (!['active-blocking', 'advisory'].includes(invariant.status)) {
      fail(`${invariant.id} has unsupported status ${invariant.status}`);
    }
    if (typeof invariant.statement !== "string" || invariant.statement === "") {
      fail(`${invariant.id} statement missing`);
    }
    if (typeof invariant.always_apply !== "boolean") fail(`${invariant.id} always_apply missing`);
    for (const field of ["kinds", "entities", "tags", "risks"]) {
      if (!Array.isArray(invariant.applies_to?.[field])) {
        fail(`${invariant.id}.applies_to.${field} must be an array`);
      }
    }
    if (!Array.isArray(invariant.dependencies)) fail(`${invariant.id}.dependencies must be an array`);
    if (!Array.isArray(invariant.required_evidence) || invariant.required_evidence.length === 0) {
      fail(`${invariant.id}.required_evidence must not be empty`);
    }
  }
  for (const invariant of registry.invariants) {
    for (const dependency of invariant.dependencies) {
      if (!ids.has(dependency)) fail(`${invariant.id} references missing dependency ${dependency}`);
    }
  }
}

function validateInventory(inventory) {
  if (inventory?.schema_version !== 1) fail("inventory schema_version must be 1");
  if (typeof inventory.task_id !== "string" || inventory.task_id === "") {
    fail("inventory task_id missing");
  }
  if (!Array.isArray(inventory.surfaces) || inventory.surfaces.length === 0) {
    fail("inventory surfaces must be a non-empty array");
  }
  for (const surface of inventory.surfaces) {
    for (const field of ["id", "kind", "risk"]) {
      if (typeof surface[field] !== "string" || surface[field] === "") {
        fail(`surface ${field} missing`);
      }
    }
    for (const field of ["entities", "tags"]) {
      if (!Array.isArray(surface[field])) fail(`${surface.id}.${field} must be an array`);
    }
  }
}

export function selectInvariants(registryPath, inventoryPath) {
  const registryDocument = readJson(registryPath);
  const inventoryDocument = readJson(inventoryPath);
  const registry = registryDocument.value;
  const inventory = inventoryDocument.value;
  validateRegistry(registry);
  validateInventory(inventory);

  const invariantsById = new Map(registry.invariants.map((row) => [row.id, row]));
  const selectedSurfaces = new Map();
  const classifyingSurfaces = new Set();

  for (const invariant of registry.invariants) {
    const matched = inventory.surfaces
      .filter((surface) => invariant.always_apply || matches(invariant, surface))
      .map((surface) => surface.id);
    if (matched.length === 0) continue;
    selectedSurfaces.set(invariant.id, new Set(matched));
    if (invariant.status === "active-blocking" && !invariant.always_apply) {
      for (const surfaceId of matched) classifyingSurfaces.add(surfaceId);
    }
  }

  const dependencyQueue = [...selectedSurfaces.keys()];
  while (dependencyQueue.length > 0) {
    const parentId = dependencyQueue.shift();
    const parentSurfaces = selectedSurfaces.get(parentId);
    for (const dependencyId of invariantsById.get(parentId).dependencies) {
      if (!selectedSurfaces.has(dependencyId)) {
        selectedSurfaces.set(dependencyId, new Set(parentSurfaces));
        dependencyQueue.push(dependencyId);
      } else {
        for (const surfaceId of parentSurfaces) selectedSurfaces.get(dependencyId).add(surfaceId);
      }
    }
  }

  const selected = [...selectedSurfaces.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([id, surfaceIds]) => {
      const invariant = invariantsById.get(id);
      return {
        id,
        status: invariant.status,
        statement: invariant.statement,
        reason: invariant.always_apply
          ? "always_apply"
          : `metadata match or dependency for ${sortedUnique(surfaceIds).join(", ")}`,
        surface_ids: sortedUnique(surfaceIds),
        required_evidence: [...invariant.required_evidence],
        dependencies: [...invariant.dependencies].sort(),
      };
    });

  const excluded = registry.invariants
    .filter((invariant) => !selectedSurfaces.has(invariant.id))
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((invariant) => ({ id: invariant.id, reason: "no exact metadata match" }));
  const unresolvedCoverage = inventory.surfaces
    .filter((surface) => surface.risk === "high" && !classifyingSurfaces.has(surface.id))
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((surface) => ({
      surface_id: surface.id,
      reason: "no surface-specific active-blocking invariant; always-apply rules are insufficient classification",
    }));

  return {
    schema_version: 1,
    task_id: inventory.task_id,
    registry_hash: sha256(registryDocument.bytes),
    selection_algorithm: "metadata-exact-v1",
    query_features: {
      surface_ids: sortedUnique(inventory.surfaces.map((surface) => surface.id)),
      kinds: sortedUnique(inventory.surfaces.map((surface) => surface.kind)),
      entities: sortedUnique(inventory.surfaces.flatMap((surface) => surface.entities)),
      tags: sortedUnique(inventory.surfaces.flatMap((surface) => surface.tags)),
    },
    selected,
    excluded,
    unresolved_coverage: unresolvedCoverage,
  };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const [registryPath, inventoryPath] = process.argv.slice(2);
  if (!registryPath || !inventoryPath) {
    console.error(
      "usage: select-proof-harness-invariants.mjs <registry-index.json> <effect-surfaces.json>",
    );
    process.exit(2);
  }
  try {
    const packet = selectInvariants(path.resolve(registryPath), path.resolve(inventoryPath));
    process.stdout.write(`${JSON.stringify(packet, null, 2)}\n`);
    if (packet.unresolved_coverage.length > 0) process.exitCode = 1;
  } catch (error) {
    console.error(`invariant selection failed: ${error.message}`);
    process.exit(1);
  }
}
