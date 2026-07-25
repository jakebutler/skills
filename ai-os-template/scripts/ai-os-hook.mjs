#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {
  buildDoctorReport,
  evaluateHook,
  findConfigPath,
  parseCliArgs,
  readJson,
  renderToolCache,
} from "./ai-os-core.mjs";

const args = parseCliArgs(process.argv.slice(2));
const cwd = process.cwd();
const config = readJson(findConfigPath(cwd, args.config));
const rawInput = await new Promise((resolve) => {
  let data = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => {
    data += chunk;
  });
  process.stdin.on("end", () => resolve(data));
});
const input = rawInput.trim() ? JSON.parse(rawInput) : {};

if (args.hook === "tool-cache-refresh") {
  if (config.hooks?.toolsCacheRefresh) {
    const report = buildDoctorReport(config, cwd);
    const cachePath = path.resolve(cwd, config.toolCache);
    const rendered = renderToolCache(report);
    const existing = fs.existsSync(cachePath) ? fs.readFileSync(cachePath, "utf8") : "";
    if (existing !== rendered) {
      fs.mkdirSync(path.dirname(cachePath), { recursive: true });
      fs.writeFileSync(cachePath, rendered);
    }
    console.log(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: input.hook_event_name ?? "SessionStart",
          additionalContext: `AI OS doctor ${report.ok ? "passed" : "reported failures"}; tool cache is current.`,
        },
      }),
    );
  } else {
    console.log("{}");
  }
} else {
  console.log(JSON.stringify(evaluateHook(args.hook, input, config, cwd)));
}
