import path from "node:path";
import {
  parseJsonSchema,
  parseJsonValue,
  readTextFile,
  topLevelKeys,
} from "@adce/parsers";
import type { ArtifactRecord } from "@adce/shared";
import type { AdceDb } from "@adce/storage";
import { listArtifacts, upsertDetectedConflict } from "@adce/storage";

const stemName = (relativePath: string): string => {
  const base = path.posix.basename(relativePath.replace(/\\/g, "/"));
  return base
    .replace(/\.schema\.json$/i, "")
    .replace(/\.json$/i, "")
    .toLowerCase();
};

const isSchemaPath = (p: string): boolean =>
  /\.schema\.json$/i.test(p) || /\/schemas\//i.test(p.replace(/\\/g, "/"));

const isDataJsonPath = (artifact: ArtifactRecord): boolean => {
  if (!artifact.path) return false;
  const p = artifact.path.replace(/\\/g, "/");
  if (!p.toLowerCase().endsWith(".json")) return false;
  if (isSchemaPath(p)) return false;
  if (path.posix.basename(p).toLowerCase() === "package.json") return false;
  if (path.posix.basename(p).toLowerCase().startsWith("tsconfig")) return false;
  return (
    artifact.type === "CONFIGURATION" ||
    artifact.type === "UNKNOWN" ||
    artifact.type === "SCHEMA"
  );
};

/**
 * Pair *.schema.json with sibling JSON data (same stem). Missing required
 * properties → SCHEMA_MISMATCH.
 */
export const detectSchemaMismatches = async (
  db: AdceDb,
  rootPath: string,
): Promise<number> => {
  const artifacts = listArtifacts(db).filter((a) => a.path);
  const schemas = artifacts.filter(
    (a) =>
      a.path &&
      (a.type === "SCHEMA" || isSchemaPath(a.path)) &&
      a.path.toLowerCase().endsWith(".json"),
  );
  const dataFiles = artifacts.filter(isDataJsonPath);

  let upserted = 0;

  for (const schemaArt of schemas) {
    const schemaText = await readTextFile(path.join(rootPath, schemaArt.path!));
    if (schemaText == null) continue;
    const parsed = parseJsonSchema(schemaArt.path!, parseJsonValue(schemaText));
    if (!parsed || parsed.required.length === 0) continue;

    const schemaStem = stemName(schemaArt.path!);
    const partners = dataFiles.filter(
      (d) => d.id !== schemaArt.id && stemName(d.path!) === schemaStem,
    );

    for (const dataArt of partners) {
      const dataText = await readTextFile(path.join(rootPath, dataArt.path!));
      if (dataText == null) continue;
      const value = parseJsonValue(dataText);
      if (value == null) continue;
      const keys = new Set(topLevelKeys(value));
      const missing = parsed.required.filter((k) => !keys.has(k));
      if (missing.length === 0) continue;

      upsertDetectedConflict(db, {
        category: "SCHEMA_MISMATCH",
        confidence: "LIKELY",
        severity: missing.length >= 2 ? "HIGH" : "MEDIUM",
        sourceArtifactId: dataArt.id,
        targetArtifactId: schemaArt.id,
        relationshipId: null,
        summary: `Schema mismatch: ${dataArt.path} missing required [${missing.join(", ")}] from ${schemaArt.path}`,
        evidence: JSON.stringify({
          schemaPath: schemaArt.path,
          dataPath: dataArt.path,
          required: parsed.required,
          present: [...keys],
          missing,
        }),
      });
      upserted += 1;
    }
  }

  return upserted;
};
