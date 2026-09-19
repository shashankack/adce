import type { NamedImport, ParsedModule } from "./types.js";

const EXPORT_DECL =
  /\bexport\s+(?:async\s+)?(?:const|let|var|function|class|type|interface|enum)\s+([A-Za-z_$][\w$]*)/g;
const EXPORT_LIST = /\bexport\s*\{([^}]+)\}/g;
const IMPORT_NAMED =
  /\bimport\s*\{([^}]+)\}\s*from\s*["']([^"']+)["']/g;

const splitNames = (raw: string): string[] =>
  raw
    .split(",")
    .map((part) => {
      const cleaned = part.trim();
      if (!cleaned) return null;
      const asMatch = cleaned.match(/^([A-Za-z_$][\w$]*)\s+as\s+/i);
      if (asMatch) return asMatch[1]!;
      const ident = cleaned.match(/^([A-Za-z_$][\w$]*)/);
      return ident?.[1] ?? null;
    })
    .filter((n): n is string => Boolean(n));

/** Lightweight TS/JS symbol extraction — regex only, not a full parser. */
export const parseModuleSymbols = (
  filePath: string,
  source: string,
): ParsedModule => {
  const exports = new Set<string>();
  const namedImports: NamedImport[] = [];

  for (const match of source.matchAll(EXPORT_DECL)) {
    exports.add(match[1]!);
  }
  for (const match of source.matchAll(EXPORT_LIST)) {
    for (const name of splitNames(match[1]!)) exports.add(name);
  }

  for (const match of source.matchAll(IMPORT_NAMED)) {
    namedImports.push({
      moduleSpecifier: match[2]!,
      names: splitNames(match[1]!),
    });
  }

  return {
    path: filePath,
    exports: [...exports].sort(),
    namedImports,
  };
};

/** Normalize a relative import to a path stem for comparison. */
export const normalizeImportSpecifier = (specifier: string): string =>
  specifier
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/\.(js|jsx|mjs|cjs|ts|tsx)$/i, "");
