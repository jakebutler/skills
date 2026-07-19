#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function sha256(bytes) {
  return `sha256:${crypto.createHash("sha256").update(bytes).digest("hex")}`;
}

function readCanonicalJson(directory, relativePath) {
  const bytes = fs.readFileSync(path.join(directory, relativePath));
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  if (text.includes("\r")) throw new Error(`${relativePath} must use LF line endings`);
  return { bytes, value: JSON.parse(text) };
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stableValue(value[key])]),
    );
  }
  return value;
}

export function hashBuilderPacket(directory) {
  const snapshot = readCanonicalJson(directory, "design-snapshot.json").value;
  const coverage = readCanonicalJson(directory, "design-review-coverage.json");
  const resolution = readCanonicalJson(directory, "design-review-resolution.json").value;
  const resolutionContract = { ...resolution };
  delete resolutionContract.approved_builder_packet_hash;
  const resolutionContractBytes = Buffer.from(
    `${JSON.stringify(stableValue(resolutionContract))}\n`,
    "utf8",
  );
  const manifest = {
    algorithm: "approved-builder-packet-v1",
    design_candidate_hash: snapshot.design_candidate_hash,
    design_review_coverage_hash: sha256(coverage.bytes),
    design_review_resolution_contract_hash: sha256(resolutionContractBytes),
  };
  const manifestBytes = Buffer.from(`${JSON.stringify(stableValue(manifest))}\n`, "utf8");

  return {
    ...manifest,
    approved_builder_packet_hash: sha256(manifestBytes),
  };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const directory = process.argv[2];
  if (!directory) {
    console.error("usage: hash-proof-harness-builder-packet.mjs <task-artifact-directory>");
    process.exit(2);
  }
  try {
    console.log(JSON.stringify(hashBuilderPacket(path.resolve(directory)), null, 2));
  } catch (error) {
    console.error(`builder-packet hashing failed: ${error.message}`);
    process.exit(1);
  }
}
