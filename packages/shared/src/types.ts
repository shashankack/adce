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

export const TemporalProviders = [
  "filesystem",
  "adce_snapshot",
  "git",
] as const;
export type TemporalProvider = (typeof TemporalProviders)[number];

export interface TemporalEvent {
  at: string;
  provider: TemporalProvider;
  kind: string;
  summary: string;
  confidence: ConfidenceLevel;
  evidence: string | null;
}

export interface ArtifactHistoryReport {
  artifactId: string;
  artifactName: string;
  artifactPath: string | null;
  events: TemporalEvent[];
}

export const ConflictCategories = [
  "TEMPORAL_MISMATCH",
  "STRUCTURAL_MISMATCH",
  "SCHEMA_MISMATCH",
  "API_SPEC_MISMATCH",
  "CONFIGURATION_MISMATCH",
  "DEPENDENCY_MISMATCH",
  "TEST_MISMATCH",
  "DOCUMENTATION_MISMATCH",
  "SEMANTIC_CONFLICT",
] as const;
export type ConflictCategory = (typeof ConflictCategories)[number];

export const ConflictLifecycles = [
  "DETECTED",
  "ANALYZED",
  "CONFIRMED",
  "REJECTED",
  "RESOLVED",
  "IGNORED",
] as const;
export type ConflictLifecycle = (typeof ConflictLifecycles)[number];

export const ConflictSeverities = ["LOW", "MEDIUM", "HIGH"] as const;
export type ConflictSeverity = (typeof ConflictSeverities)[number];

export interface ConflictRecord {
  id: string;
  category: ConflictCategory;
  lifecycle: ConflictLifecycle;
  confidence: ConfidenceLevel;
  severity: ConflictSeverity;
  sourceArtifactId: string | null;
  targetArtifactId: string | null;
  relationshipId: string | null;
  summary: string;
  evidence: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContextArtifactView {
  id: string;
  name: string;
  path: string | null;
  type: ArtifactType;
  origin: ArtifactOrigin;
  verification: VerificationState;
  health: HealthState;
  authority: AuthorityLevel;
  score: number;
  reasons: string[];
}

export interface ContextBriefItem {
  id: string;
  path: string | null;
  name: string;
  type: string;
  score: number;
  reason: string;
}

export interface ContextCautionItem {
  conflictId: string;
  severity: ConflictSeverity;
  category: ConflictCategory;
  summary: string;
  artifactIds: string[];
}

export interface ContextBrief {
  mustRead: ContextBriefItem[];
  caution: ContextCautionItem[];
  trustOrder: ContextBriefItem[];
  alsoRelevant: ContextBriefItem[];
}

export interface ContextBundle {
  task: string | null;
  rootPath: string;
  generatedAt: string;
  artifacts: ContextArtifactView[];
  relationships: RelationshipRecord[];
  conflicts: ConflictRecord[];
  notes: string[];
  brief: ContextBrief;
}

export interface AnalyzeArtifactFeature {
  id: string;
  path: string | null;
  name: string;
  type: string;
  verification: string;
  health: string;
  authority: string;
  contentHash: string | null;
  // privacy-safe: prefer hash + short excerpt, not full file dumps by default
  excerpt?: string | null;
}

export interface AnalyzeConflictFeature {
  id: string;
  category: string;
  lifecycle: string;
  confidence: string;
  severity: string;
  sourceArtifactId: string | null;
  targetArtifactId: string | null;
  summary: string;
  evidence: string | null;
}
export interface AnalyzeRequest {
  rootPath: string;
  mode: "default" | "deep";
  conflictIds: string[] | null; // null = all open
  artifacts: AnalyzeArtifactFeature[];
  conflicts: AnalyzeConflictFeature[];
  relationships: Array<{
    id: string;
    type: string;
    sourceArtifactId: string;
    targetArtifactId: string;
    verification: string;
  }>;
}
export interface AnalyzeSuggestion {
  kind: "conflict_confidence" | "semantic_conflict" | "authority" | "note";
  conflictId?: string;
  artifactId?: string;
  targetArtifactId?: string;
  // proposed values — never auto-applied to closed human decisions
  confidence?: "POTENTIAL" | "LIKELY" | "CONFIRMED";
  severity?: "LOW" | "MEDIUM" | "HIGH";
  authority?:
    "CANONICAL" | "AUTHORITATIVE" | "SUPPORTING" | "INFERRED" | "UNKNOWN";
  summary?: string;
  score?: number; // 0..1
  reason: string;
  source: "heuristic" | "ml";
}
export interface AnalyzeReport {
  rootPath: string;
  generatedAt: string;
  mode: "default" | "deep";
  engine: "heuristic" | "ml" | "hybrid";
  suggestions: AnalyzeSuggestion[];
  notes: string[];
  cached: boolean;
}

export type StructureRequirementLevel = "required" | "recommended";

export interface StructureRule {
  id: string;
  level: StructureRequirementLevel;
  type: ArtifactType;
  pathGlob?: string;
  minCount?: number;
  description: string;
}

export interface StructureRelationshipRule {
  id: string;
  level: StructureRequirementLevel;
  relationshipType: RelationshipType;
  description: string;
  check: "test-naming-sibling" | "any-documents-edge";
}

export interface StructureProfile {
  id: string;
  name: string;
  description: string;
  rules: StructureRule[];
  relationshipRules?: StructureRelationshipRule[];
}

export type StructureFindingStatus =
  | "PRESENT"
  | "MISSING"
  | "SUGGESTED"
  | "WEAK";

export interface StructureFinding {
  ruleId: string;
  status: StructureFindingStatus;
  level: StructureRequirementLevel;
  summary: string;
  evidence?: string;
  hint?: string; // e.g. adce artifact add …
}
export interface StructureReport {
  rootPath: string;
  profileId: string;
  generatedAt: string;
  findings: StructureFinding[];
  summary: {
    present: number;
    missing: number;
    suggested: number;
    weak: number;
  };
}
