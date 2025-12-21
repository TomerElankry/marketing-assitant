# Full TODO — Backend-First (Agents + Orchestrator) Plan
**Generated:** 2025-11-19 20:05  
**Basis:** implementation_plan.md, frd.md, prd.md, backend_kickstart.tar.gz

Legend: [ ] todo · [~] in-progress · [x] done · **P0** critical · **P1** high · **P2** medium  
ID format: `M{milestone}-{workstream}-{seq}` (e.g., `M0-ORCH-01`).

> Focus: stand up **infra, orchestrator, agents, schemas, bus, storage** first. Web UI items are **deferred** or minimal.

---

## EPICS / WORKSTREAMS
- **ORCH** – Orchestrator (MCP Host/Hub)
- **AGENTS** – Data, LLM×3, Merge, Localization, Report
- **BUS/STORAGE** – NATS/Kafka, Cache/DB/Artifacts
- **SEC** – Security & Compliance
- **OBS** – Observability & Cost
- **QA** – Testing (unit/contract/E2E/golden/chaos)
- **OPS** – Runbooks, SLOs, deployment
- **PORTAL** – Minimal stubs only (deferred full UI)

---

## M0 — Foundations (Backend First) — 2–3 sprints

### BUS/STORAGE (Infra First)
- [ ] **M0-BUS-01 (P0)**: Bring up infra via docker-compose (NATS, Postgres, MinIO, Jaeger)  
  **Acceptance:** containers healthy; ports reachable; buckets/db created.
- [ ] **M0-STOR-01 (P0)**: Create S3 bucket `analysis-cache` and initialize object prefixes  
  **Acceptance:** put/get works; IAM/creds set via env; 90-day lifecycle stub.
- [ ] **M0-STOR-02 (P0)**: Apply initial Postgres schema (users, projects, project_members, questionnaires, jobs, artifacts, audit_logs)  
  **Acceptance:** migration up/down works; seed script available.

### SCHEMAS & CONTRACTS
- [ ] **M0-SCHEMA-01 (P0)**: Freeze MCP tool schemas v1 (`schemas/mcp/*`)  
  **Acceptance:** JSON Schema validation in CI; version pinning.
- [ ] **M0-SCHEMA-02 (P0)**: Freeze bus contracts (`bus/contracts.json`)  
  **Acceptance:** Contract tests pass; producers/consumers use same lib.

### ORCH (MCP Host/Hub)
- [ ] **M0-ORCH-01 (P0)**: Implement discovery cache (tools, versions, scopes)  
  **Acceptance:** on boot, discovers ≥5 tools; exposes metrics.
- [ ] **M0-ORCH-02 (P0)**: Implement task router (publish `task.submitted`, correlate progress/completed)  
  **Acceptance:** idempotent submit; correlation via `trace_id`.
- [ ] **M0-ORCH-03 (P0)**: Implement resource broker for `mcp://` over MinIO  
  **Subtasks:** put/get JSON blobs; list by project_id/job_id; signed URLs for artifacts.  
  **Acceptance:** end-to-end store/fetch; 1h signed URL expiry.

### AGENTS (MVP)
- [ ] **M0-AGENTS-01 (P0)**: Data agent `validate_questionnaire@v1` skeleton → functional  
  **Subtasks:** fetch questionnaire resource; validate; normalize; return refs & missing_fields.  
  **Acceptance:** >95% of sample set normalized; errors logged.
- [ ] **M0-AGENTS-02 (P0)**: Report agent `compile_report@v1` (JSON→MD)  
  **Acceptance:** deterministic output; schema-validated.
- [ ] **M0-AGENTS-03 (P0)**: Report agent `export_pdf@v1` (wkhtml/topdf or playwright)  
  **Acceptance:** PDF ≤ 10MB; footer has job_id/trace_id.
- [ ] **M0-AGENTS-04 (P1)**: Add stub LLM agent (mock) `analyze_market@v1` returning canned analysis_ref  
  **Acceptance:** used for pipeline bring-up.

### QA (Backend)
- [ ] **M0-QA-01 (P0)**: Contract tests (REST minimal, MCP tools, bus events)  
  **Acceptance:** CI gate green.
- [ ] **M0-QA-02 (P0)**: Golden tests — sample questionnaires → stable report JSON/MD/PDF  
  **Acceptance:** diffs within tolerance.
- [ ] **M0-QA-03 (P1)**: Trace E2E test (task_id→trace_id) visible in Jaeger

### OBS & SEC & OPS
- [ ] **M0-OBS-01 (P0)**: OpenTelemetry wiring (Node/Python SDK) + Jaeger export  
  **Acceptance:** spans for submit→validate→report/export.
- [ ] **M0-SEC-01 (P0)**: Secrets via env; no hard-coded creds; CORS/CSRF N/A yet  
  **Acceptance:** secret scanner passes; review checklist signed.
- [ ] **M0-OPS-01 (P1)**: CI/CD skeleton (lint/test/build) for orchestrator+agents  
  **Acceptance:** on PR, tests run and artifacts built.

**M0 DoD:** `curl` a minimal **submit job** → Data agent validates → stub LLM returns analysis → Report agent compiles & exports **PDF**; all via bus & MCP; traces visible.

---

## M1 — Multi‑LLM & Merge — 2 sprints

### AGENTS (LLMs)
- [ ] **M1-AGENTS-01 (P0)**: GPT agent `analyze_market@v1` with deterministic JSON  
  **Sub:** prompt templates; schema validation; retries/backoff; token limits.
- [ ] **M1-AGENTS-02 (P0)**: Gemini agent `analyze_market@v1` (same schema)  
- [ ] **M1-AGENTS-03 (P0)**: Grok agent `analyze_market@v1` (same schema)  
- [ ] **M1-AGENTS-04 (P1)**: Telemetry per model (latency, tokens, error rate)

### AGENTS (Merge)
- [ ] **M1-AGENTS-05 (P0)**: Merge agent `merge_findings@v1` (consensus ≥2)  
  **Sub:** disagreements_ref structure; confidence formula; tie_breaker.
- [ ] **M1-AGENTS-06 (P1)**: Quality gates — contradictions, hallucinations, missing citations

### ORCH
- [ ] **M1-ORCH-01 (P0)**: Fan-out to 3 LLM agents; partial failures tolerated  
  **Acceptance:** job completes with 2/3; status propagated.
- [ ] **M1-ORCH-02 (P1)**: Retry policy per stage; exponential backoff + jitter

### QA & OBS
- [ ] **M1-QA-01 (P0)**: Golden tests with real vendor calls (record/replay)  
- [ ] **M1-QA-02 (P0)**: Chaos test (kill one LLM) → degraded still completes  
- [ ] **M1-OBS-01 (P1)**: Cost logging & budget guardrails per job

**M1 DoD:** Parallel 3×LLM run → merged output with disagreements & confidence; degraded path proven.

---

## M2 — Localization & Artifacts — 1–2 sprints

### AGENTS (Localization)
- [ ] **M2-AGENTS-01 (P0)**: Cultural agent `localize_message@v1`  
  **Sub:** culture profiles store; versioning; fallback.
- [ ] **M2-AGENTS-02 (P1)**: Add do’s/don’ts and sensitivity risks list

### AGENTS (Report)
- [ ] **M2-AGENTS-03 (P0)**: Figma export `export_figma@v1` (template hookup)  
  **Acceptance:** opens valid Figma file with filled components.

### STORAGE
- [ ] **M2-STOR-01 (P1)**: Artifact lifecycle & cleanup jobs  
  **Acceptance:** expired cleanup metrics/logs.

### QA
- [ ] **M2-QA-01 (P0)**: E2E — localization affects messaging/channels; Figma export verified

**M2 DoD:** Localized report + Figma export operational; artifact lifecycle policies in place.

---

## M3 — Hardening & Portal Stubs — 1–2 sprints

### SEC
- [ ] **M3-SEC-01 (P0)**: RBAC enforcement at artifact and job endpoints (service-to-service)  
  **Acceptance:** permission matrix unit/contract tests.
- [ ] **M3-SEC-02 (P1)**: PII masking & retention enforcement

### OPS
- [ ] **M3-OPS-01 (P1)**: Runbooks (incident, DLQ triage, cache purge, token rotation)

### PORTAL (Deferred UI — minimal stubs)
- [ ] **M3-PORTAL-01 (P2)**: Minimal `/auth/me` and project/job stub endpoints for Postman flows

**M3 DoD:** Security hardened; runbooks in place; minimal API stubs usable by future UI.

---

## CROSS-CUTTING

### Documentation
- [ ] **DOC-01 (P1):** MCP tool catalog (inputs/outputs, versions, scopes)
- [ ] **DOC-02 (P1):** Bus topics and event shapes
- [ ] **DOC-03 (P2):** Operator guide (DLQ replay, artifact restore)

### Owners (suggested)
- Orchestrator/Bus: Platform Lead · Agents: Data/LLM/Merge/Localization/Report owners · Security: AppSec · Observability/Cost: DevOps

### Dependencies
- Vendor APIs (GPT, Gemini, Grok) · S3-compatible store · Postgres · NATS/Kafka

