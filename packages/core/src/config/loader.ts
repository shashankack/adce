import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parse, stringify } from "yaml";
import { ADCE_CONFIG_FILE, ADCE_DIR, DEFAULT_IGNORE } from "@adce/shared";
import { defaultConfig } from "./defaults.js";
import { configSchema, type AdceConfig } from "./schema.js";

export const configPath = (rootPath: string): string =>
  path.join(rootPath, ADCE_DIR, ADCE_CONFIG_FILE);

export const writeDefaultConfig = async (
  rootPath: string,
): Promise<AdceConfig> => {
  const config = defaultConfig();
  await writeFile(configPath(rootPath), stringify(config), "utf8");
  return config;
};

/** Union project ignore with built-in defaults so older configs pick up new rules. */
export const mergeIgnoreWithDefaults = (projectIgnore: string[]): string[] => [
  ...new Set([...DEFAULT_IGNORE, ...projectIgnore]),
];

export const loadConfig = async (rootPath: string): Promise<AdceConfig> => {
  const raw = await readFile(configPath(rootPath), "utf8");
  const parsed = configSchema.parse(parse(raw));
  return {
    ...parsed,
    ignore: mergeIgnoreWithDefaults(parsed.ignore),
  };
};
