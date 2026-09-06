# ADCE

Artifact-Driven Context Engine — a temporal and conflict-aware context layer for AI coding agents.

## Status

Early development. Current milestone:

```text
adce init → adce scan → adce status
```

## Documentation

| Document | Role |
|----------|------|
| [docs/AGENTS.md](docs/AGENTS.md) | Coding agent instructions and invariants |
| [docs/ADCE_Technical_Specification.md](docs/ADCE_Technical_Specification.md) | Primary technical source of truth |
| [docs/ADCE_Project_Directory_and_Implementation_Plan.md](docs/ADCE_Project_Directory_and_Implementation_Plan.md) | Package layout and development order |
| [docs/ADCE_Complete_Project_Explanation.md](docs/ADCE_Complete_Project_Explanation.md) | Full product and research explanation |

## Development

```bash
pnpm install
pnpm --filter @adce/cli dev -- --help
```

Requires Node.js 22+.
