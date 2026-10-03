import { DEFAULT_IGNORE } from "@adce/shared";
import type { AdceConfig } from "./schema.js";

export const defaultConfig = (): AdceConfig => {
  return {
    version: 1,
    ignore: [...DEFAULT_IGNORE],
    scan: {
      followSymlinks: false,
    },
    analytics: {
      enabled: false,
    },
  };
};
