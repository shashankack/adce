import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdtemp, cp, rm, readFile, writeFile, access } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import {
  ADCE_AGENTS_FILE,
  ADCE_CONFIG_FILE,
  ADCE_DB_FILE,
  ADCE_DIR,
} from "@adce/shared";
import {
  closeDatabase,
  findArtifactByPath,
  getLatestScan,
  getMeta,
  openDatabase,
} from "@adce/storage";
import { getProjectStatus, initializeProject, scanProject } from "@adce/core";

const execFileAsync = promisify(execFile);
const repoRoot = fileURLToPath(new URL("../../..", import.meta.url));
const temps: string[] = [];

const exists = async (p: string): Promise<boolean> => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

const copyFixture = async (name: string): Promise<string> => {
  const dest = await mkdtemp(path.join(os.tmpdir(), `adce-${name}-`));
  temps.push(dest);
  await cp(path.join(repoRoot, "fixtures", name), dest, { recursive: true });
  return dest;
};

const sha256File = async (filePath: string): Promise<string> => {
  const buf = await readFile(filePath);
  return createHash("sha256").update(buf).digest("hex");
};

afterEach(async () => {
  await Promise.all(
    temps.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe("v0.1 init → scan → status", () => {
  it("initializes an empty project", async () => {
    const root = await copyFixture("empty-project");
    const result = await initializeProject(root);

    expect(result.gitDetected).toBe(false);
    expect(await exists(path.join(root, ADCE_DIR, ADCE_CONFIG_FILE))).toBe(true);
    expect(await exists(path.join(root, ADCE_DIR, ADCE_DB_FILE))).toBe(true);
    expect(await exists(path.join(root, ADCE_AGENTS_FILE))).toBe(true);
    expect(await exists(path.join(root, ADCE_DIR, "artifacts", "README.md"))).toBe(
      true,
    );
    expect(await exists(path.join(root, ADCE_DIR, "metrics"))).toBe(true);
    expect(result.created.artifactsReadme).toBe(true);
    expect(result.structureFill?.created.length).toBeGreaterThan(0);

    const scan = await scanProject({ rootPath: root });
    expect(scan.mode).toBe("full");
    expect(scan.gitDetected).toBe(false);
    expect(scan.filesSeen).toBeGreaterThanOrEqual(1);

    const status = await getProjectStatus(root);
    expect(status.initialized).toBe(true);
    expect(status.artifactCount).toBe(scan.added);
    expect(status.lastScanAt).toBe(scan.finishedAt);
  });

  it("works for a non-Git project", async () => {
    const root = await copyFixture("no-git");
    const init = await initializeProject(root);
    expect(init.gitDetected).toBe(false);

    const scan = await scanProject({ rootPath: root });
    expect(scan.gitDetected).toBe(false);
    expect(scan.added).toBeGreaterThan(0);

    const status = await getProjectStatus(root);
    expect(status.gitDetected).toBe(false);
    expect(status.initialized).toBe(true);
    expect(status.artifactCount).toBeGreaterThan(0);
    expect(status.lastScan).not.toBeNull();
  });

  it("works for a Git project", async () => {
    const root = await copyFixture("basic-typescript");
    await execFileAsync("git", ["init", "--quiet"], { cwd: root });

    const init = await initializeProject(root);
    expect(init.gitDetected).toBe(true);

    const scan = await scanProject({ rootPath: root });
    expect(scan.gitDetected).toBe(true);
    expect(scan.mode).toBe("full");

    const status = await getProjectStatus(root);
    expect(status.gitDetected).toBe(true);
    expect(status.lastScan?.gitDetected).toBe(true);
  });

  it("classifies artifacts, stores hashes, persists, and incremental-scans", async () => {
    const root = await copyFixture("basic-typescript");
    await initializeProject(root);

    const first = await scanProject({ rootPath: root });
    expect(first.mode).toBe("full");
    expect(first.added).toBe(first.filesSeen);
    expect(first.unchanged).toBe(0);

    const dbPath = path.join(root, ADCE_DIR, ADCE_DB_FILE);
    const db = openDatabase(dbPath);
    try {
      const source = findArtifactByPath(db, "src/index.ts");
      const testFile = findArtifactByPath(db, "src/index.test.ts");
      const docs = findArtifactByPath(db, "docs/overview.md");
      const manifest = findArtifactByPath(db, "package.json");
      const build = findArtifactByPath(db, "tsconfig.json");

      expect(source?.type).toBe("SOURCE");
      expect(testFile?.type).toBe("TEST");
      expect(docs?.type).toBe("DOCUMENTATION");
      expect(manifest?.type).toBe("DEPENDENCY_MANIFEST");
      expect(build?.type).toBe("BUILD");
      expect(source?.contentHash).toBe(
        await sha256File(path.join(root, "src/index.ts")),
      );
      expect(source?.contentHash).toMatch(/^[a-f0-9]{64}$/);

      const persistedScan = getLatestScan(db);
      const persistedRoot = getMeta(db, "rootPath");

      expect(persistedRoot).toBe(root);
      expect(persistedScan?.filesSeen).toBe(first.filesSeen);
      expect(persistedScan?.added).toBe(first.added);
    } finally {
      closeDatabase(db);
    }

    const afterRestart = await getProjectStatus(root);
    expect(afterRestart.initialized).toBe(true);
    expect(afterRestart.artifactCount).toBe(first.added);
    expect(afterRestart.lastScanAt).toBe(first.finishedAt);
    expect(afterRestart.lastScan?.mode).toBe("full");

    const second = await scanProject({ rootPath: root });
    expect(second.mode).toBe("incremental");
    expect(second.unchanged).toBe(first.filesSeen);
    expect(second.changed).toBe(0);
    expect(second.added).toBe(0);
    expect(second.artifactsUpserted).toBe(0);

    await writeFile(
      path.join(root, "src/index.ts"),
      'export const add = (a: number, b: number): number => a + b + 1;\n',
      "utf8",
    );

    const third = await scanProject({ rootPath: root });
    expect(third.mode).toBe("incremental");
    expect(third.changed).toBe(1);
    expect(third.unchanged).toBe(first.filesSeen - 1);
    expect(third.added).toBe(0);
  });
});
