import { initializeProject } from "@adce/core";

export const runInit = async (cwd = process.cwd()): Promise<void> => {
  const result = await initializeProject(cwd);
  console.log(`Initialized ADCE in ${result.rootPath}`);
  console.log(`Git detected: ${result.gitDetected ? "yes" : "no"}`);
  if (!result.created.agentsMd) {
    console.log("AGENTS.md already existed — left unchanged.");
  }
};
