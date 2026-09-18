import { mkdtemp, cp, rm, utimes } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  initializeProject,
  listProjectConflicts,
  rejectProjectConflict,
  scanProject,
} from "@adce/core";
import {
  closeDatabase,
  findArtifactByPath,
  openDatabase,
} from "@adce/storage";
import { ADCE_DB_FILE, ADCE_DIR } from "@adce/shared";

const repoRoot = fileURLToPath(new URL("../../..", import.meta.url));
const temps: string[] = [];

const copyFixture = async (name: string): Promise<string> => {
  const dest = await mkdtemp(path.join(os.tmpdir(), `adce-${name}-`));
  temps.push(dest);
  await cp(path.join(repoRoot, "fixtures", name), dest, { recursive: true });
  return dest;
};

afterEach(async () => {
  await Promise.all(
    temps.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe("v0.4 conflicts", () => {
  it("detects documentation temporal mismatch when source is newer", async () => {
    const root = await copyFixture("basic-typescript");

    const old = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const recent = new Date();
    await utimes(path.join(root, "README.md"), old, old);
    await utimes(path.join(root, "src/index.ts"), recent, recent);

    await initializeProject(root);
    await scanProject({ rootPath: root });

    const open = await listProjectConflicts(root);
    const docConflict = open.find((c) => c.category === "DOCUMENTATION_MISMATCH");
    expect(docConflict).toBeDefined();
    expect(docConflict!.lifecycle).toBe("DETECTED");
    expect(["POTENTIAL", "LIKELY"]).toContain(docConflict!.confidence);
    expect(docConflict!.relationshipId).toBeTruthy();
  });

  it("does not recreate rejected conflicts on rescan", async () => {
    const root = await copyFixture("basic-typescript");

    const old = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const recent = new Date();
    await utimes(path.join(root, "README.md"), old, old);
    await utimes(path.join(root, "src/index.ts"), recent, recent);

    await initializeProject(root);
    await scanProject({ rootPath: root });

    const [conflict] = await listProjectConflicts(root);
    expect(conflict).toBeDefined();

    await rejectProjectConflict(root, conflict!.id.slice(0, 8));
    await scanProject({ rootPath: root });

    const open = await listProjectConflicts(root);
    expect(open.find((c) => c.id === conflict!.id)).toBeUndefined();

    const all = await listProjectConflicts(root, { includeClosed: true });
    const closed = all.find((c) => c.id === conflict!.id);
    expect(closed?.lifecycle).toBe("REJECTED");
  });

  it("detects stale test temporal mismatch", async () => {
    const root = await copyFixture("basic-typescript");

    const old = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);
    const recent = new Date();
    await utimes(path.join(root, "src/index.test.ts"), old, old);
    await utimes(path.join(root, "src/index.ts"), recent, recent);

    await initializeProject(root);
    await scanProject({ rootPath: root });

    // Ensure mtimes stuck in DB (scan should have read them)
    const db = openDatabase(path.join(root, ADCE_DIR, ADCE_DB_FILE));
    try {
      const testArt = findArtifactByPath(db, "src/index.test.ts");
      const src = findArtifactByPath(db, "src/index.ts");
      expect(testArt?.mtimeMs).toBeTruthy();
      expect(src?.mtimeMs).toBeTruthy();
      expect(src!.mtimeMs! - testArt!.mtimeMs!).toBeGreaterThan(
        24 * 60 * 60 * 1000,
      );
    } finally {
      closeDatabase(db);
    }

    const open = await listProjectConflicts(root);
    expect(open.some((c) => c.category === "TEST_MISMATCH")).toBe(true);
  });
});
