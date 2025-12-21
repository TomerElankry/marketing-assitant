# Functional Requirements Document (FRD)

**Project:** AI Agent‑Based Marketing Analysis System  
**Version:** 1.4 (MCP‑enabled)  
**Date:** 19 Nov 2025  
**Owner:** <Your team>

---

## 1) Purpose & Scope
Extend the existing FRD to define **agent communication and capability discovery** using the **Model Context Protocol (MCP)**, alongside a **reliable messaging layer** for orchestration. The system ingests a structured questionnaire and outputs a validated, culturally localized marketing analysis with exportable reports (PDF/figma/draw.io).

**Out of scope:** Billing, human‑in‑the‑loop review UI, and vendor procurement.

---

## 2) High‑Level Goals (Recap)
1. Gather structured business/product inputs.  
2. Run **three independent LLM analyses** (GPT, Gemini, Grok).  
3. **Validate & merge** findings based on cross‑model consensus.  
4. **Culturally localize** by target country.  
5. Generate a **final report** (personas, positioning, channels, cultural do’s/don’ts, SWOT, risks, campaign ideas).

---

## 3) Actors / Agents
- **Orchestrator Service** — workflow controller; MCP **Host**; talks to all agents.
- **Data Collection Agent** — validates questionnaire completeness; MCP Server (tools for parsing/validation).
- **LLM Worker Agents ×3** — GPT, Gemini, Grok runners; each an MCP Server exposing `analyze_*` tools.
- **Validation & Merging Agent** — computes consensus, flags disagreements; MCP Server (`merge_findings`).
- **Cultural Localization Agent** — adapts strategies per country; MCP Server (`localize_message`).
- **Report Generation Agent** — composes output & exports; MCP Server (`compile_report`, `export_pdf`, `export_figma`).

All agents run as isolated services/containers. Each may also act as an **MCP Client** when delegated.

---

## 4) Communication Architecture

### 4.1 MCP Capability Layer
- **Role topology**: Orchestrator is **MCP Host**. Each agent is an **MCP Server** exposing a set of **Tools** and **Resources**.  
- **Discovery**: On startup, Orchestrator performs capability discovery and caches: tool IDs, versions, input/output schemas, required auth scopes.  
- **Invocation**: Orchestrator invokes agent tools via MCP JSON‑RPC with streaming outputs supported.  
- **Resources**: Inputs/outputs are referenced via `mcp://` URIs; payloads (e.g., large text, cached JSON) are stored in the **Analysis Cache** service and exposed as MCP Resources (read‑only by default).

### 4.2 Messaging Layer (Bus/RPC)
- **Purpose**: Reliable task dispatch, fan‑out to workers, backpressure, retries, and progress events.  
- **Implementation**: NATS or Kafka (queue groups for workers). gRPC may be used for low‑latency unary calls where appropriate.  
- **Contract**: The bus carries **lightweight events** with **references** to data (`inputs_ref`, `outputs_ref`). Agents fetch actual content via MCP Resources.

### 4.3 Event Types (canonical)
- `task.submitted` — Orchestrator publishes with `task_id`, `job_type` (e.g., `analysis.gpt`), `inputs_ref`.  
- `task.assigned` — Bus assigns task to a worker group.  
- `task.progress` — Percent, status text, optional partial result refs.  
- `task.completed` — Includes `outputs_ref`, `duration_ms`.  
- `task.failed` — Includes machine‑readable `error_code`, `error_details`.  
- `audit.trace` — Correlates MCP calls to bus events via `trace_id`.

---

## 5) MCP Tooling Contracts (per Agent)

> **Notation:** Pseudo‑IDL resembling JSON Schema. All tools must include `version` and return `result_ref` (an MCP Resource URI) unless noted.

### 5.1 Data Collection Agent (Server)
- **`validate_questionnaire@v1`**  
  **Input:** `{ questionnaire_ref: string }`  
  **Output:** `{ normalized_ref: string, missing_fields: string[] }`

- **`infer_missing@v1`** *(optional)*  
  Input hints and heuristics to suggest defaults.

### 5.2 LLM Worker Agents (GPT/Gemini/Grok)
- **`analyze_market@v1`**  
  **Input:** `{ normalized_ref: string, country: string, objectives: string[] }`  
  **Output:** `{ analysis_ref: string, telemetry?: object }`

- **`extract_structures@v1`**  
  Output includes structured personas, JTBD, channels, KPIs in deterministic JSON.

### 5.3 Validation & Merging Agent
- **`merge_findings@v1`**  
  **Input:** `{ analysis_refs: string[], consensus_threshold?: number, tie_breaker?: "precision|recall" }`  
  **Output:** `{ merged_ref: string, disagreements_ref: string, confidence: number }`

- **`quality_gates@v1`**  
  Lints for contradictions, hallucinations, missing citations.

### 5.4 Cultural Localization Agent
- **`localize_message@v1`**  
  **Input:** `{ merged_ref: string, country: string, culture_profile_ref?: string }`  
  **Output:** `{ localized_ref: string, cultural_risks: string[] }`

### 5.5 Report Generation Agent
- **`compile_report@v1`**  
  **Input:** `{ localized_ref: string, format: "json|html|md" }`  
  **Output:** `{ doc_ref: string }`

- **`export_pdf@v1`**  
  **Input:** `{ doc_ref: string, theme?: string }`  
  **Output:** `{ pdf_ref: string }`

- **`export_figma@v1`**  
  **Input:** `{ doc_ref: string, component_set?: string }`  
  **Output:** `{ figma_file_url: string }`

---

## 6) Data Model & Storage
- **Analysis Cache** (object store + index): holds all `{*_ref}` JSON blobs & artifacts; exposed as MCP Resources.  
- **Relational DB**: jobs, tasks, events, `trace_id`, user sessions, permissions.  
- **Schema versioning**: Every tool input/output includes `schema_version`. Migrations are additive; deprecations follow 90‑day policy.

---

## 7) Security & Compliance
- **MCP Scopes** per tool (least privilege). Example: `scope:analysis.read`, `scope:merge.write`.  
- **Secret management** via KMS/Secrets Manager; short‑lived tokens for MCP client auth.  
- **Network isolation**: agents per‑namespace; deny‑by‑default egress except LLM APIs.  
- **PII handling**: questionnaire fields tagged; masking in logs; data retention 90 days (configurable).  
- **Auditability**: all MCP calls and bus events emit `audit.trace` with `trace_id` and hashed principal.

---

## 8) Reliability & Observability
- **Retries & backoff** at the bus level; idempotency keys on `task.submitted`.  
- **Circuit breakers** around LLM vendor calls.  
- **Tracing**: OpenTelemetry spans for bus events and MCP invocations.  
- **SLOs**: P95 job completion < X minutes; error rate < Y%; availability 99.9%.  
- **Dead‑letter queues** for failed tasks with automated triage rules.

---

## 9) Non‑Functional Requirements
- **Performance**: Parallel fan‑out to 3 LLM agents; streaming partials to UI.  
- **Scalability**: Horizontal scale of worker groups; sharded cache.  
- **Portability**: Containers; deployable to K8s; no vendor‑specific SDKs in core.  
- **Cost controls**: Token budgets per job; dynamic model selection; caching & reuse.

---

## 10) API Endpoints (External)
- `POST /v1/jobs` — submit questionnaire; returns `task_id`.  
- `GET /v1/jobs/{task_id}` — job status & artifact refs.  
- `GET /v1/artifacts/{ref}` — signed download proxy (role‑gated).  
- `WS /v1/stream/{task_id}` — progress & partials (mirrors `task.progress`).

---

## 11) Sequence (Happy Path)
1. User submits questionnaire → `POST /v1/jobs`.  
2. Orchestrator → `task.submitted` (trace `trc_*`).  
3. Data Agent `validate_questionnaire` → `normalized_ref`.  
4. Fan‑out `task.submitted` to 3 LLM agents → each returns `analysis_ref`.  
5. Validation Agent `merge_findings` → `merged_ref`, `disagreements_ref`.  
6. Cultural Agent `localize_message` → `localized_ref`.  
7. Report Agent `compile_report` + `export_pdf` → `pdf_ref`.  
8. UI streams progress; user downloads PDF.

---

## 12) Error Cases & Policies
- **One worker fails:** continue with remaining analyses; if <2 analyses available, lower `consensus_threshold` or mark job `needs_review`.  
- **Schema mismatch:** return `error_code=SCHEMA_MISMATCH`, auto‑retry after refreshing discovery cache.  
- **Tool absent:** fallback to alternate tool version; if none, publish `task.failed` with remediation hint.

---

## 13) Acceptance Criteria
- [ ] Orchestrator discovers ≥5 MCP tools across agents at boot and caches schemas.  
- [ ] A complete run completes with **3 parallel analyses**, merged output, localized report, and **PDF export**.  
- [ ] Bus emits `task.progress` events at ≥ 10% increments with valid `trace_id`.  
- [ ] Security: agents can call only tools for which they possess scopes; unauthorized calls are rejected and audited.  
- [ ] Observability: single trace visualizes bus + MCP spans end‑to‑end.  
- [ ] Failure drill: kill one LLM agent; job still completes with degraded confidence and visible `disagreements_ref`.

---

## 14) Open Questions / Next Steps
- Decide on **bus** (NATS vs Kafka) and **RPC** usage.  
- Define **country culture profiles** store & update cadence.  
- UI design for **disagreements view** and confidence visualization.  
- Figma templates library for report export.

