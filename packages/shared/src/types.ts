export const ArtifactOrigins = ["DETECTED", "MANUAL", "IMPORTED"] as const;
export type ArtifactOrigin = (typeof ArtifactOrigins)[number];

export const VerificationStates = [
  "UNREVIEWED",
  "VERIFIED",
  "REJECTED",
  "IGNORED",
] as const;
export type VerificationState = (typeof VerificationStates)[number];

export const HealthStates = [
  "HEALTHY",
  "POTENTIALLY_STALE",
  "CONFLICTING",
  "UNKNOWN",
] as const;
export type HealthState = (typeof HealthStates)[number];

export const AuthorityLevels = [
  "CANONICAL",
  "AUTHORITATIVE",
  "SUPPORTING",
  "INFERRED",
  "UNKNOWN",
] as const;
export type AuthorityLevel = (typeof AuthorityLevels)[number];

export const ArtifactTypes = [
  "SOURCE",
  "TEST",
  "DOCUMENTATION",
  "REQUIREMENT",
  "DESIGN",
  "ARCHITECTURE",
  "DECISION",
  "CONSTRAINT",
  "POLICY",
  "SPECIFICATION",
  "SCHEMA",
  "MIGRATION",
  "API_SPEC",
  "CONFIGURATION",
  "DEPENDENCY_MANIFEST",
  "BUILD",
  "CI",
  "ENVIRONMENT_TEMPLATE",
  "UNKNOWN",
] as const;
export type ArtifactType = (typeof ArtifactTypes)[number];

export type ScanMode = "full" | "incremental";

export interface ProjectMeta {
  rootPath: string;
  createdAt: string;
  gitDetected: boolean;
  lastScanAt: string | null;
}

export interface ArtifactRecord {
  id: string;
  path: string | null;
  name: string;
  type: ArtifactType;
  origin: ArtifactOrigin;
  verification: VerificationState;
  health: HealthState;
  authority: AuthorityLevel;
  contentHash: string | null;
  sizeBytes: number | null;
  mtimeMs: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScanSummary {
  mode: ScanMode;
  startedAt: string;
  finishedAt: string;
  filesSeen: number;
  artifactsUpserted: number;
  unchanged: number;
  changed: number;
  added: number;
  removed: number;
  gitDetected: boolean;
}

export interface StatusReport {
  initialized: boolean;
  rootPath: string;
  gitDetected: boolean;
  createdAt: string | null;
  lastScanAt: string | null;
  artifactCount: number;
  lastScan: ScanSummary | null;
}

export const RelationshipTypes = [
  "DOCUMENTS",
  "IMPLEMENTS",
  "TESTS",
  "SPECIFIES",
  "CONFIGURES",
  "DEPENDS_ON",
  "GENERATED_FROM",
  "MIGRATES",
  "VALIDATES",
  "SUPERSEDES",
  "RELATED_TO",
] as const;
export type RelationshipType = (typeof RelationshipTypes)[number];

export const RelationshipOrigins = ["DETECTED", "MANUAL", "INFERRED"] as const;
export type RelationshipOrigin = (typeof RelationshipOrigins)[number];

export const ConfidenceLevels = ["POTENTIAL", "LIKELY", "CONFIRMED"] as const;
export type ConfidenceLevel = (typeof ConfidenceLevels)[number];

export interface RelationshipRecord {
  id: string;
  sourceArtifactId: string;
  targetArtifactId: string;
  type: RelationshipType;
  origin: RelationshipOrigin;
  confidence: ConfidenceLevel;
  verification: VerificationState;
  evidence: string | null;
  createdAt: string;
  updatedAt: string;
}
