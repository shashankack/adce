export { initializeProject, type InitResult } from "./project/initialize.js";
export { getProjectStatus } from "./project/status.js";
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
} from "./artifacts/query.js";
export {
  verifyProjectArtifact,
  rejectProjectArtifact,
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
