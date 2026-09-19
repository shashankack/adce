import path from "node:path";
import {
  parseModuleSymbols,
  readTextFile,
} from "@adce/parsers";
import type { RelationshipRecord } from "@adce/shared";
import type { AdceDb } from "@adce/storage";
import { findArtifactById, upsertDetectedConflict } from "@adce/storage";

const resolveImportStem = (
  fromRelative: string,
  specifier: string,
): string | null => {
  if (!specifier.startsWith(".")) return null;
  const from = fromRelative.replace(/\\/g, "/");
  const dir = path.posix.dirname(from);
  const joined = path.posix.normalize(path.posix.join(dir, specifier));
  return joined.replace(/\.(js|jsx|mjs|cjs|ts|tsx)$/i, "");
};

const artifactStem = (relativePath: string): string =>
  relativePath.replace(/\\/g, "/").replace(/\.(js|jsx|mjs|cjs|ts|tsx)$/i, "");

/**
 * TESTS edges: named imports from the tested module that are not exported
 * → STRUCTURAL_MISMATCH (LIKELY). Never CONFIRMED from static parse alone.
 */
export const detectStructuralMismatches = async (
  db: AdceDb,
  rootPath: string,
  relationships: RelationshipRecord[],
): Promise<number> => {
  let upserted = 0;

  for (const rel of relationships) {
    if (rel.verification === "REJECTED" || rel.verification === "IGNORED") {
      continue;
    }
    if (rel.type !== "TESTS") continue;

    const testArt = findArtifactById(db, rel.sourceArtifactId);
    const sourceArt = findArtifactById(db, rel.targetArtifactId);
    if (!testArt?.path || !sourceArt?.path) continue;

    const testText = await readTextFile(path.join(rootPath, testArt.path));
    const sourceText = await readTextFile(path.join(rootPath, sourceArt.path));
    if (testText == null || sourceText == null) continue;

    const testMod = parseModuleSymbols(testArt.path, testText);
    const sourceMod = parseModuleSymbols(sourceArt.path, sourceText);
    const targetStem = artifactStem(sourceArt.path);
    const exportSet = new Set(sourceMod.exports);

    const missing: string[] = [];
    for (const imp of testMod.namedImports) {
      const stem = resolveImportStem(testArt.path, imp.moduleSpecifier);
      if (!stem || stem !== targetStem) continue;
      for (const name of imp.names) {
        if (!exportSet.has(name)) missing.push(name);
      }
    }

    if (missing.length === 0) continue;

    const uniqueMissing = [...new Set(missing)].sort();
    const testLabel = testArt.path;
    const sourceLabel = sourceArt.path;

    upsertDetectedConflict(db, {
      category: "STRUCTURAL_MISMATCH",
      confidence: "LIKELY",
      severity: uniqueMissing.length >= 3 ? "HIGH" : "MEDIUM",
      sourceArtifactId: testArt.id,
      targetArtifactId: sourceArt.id,
      relationshipId: rel.id,
      summary: `Structural mismatch: ${testLabel} imports [${uniqueMissing.join(", ")}] not exported by ${sourceLabel}`,
      evidence: JSON.stringify({
        testPath: testArt.path,
        sourcePath: sourceArt.path,
        missingExports: uniqueMissing,
        sourceExports: sourceMod.exports,
      }),
    });
    upserted += 1;
  }

  return upserted;
};
