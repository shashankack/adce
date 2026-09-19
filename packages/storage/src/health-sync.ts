import type { AdceDb } from "./database.js";
import { listArtifacts, setArtifactHealth } from "./artifact-repository.js";
import { listConflicts } from "./conflict-repository.js";

/**
 * Mark artifacts involved in open conflicts as CONFLICTING;
 * clear CONFLICTING when they no longer appear in open conflicts.
 */
export const syncArtifactHealthFromConflicts = (db: AdceDb): void => {
  const open = listConflicts(db, { includeClosed: false });
  const conflictingIds = new Set<string>();
  for (const c of open) {
    if (c.sourceArtifactId) conflictingIds.add(c.sourceArtifactId);
    if (c.targetArtifactId) conflictingIds.add(c.targetArtifactId);
  }

  for (const artifact of listArtifacts(db)) {
    const shouldConflict = conflictingIds.has(artifact.id);
    if (shouldConflict && artifact.health !== "CONFLICTING") {
      setArtifactHealth(db, artifact.id, "CONFLICTING");
    } else if (
      !shouldConflict &&
      artifact.health === "CONFLICTING"
    ) {
      setArtifactHealth(db, artifact.id, "UNKNOWN");
    }
  }
};
