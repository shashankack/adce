import path from "node:path";
import {
  majorNodeVersion,
  parseJsonValue,
  parseNodeVersionFile,
  parsePackageManifest,
  readTextFile,
} from "@adce/parsers";
import type { AdceDb } from "@adce/storage";
import { listArtifacts, upsertDetectedConflict } from "@adce/storage";

const NODE_VERSION_FILES = [".nvmrc", ".node-version"];

/**
 * package.json engines.node vs .nvmrc / .node-version major mismatch
 * → CONFIGURATION_MISMATCH.
 */
export const detectConfigurationMismatches = async (
  db: AdceDb,
  rootPath: string,
): Promise<number> => {
  const artifacts = listArtifacts(db);
  const pkgArt = artifacts.find(
    (a) => a.path?.replace(/\\/g, "/") === "package.json",
  );
  if (!pkgArt?.path) return 0;

  const pkgText = await readTextFile(path.join(rootPath, pkgArt.path));
  if (pkgText == null) return 0;
  const manifest = parsePackageManifest(pkgArt.path, parseJsonValue(pkgText));
  if (!manifest?.enginesNode) return 0;

  const enginesMajor = majorNodeVersion(manifest.enginesNode);
  if (enginesMajor == null) return 0;

  let upserted = 0;

  for (const versionFile of NODE_VERSION_FILES) {
    const versionArt = artifacts.find(
      (a) => a.path?.replace(/\\/g, "/") === versionFile,
    );
    if (!versionArt?.path) continue;

    const text = await readTextFile(path.join(rootPath, versionArt.path));
    if (text == null) continue;
    const parsed = parseNodeVersionFile(versionArt.path, text);
    if (!parsed) continue;
    const fileMajor = majorNodeVersion(parsed.version);
    if (fileMajor == null || fileMajor === enginesMajor) continue;

    upsertDetectedConflict(db, {
      category: "CONFIGURATION_MISMATCH",
      confidence: "LIKELY",
      severity: "MEDIUM",
      sourceArtifactId: versionArt.id,
      targetArtifactId: pkgArt.id,
      relationshipId: null,
      summary: `Configuration mismatch: ${versionFile} pins Node ${fileMajor} but package.json engines.node is ${manifest.enginesNode}`,
      evidence: JSON.stringify({
        packagePath: pkgArt.path,
        versionFile,
        enginesNode: manifest.enginesNode,
        enginesMajor,
        fileVersion: parsed.version,
        fileMajor,
      }),
    });
    upserted += 1;
  }

  return upserted;
};
