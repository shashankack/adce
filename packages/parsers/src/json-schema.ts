import type { ParsedJsonSchema } from "./types.js";

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Extract required/property keys from a JSON Schema-like object. */
export const parseJsonSchema = (
  filePath: string,
  value: unknown,
): ParsedJsonSchema | null => {
  if (!isRecord(value)) return null;

  const looksLikeSchema =
    "$schema" in value ||
    value.type === "object" ||
    isRecord(value.properties) ||
    Array.isArray(value.required);

  if (!looksLikeSchema) return null;

  const properties = isRecord(value.properties)
    ? Object.keys(value.properties).sort()
    : [];
  const required = Array.isArray(value.required)
    ? value.required.filter((k): k is string => typeof k === "string").sort()
    : [];

  return { path: filePath, required, properties };
};

export const parseJsonValue = (text: string): unknown => {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
};

export const topLevelKeys = (value: unknown): string[] => {
  if (!isRecord(value)) return [];
  return Object.keys(value).sort();
};
