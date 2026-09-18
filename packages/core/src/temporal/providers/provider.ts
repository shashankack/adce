import type { ArtifactRecord, TemporalEvent } from "@adce/shared";
import type { AdceDb } from "@adce/storage";

export interface TemporalProviderContext {
  rootPath: string;
  artifact: ArtifactRecord;
  db: AdceDb;
}

export type TemporalProviderFn = (
  ctx: TemporalProviderContext,
) => Promise<TemporalEvent[]>;
