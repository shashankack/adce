import { access } from "node:fs/promises";
import type {
  ArtifactRecord,
  RelationshipRecord,
  StructureFinding,
  StructureReport,
} from "@adce/shared";
import {
  closeDatabase,
  listArtifacts,
  listRelationships,
  openDatabase,
} from "@adce/storage";
import { AdceNotInitializedError } from "../artifacts/query.js";
import { adceDir, dbPath } from "../project/paths.js";
import { matchGlob } from "./match-glob.js";
import { DEFAULT_PROFILE_ID, PROFILES } from "./profiles.js";

const exists = async (p: string): Promise<boolean> => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

const KNOWLEDGE_TYPES = new Set([
  "REQUIREMENT",
  "DESIGN",
  "ARCHITECTURE",
  "DECISION",
  "POLICY",
  "SPECIFICATION",
  "SCHEMA",
  "API_SPEC",
]);

const structureHint = (type: string, pathGlob?: string): string => {
  if (type === "DOCUMENTATION" && pathGlob === "AGENTS.md") {
    return "Run adce init (creates AGENTS.md) or add the file manually";
  }
  if (KNOWLEDGE_TYPES.has(type)) {
    return `Add or fill a ${type} at ${pathGlob ?? type} (dev writes it, or prompt the agent to draft then review)`;
  }
  return `Add a ${type} artifact matching ${pathGlob ?? type}`;
};

const matchesRule = (
  artifacts: ArtifactRecord[],
  type: string,
  pathGlob?: string,
): ArtifactRecord[] =>
  artifacts.filter((a) => {
    if (a.type !== type) return false;
    if (!pathGlob) return true;
    if (!a.path) return false;
    return matchGlob(a.path, pathGlob);
  });

export const checkProjectStructure = async (
  rootPath: string,
  options: { profileId?: string } = {},
): Promise<StructureReport> => {
  if (!(await exists(adceDir(rootPath)))) {
    throw new AdceNotInitializedError(rootPath);
  }

  const profileId = options.profileId ?? DEFAULT_PROFILE_ID;
  const profile = PROFILES[profileId];
  if (!profile) {
    throw new Error(
      `Unknown structure profile "${profileId}". Available: ${Object.keys(PROFILES).join(", ")}`,
    );
  }

  const db = openDatabase(dbPath(rootPath));
  try {
    const artifacts = listArtifacts(db).filter(
      (a) => a.verification !== "REJECTED" && a.verification !== "IGNORED",
    );
    const relationships = listRelationships(db).filter(
      (r) => r.verification !== "REJECTED" && r.verification !== "IGNORED",
    );

    const findings: StructureFinding[] = [];

    for (const rule of profile.rules) {
      const matches = matchesRule(artifacts, rule.type, rule.pathGlob);
      const need = rule.minCount ?? 1;
      if (matches.length >= need) {
        findings.push({
          ruleId: rule.id,
          status: "PRESENT",
          level: rule.level,
          summary: rule.description,
          evidence: matches
            .map((m) => m.path ?? m.name)
            .slice(0, 5)
            .join(", "),
        });
      } else {
        findings.push({
          ruleId: rule.id,
          status: rule.level === "required" ? "MISSING" : "SUGGESTED",
          level: rule.level,
          summary: rule.description,
          hint: structureHint(rule.type, rule.pathGlob),
        });
      }
    }

    for (const rule of profile.relationshipRules ?? []) {
      if (rule.check === "test-naming-sibling") {
        findings.push(
          checkTestNamingSibling(rule.id, rule.level, rule.description, artifacts, relationships),
        );
      } else if (rule.check === "any-documents-edge") {
        findings.push(
          checkAnyDocumentsEdge(rule.id, rule.level, rule.description, artifacts, relationships),
        );
      }
    }

    return {
      rootPath,
      profileId: profile.id,
      generatedAt: new Date().toISOString(),
      findings,
      summary: {
        present: findings.filter((f) => f.status === "PRESENT").length,
        missing: findings.filter((f) => f.status === "MISSING").length,
        suggested: findings.filter((f) => f.status === "SUGGESTED").length,
        weak: findings.filter((f) => f.status === "WEAK").length,
      },
    };
  } finally {
    closeDatabase(db);
  }
};

const checkTestNamingSibling = (
  ruleId: string,
  level: StructureFinding["level"],
  description: string,
  artifacts: ArtifactRecord[],
  relationships: RelationshipRecord[],
): StructureFinding => {
  const tests = artifacts.filter((a) => a.type === "TEST" && a.path);
  if (tests.length === 0) {
    return {
      ruleId,
      status: level === "required" ? "MISSING" : "SUGGESTED",
      level,
      summary: description,
      hint: "Add tests first; scan will infer TESTS links for sibling sources",
    };
  }

  const testsEdges = relationships.filter((r) => r.type === "TESTS");
  const linkedTestIds = new Set(testsEdges.map((r) => r.sourceArtifactId));
  const unlinked = tests.filter((t) => !linkedTestIds.has(t.id));

  if (unlinked.length === 0) {
    return {
      ruleId,
      status: "PRESENT",
      level,
      summary: description,
      evidence: `${testsEdges.length} TESTS relationship(s)`,
    };
  }

  return {
    ruleId,
    status: "WEAK",
    level,
    summary: description,
    evidence: `Unlinked tests: ${unlinked
      .map((t) => t.path)
      .slice(0, 5)
      .join(", ")}`,
    hint: "Rename tests to match sources (foo.test.ts ↔ foo.ts) or adce link <test> <source> -t TESTS",
  };
};

const checkAnyDocumentsEdge = (
  ruleId: string,
  level: StructureFinding["level"],
  description: string,
  artifacts: ArtifactRecord[],
  relationships: RelationshipRecord[],
): StructureFinding => {
  const docs = artifacts.filter((a) => a.type === "DOCUMENTATION");
  if (docs.length === 0) {
    return {
      ruleId,
      status: level === "required" ? "MISSING" : "SUGGESTED",
      level,
      summary: description,
      hint: "Add documentation artifacts first",
    };
  }

  const docEdges = relationships.filter((r) => r.type === "DOCUMENTS");
  if (docEdges.length > 0) {
    return {
      ruleId,
      status: "PRESENT",
      level,
      summary: description,
      evidence: `${docEdges.length} DOCUMENTS relationship(s)`,
    };
  }

  return {
    ruleId,
    status: "WEAK",
    level,
    summary: description,
    evidence: "Documentation present but no DOCUMENTS edges",
    hint: "adce link <doc> <source> -t DOCUMENTS (or rely on scan inference)",
  };
};
