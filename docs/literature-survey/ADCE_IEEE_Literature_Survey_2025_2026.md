# Literature Survey for ADCE
## Artifact-Driven Context Engine: Temporal and Conflict-Aware Context Engineering for AI Coding Agents

**Project:** ADCE — Artifact-Driven Context Engine  
**Research focus:** Repository intelligence, context engineering, software artifact traceability, inconsistency detection, coding agents, temporal evidence, trust ordering, and context efficiency  
**Literature window:** 2025–2026  
**Primary publication source:** IEEE / IEEE-ACM venues

---

## 1. Introduction

AI coding agents increasingly operate over large software repositories and can retrieve substantial amounts of project context. However, retrieving relevant files does not guarantee that the retrieved evidence is current, mutually consistent, or trustworthy.

A software repository may simultaneously contain:

- source code,
- tests,
- documentation,
- schemas,
- configuration files,
- architecture descriptions,
- dependency manifests,
- release notes,
- commit history,
- manually curated knowledge,
- and generated artifacts.

These artifacts can disagree because they evolve at different rates. A documentation file may describe an older API, a test may encode assumptions that no longer hold, a schema may differ from runtime behavior, or two configuration files may specify incompatible versions.

ADCE addresses this problem by introducing a repository intelligence layer between the software repository and the coding agent. Its purpose is not to replace the coding agent, but to determine which repository evidence should be trusted, which evidence requires caution, and which conflicts should be surfaced before context is passed to the agent.

The system models repository content as typed artifacts and relationships, detects temporal and structural conflicts, incorporates human authority overrides, ranks task-specific evidence, and can optionally use semantic embeddings and feedback-driven ranking. It then produces a decision-ready context brief such as:

- **MUST READ**
- **CAUTION**
- **TRUST ORDER**

The literature reviewed below is therefore organized around five related research strands:

1. Coding agents and repository reasoning  
2. Repository context retrieval and efficiency  
3. Software artifact traceability  
4. Inconsistency detection and software evolution  
5. Context-aware and human-guided software intelligence  

---

# 2. Research Gap

Recent research addresses several parts of the repository intelligence problem, including:

- repository-level context retrieval,
- coding-agent orchestration,
- documentation-to-code traceability,
- code-comment inconsistency detection,
- software reconciliation,
- dependency upgrades,
- architecture recovery,
- and token/computation efficiency.

However, these concerns are generally treated independently.

The research gap investigated by ADCE is:

> **Recent work addresses repository-context retrieval, artifact traceability, documentation/code inconsistency, codebase reconciliation, and coding-agent context management, but these concerns are generally treated separately. ADCE investigates whether explicitly modeling heterogeneous repository artifacts, temporal evidence, conflicts, human-defined authority, and task relevance as a pre-agent context layer can improve the quality and efficiency of context supplied to coding agents.**

This framing avoids the weaker claim that coding agents simply cannot understand large repositories. Modern coding agents already support repository-scale retrieval and large context windows. The unresolved problem is whether retrieved context is reliable enough to use without an additional trust and conflict layer.

---

# 3. Literature Survey

## 3.1 Harness Engineering for AI Coding Agents: Emerging Practices and Principles

**Year:** 2026  
**Publisher/Venue:** IEEE, EITCE  
**DOI:** 10.1109/EITCE70137.2026.11634633

### Problem

The effectiveness of AI coding agents depends not only on the language model itself but also on the surrounding system that controls context, constraints, verification, and feedback.

### Method

The paper studies and formalizes engineering practices surrounding coding-agent systems. It describes agent harnesses using dimensions such as:

- feedforward guidance,
- feedback sensors,
- context management,
- context isolation,
- behavioral verification.

### Relevance to ADCE

This paper provides one of the strongest conceptual foundations for ADCE.

ADCE can be positioned as a specialized **repository-context harness layer**. Instead of performing code generation itself, ADCE prepares reliable evidence before the coding agent acts.

### Gap relative to ADCE

The harness-engineering view is broader than ADCE. ADCE concentrates specifically on:

- repository artifact modeling,
- temporal disagreement,
- conflict detection,
- authority ordering,
- task-specific context,
- and compact context delivery.

### IEEE Xplore

https://ieeexplore.ieee.org/document/11634633/

---

## 3.2 CECoder: Fine-Grained Code Element Retrieval for Repository-Level Code Generation

**Year:** 2025  
**Publisher/Venue:** IEEE, ISSREW  
**DOI:** 10.1109/ISSREW67781.2025.00051

### Problem

Repository-level code generation depends heavily on retrieving useful contextual information. Conventional retrieval-augmented approaches may retrieve files or code fragments that are related to a query but still contain irrelevant or misleading information.

### Method

CECoder performs fine-grained code-element retrieval rather than relying only on coarse file-level retrieval.

The approach retrieves concrete usage examples and applies ranking before adding information to the generation context.

The reported evaluation uses **1,825 DevEval repository-level tasks**.

### Relevance to ADCE

CECoder directly supports the idea that context quality is more important than simply supplying more repository content.

Its central question is approximately:

> Which code elements are most relevant?

ADCE asks an additional question:

> When multiple relevant artifacts disagree, which evidence should the coding agent trust?

### Gap relative to ADCE

CECoder primarily optimizes retrieval relevance. ADCE adds:

- conflict awareness,
- temporal evidence,
- artifact authority,
- human overrides,
- and explicit caution signals.

### IEEE Xplore

https://ieeexplore.ieee.org/document/11262312/

---

## 3.3 Recovering Traceability Links Between Code and Documentation: A Retrospective

**Year:** 2025  
**Publisher/Venue:** IEEE Transactions on Software Engineering  
**DOI:** 10.1109/TSE.2025.3534027

### Problem

Software documentation and source code are often maintained separately, making it difficult to determine which documentation corresponds to which implementation elements.

### Method

The paper provides a retrospective examination of research on recovering traceability links between textual software documentation and source code.

It discusses information-retrieval-based approaches developed over approximately two decades and considers new challenges introduced by modern AI systems.

### Relevance to ADCE

ADCE requires relationships such as:

```text
DOCUMENTATION --DOCUMENTS--> SOURCE
TEST          --TESTS------> SOURCE
```

Traceability research establishes the importance of identifying and recovering these relationships.

### Gap relative to ADCE

Traceability establishes **connections** between artifacts.

ADCE goes further by using those connections to reason about:

- disagreement,
- staleness,
- temporal divergence,
- health,
- authority,
- and task-specific trust.

### IEEE Xplore

https://ieeexplore.ieee.org/document/10855629/

---

## 3.4 Enabling Architecture Traceability by LLM-based Architecture Component Name Extraction

**Year:** 2025  
**Publisher/Venue:** IEEE, ICSA  
**DOI:** 10.1109/ICSA65012.2025.00011

### Problem

Architecture documentation and implementation code often use different terminology, creating a semantic gap that makes architecture-to-code traceability difficult.

### Method

The work uses large language models to extract architecture component names and establish traceability between software architecture documentation and source code.

The reported weighted-average F1 score reaches approximately **0.86 using GPT-4o**, compared with approximately **0.87 for TransArC**, while avoiding the requirement to manually construct an architecture model.

### Relevance to ADCE

The paper is relevant to ADCE's artifact relationship layer.

It demonstrates that LLM-based semantic methods can improve relationship discovery between heterogeneous software artifacts.

### Gap relative to ADCE

The paper concentrates on relationship recovery.

ADCE additionally evaluates whether related artifacts:

- agree,
- conflict,
- have changed at different times,
- should receive different trust levels,
- or should be highlighted to a coding agent.

### IEEE Xplore

https://ieeexplore.ieee.org/document/10978943/

---

## 3.5 Code Comment Inconsistency Detection and Rectification Using a Large Language Model

**Year:** 2025  
**Publisher/Venue:** IEEE/ACM ICSE  
**DOI:** 10.1109/ICSE55347.2025.00035

### Problem

Comments frequently become inconsistent with the source code they describe because code and documentation evolve independently.

### Method

The paper presents an LLM-based approach for detecting and correcting inconsistencies between comments and implementation code.

### Relevance to ADCE

This paper strongly supports ADCE's assumption that repository documentation should not automatically be treated as correct simply because it exists.

The work addresses the pattern:

```text
COMMENT <-> CODE
```

ADCE generalizes the inconsistency problem to multiple repository artifact types:

```text
DOCUMENTATION <-> SOURCE
TEST          <-> SOURCE
SCHEMA        <-> DATA / IMPLEMENTATION
CONFIG        <-> CONFIG
API SPEC      <-> IMPLEMENTATION
```

### Gap relative to ADCE

The paper handles a narrow inconsistency type.

ADCE attempts to create a reusable conflict model covering multiple artifact categories and to integrate the result into coding-agent context selection.

### IEEE Xplore

https://ieeexplore.ieee.org/document/11029963/

---

## 3.6 Coding Agents: A Comprehensive Survey of Automated Bug Fixing Systems and Benchmarks

**Year:** 2025  
**Publisher/Venue:** IEEE, CSNT  
**DOI:** 10.1109/CSNT64827.2025.10968728

### Problem

Coding agents are rapidly evolving, but their architectures, benchmark methods, repository interaction patterns, and limitations are fragmented across the literature.

### Method

The paper surveys automated bug-fixing systems and coding-agent approaches, including:

- retrieval-augmented systems,
- agent-based approaches,
- agentless approaches,
- repository-level benchmarks.

It discusses benchmarks such as:

- SWE-bench,
- CODEAGENT-BENCH,
- CodeRAG-Bench.

### Relevance to ADCE

The survey identifies areas such as:

- context handling,
- validation,
- human-AI collaboration,

as important directions for future coding-agent research.

These areas overlap directly with ADCE.

### Gap relative to ADCE

The survey describes the field rather than providing a repository trust mechanism.

ADCE is a concrete system attempting to improve the evidence supplied to coding agents.

### IEEE Xplore

https://ieeexplore.ieee.org/document/10968728/

---

## 3.7 From Requirements to Code: Understanding Developer Practices in LLM-Assisted Software Engineering

**Year:** 2025  
**Publisher/Venue:** IEEE Requirements Engineering Conference  
**DOI:** 10.1109/RE63999.2025.00032

### Problem

High-level software requirements are often too abstract to be sent directly to code-generating LLMs.

### Method

The researchers interviewed **18 practitioners from 14 companies** to study how developers transform requirements into information that can effectively guide LLM-assisted development.

### Findings relevant to ADCE

Developers often enrich requirements with:

- programming tasks,
- design decisions,
- architectural constraints,
- implementation context.

### Relevance to ADCE

The study supports one of ADCE's fundamental design assumptions:

> Effective coding-agent context must include structured engineering evidence rather than only the user's prompt or a set of retrieved source files.

### Gap relative to ADCE

The study explains developer behavior but does not provide a mechanism for automatically modeling repository evidence or resolving disagreement among artifacts.

### IEEE Xplore

https://ieeexplore.ieee.org/document/11190385/

---

## 3.8 Automated Codebase Reconciliation using Large Language Models

**Year:** 2025  
**Publisher/Venue:** IEEE/ACM Forge  
**DOI:** 10.1109/Forge66646.2025.00011

### Problem

Software repositories diverge over time because of:

- conflicting changes,
- branch evolution,
- dependency changes,
- inconsistent files,
- and modifications made in parallel.

### Method

The proposed system analyzes recent commits to determine codebase divergence and uses algorithmic analysis together with LLM-based reasoning to produce context-aware modifications.

### Relevance to ADCE

This paper is particularly relevant to ADCE's temporal and conflict-aware design.

Both systems acknowledge that repository state cannot be understood solely from a static snapshot.

### Gap relative to ADCE

The reconciliation system focuses on generating or applying fixes.

ADCE instead focuses on an earlier stage:

```text
detect disagreement
        ↓
identify evidence
        ↓
estimate trust
        ↓
provide decision-ready context
        ↓
coding agent performs action
```

### IEEE Xplore

https://ieeexplore.ieee.org/document/11052825/

---

## 3.9 LLM Agents for Automated Dependency Upgrades

**Year:** 2025  
**Publisher/Venue:** IEEE/ACM ASE Workshops  
**DOI:** 10.1109/ASEW67777.2025.00016

### Problem

Software dependencies become outdated and may require code modifications, migration knowledge, compatibility analysis, and documentation interpretation.

### Method

The work introduces an LLM-agent architecture for automated dependency upgrades using migration documentation and repository information.

The reported evaluation includes approximately **71.4% precision**, while also considering token usage.

### Relevance to ADCE

The work is relevant to two ADCE dimensions:

1. **Temporal correctness** — dependencies and migration requirements change over time.
2. **Context efficiency** — unnecessary context increases agent cost.

### Gap relative to ADCE

The system is specialized for dependency upgrades.

ADCE provides a general-purpose repository context and conflict layer.

### IEEE Xplore

https://ieeexplore.ieee.org/document/11334457/

---

## 3.10 Thinking Longer, Not Larger: Enhancing Software Engineering Agents via Scaling Test-Time Compute

**Year:** 2025  
**Publisher/Venue:** IEEE/ACM ASE  
**DOI:** 10.1109/ASE63991.2025.00309

### Problem

Simply increasing model size or context may not be the most effective strategy for improving software-engineering agents.

### Method

The paper studies test-time computation scaling for software-engineering agents and evaluates performance using repository-level benchmarks such as SWE-bench Verified.

### Relevance to ADCE

The paper supports the idea that agent performance cannot be reduced to "give the model more tokens."

ADCE similarly treats context as something that must be:

- selected,
- prioritized,
- checked,
- and compacted.

### Gap relative to ADCE

The paper studies compute allocation and reasoning effort.

ADCE studies repository evidence quality and trust ordering before inference.

### IEEE Xplore

https://ieeexplore.ieee.org/document/11334237/

---

## 3.11 SOEN-101: Code Generation by Emulating Software Process Models Using Large Language Model Agents

**Year:** 2025  
**Publisher/Venue:** IEEE/ACM ICSE  
**DOI:** 10.1109/ICSE55347.2025.00140

### Problem

Many LLM-based coding systems perform direct generation without modeling structured software-engineering processes.

### Method

The paper presents FlowGen, in which specialized agents emulate software-development roles such as:

- requirements engineer,
- architect,
- developer,
- tester.

Different software process models are evaluated using code-generation benchmarks.

### Relevance to ADCE

This work demonstrates the trend toward specialized layers and roles around LLM-based software engineering.

ADCE follows a compatible philosophy but introduces a different role:

> repository evidence and trust management.

### Gap relative to ADCE

FlowGen focuses on process orchestration and generation.

ADCE focuses on repository context correctness.

### IEEE Xplore

https://ieeexplore.ieee.org/document/11029771/

---

## 3.12 Establishing Traceability Between Release Notes and Software Artifacts: Practitioners' Perspectives

**Year:** 2025  
**Publisher/Venue:** IEEE CASCON  
**DOI:** 10.1109/CASCON66301.2025.00067

### Problem

Release notes frequently refer to software changes without reliable links to the commits, pull requests, issues, or other artifacts that produced those changes.

### Method

The work studies traceability between release notes and implementation artifacts.

The reported empirical study found that approximately:

- **47%** of release artifacts lacked traceability links,
- **12%** contained broken links.

A benchmark containing approximately **3,500 validated traceability instances** was created.

Temporal proximity is also incorporated into traceability recovery.

### Relevance to ADCE

This paper is highly relevant because it combines:

- heterogeneous artifacts,
- missing relationships,
- temporal evidence,
- repository evolution.

These are core elements of ADCE.

### Gap relative to ADCE

The paper focuses on recovering traceability links.

ADCE intends to use relationships as evidence for conflict and trust reasoning.

### IEEE Xplore

https://ieeexplore.ieee.org/document/11344146/

---

## 3.13 Multi-Agent LLM Collaboration for Adaptive Code Review, Debugging, and Security Analysis

**Year:** 2025  
**Publisher/Venue:** IEEE MRAI  
**DOI:** 10.1109/MRAI65197.2025.11135756

### Problem

Code review and debugging systems often lack persistent feedback mechanisms and adaptive context selection.

### Method

The proposed system uses multiple LLM agents, vector-based memory, and feedback mechanisms to support adaptive software analysis.

### Relevance to ADCE

The work is relevant to ADCE's optional hybrid layer:

- semantic embeddings,
- feedback,
- adaptive ranking.

ADCE currently uses MiniLM-style embeddings together with feedback-driven ranking through LinUCB.

### Gap relative to ADCE

The system is primarily an agent collaboration framework.

ADCE's learning layer is subordinate to deterministic repository facts and human authority rules.

---

## 3.14 Deriving Microservice Architectural Perspectives Using Static Code Analysis for C# Platform

**Year:** 2025  
**Publisher/Venue:** IEEE/ACM SATrends  
**DOI:** 10.1109/SATrends66715.2025.00005

### Problem

Architecture documentation often becomes outdated as implementation evolves.

### Method

The work derives architectural perspectives directly from live source code using static analysis.

### Relevance to ADCE

The paper supports the idea that runtime or implementation evidence may be more current than written documentation.

At the same time, ADCE deliberately avoids adopting the simplistic rule:

```text
newer artifact = authoritative artifact
```

because a newer implementation may still violate an intentionally authoritative specification.

### Gap relative to ADCE

Architecture reconstruction derives information from source.

ADCE compares multiple evidence sources and explicitly models authority.

### IEEE Xplore

https://ieeexplore.ieee.org/document/11029413/

---

## 3.15 LLM-Based Code Generation: A Systematic Literature Review With Technical and Demographic Insights

**Year:** 2025  
**Publisher/Venue:** IEEE Access  
**DOI:** 10.1109/ACCESS.2025.3631952

### Problem

The rapid growth of LLM-based code generation has produced a fragmented literature containing different models, benchmarks, datasets, evaluation metrics, and application settings.

### Method

The systematic review examines approximately **58 studies from 2020–2025**.

### Identified challenges

The review highlights issues including:

- hallucinations,
- generalizability,
- security vulnerabilities,
- limited interpretability.

### Relevance to ADCE

This paper is useful as a broad background source demonstrating that code-generation quality remains affected by context and reliability limitations.

### Gap relative to ADCE

The paper is a broad systematic review and does not introduce repository conflict resolution.

Its main value for ADCE is establishing the broader research landscape.

### IEEE Xplore

https://ieeexplore.ieee.org/document/11242137/

---

# 4. Comparative Literature Table

| Paper | Core Problem | Method / Approach | Evaluation / Evidence | Limitation Relative to ADCE |
|---|---|---|---|---|
| Harness Engineering for AI Coding Agents | Reliability of coding-agent environments | Context, feedback, constraints, verification harness | Engineering framework / analysis | Broad framework; does not specifically model repository artifact conflicts |
| CECoder | Repository retrieval quality | Fine-grained code-element retrieval and reranking | 1,825 DevEval tasks | Optimizes relevance rather than artifact trust |
| Code–Documentation Traceability Retrospective | Missing links between docs and code | IR-based traceability research review | Retrospective of prior traceability work | Establishes links but does not resolve disagreement |
| Architecture Traceability with LLMs | Semantic gap between architecture docs and code | LLM component extraction | Weighted F1 around 0.86 | Traceability only; no conflict/trust layer |
| Code Comment Inconsistency Detection | Code/comment drift | LLM inconsistency detection and correction | ICSE empirical evaluation | Narrow artifact pair |
| Coding Agents Survey | Fragmented coding-agent landscape | Survey of agents and benchmarks | SWE-bench, CodeRAG-Bench, etc. | Descriptive survey rather than solution |
| Requirements to Code | Requirements too abstract for LLM use | Interviews with 18 practitioners / 14 companies | Qualitative grounded evidence | No automatic repository model |
| Automated Codebase Reconciliation | Diverging repository states | Commit analysis + LLM reconciliation | Repository reconciliation experiments | Focuses on modification rather than pre-agent trust |
| LLM Agents for Dependency Upgrades | Dependency evolution and migration | Agent-driven upgrade workflow | ~71.4% precision | Domain-specific |
| Thinking Longer, Not Larger | Software-agent reasoning efficiency | Test-time compute scaling | SWE-bench Verified | Focuses on compute rather than evidence quality |
| SOEN-101 / FlowGen | Lack of SE process structure in generation | Role-based LLM agents | HumanEval / MBPP variants | Process-centric rather than repository conflict-centric |
| Release Notes Traceability | Missing/broken artifact links | Traceability recovery + temporal proximity | ~3,500 validated instances | Link recovery, not conflict resolution |
| Multi-Agent Adaptive Code Review | Static agent context and weak feedback adaptation | Multi-agent system + vector memory + feedback | Code review/debugging experiments | Agent collaboration rather than deterministic repository intelligence |
| Microservice Architecture Recovery | Outdated architecture documentation | Static code analysis | Architecture reconstruction | Prefers derived implementation view; no explicit trust ordering |
| LLM Code Generation SLR | Fragmented LLM code-generation research | Systematic literature review | 58 studies | Broad overview |

---

# 5. Thematic Synthesis

## 5.1 Theme A — Coding Agents Need More Than a Large Context Window

The reviewed work increasingly treats agent performance as a systems problem rather than solely a language-model problem.

Harness engineering, process-oriented agents, and test-time computation research all show that software-engineering agents require:

- controlled context,
- explicit feedback,
- validation,
- structured workflows,
- and reasoning support.

### Implication for ADCE

ADCE should not be framed as a replacement for coding agents.

It should be framed as infrastructure that improves the information supplied to them.

---

## 5.2 Theme B — Retrieval Relevance Is Necessary but Not Sufficient

CECoder and other repository-retrieval systems demonstrate that retrieving the right code elements is important.

However, relevance does not imply correctness.

For example, a task concerning an API endpoint could retrieve all of the following:

```text
openapi.yaml
src/routes/user.ts
tests/user.test.ts
README.md
migration-notes.md
```

Every file can be relevant while still describing a different version of the API.

### Implication for ADCE

The research question should move beyond:

> Can we retrieve relevant context?

toward:

> Can conflict-aware trust ordering improve the context given to an agent when relevant repository artifacts disagree?

---

## 5.3 Theme C — Traceability Is a Foundation for Repository Intelligence

Multiple 2025 studies investigate connections between:

- code and documentation,
- architecture and implementation,
- release notes and commits/issues.

These studies show that artifact relationships are frequently incomplete or difficult to recover.

### Implication for ADCE

ADCE's relationship graph is justified as a prerequisite for conflict analysis.

Without knowing that artifact A describes, tests, configures, or constrains artifact B, the system cannot meaningfully determine whether they disagree.

---

## 5.4 Theme D — Software Artifacts Drift Over Time

The literature on comment inconsistency, dependency upgrades, architecture reconstruction, release-note traceability, and codebase reconciliation consistently demonstrates that repository artifacts evolve at different rates.

### Implication for ADCE

Temporal evidence is a legitimate first-class signal.

However, ADCE should not assume:

```text
newest = correct
```

Time is evidence of possible drift, not proof of authority.

Therefore, temporal evidence should contribute to conflict detection while final authority can incorporate:

- artifact type,
- human verification,
- declared authority,
- structural evidence,
- conflict state,
- task relevance.

---

## 5.5 Theme E — Human Feedback Remains Important

Several reviewed systems identify validation, developer feedback, or human-AI collaboration as important elements.

### Implication for ADCE

ADCE's design rule that machine analysis must not silently override human authority is defensible.

Its hybrid architecture can be described as:

```text
Deterministic repository facts
          +
Optional semantic/ML judgment
          +
Human authority and verification
          ↓
Decision-ready context
```

---

# 6. ADCE Positioning Against Existing Research

ADCE should not claim to invent:

- repository retrieval,
- software traceability,
- inconsistency detection,
- coding agents,
- semantic ranking,
- or LLM-based software analysis.

All of those areas already have substantial research.

The possible contribution lies in combining them into a **pre-agent context intelligence layer** centered on repository trust.

Conceptually:

```text
                       Existing approaches

Repository Retrieval  ─────────────┐
Traceability          ─────────────┤
Temporal Analysis     ─────────────┤
Conflict Detection    ─────────────┤
Human Feedback        ─────────────┤
Semantic Ranking      ─────────────┤
                                    ▼
                         ┌───────────────────┐
                         │       ADCE        │
                         │ Repository Trust  │
                         │ + Context Engine  │
                         └─────────┬─────────┘
                                   ▼
                         Decision-ready brief
                                   ▼
                            Coding Agent
```

The main research proposition is therefore not that any individual component is entirely new.

The contribution is the integration and evaluation of:

1. typed repository artifacts,
2. explicit artifact relationships,
3. temporal evidence,
4. multi-category conflict detection,
5. human verification,
6. explicit authority,
7. task-specific context ranking,
8. optional semantic ranking,
9. token-aware compact context,
10. reproducible rule-vs-hybrid evaluation.

---

# 7. Proposed Research Questions

The literature supports several defensible research questions.

## Primary Research Question

> **Does conflict-aware and authority-aware repository context selection improve the reliability of context supplied to AI coding agents compared with relevance-only or rule-only context selection?**

## Secondary Research Questions

### RQ2 — Conflict Detection

> How effectively can a repository intelligence layer detect temporal, structural, schema, and configuration inconsistencies among related software artifacts?

Possible metrics:

- precision,
- recall,
- F1-score,
- false-positive rate.

---

### RQ3 — Hybrid Analysis

> Does semantic ML-assisted analysis identify additional useful repository conflicts or context signals beyond deterministic rules?

Possible metrics:

- rule-only recall,
- hybrid recall,
- precision,
- ML lift,
- latency.

---

### RQ4 — Context Efficiency

> Can trust-aware compact context reduce tokens supplied to a coding agent without reducing coverage of important conflicts and authoritative artifacts?

Possible metrics:

- tokensFull,
- tokensDelivered,
- tokensSaved,
- percentage reduction,
- conflict coverage,
- authoritative-artifact coverage.

---

### RQ5 — Human Authority

> How does explicit human-defined artifact authority affect context ranking when repository evidence is conflicting?

Possible evaluation:

- ranking agreement,
- trust-order correctness,
- task success under conflicting evidence.

---

# 8. Candidate Experimental Comparison

A useful ablation design would compare:

## Baseline A — Relevance-only

```text
Task query
   ↓
semantic / lexical relevance
   ↓
top-k artifacts
```

## Baseline B — Deterministic ADCE

```text
Task query
   ↓
artifact graph
   ↓
deterministic conflicts
   ↓
authority + verification + relevance
   ↓
context brief
```

## Proposed Hybrid

```text
Task query
   ↓
artifact graph
   ↓
deterministic conflicts
   ↓
semantic ML analysis
   ↓
feedback-aware ranking
   ↓
authority + verification
   ↓
compact context brief
```

Metrics can include:

- conflict recall,
- conflict precision,
- context coverage,
- authority ranking accuracy,
- latency,
- token count,
- token reduction,
- downstream task correctness.

---

# 9. Recommended Literature Categories for Final Paper

For the final literature review, the sources should be organized by research problem rather than merely chronologically.

## Category 1 — AI Coding Agents

- Harness Engineering for AI Coding Agents
- Coding Agents: A Comprehensive Survey
- SOEN-101 / FlowGen
- Thinking Longer, Not Larger

## Category 2 — Repository Context Retrieval

- CECoder
- repository-level retrieval and code-generation work
- context-efficiency work

## Category 3 — Artifact Traceability

- Recovering Traceability Links Between Code and Documentation
- Architecture Traceability using LLMs
- Release Notes and Software Artifact Traceability

## Category 4 — Artifact Inconsistency and Evolution

- Code Comment Inconsistency Detection
- Automated Codebase Reconciliation
- LLM Agents for Automated Dependency Upgrades
- architecture recovery from live code

## Category 5 — Human and Adaptive Context

- From Requirements to Code
- Multi-Agent Adaptive Code Review
- Harness Engineering
- feedback-based ranking approaches

---

# 10. Recommended Core Papers

If presentation space is limited, the strongest set for directly explaining ADCE is:

1. **Harness Engineering for AI Coding Agents: Emerging Practices and Principles** — 2026  
2. **CECoder: Fine-Grained Code Element Retrieval for Repository-Level Code Generation** — 2025  
3. **Recovering Traceability Links Between Code and Documentation: A Retrospective** — 2025  
4. **Enabling Architecture Traceability by LLM-based Architecture Component Name Extraction** — 2025  
5. **Code Comment Inconsistency Detection and Rectification Using a Large Language Model** — 2025  
6. **Automated Codebase Reconciliation using Large Language Models** — 2025  
7. **Establishing Traceability Between Release Notes and Software Artifacts** — 2025  
8. **Coding Agents: A Comprehensive Survey of Automated Bug Fixing Systems and Benchmarks** — 2025  

These eight papers collectively cover most of the conceptual foundation required for ADCE:

```text
coding agents
      +
context engineering
      +
repository retrieval
      +
artifact relationships
      +
temporal evolution
      +
inconsistency
      +
trust / validation
      ↓
ADCE
```

---

# 11. Literature Survey Summary

The 2025–2026 literature shows rapid progress in repository-level coding agents, retrieval, artifact traceability, automated inconsistency detection, and LLM-assisted software maintenance.

Three conclusions emerge from the survey.

### 1. Repository-scale retrieval is already an established research direction

Therefore, ADCE should not claim novelty merely because it gives a coding agent repository context.

### 2. Artifact inconsistency is a demonstrated software-engineering problem

Recent work on comments, architecture documents, dependencies, release notes, and codebase reconciliation shows that repository evidence can drift and become unreliable.

### 3. Current work remains fragmented

Retrieval systems primarily optimize relevance.

Traceability systems primarily recover relationships.

Inconsistency tools typically focus on one artifact pair.

Coding-agent frameworks primarily focus on task execution.

ADCE investigates the integration of these concerns into a unified repository trust layer.

The resulting research hypothesis is:

> **A coding agent may perform more reliably and efficiently when repository context is selected not only by relevance, but also by artifact relationships, temporal evidence, conflict status, human verification, and explicit authority.**

This provides a defensible basis for evaluating ADCE through rule-only versus hybrid ablation, conflict detection metrics, context coverage, ranking behavior, latency, and token-efficiency measurements.

---

# 12. Reference List

1. **Harness Engineering for AI Coding Agents: Emerging Practices and Principles.** IEEE EITCE, 2026. DOI: `10.1109/EITCE70137.2026.11634633`.

2. **CECoder: Fine-Grained Code Element Retrieval for Repository-Level Code Generation.** IEEE ISSREW, 2025. DOI: `10.1109/ISSREW67781.2025.00051`.

3. **Recovering Traceability Links Between Code and Documentation: A Retrospective.** IEEE Transactions on Software Engineering, 2025. DOI: `10.1109/TSE.2025.3534027`.

4. **Enabling Architecture Traceability by LLM-based Architecture Component Name Extraction.** IEEE ICSA, 2025. DOI: `10.1109/ICSA65012.2025.00011`.

5. **Code Comment Inconsistency Detection and Rectification Using a Large Language Model.** IEEE/ACM ICSE, 2025. DOI: `10.1109/ICSE55347.2025.00035`.

6. **Coding Agents: A Comprehensive Survey of Automated Bug Fixing Systems and Benchmarks.** IEEE CSNT, 2025. DOI: `10.1109/CSNT64827.2025.10968728`.

7. **From Requirements to Code: Understanding Developer Practices in LLM-Assisted Software Engineering.** IEEE RE, 2025. DOI: `10.1109/RE63999.2025.00032`.

8. **Automated Codebase Reconciliation using Large Language Models.** IEEE/ACM Forge, 2025. DOI: `10.1109/Forge66646.2025.00011`.

9. **LLM Agents for Automated Dependency Upgrades.** IEEE/ACM ASE Workshops, 2025. DOI: `10.1109/ASEW67777.2025.00016`.

10. **Thinking Longer, Not Larger: Enhancing Software Engineering Agents via Scaling Test-Time Compute.** IEEE/ACM ASE, 2025. DOI: `10.1109/ASE63991.2025.00309`.

11. **SOEN-101: Code Generation by Emulating Software Process Models Using Large Language Model Agents.** IEEE/ACM ICSE, 2025. DOI: `10.1109/ICSE55347.2025.00140`.

12. **Establishing Traceability Between Release Notes and Software Artifacts: Practitioners' Perspectives.** IEEE CASCON, 2025. DOI: `10.1109/CASCON66301.2025.00067`.

13. **Multi-Agent LLM Collaboration for Adaptive Code Review, Debugging, and Security Analysis.** IEEE MRAI, 2025. DOI: `10.1109/MRAI65197.2025.11135756`.

14. **Deriving Microservice Architectural Perspectives Using Static Code Analysis for C# Platform.** IEEE/ACM SATrends, 2025. DOI: `10.1109/SATrends66715.2025.00005`.

15. **LLM-Based Code Generation: A Systematic Literature Review With Technical and Demographic Insights.** IEEE Access, 2025. DOI: `10.1109/ACCESS.2025.3631952`.

---

## Note

This document is intended as a working literature-survey draft for the ADCE project. Before final paper submission, bibliographic metadata such as author order, volume, issue, page numbers, and official IEEE citation formatting should be exported directly from IEEE Xplore or a reference manager into BibTeX.
