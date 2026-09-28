import { AGENT_SESSION_NUDGE } from "@adce/core";

export const printAgentSessionNudge = (): void => {
  console.log("");
  console.log("If a coding agent is already mid-conversation, paste this:");
  console.log("────────────────────────────────────────────────────────");
  console.log(AGENT_SESSION_NUDGE);
  console.log("────────────────────────────────────────────────────────");
  console.log("New chats that load AGENTS.md will pick this up automatically.");
};
