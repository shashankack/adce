import { access } from "node:fs/promises";
import type {
  ArtifactRecord,
  AuthorityLevel,
  ContextArtifactView,
  ContextBrief,
  ContextBriefItem,
  ContextBundle,
  ContextCautionItem,
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

const AUTHORITY_BOOST: Record<AuthorityLevel, number> = {
  CANONICAL: 10,
  AUTHORITATIVE: 7,
  SUPPORTING: 2,
  INFERRED: 1,
  UNKNOWN: 0,
};

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

  const authBoost = AUTHORITY_BOOST[artifact.authority] ?? 0;
  if (authBoost > 0) {
    score += authBoost;
    reasons.push(`authority ${artifact.authority} (+${authBoost})`);
  }

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
    const hay =
      `${artifact.name} ${artifact.path ?? ""} ${artifact.type}`.toLowerCase();
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
    if (
      seedIds.has(rel.sourceArtifactId) ||
      seedIds.has(rel.targetArtifactId)
    ) {
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
    const highAuthority = selected.filter(
      (a) => a.authority === "CANONICAL" || a.authority === "AUTHORITATIVE",
    );
    if (highAuthority.length > 0) {
      notes.push(
        `Prefer high-authority artifacts (${highAuthority.length} CANONICAL/AUTHORITATIVE in selection).`,
      );
    }
    if (selectedConflicts.length > 0) {
      notes.push(
        "Treat CONFLICTING / open-conflict artifacts with caution; prefer VERIFIED sources.",
      );
    }

    const HIGH_AUTH = new Set(["CANONICAL", "AUTHORITATIVE"]);

    const toBriefItem = (
      a: ContextArtifactView,
      reason: string,
    ): ContextBriefItem => ({
      id: a.id,
      path: a.path,
      name: a.name,
      type: a.type,
      score: a.score,
      reason,
    });

    const mustRead = selected
      .filter(
        (a) =>
          a.health !== "CONFLICTING" &&
          (a.verification === "VERIFIED" ||
            HIGH_AUTH.has(a.authority) ||
            a.type === "SOURCE" ||
            a.type === "API_SPEC" ||
            a.type === "SCHEMA"),
      )
      .slice(0, Math.min(5, selected.length))
      .map((a) => {
        const bits: string[] = [];
        if (HIGH_AUTH.has(a.authority)) bits.push(`authority ${a.authority}`);
        if (a.verification === "VERIFIED") bits.push("verified");
        bits.push(`type ${a.type}`);
        return toBriefItem(a, bits.join("; "));
      });

    const mustIds = new Set(mustRead.map((m) => m.id));

    const trustOrder = selected
      .filter(
        (a) => HIGH_AUTH.has(a.authority) || a.verification === "VERIFIED",
      )
      .map((a) =>
        toBriefItem(
          a,
          a.authority !== "UNKNOWN"
            ? `prefer ${a.authority}`
            : "verified - prefer over unreviewed",
        ),
      );

    const caution: ContextCautionItem[] = selectedConflicts.map((c) => ({
      conflictId: c.id,
      severity: c.severity,
      category: c.category,
      summary: c.summary,
      artifactIds: [c.sourceArtifactId, c.targetArtifactId].filter(
        (id): id is string => Boolean(id),
      ),
    }));

    const alsoRelevant = selected
      .filter((a) => !mustIds.has(a.id))
      .map((a) => toBriefItem(a, a.reasons[0] ?? `score ${a.score}`));

    const brief: ContextBrief = {
      mustRead,
      caution,
      trustOrder,
      alsoRelevant,
    };

    notes.push(
      "Use brief.mustRead first; treat brief.caution as trust blockers until reviewed.",
    );

    return {
      task,
      rootPath,
      generatedAt: new Date().toISOString(),
      artifacts: selected,
      relationships: selectedRels,
      conflicts: selectedConflicts,
      notes,
      brief,
    };
  } finally {
    closeDatabase(db);
  }
};
