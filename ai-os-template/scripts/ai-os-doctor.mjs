#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {
  buildDoctorReport,
  findConfigPath,
  parseCliArgs,
  readJson,
  renderToolCache,
  resolveToolCachePath,
} from "./ai-os-core.mjs";

const args = parseCliArgs(process.argv.slice(2));
const cwd = path.resolve(args.cwd ?? process.cwd());
const configPath = findConfigPath(cwd, args.config);
const config = readJson(configPath);
const report = buildDoctorReport(config, cwd);
const rendered = renderToolCache(report);
const cachePath = resolveToolCachePath(config, cwd);

if (args.write) {
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  fs.writeFileSync(cachePath, rendered);
}
if (args.check) {
  const existing = fs.existsSync(cachePath)
    ? fs.readFileSync(cachePath, "utf8")
    : "";
  if (existing !== rendered) {
    console.error(
      `AI OS tool cache is stale: ${path.relative(cwd, cachePath)}`,
    );
    process.exitCode = 1;
  }
}
if (args.json) console.log(JSON.stringify(report, null, 2));
else {
  console.log(
    `${report.ok ? "PASS" : "FAIL"} AI OS doctor (${report.project})`,
  );
  for (const failure of report.failures) console.log(`- ${failure}`);
  if (args.write) console.log(`- wrote ${path.relative(cwd, cachePath)}`);
}
if (!report.ok) process.exitCode = 1;
