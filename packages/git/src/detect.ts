import { access } from "node:fs/promises";
import path from "node:path";

// Detect if a directory is inside a git working tree

export const isGitRepository = async (roothPath: string): Promise<boolean> => {
  try {
    await access(path.join(roothPath, ".git"));
    return true;
  } catch {
    return false;
  }
};
