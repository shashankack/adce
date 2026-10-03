import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StructureFinding, StructureReport } from "@adce/shared";
import { PROFILES } from "./profiles.js";

export interface StructureFillResult {
  created: string[];
  skipped: string[];
}

const STUB_BODIES: Record<string, string> = {
  "README.md": "# Project\n\nStub created by `adce structure --fix`.\n",
  "AGENTS.md":
    "# Agent notes\n\nStub created by `adce structure --fill`.\n\nUse `adce context` before large edits.\n",
  "tsconfig.json": '{\n  "compilerOptions": {\n    "strict": true\n  }\n}\n',
  "package.json":
    '{\n  "name": "project",\n  "private": true,\n  "version": "0.0.0"\n}\n',
  "openapi.yaml":
    "openapi: 3.0.3\ninfo:\n  title: API\n  version: 0.0.0\npaths: {}\n",
  "go.mod": "module example.com/project\n\ngo 1.22\n",
  "pyproject.toml":
    '[project]\nname = "project"\nversion = "0.0.0"\nrequires-python = ">=3.11"\n',
  "requirements.txt": "# stub\n",
};

/** Map a simple pathGlob (no wildcards / braces) to a stub relative path. */
const concreteStubPath = (pathGlob: string | undefined): string | null => {
  if (!pathGlob) return null;
  if (/[*?{[]/.test(pathGlob)) return null;
  return pathGlob.replace(/\\/g, "/");
};

const RULE_STUB_PATHS: Record<string, string> = {
  readme: "README.md",
  agents: "AGENTS.md",
  tsconfig: "tsconfig.json",
  manifest: "package.json",
  openapi: "openapi.yaml",
};

const writeStubIfMissing = async (
  rootPath: string,
  rel: string,
  ruleId: string,
): Promise<"created" | "exists"> => {
  const abs = path.join(rootPath, ...rel.split("/"));
  await mkdir(path.dirname(abs), { recursive: true });
  const body =
    STUB_BODIES[path.posix.basename(rel)] ?? `# Stub for ${ruleId}\n`;
  try {
    await writeFile(abs, body, { flag: "wx" });
    return "created";
  } catch {
    return "exists";
  }
};

/**
 * Create minimal stub files for MISSING/SUGGESTED findings with concrete paths.
 * Skips wildcard rules (src/**, tests, …) — those need real content.
 */
export const fillStructureStubs = async (
  rootPath: string,
  report: StructureReport,
): Promise<StructureFillResult> => {
  const profile = PROFILES[report.profileId];
  const created: string[] = [];
  const skipped: string[] = [];
  if (!profile) return { created, skipped };

  const rulesById = new Map(profile.rules.map((r) => [r.id, r]));
  const targets = report.findings.filter(
    (f: StructureFinding) =>
      f.status === "MISSING" || f.status === "SUGGESTED",
  );

  for (const finding of targets) {
    const rule = rulesById.get(finding.ruleId);
    const rel =
      concreteStubPath(rule?.pathGlob) ??
      RULE_STUB_PATHS[finding.ruleId] ??
      null;
    if (!rel) {
      skipped.push(finding.ruleId);
      continue;
    }
    const result = await writeStubIfMissing(rootPath, rel, finding.ruleId);
    if (result === "created") created.push(rel);
    else skipped.push(`${finding.ruleId} (exists)`);
  }

  return { created, skipped };
};

/**
 * Seed concrete structure stubs from a profile using the filesystem only
 * (no scan / DB required). Used by `adce init`.
 */
export const seedConcreteStructureStubs = async (
  rootPath: string,
  profileId: string = "typescript-lib",
): Promise<StructureFillResult> => {
  const profile = PROFILES[profileId];
  const created: string[] = [];
  const skipped: string[] = [];
  if (!profile) return { created, skipped };

  for (const rule of profile.rules) {
    const rel =
      concreteStubPath(rule.pathGlob) ?? RULE_STUB_PATHS[rule.id] ?? null;
    if (!rel) {
      skipped.push(rule.id);
      continue;
    }
    const result = await writeStubIfMissing(rootPath, rel, rule.id);
    if (result === "created") created.push(rel);
    else skipped.push(`${rule.id} (exists)`);
  }

  return { created, skipped };
};
