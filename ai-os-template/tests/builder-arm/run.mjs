import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { runBuilderArm } from "../../scripts/run-builder-arm.mjs";

const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "builder-arm-"));
const repo = path.join(fixture, "repo");
const output = path.join(fixture, "evidence");
fs.mkdirSync(repo);
const git = (...args) => execFileSync("git", ["-C", repo, ...args], { encoding: "utf8" }).trim();
git("init", "-q");
git("config", "user.email", "fixture@example.com");
git("config", "user.name", "Fixture");
fs.writeFileSync(path.join(repo, "allowed.txt"), "before\n");
fs.writeFileSync(path.join(repo, ".gitignore"), "ignored.txt\n");
fs.writeFileSync(path.join(repo, "package.json"), '{"scripts":{"test":"node -e \\"process.exit(0)\\""}}\n');
git("add", ".");
git("commit", "-qm", "baseline");
const baseline = git("rev-parse", "HEAD");
const baselineBranch = git("symbolic-ref", "--short", "HEAD");
const promptPath = path.join(fixture, "prompt.md");
fs.writeFileSync(promptPath, "Change allowed.txt to after.\n");
const fake = path.join(fixture, "fake-agent.mjs");
fs.writeFileSync(fake, `
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
const workspace = process.argv[process.argv.indexOf("--workspace") + 1];
fs.writeFileSync(path.join(workspace, process.env.FAKE_TARGET ?? "allowed.txt"), "after\\n");
if (process.env.FAKE_MODE === "commit") {
  execFileSync("git", ["-C", workspace, "add", "-A"]);
  execFileSync("git", ["-C", workspace, "commit", "-qm", "forbidden"]);
}
if (process.env.FAKE_MODE === "ref") execFileSync("git", ["-C", workspace, "checkout", "-qb", "forbidden-ref"]);
console.log(JSON.stringify({type:"result",result:"done"}));
`);

async function run(target = "allowed.txt", mode = "edit", checksPass = true, model = "composer-2.5", checkMutation = false) {
  const config = {
    schema_version: 1,
    experiment_id: "fixture",
    arm_id: "arm-a",
    run_nonce: `fixture-${target.replaceAll("/", "-")}-${mode}-${model}`,
    model,
    repository: repo,
    baseline_commit: baseline,
    prompt_path: promptPath,
    allowed_paths: ["allowed.txt"],
    allowed_ignored_paths: [],
    output_directory: output,
    timeout_ms: 10000,
    check_timeout_ms: 10000,
    intervention_budget: 0,
    remediation_generation_budget: 1,
    visible_checks: [[process.execPath, "-e", `process.exit(${checksPass ? 0 : 1})`]],
    held_out_checks: [[process.execPath, "-e", checkMutation ? "require('fs').writeFileSync('post-check-outside.txt','mutated\\n');process.exit(0)" : "process.exit(0)"]]
  };
  const configPath = path.join(fixture, `config-${target.replaceAll("/", "-")}.json`);
  fs.writeFileSync(configPath, JSON.stringify(config));
  const expectedConfigSha256 = `sha256:${crypto.createHash("sha256").update(fs.readFileSync(configPath)).digest("hex")}`;
  try {
    const result = await runBuilderArm(configPath, {
      expectedConfigSha256,
      agentExecutable: process.execPath,
      agentPrefixArgs: [fake],
      agentEnvironment: { FAKE_TARGET: target, FAKE_MODE: mode },
      agentVersion: "fixture-agent"
    });
    return { status: 0, result, error: "" };
  } catch (error) {
    return { status: 1, result: null, error: error.message };
  }
}

const good = await run();
assert.equal(good.status, 0, good.error);
const evidence = JSON.parse(fs.readFileSync(path.join(output, "arm-a", "result.json"), "utf8"));
assert.equal(evidence.status, "completed");
assert.equal(evidence.model, "composer-2.5");
assert.equal(evidence.changed_paths[0], "allowed.txt");
assert.equal(evidence.visible_checks[0].status, 0);
assert.equal(evidence.held_out_checks[0].status, 0);
assert.equal(evidence.intervention_budget, 0);
assert.equal(evidence.remediation_generation_budget, 1);
assert.match(evidence.prompt_sha256, /^sha256:[a-f0-9]{64}$/);

git("reset", "--hard", baseline);
const solThroughCursor = await run("allowed.txt", "edit", true, "gpt-5.6-sol");
assert.equal(solThroughCursor.status, 1);
assert.match(solThroughCursor.error, /unsupported experiment model/i);
const legacySolThroughCursor = await run("allowed.txt", "edit", true, "gpt-5.6-sol-high");
assert.equal(legacySolThroughCursor.status, 1);
assert.match(legacySolThroughCursor.error, /unsupported experiment model/i);

git("reset", "--hard", baseline);
const bad = await run("outside.txt");
assert.equal(bad.status, 1);
assert.match(bad.error, /outside allowed paths/);

execFileSync("git", ["-C", repo, "clean", "-fd"]);
git("reset", "--hard", baseline);
const committed = await run("allowed.txt", "commit");
assert.equal(committed.status, 1);
assert.match(committed.error, /moved HEAD/);

git("reset", "--hard", baseline);
const switchedRef = await run("allowed.txt", "ref");
assert.equal(switchedRef.status, 1);
assert.match(switchedRef.error, /ref/i);
git("checkout", "-q", baselineBranch);
git("branch", "-D", "forbidden-ref");

git("reset", "--hard", baseline);
const failedCheck = await run("allowed.txt", "edit", false);
assert.equal(failedCheck.status, 1);
assert.match(failedCheck.error, /checks-failed/);

git("reset", "--hard", baseline);
const mutatingCheck = await run("allowed.txt", "edit", true, "composer-2.5", true);
assert.equal(mutatingCheck.status, 1);
assert.match(mutatingCheck.error, /checks.*mutated|repository state/i);
fs.rmSync(path.join(repo, "post-check-outside.txt"), { force: true });

git("reset", "--hard", baseline);
const ignoredWrite = await run("ignored.txt");
assert.equal(ignoredWrite.status, 1);
assert.match(ignoredWrite.error, /ignored-file state/);

console.log("builder arm fixtures passed");
