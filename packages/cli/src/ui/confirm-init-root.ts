import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import type { ProjectRootDiscovery } from "@adce/core";

export type InitRootChoice = "root" | "cwd" | "cancel";

export const confirmInitRoot = async (
  discovery: ProjectRootDiscovery,
): Promise<InitRootChoice> => {
  const root = discovery.detectedRoot;
  const markers = discovery.evidence.map((e) => e.marker).join(", ");
  console.log("");
  console.log(`Current Directory: ${discovery.cwd}`);
  console.log(`Likely project root: ${root}`);
  console.log(`Evidence: ${markers}`);
  console.log("");
  console.log("Initialize ADCE where?");
  console.log(`  [r] project root (${root})`);
  console.log(`  [c] current directory (${discovery.cwd})`);
  console.log(`  [n] cancel`);
  console.log("");

  const rl = readline.createInterface({ input, output });
  try {
    const answer = (await rl.question("Choice [r/c/n]: "))
      .trim()
      .toLocaleLowerCase();

    if (answer === "r" || answer === "") return "root";
    if (answer === "c") return "cwd";
    return "cancel";
  } finally {
    rl.close();
  }
};
