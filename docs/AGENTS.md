# AGENTS.md

# ADCE Coding Agent Instructions

This repository implements **ADCE — Artifact-Driven Context Engine**, a temporal and conflict-aware context layer for AI coding agents.

Before making architectural or subsystem changes, read:

1. `ADCE_Complete_Project_Explanation.md`
2. `ADCE_Technical_Specification.md`
3. `ADCE_Project_Directory_and_Implementation_Plan.md`

Treat `ADCE_Technical_Specification.md` as the primary technical source of truth.

---

## Current Development Priority

The implementation order is:

```text
1. CLI foundation
2. Local deterministic engine
3. Artifact management
4. Relationships
5. Temporal engine
6. Deterministic conflict detection
7. Context engine
8. ML layer
9. Research benchmark
10. Cloud hardening
11. Analytics dashboard
```

Do not prioritize the dashboard before the CLI, local engine, ML layer, and research pipeline are stable.

---

## Architectural Rules

### CLI

CLI command handlers must remain thin.

Bad:

```ts
command("scan").action(async () => {
  // scanning, storage, Git, and conflict logic here
});
```

Good:

```ts
command("scan").action(async () => {
  const result = await scanProject(options);
  renderScanResult(result);
});
```

Reusable business logic belongs in the core packages.

---

## Main Package Responsibilities

```text
packages/cli
→ terminal interface only

packages/core
→ artifact, relationship, scanner, temporal,
  conflict, context, privacy, and project logic

packages/storage
→ SQLite persistence

packages/parsers
→ Tree-sitter and structural extraction

packages/git
→ Git-specific operations

packages/shared
→ shared contracts, schemas, constants

ml/
→ Python ML and semantic analysis
```

Avoid creating new packages unless there is a strong architectural reason.

---

## Core Invariants

Do not violate these rules:

1. ADCE must work without Git.
2. Artifacts do not require backing files.
3. Manual artifacts are first-class artifacts.
4. Human corrections must survive future scans.
5. Artifact health, verification, origin, and authority are independent fields.
6. Newer artifacts are not automatically authoritative.
7. Temporal mismatch does not automatically mean confirmed conflict.
8. ML is optional enhancement, not a dependency for local operation.
9. Repository contents must not be uploaded blindly.
10. The local privacy layer controls all outbound content.
11. Important findings must explain their evidence.
12. Important CLI commands should support structured JSON output.
13. Incremental scans should be preferred after the initial scan.
14. Human policy must not be silently overwritten by automatic inference.

---

## Artifact Model

Artifact origins:

```text
DETECTED
MANUAL
IMPORTED
```

Verification:

```text
UNREVIEWED
VERIFIED
REJECTED
```

Health:

```text
HEALTHY
POTENTIALLY_STALE
CONFLICTING
UNKNOWN
```

Authority:

```text
CANONICAL
AUTHORITATIVE
SUPPORTING
INFERRED
UNKNOWN
```

Initial artifact types include:

```text
SOURCE
TEST
DOCUMENTATION
REQUIREMENT
DESIGN
ARCHITECTURE
DECISION
CONSTRAINT
POLICY
SPECIFICATION
SCHEMA
MIGRATION
API_SPEC
CONFIGURATION
DEPENDENCY_MANIFEST
BUILD
CI
ENVIRONMENT_TEMPLATE
UNKNOWN
```

---

## Relationship Model

Initial relationship types:

```text
DOCUMENTS
IMPLEMENTS
TESTS
SPECIFIES
CONFIGURES
DEPENDS_ON
GENERATED_FROM
MIGRATES
VALIDATES
SUPERSEDES
RELATED_TO
```

Every inferred relationship should retain:

```text
origin
confidence
evidence
verification/rejection information
```

If a developer rejects a relationship, future scans must respect that rejection.

---

## Temporal Model

Temporal evidence may come from:

```text
Git
Filesystem metadata
ADCE snapshots
Developer input
```

Do not make Git a required dependency.

The temporal system should use providers so Git can be absent.

Preferred abstraction:

```text
GitTemporalProvider
FilesystemTemporalProvider
ADCESnapshotProvider
```

---

## Conflict Model

Initial conflict categories:

```text
TEMPORAL_MISMATCH
STRUCTURAL_MISMATCH
SCHEMA_MISMATCH
API_SPEC_MISMATCH
CONFIGURATION_MISMATCH
DEPENDENCY_MISMATCH
TEST_MISMATCH
DOCUMENTATION_MISMATCH
SEMANTIC_CONFLICT
```

Confidence:

```text
POTENTIAL
LIKELY
CONFIRMED
```

Lifecycle:

```text
DETECTED
ANALYZED
CONFIRMED / REJECTED
RESOLVED
IGNORED
```

Every conflict should retain evidence.

Do not convert weak temporal evidence into a confirmed contradiction.

---

## Scan Pipeline

Implement the scanner in this general order:

```text
Project detection
  ↓
File enumeration
  ↓
Ignore filtering
  ↓
Change detection
  ↓
Artifact classification
  ↓
Structural parsing
  ↓
Temporal evidence collection
  ↓
Relationship inference
  ↓
Deterministic conflict detection
  ↓
Snapshot creation
  ↓
Persistence
```

Support:

```text
first scan
incremental scan
full scan
branch change
configuration change
```

---

## Initial CLI Commands

The first stable vertical slice is:

```bash
adce init
adce scan
adce status
```

Then:

```bash
adce artifacts
adce artifact <id>
adce artifact add
adce artifacts review
```

Then:

```bash
adce graph
adce link
adce unlink
adce history
```

Then:

```bash
adce conflicts
adce conflict <id>
```

Then:

```bash
adce context
adce context --task "<task>"
```

Only after these are stable should the ML integration become a major focus.

---

## ML Rules

Binding detail: `docs/ADCE_Hybrid_Architecture_Lock.md`.

### Thesis

```text
ADCE owns repository intelligence (facts locally; judgment on ML server when available).
The coding agent owns implementation, guided by AGENTS.md + adce context/analyze.
```

### Runtime

```text
Local-first: scan / graph / conflicts / context must work without the ML server.
If ML is unreachable → heuristic analyze + local context (no hard failure).
```

### Project scope (academic + product)

```text
CLI-only is NOT the end architecture.
Ship a full ML HTTP service (embeddings, semantic conflicts, ranking, agent brief packing).
Local Python CLI script = temporary stand-in only; prefer ADCE_ML_URL → your Python FastAPI server.
Heavy models run on the server, not on every user machine.

Multi-language: root markers ≠ first-class. Depth on TS → Python → Go (or Java),
with local profiles/parsers first; ML upgrades judgment. See Architecture Lock §8b.
```

### ML server may handle

```text
Semantic artifact similarity
Relationship prediction
Semantic conflict detection
Authority ranking assistance
Conflict ranking
Confidence scoring
Context packing / agent brief enrichment
Optional later: bandit or RL ranking using human feedback rewards
```

### ML must not own

```text
Scanning
Git history
Persistence
Manual artifacts
Human overrides
Configuration
Basic deterministic conflicts
```

### Agent consumption

```text
AGENTS.md instructs the agent to run ADCE.
Final agent context comes from ADCE output (local baseline ± ML enrichment).
It must NOT be designed so the only possible agent prompt is whatever the API returns.
```

### Research comparisons

```text
Rule-based ADCE
ML-assisted ADCE
Hybrid ADCE
```

---

## Privacy Rules

Allowed by default:

```text
Hashes
Artifact types
Timestamps
Structural metadata
Derived features
```

Conditional:

```text
Selected code chunks
Selected documentation chunks
```

Forbidden by default:

```text
Entire repository
.env
Secrets
Credentials
Private keys
Unrelated files
```

Secret detection must run before semantic payloads are sent.

---

## Testing Expectations

New core behavior should include tests.

Use:

```text
Vitest
```

for TypeScript.

Use:

```text
pytest
```

for Python.

Use fixture repositories for:

```text
empty project
no Git
basic TypeScript project
manual artifacts
conflicting API
missing documentation
```

Do not rely only on mocks for scanner, filesystem, Git, and persistence behavior.

---

## Current Definition of Done for v0.1

v0.1 is complete when:

```text
✓ project can be initialized
✓ Git project works
✓ non-Git project works
✓ .adce/config.yaml is created
✓ .adce/state.db is created
✓ AGENTS.md is created
✓ files can be discovered
✓ basic artifacts can be classified
✓ file hashes are stored
✓ Git availability is detected
✓ scan results persist across process restart
✓ a second scan can distinguish unchanged files
✓ adce status reports stored project state
✓ automated tests pass
```

Do not expand scope before this vertical slice is reliable.
