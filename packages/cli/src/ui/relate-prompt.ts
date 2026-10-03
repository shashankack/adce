import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import type { RelationshipSuggestion } from "@adce/core";

export type RelateChoice = "yes" | "no" | "skip" | "quit";

export const createRelateReadline = (): readline.Interface =>
  readline.createInterface({ input, output });

export const promptRelationshipSuggestion = async (
  s: RelationshipSuggestion,
  index: number,
  total: number,
  rl: readline.Interface,
): Promise<RelateChoice> => {
  console.log("");
  console.log(`Relationship suggestion ${index} / ${total}`);
  console.log("");
  console.log(`  ${s.sourcePath}`);
  console.log(`    --${s.type}-->`);
  console.log(`  ${s.targetPath}`);
  console.log("");
  console.log(
    `  score=${s.score.toFixed(2)}  confidence=${s.confidence}  via=${s.source}`,
  );
  console.log(`  ${s.reason}`);
  console.log("");
  console.log("  [y] Accept (link + verify)");
  console.log("  [n] Reject (won't suggest again)");
  console.log("  [s] Skip");
  console.log("  [q] Quit");
  console.log("");

  const answer = (await rl.question("Choice [y/n/s/q]: ")).trim().toLowerCase();
  if (answer === "y" || answer === "yes") return "yes";
  if (answer === "n" || answer === "no") return "no";
  if (answer === "q" || answer === "quit") return "quit";
  return "skip";
};
