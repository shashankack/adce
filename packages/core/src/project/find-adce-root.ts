import { access } from "node:fs/promises";
import path from "node:path";
import { ADCE_DIR } from "@adce/shared";
import { AdceNotInitializedError } from "../artifacts/query.js";
import { AdceIncompleteError, isAdceInitialized } from "./is-initialized.js";

const exists = async (p: string): Promise<boolean> => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

export interface AdceRootResolution {
  cwd: string;
  rootPath: string;
  sameAsCwd: boolean;
}

export const findAdceRoot = async (
  startDir: string,
): Promise<AdceRootResolution> => {
  const cwd = path.resolve(startDir);
  let current = cwd;

  while (true) {
    const candidate = path.join(current, ADCE_DIR);
    if (await exists(candidate)) {
      if (await isAdceInitialized(current)) {
        return {
          cwd,
          rootPath: current,
          sameAsCwd: current === cwd,
        };
      }
      // Do not walk past a broken .adce — that would hide the problem.
      throw new AdceIncompleteError(current);
    }

    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new AdceNotInitializedError(cwd);
};
