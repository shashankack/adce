import { parse as parseYaml } from "yaml";
import type { ParsedEnvTemplate, ParsedNodeVersionFile, ParsedPackageManifest } from "./types.js";

export const parsePackageManifest = (
  filePath: string,
  value: unknown,
): ParsedPackageManifest | null => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  const engines =
    typeof record.engines === "object" &&
    record.engines !== null &&
    !Array.isArray(record.engines)
      ? (record.engines as Record<string, unknown>)
      : null;
  const enginesNode =
    engines && typeof engines.node === "string" ? engines.node : null;

  const deps =
    typeof record.dependencies === "object" &&
    record.dependencies !== null &&
    !Array.isArray(record.dependencies)
      ? Object.keys(record.dependencies as Record<string, unknown>).sort()
      : [];
  const devDeps =
    typeof record.devDependencies === "object" &&
    record.devDependencies !== null &&
    !Array.isArray(record.devDependencies)
      ? Object.keys(record.devDependencies as Record<string, unknown>).sort()
      : [];

  return {
    path: filePath,
    enginesNode,
    dependencies: deps,
    devDependencies: devDeps,
  };
};

export const parseEnvTemplate = (
  filePath: string,
  text: string,
): ParsedEnvTemplate => {
  const keys: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    keys.push(trimmed.slice(0, eq).trim());
  }
  return { path: filePath, keys: [...new Set(keys)].sort() };
};

export const parseNodeVersionFile = (
  filePath: string,
  text: string,
): ParsedNodeVersionFile | null => {
  const line = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith("#"));
  if (!line) return null;
  return { path: filePath, version: line.replace(/^v/i, "") };
};

export const parseYamlValue = (text: string): unknown => {
  try {
    return parseYaml(text);
  } catch {
    return null;
  }
};

/** Pull major version number from engines / nvmrc style strings. */
export const majorNodeVersion = (raw: string): number | null => {
  const match = raw.match(/(\d+)/);
  if (!match) return null;
  return Number(match[1]);
};
