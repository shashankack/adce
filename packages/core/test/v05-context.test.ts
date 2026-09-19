import { mkdtemp, cp, rm, utimes, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  AGENTS_TEMPLATE,
  buildProjectContext,
  clearProjectArtifactAuthority,
  confirmProjectConflict,
  getProjectArtifact,
  initializeProject,
  listProjectArtifacts,
  listProjectConflicts,
  resolveProjectConflict,
  scanProject,
  setProjectArtifactAuthority,
} from "@adce/core";

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

describe("v0.4 conflict lifecycle + health", () => {
  it("marks involved artifacts CONFLICTING and clears on resolve", async () => {
    const root = await copyFixture("basic-typescript");
    const old = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const recent = new Date();
    await utimes(path.join(root, "README.md"), old, old);
    await utimes(path.join(root, "src/index.ts"), recent, recent);

    await initializeProject(root);
    await scanProject({ rootPath: root });

    const [conflict] = await listProjectConflicts(root);
    expect(conflict).toBeDefined();

    const sourceId = conflict!.sourceArtifactId!;
    const targetId = conflict!.targetArtifactId!;
    expect((await getProjectArtifact(root, sourceId)).health).toBe(
      "CONFLICTING",
    );
    expect((await getProjectArtifact(root, targetId)).health).toBe(
      "CONFLICTING",
    );

    await confirmProjectConflict(root, conflict!.id.slice(0, 8));
    const afterConfirm = (await listProjectConflicts(root)).find(
      (c) => c.id === conflict!.id,
    );
    expect(afterConfirm?.lifecycle).toBe("CONFIRMED");

    // Resolve every open conflict so health can clear.
    for (const c of await listProjectConflicts(root)) {
      await resolveProjectConflict(root, c.id);
    }
    expect(await listProjectConflicts(root)).toHaveLength(0);
    expect((await getProjectArtifact(root, sourceId)).health).toBe("UNKNOWN");
    expect((await getProjectArtifact(root, targetId)).health).toBe("UNKNOWN");
  });
});

describe("v0.5 context engine", () => {
  it("builds ranked context and biases by task tokens", async () => {
    const root = await copyFixture("basic-typescript");
    await initializeProject(root);
    await scanProject({ rootPath: root });

    const general = await buildProjectContext(root);
    expect(general.artifacts.length).toBeGreaterThan(0);
    expect(general.relationships.length).toBeGreaterThan(0);

    const tasked = await buildProjectContext(root, {
      task: "update index source tests",
      budget: 8,
    });
    expect(tasked.task).toContain("index");
    const top = tasked.artifacts[0]!;
    expect(top.score).toBeGreaterThan(0);
    expect(
      tasked.artifacts.some(
        (a) => a.path === "src/index.ts" || a.path === "src/index.test.ts",
      ),
    ).toBe(true);
  });

  it("boosts CANONICAL authority in ranking and writes AGENTS.md guidance", async () => {
    const root = await copyFixture("basic-typescript");
    const init = await initializeProject(root);
    expect(init.created.agentsMd).toBe(true);
    const agentsMd = await readFile(path.join(root, "AGENTS.md"), "utf8");
    expect(agentsMd).toContain("adce context");
    expect(agentsMd).toContain("adce authority set");
    expect(AGENTS_TEMPLATE).toContain("--format markdown");

    await scanProject({ rootPath: root });
    const readme = (await listProjectArtifacts(root)).find(
      (a) => a.path === "README.md",
    )!;
    expect(readme).toBeDefined();

    const before = await buildProjectContext(root, { budget: 20 });
    const beforeScore =
      before.artifacts.find((a) => a.id === readme.id)?.score ?? 0;

    await setProjectArtifactAuthority(root, readme.id, "CANONICAL");
    expect((await getProjectArtifact(root, readme.id)).authority).toBe(
      "CANONICAL",
    );

    const after = await buildProjectContext(root, { budget: 20 });
    const afterView = after.artifacts.find((a) => a.id === readme.id)!;
    expect(afterView.score).toBeGreaterThan(beforeScore);
    expect(
      afterView.reasons.some((r) => r.includes("authority CANONICAL")),
    ).toBe(true);
    expect(
      after.notes.some((n) => n.includes("CANONICAL/AUTHORITATIVE")),
    ).toBe(true);

    await clearProjectArtifactAuthority(root, readme.id.slice(0, 8));
    expect((await getProjectArtifact(root, readme.id)).authority).toBe(
      "UNKNOWN",
    );
  });
});
