import { mkdtemp, cp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  InvalidRelationshipTypeError,
  RelationshipExistsError,
  RelationshipSelfLinkError,
  initializeProject,
  linkProjectArtifacts,
  listProjectArtifacts,
  listProjectGraph,
  listProjectRelationships,
  scanProject,
  unlinkProjectRelationship,
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

describe("v0.3 relationships", () => {
  it("links two artifacts and lists graph", async () => {
    const root = await copyFixture("no-git");
    await initializeProject(root);
    await scanProject({ rootPath: root });

    const artifacts = await listProjectArtifacts(root);
    const source =
      artifacts.find((a) => a.path === "src/index.ts") ?? artifacts[0]!;
    const target =
      artifacts.find((a) => a.path === "README.md") ??
      artifacts.find((a) => a.id !== source.id)!;

    expect(target).toBeDefined();

    const rel = await linkProjectArtifacts(root, {
      sourceIdOrPrefix: source.id.slice(0, 8),
      targetIdOrPrefix: target!.id.slice(0, 8),
      type: "RELATED_TO",
    });

    expect(rel.origin).toBe("MANUAL");
    expect(rel.verification).toBe("VERIFIED");
    expect(rel.type).toBe("RELATED_TO");

    const all = await listProjectRelationships(root);
    expect(all.some((r) => r.id === rel.id && r.type === "RELATED_TO")).toBe(
      true,
    );

    const graph = await listProjectGraph(root);
    expect(graph.some((e) => e.relationship.id === rel.id)).toBe(true);
    expect(
      graph.find((e) => e.relationship.id === rel.id)?.sourceLabel,
    ).toBe(source.path);
    expect(
      graph.find((e) => e.relationship.id === rel.id)?.targetLabel,
    ).toBe(target!.path);
  });

  it("rejects duplicate edge", async () => {
    const root = await copyFixture("no-git");
    await initializeProject(root);
    await scanProject({ rootPath: root });

    const [a, b] = await listProjectArtifacts(root);
    expect(a).toBeDefined();
    expect(b).toBeDefined();

    await linkProjectArtifacts(root, {
      sourceIdOrPrefix: a!.id,
      targetIdOrPrefix: b!.id,
      type: "TESTS",
    });

    await expect(
      linkProjectArtifacts(root, {
        sourceIdOrPrefix: a!.id,
        targetIdOrPrefix: b!.id,
        type: "TESTS",
      }),
    ).rejects.toBeInstanceOf(RelationshipExistsError);
  });

  it("rejects self link and invalid type", async () => {
    const root = await copyFixture("no-git");
    await initializeProject(root);
    await scanProject({ rootPath: root });

    const [a, b] = await listProjectArtifacts(root);

    await expect(
      linkProjectArtifacts(root, {
        sourceIdOrPrefix: a!.id,
        targetIdOrPrefix: a!.id,
        type: "RELATED_TO",
      }),
    ).rejects.toBeInstanceOf(RelationshipSelfLinkError);

    await expect(
      linkProjectArtifacts(root, {
        sourceIdOrPrefix: a!.id,
        targetIdOrPrefix: b!.id,
        type: "NOT_A_TYPE",
      }),
    ).rejects.toBeInstanceOf(InvalidRelationshipTypeError);
  });

  it("unlinks by marking relationship REJECTED", async () => {
    const root = await copyFixture("no-git");
    await initializeProject(root);
    await scanProject({ rootPath: root });

    const [a, b] = await listProjectArtifacts(root);
    const rel = await linkProjectArtifacts(root, {
      sourceIdOrPrefix: a!.id,
      targetIdOrPrefix: b!.id,
      type: "RELATED_TO",
    });

    const rejected = await unlinkProjectRelationship(root, rel.id.slice(0, 8));
    expect(rejected.verification).toBe("REJECTED");

    const after = await listProjectRelationships(root);
    const row = after.find((r) => r.id === rel.id);
    expect(row?.verification).toBe("REJECTED");
  });

  it("infers DOCUMENTS and TESTS on basic-typescript scan", async () => {
    const root = await copyFixture("basic-typescript");
    await initializeProject(root);
    await scanProject({ rootPath: root });

    const artifacts = await listProjectArtifacts(root);
    const readme = artifacts.find((a) => a.path === "README.md");
    const source = artifacts.find((a) => a.path === "src/index.ts");
    const test = artifacts.find((a) => a.path === "src/index.test.ts");
    expect(readme).toBeDefined();
    expect(source).toBeDefined();
    expect(test).toBeDefined();

    const rels = await listProjectRelationships(root);
    const docs = rels.find(
      (r) =>
        r.type === "DOCUMENTS" &&
        r.sourceArtifactId === readme!.id &&
        r.targetArtifactId === source!.id,
    );
    expect(docs?.origin).toBe("DETECTED");
    expect(docs?.verification).toBe("UNREVIEWED");

    const tests = rels.find(
      (r) =>
        r.type === "TESTS" &&
        r.sourceArtifactId === test!.id &&
        r.targetArtifactId === source!.id,
    );
    expect(tests?.origin).toBe("DETECTED");
    expect(tests?.confidence).toBe("LIKELY");
  });

  it("does not recreate REJECTED relationships on rescan", async () => {
    const root = await copyFixture("basic-typescript");
    await initializeProject(root);
    await scanProject({ rootPath: root });

    const rels = await listProjectRelationships(root);
    const tests = rels.find((r) => r.type === "TESTS");
    expect(tests).toBeDefined();

    await unlinkProjectRelationship(root, tests!.id);
    await scanProject({ rootPath: root });

    const after = await listProjectRelationships(root);
    const again = after.find((r) => r.id === tests!.id);
    expect(again?.verification).toBe("REJECTED");
    expect(again?.origin).toBe("DETECTED");
  });
});
