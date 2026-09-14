import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { ArtifactTypes, type ArtifactRecord } from "@adce/shared";

export type ReviewChoice =
  | "verify"
  | "reject"
  | "ignore"
  | "edit"
  | "skip"
  | "quit";

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
  console.log("  [e] Edit type");
  console.log("  [i] Ignore");
  console.log("  [r] Reject");
  console.log("  [s] Skip");
  console.log("  [q] Quit");
  console.log("");

  const answer = (await rl.question("Choice [v/e/i/r/s/q]: "))
    .trim()
    .toLowerCase();

  if (answer === "v") return "verify";
  if (answer === "e") return "edit";
  if (answer === "i") return "ignore";
  if (answer === "r") return "reject";
  if (answer === "q") return "quit";
  return "skip";
};

export const promptArtifactType = async (
  rl: readline.Interface,
  current: string,
): Promise<string | null> => {
  console.log(`Current type: ${current}`);
  console.log(`Allowed: ${ArtifactTypes.join(", ")}`);
  const answer = (await rl.question("New type (empty cancels): ")).trim();
  if (!answer) return null;
  return answer;
};

export const createReviewReadline = (): readline.Interface =>
  readline.createInterface({ input, output });
