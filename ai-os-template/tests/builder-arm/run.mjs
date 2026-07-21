import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { runBuilderArm } from "../../scripts/run-builder-arm.mjs";

const sha256 = (value) => `sha256:${crypto.createHash("sha256").update(value).digest("hex")}`;

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
const agentLaunchCountPath = path.join(fixture, "agent-launch-count.log");
const fake = path.join(fixture, "fake-agent.mjs");
fs.writeFileSync(fake, `
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
fs.appendFileSync(${JSON.stringify(agentLaunchCountPath)}, "launch\\n");
const workspace = process.argv[process.argv.indexOf("--workspace") + 1];
fs.writeFileSync(path.join(workspace, process.env.FAKE_TARGET ?? "allowed.txt"), process.env.FAKE_CONTENT ?? "after\\n");
if (process.env.FAKE_MODE === "commit") {
  execFileSync("git", ["-C", workspace, "add", "-A"]);
  execFileSync("git", ["-C", workspace, "commit", "-qm", "forbidden"]);
}
if (process.env.FAKE_MODE === "ref") execFileSync("git", ["-C", workspace, "checkout", "-qb", "forbidden-ref"]);
console.log(JSON.stringify({type:"result",result:"done"}));
`);

async function run(target = "allowed.txt", mode = "edit", checksPass = true, model = "composer-2.5", checkMutation = false, outputDirectory = output, isolationBoundary = "test-double", cursorFilesystemPolicy, remediationParent = null, selfTestPass = null, checkTimesOut = false, checkSignals = false) {
  const fixtureIdentity = crypto.createHash("sha256")
    .update(JSON.stringify({ target, mode, checksPass, model, checkMutation, outputDirectory, isolationBoundary, cursorFilesystemPolicy, selfTestPass, checkTimesOut, checkSignals }))
    .digest("hex")
    .slice(0, 16);
  const config = {
    schema_version: 1,
    experiment_id: "fixture",
    arm_id: remediationParent?.arm_id ?? `arm-${fixtureIdentity}`,
    run_nonce: `fixture-${fixtureIdentity}`,
    model,
    repository: repo,
    baseline_commit: baseline,
    prompt_path: promptPath,
    allowed_paths: ["allowed.txt"],
    allowed_ignored_paths: [],
    output_directory: outputDirectory,
    timeout_ms: 10000,
    check_timeout_ms: checkTimesOut ? 1000 : 10000,
    intervention_budget: 0,
    remediation_generation_budget: 1,
    visible_checks: [[process.execPath, "-e", checkTimesOut
      ? "setTimeout(() => process.exit(0), 10000)"
      : checkSignals
        ? "process.kill(process.pid, 'SIGTERM')"
        : "const fs=require('fs');process.exit(fs.readFileSync('allowed.txt','utf8')==='after\\n'?0:1)"]],
    held_out_checks: checkMutation
      ? [
          [process.execPath, "-e", "require('fs').writeFileSync('post-check-outside.txt','mutated\\n');process.exit(0)"],
          [process.execPath, "-e", "require('fs').rmSync('post-check-outside.txt',{force:true});process.exit(0)"],
        ]
      : [[process.execPath, "-e", "process.exit(0)"]],
    ...(selfTestPass !== null && {
      held_out_evaluator_self_tests: [[
        process.execPath,
        "-e",
        `process.exit(${selfTestPass ? 0 : 1})`,
        "--",
        "--proof-harness-self-test",
      ]],
    }),
    ...(remediationParent && {
      remediation_generation: remediationParent.remediation_generation + 1,
      remediation_parent_result_path: remediationParent.result_path,
      remediation_parent_result_sha256: sha256(fs.readFileSync(remediationParent.result_path)),
    }),
    ...(cursorFilesystemPolicy !== undefined && { cursor_filesystem_policy: cursorFilesystemPolicy }),
  };
  const configPath = path.join(fixture, `config-${target.replaceAll("/", "-")}.json`);
  fs.writeFileSync(configPath, JSON.stringify(config));
  const expectedConfigSha256 = `sha256:${crypto.createHash("sha256").update(fs.readFileSync(configPath)).digest("hex")}`;
  try {
    const result = await runBuilderArm(configPath, {
      expectedConfigSha256,
      agentExecutable: process.execPath,
      agentPrefixArgs: [fake],
      agentEnvironment: {
        FAKE_TARGET: target,
        FAKE_MODE: mode,
        FAKE_CONTENT: checksPass ? "after\n" : "needs-remediation\n",
      },
      agentVersion: "fixture-agent",
      isolationBoundary: isolationBoundary === null ? undefined : { enforcement: isolationBoundary },
    });
    return { status: 0, result, error: "" };
  } catch (error) {
    return { status: 1, result: error.result ?? null, error: error.message };
  }
}

const unisolated = await run("allowed.txt", "edit", true, "composer-2.5", false, output, null);
assert.equal(unisolated.status, 1);
assert.match(unisolated.error, /explicit trusted-host filesystem policy/i);
assert.equal(fs.existsSync(agentLaunchCountPath), false, "unisolated Composer must fail before agent launch");

const invalidOracle = await run(
  "allowed.txt",
  "edit",
  true,
  "composer-2.5",
  false,
  output,
  "test-double",
  undefined,
  null,
  false,
);
assert.equal(invalidOracle.status, 1);
assert.match(invalidOracle.error, /held-out evaluator semantic self-test/i);
assert.equal(fs.existsSync(agentLaunchCountPath), false, "an invalid held-out oracle must fail before agent launch");

const trustedHost = await run(
  "allowed.txt",
  "edit",
  true,
  "composer-2.5",
  false,
  output,
  null,
  "trusted-host-external-reads-allowed",
);
assert.equal(trustedHost.status, 0, trustedHost.error);
assert.equal(trustedHost.result.cursor_filesystem_policy, "trusted-host-external-reads-allowed");
assert.equal(trustedHost.result.filesystem_read_scope, "host-readable");
git("reset", "--hard", baseline);

const concurrentStarts = await Promise.all([run(), run()]);
const successfulStarts = concurrentStarts.filter((entry) => entry.status === 0);
assert.equal(successfulStarts.length, 1, "exactly one concurrent Composer start may claim the run identity");
assert.equal(fs.readFileSync(agentLaunchCountPath, "utf8"), "launch\nlaunch\n", "a losing concurrent start must fail before agent launch");
const good = successfulStarts[0];
assert.equal(good.status, 0, good.error);
const evidence = JSON.parse(fs.readFileSync(good.result.result_path, "utf8"));
assert.equal(evidence.status, "completed");
assert.equal(evidence.model, "composer-2.5");
assert.equal(evidence.changed_paths[0], "allowed.txt");
assert.equal(evidence.visible_checks[0].status, 0);
assert.equal(evidence.held_out_checks[0].status, 0);
assert.equal(evidence.intervention_budget, 0);
assert.equal(evidence.remediation_generation_budget, 1);
assert.equal(fs.existsSync(evidence.execution_claim_path), true);
assert.match(evidence.execution_claim_sha256, /^sha256:[a-f0-9]{64}$/);
assert.match(evidence.prompt_sha256, /^sha256:[a-f0-9]{64}$/);

git("reset", "--hard", baseline);
const repeated = await run();
assert.equal(repeated.status, 1);
assert.match(repeated.error, /already produced result evidence/i);
assert.equal(
  fs.readFileSync(path.join(repo, "allowed.txt"), "utf8"),
  "before\n",
  "a repeated run identity must be rejected before the agent mutates the repository",
);

const symlinkOutput = path.join(fixture, "symlink-output");
fs.symlinkSync(repo, symlinkOutput, "dir");
const symlinkEscaped = await run("allowed.txt", "edit", true, "composer-2.5", false, symlinkOutput);
assert.equal(symlinkEscaped.status, 1);
assert.match(symlinkEscaped.error, /output_directory.*outside|resolved.*inside.*repository/i);
assert.equal(git("status", "--porcelain"), "", "a symlinked evidence path must be rejected before repository mutation");

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
assert.equal(bad.result.status, "invalid-out-of-scope");
assert.equal(bad.result.visible_checks.length, 1);
assert.equal(bad.result.visible_checks[0].status, null);
assert.equal(bad.result.held_out_checks.length, 1);
assert.equal(bad.result.held_out_checks[0].status, null);

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
const timedOutCheck = await run("allowed.txt", "edit", true, "composer-2.5", false, output, "test-double", undefined, null, null, true);
assert.equal(timedOutCheck.status, 1);
assert.equal(timedOutCheck.result.status, "checks-failed");
assert.equal(timedOutCheck.result.visible_checks[0].status, null);
assert.equal(timedOutCheck.result.visible_checks[0].timed_out, true);
assert.equal(timedOutCheck.result.visible_checks[0].skipped, false);

git("reset", "--hard", baseline);
const signaledCheck = await run("allowed.txt", "edit", true, "composer-2.5", false, output, "test-double", undefined, null, null, false, true);
assert.equal(signaledCheck.status, 1);
assert.equal(signaledCheck.result.status, "checks-failed");
assert.equal(signaledCheck.result.visible_checks[0].status, null);
assert.equal(signaledCheck.result.visible_checks[0].signal, "SIGTERM");
assert.equal(signaledCheck.result.visible_checks[0].timed_out, false);
assert.equal(signaledCheck.result.visible_checks[0].skipped, false);

git("reset", "--hard", baseline);
const failedCheck = await run("allowed.txt", "edit", false);
assert.equal(failedCheck.status, 1);
assert.match(failedCheck.error, /checks-failed/);
assert.equal(failedCheck.result.status, "checks-failed");
assert.equal(failedCheck.result.remediation_generation, 0);
assert.equal(fs.existsSync(failedCheck.result.result_path), true, "failed checks must still emit a canonical result");
assert.equal(fs.existsSync(failedCheck.result.result_receipt_path), true, "failed checks must still emit a bound receipt");

const failedParentBytes = fs.readFileSync(failedCheck.result.result_path);
const failedParentReceiptBytes = fs.readFileSync(failedCheck.result.result_receipt_path);
const falselyCompletedParent = JSON.parse(failedParentBytes.toString("utf8"));
falselyCompletedParent.status = "completed";
fs.writeFileSync(failedCheck.result.result_path, `${JSON.stringify(falselyCompletedParent, null, 2)}\n`);
const falselyCompletedReceipt = JSON.parse(failedParentReceiptBytes.toString("utf8"));
falselyCompletedReceipt.result_sha256 = sha256(fs.readFileSync(failedCheck.result.result_path));
fs.writeFileSync(failedCheck.result.result_receipt_path, `${JSON.stringify(falselyCompletedReceipt, null, 2)}\n`);
const completedParentRemediation = await run("allowed.txt", "edit", true, "composer-2.5", false, output, "test-double", undefined, falselyCompletedParent);
assert.equal(completedParentRemediation.status, 1);
assert.match(completedParentRemediation.error, /only a checks-failed terminal result may be remediated/i);
fs.writeFileSync(failedCheck.result.result_path, failedParentBytes);
fs.writeFileSync(failedCheck.result.result_receipt_path, failedParentReceiptBytes);

fs.writeFileSync(path.join(repo, "allowed.txt"), "diverged-after-failure\n");
const divergentParentRemediation = await run("allowed.txt", "edit", true, "composer-2.5", false, output, "test-double", undefined, failedCheck.result);
assert.equal(divergentParentRemediation.status, 1);
assert.match(divergentParentRemediation.error, /does not match the exact terminal parent state/i);
fs.writeFileSync(path.join(repo, "allowed.txt"), "needs-remediation\n");

const remediatedCheck = await run(
  "allowed.txt",
  "edit",
  true,
  "composer-2.5",
  false,
  output,
  "test-double",
  undefined,
  failedCheck.result,
);
assert.equal(remediatedCheck.status, 0, remediatedCheck.error);
assert.equal(remediatedCheck.result.status, "completed");
assert.equal(remediatedCheck.result.remediation_generation, 1);
assert.equal(remediatedCheck.result.remediation_parent_result_path, failedCheck.result.result_path);
assert.equal(
  remediatedCheck.result.remediation_parent_result_sha256,
  sha256(fs.readFileSync(failedCheck.result.result_path)),
);
const overBudgetRemediation = await run(
  "allowed.txt",
  "edit",
  true,
  "composer-2.5",
  false,
  output,
  "test-double",
  undefined,
  remediatedCheck.result,
);
assert.equal(overBudgetRemediation.status, 1);
assert.match(overBudgetRemediation.error, /within the approved remediation budget/i);

git("reset", "--hard", baseline);
const selfTestBoundFailure = await run("allowed.txt", "edit", false, "composer-2.5", false, output, "test-double", undefined, null, true);
assert.equal(selfTestBoundFailure.status, 1, selfTestBoundFailure.error);
assert.notEqual(selfTestBoundFailure.result, null, selfTestBoundFailure.error);
assert.equal(selfTestBoundFailure.result.status, "checks-failed");
const droppedSelfTestRemediation = await run(
  "allowed.txt",
  "edit",
  true,
  "composer-2.5",
  false,
  output,
  "test-double",
  undefined,
  selfTestBoundFailure.result,
  null,
);
assert.equal(droppedSelfTestRemediation.status, 1);
assert.match(droppedSelfTestRemediation.error, /remediation parent control mismatch: held_out_evaluator_self_tests/i);

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
