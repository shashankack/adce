import { AdceNotInitializedError, listProjectGraph } from "@adce/core";
import { resolveAdceRoot } from "../project-root.js";
import { log } from "../ui/logger.js";

export const runGraph = async (cwd = process.cwd()): Promise<void> => {
  try {
    const rootPath = await resolveAdceRoot(cwd);
    const edges = await listProjectGraph(rootPath);

    if (edges.length === 0) {
      console.log("No relationships stored. Use `adce link` to create one.");
      return;
    }

    console.log(`Relationships (${edges.length}):`);
    console.log("");
    for (const edge of edges) {
      const { relationship: r } = edge;
      console.log(
        `${r.id} ${edge.sourceLabel} --${r.type}--> ${edge.targetLabel} (${r.origin}, ${r.verification})`,
      );
    }
    console.log("");
    console.log("Use `adce unlink <relationship-id>` to remove an edge.");
  } catch (error) {
    if (error instanceof AdceNotInitializedError) {
      log.error(error.message);
      return;
    }
    throw error;
  }
};
