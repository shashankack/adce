export {
  initializeProject,
  type InitResult,
  type InitOptions,
} from "./project/initialize.js";
export { getProjectStatus } from "./project/status.js";
export {
  isAdceInitialized,
  AdceIncompleteError,
} from "./project/is-initialized.js";
export {
  scanProject,
  type ScanOptions,
  type ScanResult,
} from "./scanner/scan-project.js";
export { classifyArtifact } from "./artifacts/classifier.js";
export { loadConfig, writeDefaultConfig } from "./config/loader.js";
export type { AdceConfig } from "./config/schema.js";
export {
  discoverProjectRoot,
  type ProjectRootDiscovery,
  type RootEvidence,
} from "./project/discover-root.js";
export {
  listProjectArtifacts,
  getProjectArtifact,
  AdceNotInitializedError,
  ArtifactNotFoundError,
  AmbiguousArtifactIdError,
  type ListProjectArtifactsOptions,
} from "./artifacts/query.js";
export {
  verifyProjectArtifact,
  rejectProjectArtifact,
  ignoreProjectArtifact,
} from "./artifacts/verification.js";
export {
  setProjectArtifactAuthority,
  clearProjectArtifactAuthority,
  InvalidAuthorityLevelError,
} from "./artifacts/authority.js";
export {
  findAdceRoot,
  type AdceRootResolution,
} from "./project/find-adce-root.js";
export {
  runProjectDoctor,
  type DoctorCheck,
  type DoctorReport,
  type DoctorSeverity,
} from "./project/doctor.js";
export {
  AGENTS_TEMPLATE,
  mergeAgentsMarkdown,
  ADCE_AGENTS_BEGIN,
  ADCE_AGENTS_END,
  AGENT_SESSION_NUDGE,
  type AgentsMdAction,
} from "./project/agents-template.js";
export {
  CURSOR_ADCE_RULE_RELATIVE,
  CURSOR_ADCE_RULE_BODY,
  ensureCursorAdceRule,
  type CursorRuleAction,
} from "./project/cursor-rule.js";
export {
  ensureGitignoreAdce,
  gitignoreHasAdce,
  type GitignoreAdceAction,
} from "./project/gitignore-adce.js";

export {
  addManualArtifact,
  InvalidArtifactTypeError,
  ArtifactPathConflictError,
  type AddManualArtifactInput,
} from "./artifacts/manual-artifact.js";
export { listArtifactsForReview } from "./artifacts/review.js";
export {
  editProjectArtifact,
  ArtifactEditError,
  type EditProjectArtifactInput,
} from "./artifacts/edit-artifact.js";
export {
  listProjectRelationships,
  getProjectRelationship,
} from "./relationships/query.js";
export {
  linkProjectArtifacts,
  unlinkProjectRelationship,
  type LinkProjectArtifactsInput,
} from "./relationships/link.js";
export { listProjectGraph, type GraphEdgeView } from "./relationships/graph.js";
export {
  inferRelationshipCandidates,
  persistInferredRelationships,
  type InferredEdge,
} from "./relationships/infer.js";
export {
  InvalidRelationshipTypeError,
  RelationshipNotFoundError,
  AmbiguousRelationshipIdError,
  RelationshipExistsError,
  RelationshipSelfLinkError,
} from "./relationships/errors.js";
export { getArtifactHistory } from "./temporal/history.js";
export {
  listProjectConflicts,
  getProjectConflict,
  rejectProjectConflict,
  ignoreProjectConflict,
  confirmProjectConflict,
  resolveProjectConflict,
  detectProjectConflicts,
  ConflictNotFoundError,
  AmbiguousConflictIdError,
} from "./conflicts/query.js";
export { detectTemporalMismatches } from "./conflicts/detect-temporal.js";
export { detectStructuralMismatches } from "./conflicts/detect-structural.js";
export { detectSchemaMismatches } from "./conflicts/detect-schema.js";
export { detectConfigurationMismatches } from "./conflicts/detect-configuration.js";
export {
  buildProjectContext,
  type BuildContextOptions,
} from "./context/build-context.js";
export {
  compactBrief,
  estimateBriefTokens,
} from "./context/token-budget.js";
export {
  appendContextTokenMetric,
  contextTokenLogPath,
  type ContextTokenMetricEvent,
} from "./context/token-metrics-log.js";
export {
  analyzeProject,
  type AnalyzeProjectOptions,
} from "./analyze/analyze-project.js";
export { runProjectAnalyze } from "./analyze/run-analyze.js";
export { runHeuristicAnalyze } from "./analyze/heuristic.js";
export { runMlAnalyze } from "./analyze/ml-client.js";
export { runMlHttpAnalyze } from "./analyze/ml-http.js";
export { filterAnalyzeRequestForMl } from "./analyze/privacy.js";
export {
  postConflictFeedback,
  type ConflictFeedbackPayload,
  type FeedbackAction,
} from "./analyze/ml-feedback.js";
export { checkProjectStructure } from "./structure/check-structure.js";
export {
  fillStructureStubs,
  seedConcreteStructureStubs,
  type StructureFillResult,
} from "./structure/fill-structure.js";
export { packContextBrief } from "./context/ml-pack.js";
