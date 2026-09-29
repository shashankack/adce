# ADCE — Project Progress Report

**Artifact-Driven Context Engine**

| Field | Value |
|-------|--------|
| Student project | ADCE (local-first CLI + hybrid ML architecture) |
| Report date | 29 September 2026 (updated) |
| Audience | Faculty / project review |
| Roadmap scope | v0.1 – v0.7 (+ dashboard deferred) |
| **Overall completion** | **≈ 95–96%** of planned v0.1–v0.7 roadmap |
| Automated tests | Vitest `@adce/core` + `pnpm bench:analyze` + ML pack smoke |
| Primary references | `docs/ADCE_Technical_Specification.md`, `docs/ADCE_Hybrid_Architecture_Lock.md`, `docs/PROGRESS.md`, `docs/AGENTS.md` |

---

## 1. One-line summary

ADCE is a **repository intelligence layer** for AI coding agents: it scans a project into artifacts and relationships, detects conflicts over time, respects human trust overrides, and emits a **decision-ready context brief** (MUST READ / CAUTION / TRUST ORDER). The coding agent *acts*; ADCE *judges what to trust*.

---

## 2. Overall progress at a glance

| Version | Theme | Status | Est. complete |
|---------|--------|--------|----------------|
| **v0.1** | CLI foundation (init → scan → status) | **Done** | 100% |
| **v0.2** | Artifact management | **Done** | 100% |
| **v0.3** | Relationships + temporal history | **Done** | 100% |
| **v0.4** | Deterministic conflict detection | **Done** | ~100% |
| **v0.5** | Context engine + structure profiles | **Done** (TS / Python / Go / typescript-api / generic) | ~100% |
| **v0.6** | ML integration (hybrid) | **Done** (MiniLM + feedback + LinUCB + `/v1/pack`) | ~98% |
| **v0.7** | Research benchmark / evaluation | **Done for thesis scaffold** | ~75% |
| Dashboard | UI (post-core roadmap) | **Deferred** | — |

### How the overall % was estimated

```text
v0.1–v0.5  ≈ 5 equal milestones at 100%
v0.6       ≈ 98% (FastAPI + MiniLM + privacy + feedback + LinUCB + pack)
v0.7       ≈ 75% (ablation runner, precision/recall/mlLift/brief metrics, golden path;
                 larger corpora optional)

Blended roadmap estimate for v0.1–v0.7:  ≈ 95–96%
```

**Local CLI and hybrid ML path work end-to-end** (offline heuristic; MiniLM + pack when `ADCE_ML_URL` is up). Dashboard is explicitly out of scope for the core thesis.

---

## 3. Architecture (locked)

Hybrid: local deterministic facts + optional ML judgment over HTTPS with a privacy filter. Primary embedder: MiniLM (`all-MiniLM-L6-v2`) with hashing fallback. Ranking research: feedback log + LinUCB. Context packing: `POST /v1/pack` reorders MUST READ / CAUTION / TRUST using task–item similarity.

---

## 4. What remains (optional)

| Priority | Item | Notes |
|----------|------|-------|
| 1 | Larger evaluation corpora / CI ML-up job | Extends v0.7; scaffold exists |
| 2 | Dashboard UI | Deferred |
| 3 | `structure --fix` already ships for concrete paths | Wildcards still manual |

---

## 5. Demo-ready command surface

```text
adce init [-y] [--repair]
adce scan [--full]
adce doctor [--format json] [--nudge]
adce structure -p typescript-lib|typescript-api|generic|python|go [--fill]
adce conflicts | conflict confirm|resolve|reject|ignore   # → /v1/feedback + score
adce context --task "…" [--skip-pack] --format markdown
adce analyze [--deep] [--skip-ml] [--skip-cache]
pnpm bench:analyze   # rule vs hybrid; golden when ML-up
```

---

## 6. Evaluation & academic framing (v0.7)

`pnpm bench:analyze` compares **rule-only** vs **hybrid** on fixtures. Metrics: category recall/precision, `mlLift`, brief caution coverage, latency. Results: `benchmarks/results/latest.json`; ML-up golden: `benchmarks/golden/analyze-hybrid-latest.json`.

Example signal: `parser-conflicts` hybrid can show ML suggestions (e.g. `2/4/6`) while rule stays heuristic-only (`2/0/2`).

---

## 7. Bottom line for review

| Question | Answer |
|----------|--------|
| Is there a working product CLI? | **Yes** |
| Does it work without ML / Git? | **Yes** |
| Is hybrid ML HTTP wired? | **Yes** (MiniLM + pack + LinUCB) |
| Multi-lang structure? | **TS lib/API + Python + Go (+ generic)** |
| Research ablation? | **Yes** (`pnpm bench:analyze`) |
| Dashboard? | **Deferred** |
| Overall roadmap progress | **≈ 95–96%** |

---

*Prepared / updated from the ADCE repository state as of 29 September 2026. See `docs/PROGRESS.md` and `docs/ADCE_Hybrid_Architecture_Lock.md`.*
