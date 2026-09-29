import type { AnalyzeRequest } from "@adce/shared";

const SECRETISH =
  /(^|\/)(\.env|\.env\..*|credentials|secrets?|id_rsa|.*\.(pem|key|p12|pfx))$/i;

export const filterAnalyzeRequestForMl = (
  req: AnalyzeRequest,
): AnalyzeRequest => ({
  rootPath: req.rootPath,
  mode: req.mode,
  conflictIds: req.conflictIds,
  artifacts: req.artifacts
    .filter((a) => {
      const p = (a.path ?? "").replace(/\\/g, "/");
      return !SECRETISH.test(p);
    })
    .map((a) => ({
      id: a.id,
      path: a.path,
      name: a.name,
      type: a.type,
      verification: a.verification,
      health: a.health,
      authority: a.authority,
      contentHash: a.contentHash,
      excerpt: null,
    })),

  conflicts: req.conflicts.map((c) => ({
    id: c.id,
    category: c.category,
    lifecycle: c.lifecycle,
    confidence: c.confidence,
    severity: c.severity,
    sourceArtifactId: c.sourceArtifactId,
    targetArtifactId: c.targetArtifactId,
    summary: c.summary,
    evidence: null,
  })),
  relationships: req.relationships.map((r) => ({
    id: r.id,
    type: r.type,
    sourceArtifactId: r.sourceArtifactId,
    targetArtifactId: r.targetArtifactId,
    verification: r.verification,
  })),
});
