import { access } from "node:fs/promises";
import type {
  ArtifactRecord,
  ContextArtifactView,
  ContextBundle,
  RelationshipRecord,
} from "@adce/shared";
import {
  closeDatabase,
  listArtifacts,
  listConflicts,
  listRelationships,
  openDatabase,
} from "@adce/storage";
import { AdceNotInitializedError } from "../artifacts/query.js";
import { adceDir, dbPath } from "../project/paths.js";

const exists = async (p: string): Promise<boolean> => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

const DEFAULT_BUDGET = 12;

const tokenize = (task: string): string[] =>
  task
    .toLowerCase()
    .split(/[^a-z0-9_/.-]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);

const scoreArtifact = (
  artifact: ArtifactRecord,
  tokens: string[],
  conflictedIds: Set<string>,
): { score: number; reasons: string[] } => {
  let score = 0;
  const reasons: string[] = [];

  // Type prior
  const typeBoost: Record<string, number> = {
    SOURCE: 8,
    TEST: 5,
    API_SPEC: 7,
    SCHEMA: 6,
    REQUIREMENT: 6,
    DOCUMENTATION: 4,
    CONFIGURATION: 4,
    POLICY: 5,
  };
  const boost = typeBoost[artifact.type] ?? 2;
  score += boost;
  reasons.push(`type ${artifact.type} (+${boost})`);

  if (artifact.verification === "VERIFIED") {
    score += 4;
    reasons.push("verified (+4)");
  } else if (artifact.verification === "REJECTED") {
    score -= 20;
    reasons.push("rejected (−20)");
  } else if (artifact.verification === "IGNORED") {
    score -= 10;
    reasons.push("ignored (−10)");
  }

  if (artifact.health === "CONFLICTING") {
    score += 3;
    reasons.push("conflicting health (+3, surface caution)");
  }

  if (artifact.origin === "MANUAL") {
    score += 2;
    reasons.push("manual (+2)");
  }

  if (tokens.length > 0) {
    const hay = `${artifact.name} ${artifact.path ?? ""} ${artifact.type}`.toLowerCase();
    let hits = 0;
    for (const token of tokens) {
      if (hay.includes(token)) hits += 1;
    }
    if (hits > 0) {
      const taskBoost = hits * 6;
      score += taskBoost;
      reasons.push(`task token hits ${hits} (+${taskBoost})`);
    }
  }

  if (conflictedIds.has(artifact.id)) {
    score += 2;
    reasons.push("involved in open conflict (+2)");
  }

  return { score, reasons };
};

const relatedIds = (
  seedIds: Set<string>,
  relationships: RelationshipRecord[],
): Set<string> => {
  const out = new Set(seedIds);
  for (const rel of relationships) {
    if (rel.verification === "REJECTED" || rel.verification === "IGNORED") {
      continue;
    }
    if (seedIds.has(rel.sourceArtifactId) || seedIds.has(rel.targetArtifactId)) {
      out.add(rel.sourceArtifactId);
      out.add(rel.targetArtifactId);
    }
  }
  return out;
};

export interface BuildContextOptions {
  task?: string | null;
  budget?: number;
}

export const buildProjectContext = async (
  rootPath: string,
  options: BuildContextOptions = {},
): Promise<ContextBundle> => {
  if (!(await exists(adceDir(rootPath)))) {
    throw new AdceNotInitializedError(rootPath);
  }

  const budget = options.budget ?? DEFAULT_BUDGET;
  const task = options.task?.trim() || null;
  const tokens = task ? tokenize(task) : [];

  const db = openDatabase(dbPath(rootPath));
  try {
    const artifacts = listArtifacts(db);
    const relationships = listRelationships(db).filter(
      (r) => r.verification !== "REJECTED" && r.verification !== "IGNORED",
    );
    const conflicts = listConflicts(db, { includeClosed: false });

    const conflictedIds = new Set<string>();
    for (const c of conflicts) {
      if (c.sourceArtifactId) conflictedIds.add(c.sourceArtifactId);
      if (c.targetArtifactId) conflictedIds.add(c.targetArtifactId);
    }

    const scored: ContextArtifactView[] = artifacts
      .filter((a) => a.verification !== "REJECTED")
      .map((artifact) => {
        const { score, reasons } = scoreArtifact(
          artifact,
          tokens,
          conflictedIds,
        );
        return {
          id: artifact.id,
          name: artifact.name,
          path: artifact.path,
          type: artifact.type,
          origin: artifact.origin,
          verification: artifact.verification,
          health: artifact.health,
          authority: artifact.authority,
          score,
          reasons,
        };
      })
      .sort((a, b) => b.score - a.score);

    // Keep top budget, then expand once via relationships
    const top = scored.slice(0, Math.max(1, budget));
    const seedIds = new Set(top.map((a) => a.id));
    const expandedIds = relatedIds(seedIds, relationships);

    const selectedMap = new Map<string, ContextArtifactView>();
    for (const view of scored) {
      if (seedIds.has(view.id) || expandedIds.has(view.id)) {
        selectedMap.set(view.id, view);
      }
    }
    // Cap after expansion
    const selected = [...selectedMap.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, budget + 6);

    const selectedIds = new Set(selected.map((a) => a.id));
    const selectedRels = relationships.filter(
      (r) =>
        selectedIds.has(r.sourceArtifactId) &&
        selectedIds.has(r.targetArtifactId),
    );
    const selectedConflicts = conflicts.filter(
      (c) =>
        (c.sourceArtifactId && selectedIds.has(c.sourceArtifactId)) ||
        (c.targetArtifactId && selectedIds.has(c.targetArtifactId)),
    );

    const notes: string[] = [];
    if (task) notes.push(`Task filter: "${task}"`);
    notes.push(
      `Selected ${selected.length} artifacts, ${selectedRels.length} relationships, ${selectedConflicts.length} open conflicts.`,
    );
    if (selectedConflicts.length > 0) {
      notes.push(
        "Treat CONFLICTING / open-conflict artifacts with caution; prefer VERIFIED sources.",
      );
    }

    return {
      task,
      rootPath,
      generatedAt: new Date().toISOString(),
      artifacts: selected,
      relationships: selectedRels,
      conflicts: selectedConflicts,
      notes,
    };
  } finally {
    closeDatabase(db);
  }
};
