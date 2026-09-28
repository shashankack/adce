export const ADCE_AGENTS_BEGIN = "<!-- BEGIN ADCE -->";
export const ADCE_AGENTS_END = "<!-- END ADCE -->";

/** Body inside the ADCE markers (no begin/end lines). */
export const AGENTS_SECTION_BODY = `## ADCE

This repository uses ADCE for artifact context management.

Before repository-level modifications:

1. Run \`adce status\`.
2. Run \`adce context --task "<current task>" --format markdown\`.
3. Read sections in order: MUST READ → CAUTION → TRUST ORDER → ALSO RELEVANT.
4. Do not trust CAUTION artifacts over TRUST ORDER / VERIFIED sources.
5. Run \`adce conflicts\` (and \`adce analyze\` if available) when CAUTION is non-empty.
6. Set known trust with \`adce authority set <id> -l CANONICAL|AUTHORITATIVE|SUPPORTING\`.
7. Run \`adce structure\` and fill MISSING / SUGGESTED gaps before large changes.
`;

/** Full file content when AGENTS.md does not exist yet. */
export const AGENTS_TEMPLATE = `${ADCE_AGENTS_BEGIN}
${AGENTS_SECTION_BODY.trimEnd()}
${ADCE_AGENTS_END}
`;

export type AgentsMdAction = "created" | "merged" | "updated" | "unchanged";

/** Paste into an already-open coding-agent chat after mid-project init. */
export const AGENT_SESSION_NUDGE = `ADCE is set up in this repository.

Before further edits, run:
  adce context --task "<current task>" --format markdown
Then follow MUST READ → CAUTION → TRUST ORDER.
Also run \`adce conflicts\` (and \`adce analyze --skip-ml\` if useful) when CAUTION is non-empty.`;

const markedBlock = (): string =>
  `${ADCE_AGENTS_BEGIN}\n${AGENTS_SECTION_BODY.trimEnd()}\n${ADCE_AGENTS_END}`;

/**
 * Ensure AGENTS.md contains the ADCE instruction block.
 * - Missing file → write full template
 * - Existing file without markers → append marked section
 * - Existing file with markers → replace block (keeps rest of file)
 */
export const mergeAgentsMarkdown = (
  existing: string | null,
): { content: string; action: AgentsMdAction } => {
  const block = markedBlock();

  if (existing == null) {
    return { content: `${block}\n`, action: "created" };
  }

  const begin = existing.indexOf(ADCE_AGENTS_BEGIN);
  const end = existing.indexOf(ADCE_AGENTS_END);

  if (begin !== -1 && end !== -1 && end > begin) {
    const before = existing.slice(0, begin);
    const after = existing.slice(end + ADCE_AGENTS_END.length);
    const next = `${before}${block}${after}`.replace(/\n{3,}/g, "\n\n");
    if (next === existing) {
      return { content: existing, action: "unchanged" };
    }
    return { content: next.endsWith("\n") ? next : `${next}\n`, action: "updated" };
  }

  // Already mentions ADCE checklist without markers — still append marked block once
  // so future inits can update it. Avoid duplicate if markers somehow partial.
  if (begin !== -1 || end !== -1) {
    // Broken markers: append a clean block at end
    const trimmed = existing.replace(/\s+$/u, "");
    return {
      content: `${trimmed}\n\n${block}\n`,
      action: "merged",
    };
  }

  const trimmed = existing.replace(/\s+$/u, "");
  return {
    content: `${trimmed}\n\n${block}\n`,
    action: "merged",
  };
};
