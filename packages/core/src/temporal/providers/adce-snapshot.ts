import type { TemporalEvent } from "@adce/shared";
import { listScans } from "@adce/storage";
import type { TemporalProviderFn } from "./provider.js";

export const adceSnapshotTemporalProvider: TemporalProviderFn = async ({
  artifact,
  db,
}) => {
  const events: TemporalEvent[] = [];

  events.push({
    at: artifact.createdAt,
    provider: "adce_snapshot",
    kind: "ARTIFACT_CREATED",
    summary: `Artifact recorded in ADCE (${artifact.origin})`,
    confidence: "CONFIRMED",
    evidence: `id=${artifact.id}`,
  });

  if (artifact.updatedAt !== artifact.createdAt) {
    events.push({
      at: artifact.updatedAt,
      provider: "adce_snapshot",
      kind: "ARTIFACT_UPDATED",
      summary: "Artifact row last updated",
      confidence: "CONFIRMED",
      evidence: null,
    });
  }

  const scans = listScans(db, 5);
  for (const scan of scans) {
    events.push({
      at: scan.finishedAt,
      provider: "adce_snapshot",
      kind: "SCAN_COMPLETED",
      summary: `ADCE ${scan.mode} scan completed`,
      confidence: "CONFIRMED",
      evidence: `filesSeen=${scan.filesSeen} changed=${scan.changed} added=${scan.added}`,
    });
  }

  return events;
};
