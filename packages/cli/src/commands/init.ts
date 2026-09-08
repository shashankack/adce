import { discoverProjectRoot, initializeProject } from "@adce/core";
import { confirmInitRoot } from "../ui/confirm-init-root.js";

export interface RunInitOptions {
  /** Skip prompts; if mismatch, use detected root (or cwd if none). */
  yes?: boolean;
}

export const runInit = async (
  cwd = process.cwd(),
  options: RunInitOptions = {},
): Promise<void> => {
  const discovery = await discoverProjectRoot(cwd);

  let targetRoot = discovery.cwd;

  if (!discovery.sameAsCwd && discovery.detectedRoot) {
    if (options.yes) {
      targetRoot = discovery.detectedRoot;
      console.log(`Using detected project root: ${targetRoot} (from --yes)`);
    } else {
      const choice = await confirmInitRoot(discovery);
      if (choice === "cancel") {
        console.log("Init cancelled.");
        return;
      }
      targetRoot = choice === "root" ? discovery.detectedRoot : discovery.cwd;
    }
  } else if (!discovery.detectedRoot) {
    console.log(
      "No project root markers found. Initializing in current directory.",
    );
  }

  const result = await initializeProject(targetRoot);
  console.log(`Initialized ADCE in ${result.rootPath}`);
  console.log(`Git detected: ${result.gitDetected ? "yes" : "no"}`);
  if (!result.created.agentsMd) {
    console.log("AGENTS.md already existed — left unchanged.");
  }
};
