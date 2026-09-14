import { access } from "node:fs/promises";
import path from "node:path";
import { ADCE_DIR } from "@adce/shared";
import { AdceNotInitializedError } from "../artifacts/query.js";

const exists = async (path: string): Promise<boolean> => {
  try {
    await access(path);
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
      return {
        cwd,
        rootPath: current,
        sameAsCwd: current === cwd,
      };
    }

    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new AdceNotInitializedError(cwd);
};
