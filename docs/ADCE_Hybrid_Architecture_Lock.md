# ADCE Hybrid Architecture Lock

**Status:** Binding project requirements (do not steer away without an explicit decision to change this document).  
**Updated:** 2026-09-24  
**Also reflected in:** `docs/ADCE_Technical_Specification.md`, `docs/AGENTS.md`

This file records architecture decisions reached during v0.5–v0.6 planning so future work stays aligned for implementation **and** academic evaluation.

---

## 1. Product thesis (locked)

```text
ADCE  = repository intelligence (what exists, connects, conflicts, and should be trusted)
Agent = code action (implements changes using ADCE’s brief)
```

Intelligence must be focused **inside ADCE** (local deterministic engine + optional ML service), not left to the coding agent to invent trust order from a raw repo dump.

A weak agent may still misread output — therefore ADCE must emit **decision-ready** structured context (ranked MUST READ / CAUTION / TRUST), not essays.

---

## 2. Hybrid shape (locked)

```text
Developer machine                          Your infrastructure
─────────────────                          ───────────────────
ADCE CLI + core + SQLite                   ML API / service
  scan, graph, temporal,                     embeddings / similarity
  deterministic conflicts,                   semantic conflicts
  local context, privacy filter              authority / confidence ranking
  feature selection                          context packing (“agent brief”)
       │                                            │
       └──── HTTPS (selected payload only) ─────────┘
                         │
                         ▼
              Coding agent (via AGENTS.md ritual)
```

| Mode | Role |
|------|------|
| **Local-first (required)** | Default path. Always works offline / without API. Owns facts. |
| **ML server (required for full product + academic deliverable)** | Optional at *runtime* if unreachable; **required in the project scope** as a first-class component. Owns heavier judgment. |
| **Local-only forever** | **Rejected** as the end architecture (CLI-only is incomplete for professors / full roadmap). |

**Runtime:** ML may be unavailable → heuristic / local context fallback.  
**Project scope:** Ship and document the **full hybrid** (CLI + ML server), not a toy one-off script as the final story.

---

## 3. How coding agents consume ADCE (locked)

Primary integration is **instruction-driven**, not vendor lock-in:

1. Repo `AGENTS.md` (or equivalent agent rules) tells the agent to run ADCE.
2. Agent runs e.g. `adce status`, `adce context --task "…"`, `adce conflicts`, optionally `adce analyze`.
3. Agent uses the returned structured context as its working brief.

The “final prompt” for the agent is **assembled from ADCE output** (and the agent’s task). It is **not** required to come exclusively from the ML API.

| Situation | Context source |
|-----------|----------------|
| API down / privacy block / `--no-ml` | Local `adce context` (+ heuristic analyze) |
| API available | Local facts + ML enrichment / packed brief from server |

---

## 4. What must stay local (locked)

ML / cloud must **not** own:

```text
Scanning
Git history collection
SQLite persistence
Manual artifacts
Human overrides (verify/reject/authority/conflict lifecycle)
Configuration
Basic deterministic conflicts (temporal, structural, schema, config)
```

The local engine decides **what leaves the machine**.

---

## 5. What the ML server owns (full scope — locked target)

Build the **full hybrid ML service**, not a forever-minimal stub. Academic and product target includes:

```text
HTTP(S) API (e.g. FastAPI) using shared AnalyzeRequest / AnalyzeReport contracts
Semantic artifact similarity (embeddings)
Relationship / semantic-conflict suggestions
Authority and confidence ranking assistance
Context packing → agent-ready brief (MUST READ / CAUTION / TRUST)
Server-side caching
Privacy-aware acceptance of only selected features / chunks
Secret detection before outbound payloads (local) and rejection of forbidden uploads (server)
Feedback logging hooks (confirm/reject/resolve) for later ranking / bandit / RL research
```

**Local Python subprocess** (`ml/adce_ml/cli.py`) is an acceptable **dev stand-in**. End architecture replaces/extends it with **`ADCE_ML_URL` → your ML API**. Heavy models live on **your server**, not on every developer laptop.

### Explicitly out of default scope

```text
Uploading the entire repository
Requiring the ML API for scan/status/context to function
Auto-CONFIRMED conflicts from ML alone
Silently overwriting human authority / verification
Putting large model weights on every user machine as the primary design
```

---

## 6. Reinforcement learning (locked guidance)

RL is **allowed later on the server**, not required for v0.6 MVP wiring.

Prefer:

```text
Contextual bandits / preference learning over context packing and conflict ranking
Rewards from human confirm / reject / resolve / ignore and (later) outcome signals
```

Do **not** use RL as the first substitute for:

```text
Deterministic detectors
Embedding similarity
Straightforward confidence classifiers
```

---

## 7. Privacy (locked)

**Allowed by default:** hashes, types, timestamps, structural metadata, derived features.  
**Conditional:** selected code/doc chunks after filtering.  
**Forbidden by default:** entire repo, `.env`, secrets, credentials, private keys, unrelated files.

---

## 8. Academic / evaluation framing (locked)

Professors should see a **systems + ML** project:

```text
Local deterministic ADCE  +  ML service  +  hybrid merge  +  agent ritual (AGENTS.md)
```

v0.7 research comparisons remain:

```text
Rule-based ADCE
vs
ML-assisted ADCE
vs
Hybrid ADCE
```

Metrics may include precision/recall on conflict usefulness, ranking quality, and whether agents follow ADCE briefs.

---

## 8b. Multi-language first-class strategy (locked guidance)

**Root markers ≠ first-class support.** Discovering `go.mod` / `pyproject.toml` / etc. only helps `adce init` find a root. Usable inventory ≠ language-native intelligence.

### Layers

| Layer | Role |
|-------|------|
| **Local facts** | Classifiers, structure profiles, 1–2 deterministic detectors per ecosystem |
| **Shared graph** | Docs↔source↔tests, temporal staleness, manifest/env mismatches (language-light) |
| **ML (+ later RL)** | Semantic similarity, ranking, brief packing; RL/bandits only after feedback volume |

ML and RL **do not** replace structure profiles or parsers. Offline / `--skip-ml` must still feel solid.

**ML stack is Python** (FastAPI HTTP service on your infra). The TypeScript CLI only owns a thin HTTP client + local privacy filter + heuristic fallback — never the model server.

### Depth before breadth (priority)

```text
1. TypeScript / Node   (current default — deepen)
2. Python
3. Go  (or Java/Gradle — pick one for thesis depth)
4. Rust / PHP only if audience demands
```

Prefer **first-class on 2–3 widely used stacks** over shallow markers for six languages.

### Build order

```text
1. Structure profiles: generic + python (+ go)
2. Richer multi-lang classifiers (tests, manifests, entrypoints)
3. Language-agnostic conflict detectors that fire often
4. Full ML HTTP in Python (embeddings + ranking + packing)  ← current v0.6 finish line
5. v0.7 benchmark: rule vs ML vs hybrid on mixed-language fixtures
6. Bandits / RL for ranking — last
```

### Done when

A mid-size **Python or Go** repo can `init → scan → structure → conflicts → context` with real signal **with ML down**. ML then upgrades judgment.

---

## 9. Implementation checklist (do not drop)

- [x] Local CLI through context + deterministic conflicts (v0.1–v0.5)
- [x] Local analyze heuristic + optional local ML script stand-in (v0.6 MVP)
- [x] Mid-session agent nudge + `adce doctor` + Cursor rule on init
- [x] Decision-ready context buckets in agent-facing output
- [ ] **Full ML HTTP service in Python** (FastAPI; embeddings + ranking + agent brief)
- [ ] CLI client via `ADCE_ML_URL` (fallback to local Python script / heuristic if unreachable)
- [ ] Privacy filter on outbound analyze/context-enrich payloads
- [ ] Feedback logging for ranking research
- [x] Multi-lang structure profiles (`generic`, `python`; `go` later)
- [ ] v0.7 benchmark scenarios and ablations

---

## 10. Change control

If a future change contradicts this file (e.g. “CLI-only is enough” or “API must always produce the only agent prompt”):

1. Update **this document** explicitly.
2. Mirror the change in `docs/ADCE_Technical_Specification.md` §3 / §18 and `docs/AGENTS.md` ML Rules.
3. Note the decision in `docs/PROGRESS.md`.

Until then, **this hybrid lock wins**.
