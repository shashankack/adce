# ADCE Technical Specification

## 1. Purpose

ADCE (Artifact-Driven Context Engine) is a temporal and conflict-aware context layer for AI coding agents.

Its job is to build a structured model of a software project, identify important artifacts and their relationships, track how they evolve, detect inconsistencies, and generate reliable task-specific context for coding agents.

ADCE is **not** a coding agent itself.

---

## 2. Core System Flow

```text
Project
  ↓
Artifact Discovery
  ↓
Artifact Classification
  ↓
Relationship Graph
  ↓
Temporal Evidence
  ↓
Conflict Detection
  ↓
Authority Assessment
  ↓
Optional ML Analysis
  ↓
Context Generation
  ↓
Coding Agent
```

The system must remain useful without ML, Git, documentation, or a well-structured repository.

---

## 3. Main Architecture

### Local Engine

Runs inside the developer's environment.

Responsibilities:

- CLI
- repository discovery
- file scanning
- ignore rules
- hashing
- incremental scans
- artifact discovery
- artifact classification
- AST parsing
- Git inspection when available
- filesystem temporal evidence
- ADCE-native snapshots
- manual artifact management
- relationship management
- deterministic conflict detection
- authority rules
- local SQLite state
- privacy filtering
- secret detection
- local context generation
- cloud request preparation
- local caching

### Cloud / ML Layer

Used only for heavier analysis.

Responsibilities:

- semantic similarity
- semantic relationship detection
- semantic conflict analysis
- authority ranking
- conflict ranking
- confidence scoring
- embedding-based analysis

The cloud must not receive the full repository by default.

The local engine decides what leaves the machine.

---

## 4. Tech Stack

### Local CLI and Core

```text
TypeScript
Node.js
pnpm
Commander.js
Tree-sitter
simple-git
SQLite
better-sqlite3
Drizzle ORM
Zod
Vitest
```

### ML Layer

```text
Python
uv
PyTorch
sentence-transformers
scikit-learn
NumPy
pandas
pytest
```

### Minimal Cloud Layer

```text
TypeScript
Fastify
Redis
BullMQ
```

PostgreSQL is optional until persistent cloud history is required.

The analytics dashboard is a later feature and is not part of the initial implementation priority.

---

## 5. Core Domain Model

### Project

Represents one ADCE-managed software project.

### Artifact

An artifact is any meaningful project object that can contribute to repository context.

An artifact does **not** require a file.

Artifact origins:

```text
DETECTED
MANUAL
IMPORTED
```

Artifact verification:

```text
UNREVIEWED
VERIFIED
REJECTED
```

Artifact health:

```text
HEALTHY
POTENTIALLY_STALE
CONFLICTING
UNKNOWN
```

Artifact authority:

```text
CANONICAL
AUTHORITATIVE
SUPPORTING
INFERRED
UNKNOWN
```

Possible artifact types:

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

### Relationship

Connects two artifacts.

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

Every relationship should retain:

- source artifact
- target artifact
- relationship type
- origin
- confidence
- verification / rejection state
- evidence

### Temporal Evidence

Represents information about change over time.

Sources:

```text
Git
Filesystem
ADCE Snapshot
Developer Input
```

### Snapshot

A persisted observation of project state.

Snapshots allow ADCE to build temporal history even without Git.

### Conflict

Represents an inconsistency or suspected inconsistency between artifacts.

Initial conflict types:

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

Conflict confidence/state:

```text
POTENTIAL
LIKELY
CONFIRMED
```

Conflict lifecycle:

```text
DETECTED
ANALYZED
CONFIRMED / REJECTED
RESOLVED
IGNORED
```

---

## 6. Human Control

Human input must be first-class.

Developers must be able to:

- add artifacts manually
- review detected artifacts
- verify artifacts
- reject artifacts
- edit artifact metadata
- define authority
- create relationships
- remove relationships
- reject inferred relationships
- add knowledge with no backing file

Human decisions must survive future scans.

A scan must never silently overwrite deliberate human project policy.

Suggested precedence:

```text
Explicit human assertion
    >
Verified deterministic evidence
    >
High-confidence automatic inference
    >
ML inference
```

Human decisions may still be challenged by warnings, but should not be silently replaced.

---

## 7. Temporal Model

ADCE must not depend on Git.

Temporal providers:

```text
GitTemporalProvider
FilesystemTemporalProvider
ADCESnapshotProvider
```

When Git is available, use:

- commits
- timestamps
- diffs
- file history
- renames
- deletions
- branch state
- co-change patterns

Without Git, use:

- file hashes
- modification times
- file state
- ADCE snapshots

Important rule:

> Newer does not automatically mean authoritative.

Temporal information is evidence, not final truth.

---

## 8. Scan Pipeline

The scan pipeline should follow this order:

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

The scanner must support:

```text
First scan
Incremental scan
Full scan
Branch change
Configuration change
```

Later scans should process changed artifacts and affected neighbors where possible.

---

## 9. Main CLI

### Project

```bash
adce init
adce setup
adce status
adce doctor
```

### Discovery

```bash
adce scan
adce scan --full
adce watch
```

### Artifacts

```bash
adce artifacts
adce artifacts review
adce artifacts import

adce artifact <id>
adce artifact add
adce artifact edit
adce artifact verify
adce artifact reject
adce artifact ignore
adce artifact remove
```

### Relationships

```bash
adce graph
adce link
adce unlink
```

### Authority

```bash
adce authority set
adce authority clear
```

### Temporal

```bash
adce history <artifact>
```

### Conflicts

```bash
adce conflicts
adce conflict <id>
```

### Intelligence

```bash
adce analyze
adce analyze <id>
adce analyze --all
adce analyze --deep

adce context
adce context --task "<task>"
adce context --format json
```

### Configuration

```bash
adce config
```

---

## 10. CLI Output Requirements

Important commands should support:

```text
Human-readable terminal output
+
Machine-readable JSON output
```

Business logic must never live inside CLI command handlers.

The CLI should call reusable core functions.

Example:

```ts
const result = await scanProject(options);
renderScanResult(result);
```

not:

```ts
// scanning logic directly inside the CLI command
```

---

## 11. Generated ADCE Project State

Running:

```bash
adce init
```

should create:

```text
.adce/
├── config.yaml
├── state.db
├── artifacts/
├── cache/
└── logs/

AGENTS.md
```

Manual / virtual artifacts may be stored under:

```text
.adce/artifacts/
```

SQLite stores structured state.

---

## 12. Conflict Detection Philosophy

ADCE must distinguish evidence from conclusions.

Example:

```text
docs/auth.md unchanged for 3 months
src/auth.ts changed 6 times
```

This is not automatically:

```text
Documentation is wrong.
```

It is:

```text
Potential temporal divergence.
```

Semantic or stronger structural analysis may later confirm the conflict.

Every finding should explain:

- involved artifacts
- relationship between them
- evidence used
- confidence
- deterministic reasoning
- ML reasoning, if used
- likely authority
- reason for authority

---

## 13. ML Integration

ML must enhance ADCE rather than replace deterministic logic.

Initial ML responsibilities:

```text
Semantic artifact similarity
Relationship prediction
Semantic conflict detection
Authority ranking
Conflict ranking
Confidence scoring
```

The first research baseline must remain a deterministic ADCE system.

This enables comparisons such as:

```text
Rule-based ADCE
vs
ML-assisted ADCE
vs
Hybrid ADCE
```

---

## 14. Privacy Rules

The local engine controls all outbound repository data.

### Usually safe to transmit

```text
Hashes
Artifact type
Timestamps
Structural metadata
Symbol names
Relationship metadata
Derived features
```

### Conditional

```text
Selected relevant code chunks
Selected documentation chunks
```

### Forbidden by default

```text
Entire repository
.env files
Secrets
API keys
Passwords
Private keys
Credentials
Unrelated source code
```

Secret detection must run before semantic content is sent.

---

## 15. Context Engine

Context generation should combine:

```text
Task
Artifact graph
Temporal evidence
Conflicts
Authority
Context budget
```

The output should identify:

```text
Primary artifacts
Supporting artifacts
Potentially stale artifacts
Known conflicts
Authority information
Recommended precedence
Explanations
```

Example:

```bash
adce context --task "Add refresh token rotation"
```

The purpose is not to dump the repository.

The purpose is to provide the most relevant and trustworthy project context for the task.

---

## 16. Research Evaluation

The research benchmark should use real open-source repositories fixed at known commits.

Controlled variants should introduce known conflicts such as:

```text
Stale documentation
Stale tests
Schema conflicts
API conflicts
Configuration conflicts
Dependency conflicts
Non-conflicting controls
```

Ground truth should be known before ADCE runs.

Evaluation can compare:

```text
Normal repository context
Deterministic ADCE
ML-assisted ADCE
Hybrid ADCE
```

Metrics can include:

```text
Precision
Recall
F1
False positive rate
False negative rate
Artifact classification accuracy
Relationship accuracy
Authority ranking accuracy
Latency
Memory
CPU
Bandwidth
Payload size
Context size
```

---

## 17. Development Order

### v0.1

```text
adce init
adce scan
adce status
```

Build:

- filesystem discovery
- hashing
- Git detection
- SQLite state
- basic artifact classification

### v0.2

Build:

- artifact listing
- manual artifacts
- artifact review
- verification
- authority
- human overrides

### v0.3

Build:

- relationships
- graph
- Git temporal provider
- filesystem provider
- ADCE snapshots
- history

### v0.4

Build:

- deterministic conflict detection
- conflict evidence
- conflict lifecycle

### v0.5

Build:

- context engine
- task-specific context
- JSON output
- AGENTS.md integration

### v0.6

Build:

- cloud analysis
- Python ML
- semantic conflicts
- authority ranking
- caching

### v0.7

Build:

- benchmark pipeline
- controlled scenarios
- evaluation
- ablation studies

Dashboard work comes after these.

---

## 18. Non-Negotiable System Rules

1. ADCE must work without Git.
2. An artifact does not require a file.
3. Manual artifacts are first-class artifacts.
4. Human corrections must survive future scans.
5. Health, verification, origin, and authority are separate concepts.
6. Newer does not automatically mean authoritative.
7. A temporal mismatch is not automatically a confirmed conflict.
8. ML is not required for basic ADCE operation.
9. CLI commands must remain thin wrappers over reusable core logic.
10. The local engine decides what leaves the developer's machine.
11. Full repository upload is forbidden by default.
12. Important findings must be explainable.
13. Important CLI commands should support JSON output.
14. Incremental scanning should be preferred after the first scan.
15. The dashboard is not a core project dependency.
