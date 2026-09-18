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
  findAdceRoot,
  type AdceRootResolution,
} from "./project/find-adce-root.js";
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
  detectProjectConflicts,
  ConflictNotFoundError,
  AmbiguousConflictIdError,
} from "./conflicts/query.js";
export { detectTemporalMismatches } from "./conflicts/detect-temporal.js";
