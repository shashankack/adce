import type { ContextBrief } from "@adce/shared";

/** Rough agent-token estimate (chars / 4). Good enough for compaction feedback. */
export const estimateBriefTokens = (brief: ContextBrief): number => {
  const parts: string[] = [];
  for (const a of brief.mustRead) {
    parts.push(a.path ?? "", a.name, a.type, a.reason);
  }
  for (const c of brief.caution) {
    parts.push(c.severity, c.category, c.summary, c.conflictId);
  }
  for (const a of brief.trustOrder) {
    parts.push(a.path ?? "", a.name, a.reason);
  }
  for (const a of brief.alsoRelevant) {
    parts.push(a.path ?? "", a.name, a.type, a.reason);
  }
  return Math.ceil(parts.join(" ").length / 4);
};

/** Drop low-value sections and cap list sizes for smaller agent prompts. */
export const compactBrief = (
  brief: ContextBrief,
  opts?: { mustReadMax?: number; trustMax?: number; cautionMax?: number },
): ContextBrief => {
  const mustReadMax = opts?.mustReadMax ?? 3;
  const trustMax = opts?.trustMax ?? 3;
  const cautionMax = opts?.cautionMax ?? 5;
  return {
    mustRead: brief.mustRead.slice(0, mustReadMax).map((a) => ({
      ...a,
      reason: a.reason.split(";")[0]?.trim() || a.reason,
    })),
    caution: brief.caution.slice(0, cautionMax).map((c) => ({
      ...c,
      summary:
        c.summary.length > 120 ? `${c.summary.slice(0, 117)}...` : c.summary,
    })),
    trustOrder: brief.trustOrder.slice(0, trustMax).map((a) => ({
      ...a,
      reason: a.reason.split(";")[0]?.trim() || a.reason,
    })),
    // ALSO RELEVANT is the biggest token sink for agents — omit in compact mode
    alsoRelevant: [],
  };
};
