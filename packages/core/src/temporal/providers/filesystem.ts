import { access, stat } from "node:fs/promises";
import path from "node:path";
import type { TemporalEvent } from "@adce/shared";
import type { TemporalProviderFn } from "./provider.js";

const exists = async (p: string): Promise<boolean> => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

export const filesystemTemporalProvider: TemporalProviderFn = async ({
  rootPath,
  artifact,
}) => {
  const events: TemporalEvent[] = [];

  if (artifact.mtimeMs != null) {
    events.push({
      at: new Date(artifact.mtimeMs).toISOString(),
      provider: "filesystem",
      kind: "FILE_MTIME_RECORDED",
      summary: `Recorded file mtime for ${artifact.path ?? artifact.name}`,
      confidence: "LIKELY",
      evidence: `mtimeMs=${artifact.mtimeMs}`,
    });
  }

  if (artifact.path) {
    const absolute = path.join(rootPath, artifact.path);
    if (await exists(absolute)) {
      try {
        const live = await stat(absolute);
        const liveMs = Math.trunc(live.mtimeMs);
        if (artifact.mtimeMs == null || liveMs !== artifact.mtimeMs) {
          events.push({
            at: new Date(liveMs).toISOString(),
            provider: "filesystem",
            kind: "FILE_MTIME_LIVE",
            summary: `Live filesystem mtime for ${artifact.path}`,
            confidence: "POTENTIAL",
            evidence: `live mtimeMs=${liveMs}`,
          });
        }
      } catch {
        // ignore unreadable files
      }
    }
  }

  return events;
};
