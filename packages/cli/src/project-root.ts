import { findAdceRoot } from "@adce/core";
import { log } from "./ui/logger.js";

export const resolveAdceRoot = async (cwd = process.cwd()): Promise<string> => {
  const resolution = await findAdceRoot(cwd);

  if (!resolution.sameAsCwd) {
    log.step(`Using ADCE project at ${resolution.rootPath}`);
  }
  return resolution.rootPath;
};
