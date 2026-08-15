#!/usr/bin/env node
import path from "node:path";
import {
  processSolutionLearning,
  readSolutionLearningCandidate,
} from "./solution-learning.mjs";

const [candidatePath, repositoryRoot, solutionsDirectory, ...flags] =
  process.argv.slice(2);

if (!candidatePath || !repositoryRoot || !solutionsDirectory) {
  console.error(
    "usage: process-solution-learning.mjs <candidate.json> <repository-root> <solutions-directory> [--headless]",
  );
  process.exit(2);
}

const result = processSolutionLearning(
  readSolutionLearningCandidate(path.resolve(candidatePath)),
  {
    repositoryRoot: path.resolve(repositoryRoot),
    solutionsDirectory: path.resolve(solutionsDirectory),
    headless: flags.includes("--headless"),
  },
);

console.log(JSON.stringify(result, null, 2));
if (result.status === "rejected") process.exitCode = 1;
