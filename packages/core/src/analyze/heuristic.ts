// packages/core/src/analyze/heuristic.ts
import type { AnalyzeRequest, AnalyzeSuggestion } from "@adce/shared";

export const runHeuristicAnalyze = (
  req: AnalyzeRequest,
): AnalyzeSuggestion[] => {
  const out: AnalyzeSuggestion[] = [];

  for (const c of req.conflicts) {
    if (
      c.lifecycle === "REJECTED" ||
      c.lifecycle === "IGNORED" ||
      c.lifecycle === "RESOLVED"
    ) {
      continue;
    }

    // Example: temporal + structural already LIKELY → nudge toward confirm-worthy
    if (
      (c.category === "STRUCTURAL_MISMATCH" ||
        c.category === "SCHEMA_MISMATCH") &&
      c.confidence === "LIKELY"
    ) {
      out.push({
        kind: "conflict_confidence",
        conflictId: c.id,
        confidence: "LIKELY",
        severity:
          c.severity === "LOW"
            ? "MEDIUM"
            : (c.severity as "LOW" | "MEDIUM" | "HIGH"),
        reason:
          "Deterministic structural/schema evidence already strong; human confirm recommended.",
        source: "heuristic",
        score: 0.75,
      });
    }

    if (
      c.category === "DOCUMENTATION_MISMATCH" &&
      c.confidence === "POTENTIAL"
    ) {
      out.push({
        kind: "note",
        conflictId: c.id,
        reason:
          "Temporal doc lag alone is weak; prefer ML semantic check or human review before CONFIRMED.",
        source: "heuristic",
        score: 0.4,
      });
    }
  }

  // Deep mode: suggest possible DOCUMENTS links by name token overlap (no ML)
  if (req.mode === "deep") {
    const docs = req.artifacts.filter((a) => a.type === "DOCUMENTATION");
    const sources = req.artifacts.filter((a) => a.type === "SOURCE");
    for (const d of docs) {
      for (const s of sources) {
        const dn = (d.path ?? d.name).toLowerCase();
        const sn = (s.path ?? s.name).toLowerCase();
        const token = sn
          .split("/")
          .pop()
          ?.replace(/\.\w+$/, "");
        if (token && token.length > 3 && dn.includes(token)) {
          out.push({
            kind: "note",
            artifactId: d.id,
            reason: `Name overlap suggests ${d.path ?? d.name} may document ${s.path ?? s.name}`,
            source: "heuristic",
            score: 0.55,
          });
        }
      }
    }
  }

  return out;
};
