# ADCE Dashboard (scaffold)

Minimal Vite + React UI for faculty demos:

- Ping ML `/health`
- Load `benchmarks/results/*.json` ablation tables

## Run

```powershell
# from repo root
pnpm install
pnpm --filter @adce/dashboard dev
```

Open http://127.0.0.1:5173

This is intentionally thin — extend with live `adce status --format json` later if needed.
