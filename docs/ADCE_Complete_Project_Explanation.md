# ADCE — Artifact-Driven Context Engine
## Temporal and Conflict-Aware Context Management for AI Coding Agents

---

# 1. Project Overview

**ADCE (Artifact-Driven Context Engine)** is a developer tool designed to improve how AI coding agents understand and work with software repositories.

Modern coding agents can read large amounts of source code, but repository size is not the real problem. The harder problem is that software projects contain **multiple artifacts that may be incomplete, outdated, contradictory, weakly connected, or undocumented**.

Examples include:

- source code
- tests
- README files
- API specifications
- database schemas
- migrations
- configuration files
- architectural decisions
- requirements
- internal documentation
- build files
- CI/CD definitions
- manually supplied project knowledge

A coding agent may have access to all of these artifacts, but still make a wrong decision if it does not know:

- which artifact is authoritative
- which artifact is stale
- which artifacts are related
- whether two artifacts conflict
- which artifact changed more recently
- whether documentation still matches implementation
- whether tests describe current behavior
- whether a schema or API contract is still valid
- which artifacts are relevant to the developer's current task

ADCE introduces a structured layer between the repository and the coding agent.

Its goal is not to replace coding agents.

Its goal is to provide them with **better repository context**.

---

# 2. Core Problem

A software repository contains more than code.

For example:

```text
README.md
openapi.yaml
src/routes/users.ts
tests/users.test.ts
prisma/schema.prisma
docs/users.md
```

These files may all describe the same system feature.

However, they can diverge over time.

Example:

```text
Documentation:
Token expiry = 24 hours

Implementation:
Token expiry = 1 hour
```

Or:

```text
OpenAPI:
POST /user

Implementation:
POST /users
```

Or:

```text
Database documentation:
email is optional

Schema:
email is required
```

A coding agent may read every file and still not know which one reflects the current system state.

Therefore, the problem ADCE addresses is:

> **How can software artifacts be identified, related, temporally tracked, conflict-checked, ranked, and transformed into reliable context for AI coding agents?**

---

# 3. Main Idea

ADCE creates and maintains an **artifact model** of the software project.

The basic flow is:

```text
Software Project
      ↓
Artifact Discovery
      ↓
Artifact Classification
      ↓
Relationship Discovery
      ↓
Temporal Analysis
      ↓
Conflict Detection
      ↓
Authority Assessment
      ↓
Context Selection
      ↓
AI Coding Agent
```

Instead of giving an agent a raw repository and expecting it to reason perfectly, ADCE provides structured information such as:

```text
Relevant artifacts:
- src/auth/token.ts
- tests/auth/token.test.ts
- openapi.yaml

Potentially stale:
- docs/authentication.md

Known conflict:
- docs say token expiry is 24h
- implementation says token expiry is 1h

Likely authoritative:
- src/auth/token.ts

Reason:
- directly defines runtime behavior
- modified after documentation
```

---

# 4. Project Vision

ADCE is intended to be:

- **coding-agent agnostic**
- **repository-aware**
- **artifact-aware**
- **temporal**
- **conflict-aware**
- **explainable**
- **privacy-conscious**
- **usable even on poorly documented projects**
- **usable even without Git**
- **extensible through ML**
- **capable of human correction and review**

It should work with agents such as:

- Claude Code
- Codex
- Cursor
- Gemini CLI
- future AI coding agents

The goal is to avoid depending on one specific agent vendor.

---

# 5. Product Architecture

ADCE follows a hybrid local-cloud architecture.

```text
                    DEVELOPER MACHINE

┌────────────────────────────────────────────┐
│                                            │
│              Software Repository           │
│                      │                     │
│                      ▼                     │
│                ADCE CLI / Engine           │
│                TypeScript + Node.js        │
│                      │                     │
│        ┌─────────────┼─────────────┐       │
│        ▼             ▼             ▼       │
│   Repository      Temporal      Artifact   │
│    Scanner         Engine         Graph    │
│        │             │             │       │
│        └─────────────┼─────────────┘       │
│                      ▼                     │
│             Deterministic Analysis         │
│                      │                     │
│                      ▼                     │
│                 Local SQLite               │
│                                            │
└──────────────────────┬─────────────────────┘
                       │
                       │ selected / derived data
                       │ HTTPS
                       ▼

                     ADCE CLOUD

┌────────────────────────────────────────────┐
│                                            │
│                 Cloud API                  │
│                      │                     │
│                      ▼                     │
│                 ML Workers                 │
│                    Python                  │
│                      │                     │
│         ┌────────────┼────────────┐        │
│         ▼            ▼            ▼        │
│   Embeddings     Semantic      Authority   │
│                  Conflict       Ranking    │
│                  Analysis                  │
│                                            │
└──────────────────────┬─────────────────────┘
                       │
                       ▼
                 Structured Result
                       │
                       ▼
                  ADCE Context
                       │
                       ▼
                 Coding Agent
```

---

# 6. Why Hybrid Local + Cloud?

The local engine performs lightweight, deterministic, privacy-sensitive work.

The cloud layer performs heavier semantic and ML-based analysis.

This keeps the installed client relatively lightweight while allowing more advanced intelligence to remain server-side.

It also helps protect proprietary model logic and avoids forcing developers to install heavy ML runtimes locally.

---

# 7. Local ADCE Engine

The local engine is the primary developer-facing component.

It is responsible for:

- repository initialization
- file discovery
- `.gitignore` handling
- artifact detection
- artifact classification
- AST parsing
- Git history extraction
- filesystem metadata extraction
- hashing
- incremental scans
- local snapshots
- artifact relationship detection
- local deterministic conflicts
- manual artifact management
- artifact review
- relationship overrides
- authority configuration
- privacy filtering
- secret detection before upload
- context generation
- local caching
- communication with ADCE Cloud

---

# 8. Cloud Intelligence Layer

The cloud layer handles computationally heavier analysis such as:

- semantic artifact similarity
- semantic relationship discovery
- semantic conflict detection
- artifact authority ranking
- conflict ranking
- confidence scoring
- embedding generation
- ML-based classification
- hybrid deterministic + ML reasoning

The server should not receive the entire repository by default.

Instead, the local engine decides what data is required.

---

# 9. Privacy Model

A central design rule is:

> **The local ADCE engine decides what leaves the repository.**

ADCE should not automatically upload the entire codebase.

Data can be divided into three levels.

## Level 1 — Metadata

Example:

```json
{
  "path": "src/auth/service.ts",
  "type": "source",
  "hash": "abc123",
  "lastModified": "2026-09-05",
  "size": 4312
}
```

Useful for:

- temporal analysis
- change tracking
- co-change analysis
- basic relationship reasoning

---

## Level 2 — Structural Representation

Instead of sending entire code:

```ts
export async function authenticate(
  email: string,
  password: string
) {
  ...
}
```

ADCE can extract:

```json
{
  "file": "src/auth/service.ts",
  "symbols": [
    {
      "type": "function",
      "name": "authenticate",
      "parameters": ["email", "password"]
    }
  ],
  "imports": [
    "./token",
    "./database"
  ]
}
```

---

## Level 3 — Selected Semantic Content

Only specific relevant code or documentation fragments are transmitted when semantic analysis requires them.

For example:

```text
docs/auth.md lines 42-46

and

src/auth/token.ts symbol createToken
```

instead of the entire repository.

---

# 10. Secret Protection

Before semantic content is sent to the server, ADCE should attempt to block obvious secrets such as:

- API keys
- access tokens
- private keys
- connection strings
- passwords
- `.env` contents
- secret-looking values

A cloud request should be blocked when sensitive content is detected unless explicitly resolved by the developer.

---

# 11. Artifact Model

ADCE does not treat every project object as merely a file.

An artifact can be:

- automatically detected
- manually created
- imported

An artifact can also exist without a backing file.

Example:

```text
Artifact:
Payment Retry Policy

Type:
REQUIREMENT

Origin:
MANUAL

Backing file:
None
```

This allows ADCE to represent project knowledge that exists only in developer decisions, architecture discussions, or requirements.

---

# 12. Artifact Origins

Artifacts have one of three origins:

```text
DETECTED
MANUAL
IMPORTED
```

### DETECTED

Automatically discovered by ADCE.

### MANUAL

Explicitly created by the developer.

### IMPORTED

Loaded from an artifact manifest or external source.

---

# 13. Artifact Types

## Technical Artifacts

```text
SOURCE
TEST
SCHEMA
MIGRATION
API_SPEC
CONFIGURATION
DEPENDENCY_MANIFEST
BUILD
CI
ENVIRONMENT_TEMPLATE
```

## Knowledge Artifacts

```text
DOCUMENTATION
REQUIREMENT
DESIGN
ARCHITECTURE
DECISION
CONSTRAINT
POLICY
SPECIFICATION
```

Potential future types:

```text
TASK
ISSUE
CHANGE_REQUEST
```

---

# 14. Artifact Verification

Verification state is separate from artifact health.

Verification:

```text
UNREVIEWED
VERIFIED
REJECTED
```

This indicates whether a human has reviewed the artifact definition.

---

# 15. Artifact Health

Health describes the current artifact condition:

```text
HEALTHY
POTENTIALLY_STALE
CONFLICTING
UNKNOWN
```

An artifact can therefore be:

```text
Verification: VERIFIED
Health: CONFLICTING
```

These states represent different concepts and must not be merged.

---

# 16. Artifact Authority

Artifacts can have authority levels such as:

```text
CANONICAL
AUTHORITATIVE
SUPPORTING
INFERRED
UNKNOWN
```

Example:

```text
openapi.yaml

Authority:
CANONICAL
```

If the implementation disagrees with a manually declared canonical specification, ADCE should report the inconsistency but should not silently change the developer-defined authority.

---

# 17. Human Overrides

ADCE must allow developers to correct automatic inference.

For example, ADCE may incorrectly infer:

```text
README.md DOCUMENTS src/auth.ts
```

The developer can reject the relationship.

ADCE must remember this rejection so that later scans do not recreate the same relationship automatically.

Human decisions and automatically generated knowledge are stored separately.

A reasonable precedence model is:

```text
explicit human assertion
        >
verified deterministic evidence
        >
high-confidence automatic inference
        >
ML inference
```

Human input is not assumed to be infallible, but explicit project policy must be respected.

---

# 18. Artifact Relationships

Artifacts are connected through a graph.

Relationship types may include:

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

Example:

```text
Authentication Requirement
        │
        │ IMPLEMENTED_BY
        ▼
src/auth/service.ts
```

Another example:

```text
docs/auth.md
    DOCUMENTS
        ↓
src/auth/service.ts

tests/auth.test.ts
    TESTS
        ↓
src/auth/service.ts

openapi.yaml
    SPECIFIES
        ↓
src/routes/auth.ts
```

Relationships can be:

- deterministic
- heuristic
- ML-inferred
- manually added

Every relationship should retain its origin and confidence.

---

# 19. Temporal Intelligence

ADCE is temporal because it does not only inspect the current repository state.

It also considers how artifacts evolve.

Temporal evidence may come from:

```text
Git history
Filesystem metadata
ADCE snapshots
Developer-supplied information
```

---

# 20. Git Temporal Provider

When Git exists, ADCE can extract:

- commits
- commit timestamps
- file history
- file renames
- file deletions
- branches
- diffs
- change sequences
- co-change patterns

Example:

```text
token.ts changed:
T1 T3 T5 T7

token.test.ts changed:
T1 T3 T5 T7

auth.md changed:
T1
```

This does not prove that `auth.md` is wrong.

It provides evidence that the documentation may be stale and deserves inspection.

---

# 21. No-Git Support

ADCE must not require Git.

If the project has no Git repository, ADCE can still use:

- filesystem modification times
- file hashes
- file sizes
- directory state
- ADCE snapshots

Initialization should continue with reduced temporal confidence.

Example:

```text
Git repository:
Not detected.

ADCE will use filesystem and internal
snapshot history for temporal analysis.
```

---

# 22. ADCE-Native Snapshot History

Even without Git, ADCE builds its own history after the first scan.

Example:

```text
Snapshot 1

auth.ts hash = AAA
auth.md hash = BBB
```

Later:

```text
Snapshot 2

auth.ts hash = CCC
auth.md hash = BBB
```

ADCE now knows:

```text
auth.ts changed
auth.md did not
```

This creates a tool-native temporal history.

---

# 23. Temporal Evidence Provenance

Every temporal conclusion should explain where the evidence came from.

For example:

```text
Git history                   HIGH
ADCE snapshot history         HIGH
Filesystem modification time  MEDIUM
Developer supplied            MANUAL
```

This prevents ADCE from presenting weak filesystem evidence as if it were equivalent to Git history.

---

# 24. Conflict Detection

ADCE detects situations where related artifacts appear inconsistent.

Initial conflict categories can include:

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

---

# 25. Conflict Confidence

Not every mismatch is guaranteed to be a real problem.

Therefore findings should be classified carefully:

```text
POTENTIAL
LIKELY
CONFIRMED
```

For example, a file modification timestamp alone should never be treated as proof that documentation is incorrect.

It should instead produce a warning such as:

```text
Potential stale documentation

Evidence:
Implementation changed 6 times
since documentation was last updated.
```

---

# 26. Conflict Lifecycle

A conflict can progress through:

```text
DETECTED
    ↓
ANALYZED
    ↓
CONFIRMED / REJECTED
    ↓
RESOLVED
```

Optional:

```text
IGNORED
```

Historical conflicts should not simply disappear from the system.

---

# 27. Deterministic Analysis

The initial ADCE engine should work without ML.

Deterministic analysis may include:

- file age comparison
- Git history analysis
- changed-together analysis
- schema comparison
- API structure comparison
- dependency mismatch detection
- structural comparison
- naming and path heuristics
- static relationship discovery

This creates a baseline that can later be compared against ML-assisted ADCE.

---

# 28. ML Layer

Python is used for heavier ML and semantic components.

Potential capabilities include:

- artifact embeddings
- semantic similarity
- artifact relationship prediction
- conflict classification
- semantic contradiction detection
- authority ranking
- conflict severity ranking
- anomaly detection
- confidence scoring

The ML layer is not responsible for the entire system.

It enhances deterministic ADCE.

---

# 29. Hybrid Analysis

The final conflict assessment can combine:

```text
Git evidence
+
filesystem evidence
+
structural evidence
+
deterministic rules
+
semantic ML evidence
+
human declarations
```

For example:

```text
Documentation:
"Tokens remain valid for 24 hours."

Implementation:
expiresIn = "1h"

Temporal evidence:
Implementation changed after documentation.

Structural evidence:
createToken defines runtime expiry.

Semantic model:
Detected contradictory duration values.

Final result:
CONFIRMED SEMANTIC CONFLICT
```

---

# 30. Explainability

Every ADCE finding should answer:

- What is wrong?
- Which artifacts are involved?
- Why were these artifacts compared?
- What evidence was used?
- Which evidence came from deterministic logic?
- Which evidence came from ML?
- What is the confidence?
- Which artifact appears authoritative?
- Why?

Weak output:

```text
Conflict detected.
Confidence: 92%
```

Preferred output:

```text
Conflict detected.

Documentation:
Tokens expire after 24h.

Implementation:
expiresIn = "1h"

Temporal evidence:
Implementation changed after documentation.

Structural evidence:
Runtime code defines token expiration.

Semantic evidence:
Contradictory duration values detected.

Final confidence:
0.96
```

---

# 31. Context Engine

The context engine transforms repository intelligence into information that a coding agent can actually consume.

Input:

```text
Artifact graph
+
Temporal evidence
+
Conflicts
+
Authority
+
Current task
```

Output:

```text
Relevant artifacts
Authoritative artifacts
Potentially stale artifacts
Known conflicts
Recommended precedence
Temporal evidence
```

---

# 32. Task-Specific Context

Example:

```bash
adce context --task "Add refresh token rotation"
```

Possible output:

```text
Task:
Add refresh token rotation

Primary artifacts:
- src/auth/token.ts
- src/auth/refresh.ts
- tests/auth/refresh.test.ts

Supporting artifacts:
- openapi.yaml
- prisma/schema.prisma

Potentially stale:
- docs/authentication.md

Known conflict:
Token expiration differs between
documentation and implementation.

Recommended precedence:
1. Runtime implementation
2. Database schema
3. API specification
4. Tests
5. Documentation
```

This gives the coding agent a structured view of the repository rather than a raw dump.

---

# 33. Context Budgets

ADCE should support an approximate context budget.

Example:

```bash
adce context \
  --task "Add refresh token rotation" \
  --budget 8000
```

ADCE ranks artifacts and attempts to stay under the requested budget.

This creates a possible research dimension around context efficiency.

---

# 34. Machine-Readable Output

Important CLI commands should support JSON output.

Example:

```bash
adce context \
  --task "Add refresh token rotation" \
  --format json
```

This allows coding agents and future integrations to consume ADCE without parsing terminal formatting.

The CLI therefore exposes two interfaces:

```text
Human interface
→ formatted terminal output

Machine interface
→ structured JSON
```

---

# 35. AGENTS.md Integration

When ADCE is initialized, it can create an `AGENTS.md` file.

Example:

```md
# ADCE

This repository uses ADCE for artifact context management.

Before repository-level modifications:

1. Run `adce status`.
2. Run `adce context --task "<current task>"`.
3. Check unresolved conflicts.
4. Treat stale artifacts with caution.
```

This allows coding agents to discover and use ADCE without requiring vendor-specific integrations.

---

# 36. Main CLI Commands

## Project

```bash
adce init
adce setup
adce status
adce doctor
```

## Discovery

```bash
adce scan
adce scan --full
adce watch
```

## Artifact Management

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

## Relationships

```bash
adce graph
adce link
adce unlink
```

## Authority

```bash
adce authority set
adce authority clear
```

## Temporal

```bash
adce history <artifact>
```

## Conflicts

```bash
adce conflicts
adce conflict <id>
```

## Intelligence

```bash
adce analyze
adce analyze <id>
adce analyze --all
adce analyze --deep

adce context
adce context --task "<task>"
```

## Configuration

```bash
adce config
```

---

# 37. `adce init`

`adce init` converts an existing project into an ADCE-aware project.

It checks:

- project root
- existing ADCE state
- Git availability
- languages
- package/build systems
- detectable artifact categories

It creates:

```text
.adce/
├── config.yaml
├── state.db
├── artifacts/
├── cache/
└── logs/

AGENTS.md
```

---

# 38. `adce scan`

The scan workflow is:

```text
Repository
    ↓
File discovery
    ↓
Artifact classification
    ↓
AST extraction
    ↓
Git/filesystem metadata
    ↓
Hashing
    ↓
Relationship discovery
    ↓
Temporal state
    ↓
Deterministic conflicts
    ↓
SQLite persistence
```

The first scan is relatively broad.

Later scans should be incremental.

---

# 39. Incremental Scanning

ADCE stores file hashes.

Example:

```text
Scan 1

auth.ts  = ABC
user.ts  = DEF
README   = XYZ
```

Later:

```text
Scan 2

auth.ts  = ABC
user.ts  = NEW
README   = XYZ
```

Only `user.ts` changed.

ADCE can therefore reanalyze:

```text
user.ts
+
related/dependent artifacts
```

instead of rescanning the entire project deeply.

---

# 40. `adce artifacts review`

Automatically detected artifacts may be uncertain.

The developer can review candidates.

Example:

```text
Artifact candidate 1 / 12

Path:
docs/architecture-old.md

Detected type:
DOCUMENTATION

Confidence:
0.61

Related to:
src/core/engine.ts

Choose:
[V] Verify
[E] Edit
[I] Ignore
[R] Reject
[S] Skip
```

This creates a human-in-the-loop artifact establishment process.

---

# 41. Manual Artifact Creation

Developers can add missing project knowledge.

File-backed example:

```bash
adce artifact add internal/important.spec
```

Virtual/manual example:

```bash
adce artifact add --manual
```

Possible interactive input:

```text
Artifact name:
Payment Retry Policy

Type:
REQUIREMENT

Description:
Payments retry at most three times
using exponential backoff.

Authority:
AUTHORITATIVE
```

This becomes part of the same artifact graph as automatically detected files.

---

# 42. Importing Artifacts

Large projects may define many artifacts using YAML.

Example:

```yaml
artifacts:

  - name: Authentication Requirements
    type: requirement
    path: docs/auth-requirements.md
    authority: authoritative

  - name: API Contract
    type: api_spec
    path: openapi.yaml
    authority: canonical

relationships:

  - from: Authentication Requirements
    to: API Contract
    type: specified_by
```

Then:

```bash
adce artifacts import artifacts.yaml
```

---

# 43. Local Project State

ADCE maintains local state using SQLite.

The `.adce` directory may contain:

```text
.adce/
├── config.yaml
├── state.db
├── artifacts/
├── cache/
└── logs/
```

The database stores information such as:

```text
artifacts
relationships
snapshots
conflicts
scans
overrides
analysis results
```

---

# 44. Offline Mode

ADCE should remain useful when cloud analysis is unavailable.

Offline functionality includes:

- repository scanning
- Git analysis
- filesystem analysis
- snapshots
- structural extraction
- deterministic relationships
- deterministic conflicts
- cached results
- context generation from available evidence

Semantic ML analysis is skipped.

---

# 45. Caching

Heavy analysis should be cached using artifact state.

A semantic result can conceptually be keyed by:

```text
model_version
+
artifact_a_hash
+
artifact_b_hash
+
analysis_type
```

If neither artifact changed, the same ML request does not need to run again.

This reduces:

- latency
- bandwidth
- cloud compute
- cost

---

# 46. Branch Awareness

When Git exists, ADCE should understand branches.

A finding from:

```text
feature/new-auth
```

must not automatically be treated as valid for:

```text
main
```

Branch and commit state should therefore be considered when maintaining repository state.

---

# 47. Research Component

ADCE is not only a software product.

It also supports a research evaluation.

The primary research idea is to determine whether temporal and conflict-aware artifact context improves coding-agent reliability compared with conventional repository context.

A possible research question is:

> **Can a temporal and conflict-aware artifact context system improve the correctness and consistency of coding-agent decisions compared with conventional repository-context approaches?**

Additional questions can include:

- Does temporal information improve conflict detection?
- Does ML improve detection over deterministic rules?
- Does hybrid deterministic + ML analysis outperform either approach alone?
- How much semantic content must be transmitted to achieve strong conflict-detection accuracy?
- How much human review is required to produce a reliable artifact graph?
- Can ADCE reduce irrelevant context while preserving task performance?

---

# 48. Research Baselines

ADCE can be evaluated in multiple configurations.

```text
Baseline A:
Normal repository context

Baseline B:
Deterministic ADCE

System C:
ML-assisted ADCE

System D:
Hybrid deterministic + ML ADCE
```

This creates clear comparisons.

---

# 49. Research Benchmark

Real open-source GitHub repositories can be used as benchmark bases.

However, they should be frozen at specific commits.

Example:

```text
Repository:
example/project

Commit:
a83f29d

Language:
TypeScript

Artifacts:
source, docs, tests, OpenAPI, migrations
```

Controlled conflict variants can then be created.

---

# 50. Controlled Benchmark Scenarios

Possible scenarios include:

```text
stale documentation
stale tests
schema conflict
API specification conflict
configuration conflict
dependency mismatch
migration inconsistency
non-conflicting controls
```

Example:

Original:

```ts
export function createUser(email: string) {}
```

Documentation:

```text
createUser(email)
```

Mutation:

```ts
export function createUser(
  email: string,
  name: string
) {}
```

Documentation is intentionally left unchanged.

Ground truth:

```text
Conflict exists: YES
Type: STALE_DOCUMENTATION
Affected artifact: documentation
```

ADCE can then be evaluated objectively.

---

# 51. Real-World Benchmark

A second benchmark can use untouched repositories.

Purpose:

- determine whether ADCE finds useful problems in realistic environments
- evaluate false-positive behavior
- validate findings manually

This complements the controlled benchmark.

---

# 52. Evaluation Metrics

Possible metrics include:

```text
Precision
Recall
F1-score
False positive rate
False negative rate
Conflict resolution accuracy
Authority ranking accuracy
Artifact classification accuracy
Relationship prediction accuracy
Latency
Memory usage
CPU usage
Bandwidth
Payload size
Context size
Context reduction
Cloud cost
Human review effort
```

---

# 53. Ablation Studies

ADCE's modular design allows components to be disabled.

Possible comparisons:

```text
Structural only

Temporal + structural

Semantic + structural

Temporal + structural + semantic

Automatic artifact graph

Human-reviewed artifact graph
```

This helps determine which components actually contribute to performance.

---

# 54. Research Trade-Offs

The project can explicitly study the trade-offs between:

```text
accuracy
↔
privacy
↔
bandwidth
↔
latency
↔
compute
```

For example, semantic analysis could be evaluated using:

```text
Full content
Selected chunks
Structural representation
Metadata only
```

The goal would be to determine how little repository information can be transmitted while maintaining useful analysis accuracy.

---

# 55. Tech Stack

## Local CLI and Core

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

## ML Layer

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

## Minimal Cloud Layer

```text
TypeScript
Fastify
Redis
BullMQ
```

PostgreSQL can be added when persistent cloud state becomes necessary.

## Optional Later Dashboard

```text
Next.js
TypeScript
Tailwind CSS
shadcn/ui
Recharts
PostgreSQL
```

The dashboard is intentionally the lowest priority.

---

# 56. Recommended Source Structure

```text
adce/
├── packages/
│   ├── cli/
│   ├── core/
│   ├── storage/
│   ├── parsers/
│   ├── git/
│   └── shared/
│
├── ml/
├── benchmarks/
├── fixtures/
├── experiments/
├── scripts/
├── docs/
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

The CLI should remain a thin interface over the reusable core.

Business logic should not live inside command handlers.

---

# 57. Development Priorities

## Priority 1 — CLI Foundation

```text
adce init
adce scan
adce status
```

Build:

- repository discovery
- file scanning
- hashing
- Git detection
- SQLite state
- basic artifact classification

---

## Priority 2 — Artifact Management

```text
adce artifacts
adce artifact
adce artifact add
adce artifacts review
```

Build:

- manual artifacts
- review
- verification
- authority
- human overrides

---

## Priority 3 — Relationship and Temporal Engine

```text
adce graph
adce link
adce unlink
adce history
```

Build:

- artifact graph
- Git temporal provider
- filesystem provider
- ADCE snapshots
- co-change analysis

---

## Priority 4 — Deterministic Conflict Engine

```text
adce conflicts
adce conflict
```

Build:

- temporal mismatch detection
- structural conflicts
- schema mismatches
- API mismatches
- evidence
- severity
- lifecycle

---

## Priority 5 — Context Engine

```text
adce context
adce context --task
```

Build:

- artifact ranking
- context budgeting
- authority reasoning
- machine-readable output
- AGENTS.md integration

---

## Priority 6 — ML Layer

```text
adce analyze
adce analyze --all
adce analyze --deep
```

Build:

- embeddings
- semantic similarity
- semantic conflict detection
- relationship prediction
- authority ranking
- hybrid scoring

---

## Priority 7 — Research Evaluation

Build:

- reproducible benchmark repositories
- controlled scenarios
- ground truth
- baseline runs
- metrics
- ablations
- experiment reports

---

## Priority 8 — Optional Analytics Dashboard

Only after the CLI, ML layer, and research pipeline are stable.

---

# 58. End-to-End Developer Workflow

The intended developer workflow is:

```text
Developer enters project
        ↓
      adce init
        ↓
ADCE detects repository capabilities
        ↓
      adce scan
        ↓
Artifacts discovered
        ↓
Developer reviews uncertain artifacts
        ↓
Developer adds missing artifacts
        ↓
Relationships established
        ↓
Temporal state created
        ↓
Deterministic conflicts detected
        ↓
Optional ML analysis
        ↓
Context generated
        ↓
Coding agent consumes context
        ↓
Agent modifies repository
        ↓
ADCE rescans changed artifacts
        ↓
Artifact graph and conflicts update
        ↓
New context available
```

This creates a continuous loop:

```text
        ┌───────────────────┐
        │   Coding Agent    │
        └─────────┬─────────┘
                  │
             requests context
                  │
                  ▼
               ADCE
                  │
                  ▼
           Artifact Model
                  │
                  ▼
        Agent modifies repo
                  │
                  ▼
             ADCE scan
                  │
                  ▼
         Changes detected
                  │
                  ▼
        Context state updated
                  │
                  └──────────────→ Agent
```

---

# 59. Example End-to-End Conflict

Project contains:

```text
docs/authentication.md
src/auth/token.ts
tests/auth/token.test.ts
```

Documentation:

```text
Access tokens expire after 24 hours.
```

Implementation:

```ts
expiresIn: "1h"
```

ADCE may detect:

```text
TEMPORAL_MISMATCH

docs/authentication.md
was last updated before
src/auth/token.ts changed.
```

The developer runs:

```bash
adce analyze C-007
```

Semantic analysis confirms:

```text
CONFIRMED SEMANTIC CONFLICT

Documentation:
24 hours

Implementation:
1 hour

Likely authoritative:
src/auth/token.ts

Reason:
Directly defines runtime behavior
and was changed after documentation.

Confidence:
0.96
```

Then:

```bash
adce context --task "Modify token refresh behavior"
```

returns:

```text
Relevant:
src/auth/token.ts
tests/auth/token.test.ts

Potentially stale:
docs/authentication.md

Known conflict:
Token expiry mismatch

Recommendation:
Do not rely on authentication.md
for token expiry behavior.
```

This is the core value ADCE provides.

---

# 60. Main Contributions of the Project

ADCE's intended technical contributions are:

1. **Artifact-centric repository representation**
   - software projects are modeled as artifacts and relationships rather than only raw files.

2. **Temporal artifact reasoning**
   - combines Git, filesystem metadata, and ADCE snapshots.

3. **Conflict-aware context**
   - identifies inconsistencies before context is supplied to an agent.

4. **Authority-aware reasoning**
   - distinguishes canonical, authoritative, supporting, and inferred artifacts.

5. **Human-in-the-loop artifact correction**
   - developers can review, add, reject, and override artifacts and relationships.

6. **Support for weak or incomplete repositories**
   - works without Git, documentation, tests, or strong project structure.

7. **Hybrid deterministic + ML analysis**
   - deterministic logic provides explainable baseline reasoning, while ML handles semantic cases.

8. **Privacy-conscious cloud intelligence**
   - local client controls what repository information leaves the machine.

9. **Agent-agnostic integration**
   - context is exposed through CLI, Markdown, JSON, and `AGENTS.md`.

10. **Reproducible research benchmark**
    - controlled repository mutations allow objective evaluation.

---

# 61. What ADCE Is Not

ADCE is not:

- another coding agent
- a code-generation system
- a replacement for Git
- a documentation generator
- a normal CRUD application
- a generic chatbot
- a repository search tool only
- a simple context-window reducer
- a vendor-specific Cursor or Claude plugin
- an ML system that blindly uploads entire repositories

It is a **repository intelligence and context-management layer for coding agents**.

---

# 62. Final One-Sentence Description

> **ADCE is a temporal and conflict-aware artifact context engine that builds a structured model of a software project, tracks how its artifacts evolve, detects inconsistencies, incorporates human and ML-assisted reasoning, and supplies coding agents with relevant, authoritative, and explainable repository context.**

---

# 63. Short Pitch

Modern coding agents can read entire repositories, but they can still make incorrect decisions when the repository contains stale documentation, outdated tests, conflicting schemas, inconsistent API specifications, or missing project knowledge.

ADCE solves this by creating an artifact graph of the project, tracking artifact history, identifying conflicts, determining authority, and generating task-specific context for coding agents.

A lightweight local CLI performs repository scanning, Git analysis, structural parsing, manual artifact management, and deterministic reasoning. Heavier semantic and ML analysis can run in the cloud using only selected repository information.

The result is a coding-agent-agnostic context layer designed to help AI agents reason about **which project information should actually be trusted**, not merely which files fit inside the context window.
