import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

export const SAFE_ENVIRONMENT_NAMES = Object.freeze(["HOME", "LANG", "LC_ALL", "LOGNAME", "PATH", "SHELL", "TERM", "TMPDIR", "USER"]);

export function sha256(value) {
  return `sha256:${crypto.createHash("sha256").update(value).digest("hex")}`;
}

export function git(repository, args, encoding = "utf8", allowFailure = false) {
  const result = spawnSync("git", ["-C", repository, ...args], { encoding, maxBuffer: 128 * 1024 * 1024 });
  if (result.status !== 0 && !allowFailure) {
    throw new Error(`git ${args.join(" ")} failed: ${result.error?.message ?? String(result.stderr).trim()}`);
  }
  return result;
}

export function nulPaths(value) {
  return String(value).split("\0").filter(Boolean);
}

export function pathAllowed(target, allowed) {
  return allowed.some((entry) => target === entry || (entry.endsWith("/") && target.startsWith(entry)));
}

export function safeEnvironment(source = process.env) {
  return Object.fromEntries(SAFE_ENVIRONMENT_NAMES
    .filter((name) => typeof source[name] === "string")
    .map((name) => [name, source[name]]));
}

function resolveExecutable(executable, environment) {
  const candidates = path.isAbsolute(executable)
    ? [executable]
    : String(environment.PATH ?? "").split(path.delimiter).filter(Boolean).map((entry) => path.join(entry, executable));
  const found = candidates.find((candidate) => {
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      return fs.statSync(candidate).isFile();
    } catch {
      return false;
    }
  });
  if (!found) throw new Error(`cannot resolve evaluator executable: ${executable}`);
  return fs.realpathSync(found);
}

export function executionManifest(commands, environment) {
  const environmentNames = Object.keys(environment).sort();
  const environmentSha256 = sha256(Buffer.from(JSON.stringify(environmentNames.map((name) => [name, environment[name]]))));
  const checks = commands.map((command) => {
    const executablePath = resolveExecutable(command[0], environment);
    return {
      command,
      executable_path: executablePath,
      executable_sha256: sha256(fs.readFileSync(executablePath)),
    };
  });
  const manifest = { schema_version: 1, environment_names: environmentNames, environment_sha256: environmentSha256, checks };
  return { manifest, sha256: sha256(Buffer.from(JSON.stringify(manifest))) };
}

export function repositoryIdentity(repository) {
  const canonical = fs.realpathSync(repository);
  const resolveGitPath = (value) => fs.realpathSync(path.resolve(canonical, value));
  return {
    repository: canonical,
    git_common_dir: resolveGitPath(git(canonical, ["rev-parse", "--git-common-dir"]).stdout.trim()),
    git_dir: resolveGitPath(git(canonical, ["rev-parse", "--git-dir"]).stdout.trim()),
  };
}

export function changedPaths(repository, baseline) {
  return [...new Set([
    ...nulPaths(git(repository, ["diff", "--name-only", "-z", baseline], null).stdout),
    ...nulPaths(git(repository, ["ls-files", "--others", "--exclude-standard", "-z"], null).stdout),
  ])].sort();
}

export function ignoredStateSha256(repository, allowedIgnoredPaths) {
  const rows = [];
  for (const relative of nulPaths(git(repository, ["ls-files", "--others", "--ignored", "--exclude-standard", "-z"], null).stdout)) {
    if (pathAllowed(relative, allowedIgnoredPaths)) continue;
    const target = path.join(repository, relative);
    const stat = fs.lstatSync(target);
    const content = stat.isSymbolicLink() ? Buffer.from(fs.readlinkSync(target)) : fs.readFileSync(target);
    rows.push(`${relative}\0${stat.mode.toString(8)}\0${sha256(content)}`);
  }
  return sha256(rows.sort().join("\n"));
}

export function workingStateSha256(repository, paths) {
  const rows = paths.map((relative) => {
    const target = path.join(repository, relative);
    if (!fs.existsSync(target)) return `${relative}\0deleted`;
    const stat = fs.lstatSync(target);
    const content = stat.isSymbolicLink() ? Buffer.from(fs.readlinkSync(target)) : fs.readFileSync(target);
    return `${relative}\0${stat.mode.toString(8)}\0${sha256(content)}`;
  });
  return sha256(rows.join("\n"));
}

export function repositoryState(repository, baseline, allowedIgnoredPaths) {
  const head = git(repository, ["rev-parse", "HEAD"]).stdout.trim();
  const indexTree = git(repository, ["write-tree"]).stdout.trim();
  const refResult = git(repository, ["symbolic-ref", "-q", "HEAD"], "utf8", true);
  const ref = refResult.status === 0 ? refResult.stdout.trim() : "DETACHED";
  const refTarget = ref === "DETACHED" ? head : git(repository, ["rev-parse", ref]).stdout.trim();
  const paths = changedPaths(repository, baseline);
  return {
    head,
    index_tree: indexTree,
    ref,
    ref_target: refTarget,
    status_sha256: sha256(git(repository, ["status", "--porcelain=v1", "-z"], null).stdout),
    changed_paths: paths,
    ignored_state_sha256: ignoredStateSha256(repository, allowedIgnoredPaths),
    working_state_sha256: workingStateSha256(repository, paths),
  };
}

export function assertStateUnchanged(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label} mutated builder repository state`);
  }
}
