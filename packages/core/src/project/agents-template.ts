export const AGENTS_TEMPLATE = `# ADCE

This repository uses ADCE for artifact context management.

Before repository-level modifications:

1. Run \`adce status\`.
2. Run \`adce context --task "<current task>" --format markdown\`.
3. Read sections in order: MUST READ → CAUTION → TRUST ORDER → ALSO RELEVANT.
4. Do not trust CAUTION artifacts over TRUST ORDER / VERIFIED sources.
5. Run \`adce conflicts\` (and \`adce analyze\` if available) when CAUTION is non-empty.
6. Set known trust with \`adce authority set <id> -l CANONICAL|AUTHORITATIVE|SUPPORTING\`.
`;
