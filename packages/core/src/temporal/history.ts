import { access } from "node:fs/promises";
import type { ArtifactHistoryReport, TemporalEvent } from "@adce/shared";
import { closeDatabase, openDatabase } from "@adce/storage";
import {
  AdceNotInitializedError,
  resolveArtifactId,
} from "../artifacts/query.js";
import { adceDir, dbPath } from "../project/paths.js";
import { adceSnapshotTemporalProvider } from "./providers/adce-snapshot.js";
import { filesystemTemporalProvider } from "./providers/filesystem.js";
import { gitTemporalProvider } from "./providers/git.js";
import type { TemporalProviderFn } from "./providers/provider.js";

const exists = async (p: string): Promise<boolean> => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

const DEFAULT_PROVIDERS: TemporalProviderFn[] = [
  filesystemTemporalProvider,
  adceSnapshotTemporalProvider,
  gitTemporalProvider,
];

const sortEvents = (events: TemporalEvent[]): TemporalEvent[] =>
  [...events].sort((a, b) => {
    const byTime = b.at.localeCompare(a.at);
    if (byTime !== 0) return byTime;
    return a.provider.localeCompare(b.provider);
  });

export const getArtifactHistory = async (
  rootPath: string,
  idOrPrefix: string,
  providers: TemporalProviderFn[] = DEFAULT_PROVIDERS,
): Promise<ArtifactHistoryReport> => {
  if (!(await exists(adceDir(rootPath)))) {
    throw new AdceNotInitializedError(rootPath);
  }

  const db = openDatabase(dbPath(rootPath));
  try {
    const artifact = resolveArtifactId(db, idOrPrefix);
    const batches = await Promise.all(
      providers.map((provider) =>
        provider({ rootPath, artifact, db }).catch(() => [] as TemporalEvent[]),
      ),
    );
    const events = sortEvents(batches.flat());

    return {
      artifactId: artifact.id,
      artifactName: artifact.name,
      artifactPath: artifact.path,
      events,
    };
  } finally {
    closeDatabase(db);
  }
};
