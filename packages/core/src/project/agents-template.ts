export const AGENTS_TEMPLATE = `# ADCE

This repository uses ADCE for artifact context management.

Before repository-level modifications:

1. Run \`adce status\`.
2. Run \`adce context --task "<current task>"\` (use \`--format markdown\` or \`json\` when useful).
3. Check open conflicts with \`adce conflicts\`.
4. Prefer VERIFIED and high-authority artifacts; treat CONFLICTING / stale docs with caution.
5. When you know trust order, set it: \`adce authority set <id> -l CANONICAL|AUTHORITATIVE|SUPPORTING\`.
`;
