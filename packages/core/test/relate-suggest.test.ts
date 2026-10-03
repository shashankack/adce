import { mkdir, mkdtemp, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  acceptRelationshipSuggestion,
  heuristicRelationshipSuggestions,
  initializeProject,
  listProjectRelationships,
  rejectRelationshipSuggestion,
  scanProject,
  suggestProjectRelationships,
} from "@adce/core";
import { closeDatabase, listArtifacts, openDatabase } from "@adce/storage";
import { dbPath } from "../src/project/paths.js";

const temps: string[] = [];

const makeProject = async (): Promise<string> => {
  const root = await mkdtemp(path.join(os.tmpdir(), "adce-relate-"));
  temps.push(root);
  await mkdir(path.join(root, "src"), { recursive: true });
  await mkdir(path.join(root, "docs"), { recursive: true });
  await writeFile(
    path.join(root, "package.json"),
    JSON.stringify({ name: "relate-fixture", version: "0.0.0" }),
  );
  await writeFile(path.join(root, "src", "checkout.ts"), "export const x = 1;\n");
  await writeFile(
    path.join(root, "docs", "checkout-flow.md"),
    "# Checkout flow\n",
  );
  await writeFile(path.join(root, "README.md"), "# relate fixture\n");
  return root;
};

afterEach(async () => {
  await Promise.all(
    temps.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe("relationship suggestions (adce relate)", () => {
  it("heuristics suggest DOCUMENTS on name overlap", async () => {
    const root = await makeProject();
    await initializeProject(root, { fillStructure: false });
    await scanProject({ rootPath: root, full: true });

    const db = openDatabase(dbPath(root));
    try {
      const artifacts = listArtifacts(db);
      const suggestions = heuristicRelationshipSuggestions(artifacts, [], 24);
      expect(
        suggestions.some(
          (s) =>
            s.type === "DOCUMENTS" &&
            s.sourcePath.includes("checkout-flow") &&
            s.targetPath.includes("checkout"),
        ),
      ).toBe(true);
    } finally {
      closeDatabase(db);
    }
  });

  it("accept verifies and reject tombstones; reject is not re-suggested", async () => {
    const root = await makeProject();
    await initializeProject(root, { fillStructure: false });
    await scanProject({ rootPath: root, full: true });

    const db = openDatabase(dbPath(root));
    let hit;
    let srcId: string;
    let tgtId: string;
    try {
      const arts = listArtifacts(db);
      // Build against empty existing so scan-inferred edges don't hide the candidate.
      hit = heuristicRelationshipSuggestions(arts, [], 24).find(
        (s) =>
          s.type === "DOCUMENTS" &&
          s.sourcePath.includes("checkout-flow") &&
          s.targetPath.includes("checkout"),
      );
      srcId = arts.find((a) => a.path?.includes("README"))!.id;
      tgtId = arts.find((a) => a.path?.includes("checkout.ts"))!.id;
    } finally {
      closeDatabase(db);
    }
    expect(hit).toBeDefined();

    await rejectRelationshipSuggestion(root, hit!);
    const afterReject = await listProjectRelationships(root);
    expect(
      afterReject.some(
        (r) =>
          r.sourceArtifactId === hit!.sourceArtifactId &&
          r.targetArtifactId === hit!.targetArtifactId &&
          r.type === hit!.type &&
          r.verification === "REJECTED",
      ),
    ).toBe(true);

    const again = await suggestProjectRelationships(root, {
      skipMl: true,
      limit: 24,
    });
    expect(
      again.suggestions.some(
        (s) =>
          s.sourceArtifactId === hit!.sourceArtifactId &&
          s.targetArtifactId === hit!.targetArtifactId &&
          s.type === hit!.type,
      ),
    ).toBe(false);

    const accepted = await acceptRelationshipSuggestion(root, {
      sourceArtifactId: srcId,
      targetArtifactId: tgtId,
      type: "DOCUMENTS",
      confidence: "LIKELY",
      reason: "test accept",
    });
    expect(accepted.verification).toBe("VERIFIED");
    expect(accepted.origin).toBe("DETECTED");
  });
});
