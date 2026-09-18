import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const meta = sqliteTable("meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const artifacts = sqliteTable("artifacts", {
  id: text("id").primaryKey(),
  path: text("path"),
  name: text("name").notNull(),
  type: text("type").notNull(),
  origin: text("origin").notNull(),
  verification: text("verification").notNull(),
  health: text("health").notNull(),
  authority: text("authority").notNull(),
  contentHash: text("content_hash"),
  sizeBytes: integer("size_bytes"),
  mtimeMs: integer("mtime_ms"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const scans = sqliteTable("scans", {
  id: text("id").primaryKey(),
  mode: text("mode").notNull(),
  startedAt: text("started_at").notNull(),
  finishedAt: text("finished_at").notNull(),
  filesSeen: integer("files_seen").notNull(),
  artifactsUpserted: integer("artifacts_upserted").notNull(),
  unchanged: integer("unchanged").notNull(),
  changed: integer("changed").notNull(),
  added: integer("added").notNull(),
  removed: integer("removed").notNull(),
  gitDetected: integer("git_detected", { mode: "boolean" }).notNull(),
});

export const relationships = sqliteTable("relationships", {
  id: text("id").primaryKey(),
  sourceArtifactId: text("source_artifact_id").notNull(),
  targetArtifactId: text("target_artifact_id").notNull(),
  type: text("type").notNull(),
  origin: text("origin").notNull(),
  confidence: text("confidence").notNull(),
  verification: text("verification").notNull(),
  evidence: text("evidence"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const conflicts = sqliteTable("conflicts", {
  id: text("id").primaryKey(),
  category: text("category").notNull(),
  lifecycle: text("lifecycle").notNull(),
  confidence: text("confidence").notNull(),
  severity: text("severity").notNull(),
  sourceArtifactId: text("source_artifact_id"),
  targetArtifactId: text("target_artifact_id"),
  relationshipId: text("relationship_id"),
  summary: text("summary").notNull(),
  evidence: text("evidence"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
