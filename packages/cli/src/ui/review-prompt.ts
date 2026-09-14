import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import type { ArtifactRecord } from "@adce/shared";

export type ReviewChoice = "verify" | "reject" | "skip" | "quit";

export const promptArtifactReview = async (
  artifact: ArtifactRecord,
  index: number,
  total: number,
  rl: readline.Interface,
): Promise<ReviewChoice> => {
  console.log("");
  console.log(`Artifact candidate ${index} / ${total}`);
  console.log("");
  console.log(`  ID:   ${artifact.id}`);
  console.log(`  Name: ${artifact.name}`);
  console.log(`  Path: ${artifact.path ?? "(none)"}`);
  console.log(`  Type: ${artifact.type}`);
  console.log("");
  console.log("  [v] Verify");
  console.log("  [r] Reject");
  console.log("  [s] Skip");
  console.log("  [q] Quit");
  console.log("");

  const answer = (await rl.question("Choice [v/r/s/q]: "))
    .trim()
    .toLowerCase();

  if (answer === "v") return "verify";
  if (answer === "r") return "reject";
  if (answer === "q") return "quit";
  return "skip";
};

export const createReviewReadline = (): readline.Interface =>
  readline.createInterface({ input, output });
