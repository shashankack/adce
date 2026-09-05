# ADCE Project Directory Structure

This document defines the recommended source-code layout for the ADCE project, with the CLI and deterministic engine as the highest priorities, followed by the ML layer, research benchmark tooling, and only later any dashboard or analytics work.

---

## Full Recommended Structure

```text
adce/
│
├── packages/
│   │
│   ├── cli/                         # @adce/cli - developer-facing CLI
│   │   ├── src/
│   │   │   ├── commands/
│   │   │   │   ├── init.ts
│   │   │   │   ├── setup.ts
│   │   │   │   ├── scan.ts
│   │   │   │   ├── status.ts
│   │   │   │   ├── artifacts.ts
│   │   │   │   ├── artifact.ts
│   │   │   │   ├── graph.ts
│   │   │   │   ├── link.ts
│   │   │   │   ├── unlink.ts
│   │   │   │   ├── authority.ts
│   │   │   │   ├── history.ts
│   │   │   │   ├── conflicts.ts
│   │   │   │   ├── conflict.ts
│   │   │   │   ├── analyze.ts
│   │   │   │   ├── context.ts
│   │   │   │   ├── config.ts
│   │   │   │   └── doctor.ts
│   │   │   │
│   │   │   ├── ui/
│   │   │   │   ├── logger.ts
│   │   │   │   ├── spinner.ts
│   │   │   │   ├── table.ts
│   │   │   │   └── prompts.ts
│   │   │   │
│   │   │   ├── output/
│   │   │   │   ├── json.ts
│   │   │   │   └── terminal.ts
│   │   │   │
│   │   │   ├── cli.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── tests/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   │
│   ├── core/                        # Main ADCE intelligence
│   │   ├── src/
│   │   │
│   │   │   ├── project/
│   │   │   │   ├── project.ts
│   │   │   │   ├── initialize.ts
│   │   │   │   └── discovery.ts
│   │   │   │
│   │   │   ├── artifacts/
│   │   │   │   ├── artifact.ts
│   │   │   │   ├── artifact-types.ts
│   │   │   │   ├── classifier.ts
│   │   │   │   ├── registry.ts
│   │   │   │   ├── manual-artifact.ts
│   │   │   │   ├── review.ts
│   │   │   │   ├── authority.ts
│   │   │   │   └── verification.ts
│   │   │   │
│   │   │   ├── relationships/
│   │   │   │   ├── relationship.ts
│   │   │   │   ├── relationship-types.ts
│   │   │   │   ├── detector.ts
│   │   │   │   ├── graph.ts
│   │   │   │   └── overrides.ts
│   │   │   │
│   │   │   ├── scanner/
│   │   │   │   ├── scanner.ts
│   │   │   │   ├── discovery.ts
│   │   │   │   ├── filters.ts
│   │   │   │   ├── hashing.ts
│   │   │   │   ├── incremental.ts
│   │   │   │   └── scan-result.ts
│   │   │   │
│   │   │   ├── temporal/
│   │   │   │   ├── temporal-engine.ts
│   │   │   │   ├── evidence.ts
│   │   │   │   ├── snapshot.ts
│   │   │   │   │
│   │   │   │   └── providers/
│   │   │   │       ├── provider.ts
│   │   │   │       ├── git.ts
│   │   │   │       ├── filesystem.ts
│   │   │   │       └── adce-snapshot.ts
│   │   │   │
│   │   │   ├── conflicts/
│   │   │   │   ├── conflict.ts
│   │   │   │   ├── conflict-types.ts
│   │   │   │   ├── detector.ts
│   │   │   │   ├── evidence.ts
│   │   │   │   ├── severity.ts
│   │   │   │   └── lifecycle.ts
│   │   │   │
│   │   │   ├── context/
│   │   │   │   ├── context-engine.ts
│   │   │   │   ├── ranking.ts
│   │   │   │   ├── budget.ts
│   │   │   │   └── renderer.ts
│   │   │   │
│   │   │   ├── privacy/
│   │   │   │   ├── filter.ts
│   │   │   │   ├── secrets.ts
│   │   │   │   └── policy.ts
│   │   │   │
│   │   │   ├── config/
│   │   │   │   ├── schema.ts
│   │   │   │   ├── defaults.ts
│   │   │   │   └── loader.ts
│   │   │   │
│   │   │   ├── errors/
│   │   │   │   └── errors.ts
│   │   │   │
│   │   │   └── index.ts
│   │   │
│   │   ├── tests/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   │
│   ├── storage/                     # SQLite persistence
│   │   ├── src/
│   │   │   ├── database.ts
│   │   │   ├── schema/
│   │   │   │   ├── artifacts.ts
│   │   │   │   ├── relationships.ts
│   │   │   │   ├── snapshots.ts
│   │   │   │   ├── conflicts.ts
│   │   │   │   ├── overrides.ts
│   │   │   │   └── scans.ts
│   │   │   │
│   │   │   ├── repositories/
│   │   │   │   ├── artifact-repository.ts
│   │   │   │   ├── relationship-repository.ts
│   │   │   │   ├── conflict-repository.ts
│   │   │   │   └── snapshot-repository.ts
│   │   │   │
│   │   │   └── migrations/
│   │   │
│   │   ├── tests/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   │
│   ├── parsers/                     # Structural/code understanding
│   │   ├── src/
│   │   │   ├── parser.ts
│   │   │   ├── registry.ts
│   │   │   ├── tree-sitter.ts
│   │   │   │
│   │   │   ├── languages/
│   │   │   │   ├── typescript.ts
│   │   │   │   ├── javascript.ts
│   │   │   │   ├── python.ts
│   │   │   │   └── java.ts
│   │   │   │
│   │   │   └── extractors/
│   │   │       ├── symbols.ts
│   │   │       ├── imports.ts
│   │   │       ├── exports.ts
│   │   │       └── dependencies.ts
│   │   │
│   │   ├── tests/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   │
│   ├── git/                         # Git-specific functionality
│   │   ├── src/
│   │   │   ├── client.ts
│   │   │   ├── history.ts
│   │   │   ├── diff.ts
│   │   │   ├── commits.ts
│   │   │   ├── branches.ts
│   │   │   └── cochange.ts
│   │   │
│   │   ├── tests/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   │
│   └── shared/                      # Shared contracts/utilities only
│       ├── src/
│       │   ├── types/
│       │   ├── schemas/
│       │   ├── constants/
│       │   ├── result.ts
│       │   └── index.ts
│       │
│       ├── package.json
│       └── tsconfig.json
│
│
├── ml/                              # Python ML layer
│   ├── adce_ml/
│   │   ├── __init__.py
│   │   │
│   │   ├── embeddings/
│   │   │   ├── encoder.py
│   │   │   └── similarity.py
│   │   │
│   │   ├── relationships/
│   │   │   └── predictor.py
│   │   │
│   │   ├── conflicts/
│   │   │   ├── classifier.py
│   │   │   └── semantic.py
│   │   │
│   │   ├── authority/
│   │   │   └── ranker.py
│   │   │
│   │   ├── features/
│   │   │   ├── structural.py
│   │   │   ├── temporal.py
│   │   │   └── semantic.py
│   │   │
│   │   └── inference/
│   │       └── engine.py
│   │
│   ├── experiments/
│   ├── notebooks/
│   ├── tests/
│   ├── models/                      # gitignored
│   ├── pyproject.toml
│   └── uv.lock
│
│
├── benchmarks/
│   ├── repositories/
│   │   └── repositories.json
│   │
│   ├── scenarios/
│   │   ├── stale-documentation/
│   │   ├── stale-test/
│   │   ├── api-conflict/
│   │   ├── schema-conflict/
│   │   └── controls/
│   │
│   ├── ground-truth/
│   └── results/                     # gitignored/generated
│
│
├── fixtures/                        # Small fake repos for automated tests
│   ├── basic-typescript/
│   ├── no-git/
│   ├── no-documentation/
│   ├── manual-artifacts/
│   ├── conflicting-api/
│   └── empty-project/
│
│
├── scripts/
│   ├── benchmark.ts
│   ├── build.ts
│   └── clean.ts
│
│
├── docs/
│   ├── architecture/
│   ├── cli/
│   ├── artifact-model/
│   ├── conflict-model/
│   ├── temporal-model/
│   └── research/
│
│
├── .github/
│   └── workflows/
│       ├── test.yml
│       └── lint.yml
│
├── .gitignore
├── .editorconfig
├── .npmrc
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── eslint.config.js
├── prettier.config.js
├── vitest.workspace.ts
└── README.md
```

---

## Important Architectural Decision

Do **not** split every engine into its own npm package yet.

Keep the following as modules inside `packages/core/src/` during the early stages:

```text
artifacts/
relationships/
scanner/
temporal/
conflicts/
context/
privacy/
config/
```

This avoids creating too many tiny workspace packages while the internal architecture is still evolving.

Extract a module into a separate package only when there is a real reason to do so.

The dependency direction should remain approximately:

```text
                    @adce/cli
                        │
                        ▼
                    @adce/core
                   /     |      \
                  /      |       \
                 ▼       ▼        ▼
          @adce/storage parsers  @adce/git
                 \       |        /
                  \      |       /
                   └── shared ──┘
```

The CLI must remain thin.

Bad:

```ts
command("scan")
  .action(async () => {
      // hundreds of lines of scanning logic here
  });
```

Better:

```ts
command("scan")
  .action(async () => {
      const result = await scanProject(options);
      renderScanResult(result);
  });
```

The core scanning logic should be reusable by the CLI, tests, future IDE integrations, APIs, or coding agents.

---

# Generated `.adce` Directory

The ADCE source repository is different from the `.adce` directory created inside a developer's project.

When a user runs:

```bash
adce init
```

their project may receive:

```text
some-project/
│
├── .adce/
│   ├── config.yaml
│   ├── state.db
│   ├── artifacts/                 # manually defined/virtual artifacts
│   ├── cache/
│   └── logs/
│
├── AGENTS.md
│
└── ...existing project files
```

The ADCE source repository itself should **not** contain a root `.adce/` directory for its own implementation.

Use fixtures to test generated ADCE projects instead.

---

# Minimal Structure to Create First

Do not create every file from the full structure immediately.

Start with:

```text
adce/
├── packages/
│   ├── cli/
│   │   └── src/
│   │       ├── commands/
│   │       │   ├── init.ts
│   │       │   ├── scan.ts
│   │       │   └── status.ts
│   │       ├── cli.ts
│   │       └── index.ts
│   │
│   ├── core/
│   │   └── src/
│   │       ├── artifacts/
│   │       ├── relationships/
│   │       ├── scanner/
│   │       ├── temporal/
│   │       ├── config/
│   │       └── index.ts
│   │
│   ├── storage/
│   │   └── src/
│   │
│   ├── parsers/
│   │   └── src/
│   │
│   ├── git/
│   │   └── src/
│   │
│   └── shared/
│       └── src/
│
├── ml/
│
├── fixtures/
│   ├── basic-typescript/
│   ├── no-git/
│   └── empty-project/
│
├── benchmarks/
├── docs/
│
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .gitignore
└── README.md
```

---

# First Implementation Target

The first vertical slice should be:

```text
pnpm build
    ↓
adce init
    ↓
.adce/config.yaml created
.adce/state.db created
AGENTS.md created
    ↓
adce scan
    ↓
files discovered
files classified
hashes calculated
Git detected if available
basic artifacts persisted
    ↓
adce status
```

Do **not** add ML, cloud infrastructure, semantic conflict analysis, or a dashboard before this flow is reliable.

---

# Recommended Development Order

## v0.1 — CLI Foundation

Implement:

```text
adce init
adce scan
adce status
```

Core capabilities:

```text
Project discovery
Configuration
Filesystem scanning
Basic artifact classification
Hashing
Git detection
SQLite persistence
Incremental scan foundations
```

---

## v0.2 — Artifact Management

Implement:

```text
adce artifacts
adce artifact <id>
adce artifact add
adce artifact edit
adce artifact verify
adce artifact reject
adce artifacts review
```

Add:

```text
Manual artifacts
Virtual artifacts
Verification states
Artifact authority
Human overrides
```

---

## v0.3 — Relationships and Temporal Engine

Implement:

```text
adce graph
adce link
adce unlink
adce history
```

Add:

```text
Artifact relationships
Manual relationship overrides
Git temporal provider
Filesystem temporal provider
ADCE snapshot provider
Co-change history
```

---

## v0.4 — Deterministic Conflict Engine

Implement:

```text
adce conflicts
adce conflict <id>
```

Add:

```text
Temporal mismatches
Structural mismatches
Schema mismatches
API specification mismatches
Configuration mismatches
Conflict evidence
Conflict severity
Conflict lifecycle
```

---

## v0.5 — Context Engine

Implement:

```text
adce context
adce context --task "<task>"
adce context --format json
```

Add:

```text
Artifact ranking
Authority reasoning
Task-specific context
Context budgets
Machine-readable JSON output
AGENTS.md integration
```

---

## v0.6 — ML Integration

Implement:

```text
adce analyze
adce analyze <conflict-id>
adce analyze --all
adce analyze --deep
```

Add Python ML components for:

```text
Semantic artifact similarity
Relationship prediction
Semantic conflict detection
Authority ranking
Confidence scoring
Hybrid deterministic + ML analysis
```

---

## v0.7 — Research Evaluation

Use:

```text
benchmarks/
experiments/
fixtures/
```

Evaluate:

```text
Rule-based ADCE
vs
ML-assisted ADCE
vs
Hybrid ADCE
```

Metrics should include:

```text
Precision
Recall
F1
False positive rate
False negative rate
Latency
Memory usage
CPU usage
Bandwidth
Cloud payload size
Context size
```

---

# Core Design Principle

ADCE should not assume that every project has:

```text
Git
documentation
tests
schemas
proper project structure
```

The architecture must support:

```text
Automatic artifact discovery
+
Manual artifact creation
+
Manual artifact review
+
Manual relationship creation
+
Human overrides
+
Git temporal evidence when available
+
Filesystem evidence when Git is unavailable
+
ADCE-native snapshots for its own temporal history
```

The final conceptual model is:

```text
Project
   ↓
Artifacts
   ↓
Relationships
   ↓
Temporal Evidence
   ↓
Conflicts
   ↓
Authority / Verification
   ↓
Context
   ↓
Coding Agent
```

The CLI is the main product interface. The ML layer enhances its intelligence. The analytics dashboard is optional and should remain the lowest development priority.
