# Implementation Plan — AI Multi‑Agent Marketing Analysis (MCP‑Enabled)
**Date:** 2025-11-19
**Scope:** Deliver a secure YellowHead web portal + backend that ingests a questionnaire and returns a validated, culturally localized marketing analysis with PDF/Figma exports.
**References:** frd.md, prd.md

---

## 0. Guiding Principles
- Separation of concerns: Web Portal, Orchestrator (MCP Host), Agents (MCP Servers), Bus, Storage.
- Contract-first: Lock API schemas, MCP tool I/O, and bus events before building.
- Observable by default: Trace IDs across UI ↔ Bus ↔ MCP calls.
- Fail-degraded, not fail-closed: Produce report even with partial analyses; surface confidence.

---

## 1. Milestones & Timeline (indicative)
- M0 — Foundations (2–3 sprints): Auth + Projects, Single-LLM happy path, PDF export, basic observability.
- M1 — Multi‑LLM & Validation (2 sprints): 3× LLM agents, merge/consensus, disagreements & confidence.
- M2 — Localization & Exports (1–2 sprints): Cultural agent, Figma export, Portal polish.
- M3 — Hardening (1–2 sprints): RBAC, rate limits, DLQ flows, cost controls, SLO tuning.

Each milestone has a “Definition of Done” with tests, docs, and runbooks.

---

## 2. Workstreams & Deliverables

### 2.1 Web Portal (YellowHead)
- Auth (OIDC): Login, session, GET /auth/me; roles Admin/Employee; per‑project RBAC (Owner/Editor/Viewer).
- Projects: Dashboard (list/search/status), New Project wizard (autosave/upload), Project Detail (Overview/Questionnaire/Runs/Report), Share dialog.
- Exports: Download PDF; Open in Figma.
- Telemetry: Page events with trace_id propagation to backend.
- DoD: E2E Cypress tests for Login→New Project→Report→Export.

### 2.2 Orchestrator (MCP Host/Hub)
- Discovery cache: Tools, versions, scopes; refresh + backoff.
- Task router: Publish task.submitted; correlate task.progress / task.completed.
- Resource broker: Read/write mcp:// resources; signed URLs for artifacts.
- DoD: Contract tests against mock MCP Servers; OpenTelemetry spans emitted.

### 2.3 Agents (MCP Servers)
- Data Collection: validate_questionnaire@v1 (+ optional infer_missing@v1).
- LLM Workers ×3: analyze_market@v1 (GPT/Gemini/Grok) with deterministic JSON schemas.
- Validation & Merge: merge_findings@v1 (consensus threshold; disagreements; confidence).
- Cultural Localization: localize_message@v1 (profiles + do’s/don’ts).
- Report Generation: compile_report@v1, export_pdf@v1, export_figma@v1.
- DoD: Schema-validated I/O; golden tests on sample questionnaires.

### 2.4 Messaging & Storage
- Bus: NATS/Kafka; topics task.submitted, task.progress, task.completed/failed, audit.trace.
- Storage: Analysis Cache (object store + index) for mcp:// JSON; Relational DB (users, projects, jobs, traces); Artifacts bucket for PDF/JSON; Retention policies.
- DoD: DLQ routing; replay tools; migrations versioned.

### 2.5 Security & Compliance
- OIDC, secure cookies/JWT; per‑project RBAC; PII tagging/masking; signed downloads; rate limits; audit logs.
- DoD: Security tests, SSRF protection, dependency scanning, secrets rotation.

---

## 3. Contract‑First Specs (freeze early)

### 3.1 REST APIs (external)
- Auth: GET /auth/me; provider redirects for login/logout.
- Projects: GET/POST /v1/projects, GET/PATCH/DELETE /v1/projects/{{id}}, POST /v1/projects/{{id}}/share.
- Questionnaire: GET/PUT /v1/projects/{{id}}/questionnaire.
- Jobs: POST /v1/projects/{{id}}/jobs -> task_id; GET /v1/jobs/{{task_id}}; WS /v1/stream/{{task_id}}.
- Artifacts: GET /v1/projects/{{id}}/artifacts, GET /v1/artifacts/{{ref}}.

### 3.2 Bus events
- task.submitted
  - { task_id, project_id, job_type, inputs_ref, trace_id, ts }
- task.progress
  - { task_id, stage, pct, message, trace_id, ts }
- task.completed / task.failed
  - { task_id, status, outputs_ref, artifacts[], trace_id, ts }

### 3.3 MCP tools (schemas)
- Data: validate_questionnaire@v1 -> { normalized_ref, missing_fields[] }
- LLM: analyze_market@v1 -> { analysis_ref, telemetry? }
- Merge: merge_findings@v1 -> { merged_ref, disagreements_ref, confidence }
- Localize: localize_message@v1 -> { localized_ref, cultural_risks[] }
- Report: compile_report@v1 -> { doc_ref }, export_pdf@v1 -> { pdf_ref }, export_figma@v1 -> { figma_file_url }

---

## 4. Architecture & Tech Stack
- Frontend: React/Next.js, TypeScript, Tailwind; Cypress for E2E; OIDC client.
- Backend (Portal API + Orchestrator): Node.js/TypeScript or Python (FastAPI); gRPC optional.
- Agents: Containerized services; Python or Node; strict JSON Schema validation.
- LLMs: GPT, Gemini, Grok; retries & circuit breakers.
- Bus: NATS or Kafka (queue groups).
- Storage: Postgres; S3‑compatible object store for cache/artifacts.
- Observability: OpenTelemetry, Prometheus/Grafana, structured logs with trace_id.
- CI/CD: GitHub Actions; IaC Terraform; K8s or ECS deployment.

---

## 5. Data Model (initial)
- users(id, oidc_sub, email, role, created_at)
- orgs(id, name) -> MVP fixed to YellowHead
- projects(id, org_id, owner_id, name, status, created_at)
- project_members(project_id, user_id, role)
- questionnaires(id, project_id, version, resource_ref, created_at)
- jobs(id, project_id, task_id, trace_id, status, created_at, completed_at)
- artifacts(id, project_id, job_id, kind, ref, created_at)
- audit_logs(id, actor_id, action, meta, ts)

---

## 6. Testing Strategy
- Unit: Schemas, tool I/O, reducers for merge/confidence.
- Contract tests: REST, MCP, and bus events against mocks.
- Golden tests: Known questionnaires -> stable merged outputs.
- E2E: Login -> New Project -> Report -> Export (Cypress).
- Chaos/Resilience: Kill one LLM agent; ensure degraded run completes.

---

## 7. Operational Playbooks
- Runbooks: incident response, DLQ triage, cache purge, token rotation.
- SLOs: P95 job time (set per milestone), error rate < target, availability 99.9%.
- Cost controls: token budgets, caching, selective re‑runs; usage dashboards.

---

## 8. Risk Register & Mitigations
- Vendor outages: model fallbacks, circuit breakers, timeouts.
- Schema drift: discovery refresh; version pinning and deprecation policy.
- PII leakage: masking, scoped access, redaction in logs, access reviews.
- Cost overrun: token caps, prompt audits, result reuse.
- Cultural bias: curated profiles + human spot checks for high‑impact releases.

---

## 9. Backlog (initial, prio‑ordered)
1) Freeze JSON Schemas for MCP tools and bus payloads.
2) Stand up OIDC and RBAC skeleton; /auth/me.
3) Projects API + Dashboard list view.
4) Questionnaire wizard + autosave; resource store.
5) Orchestrator (Host): discovery cache + task router.
6) Data agent validate_questionnaire@v1.
7) Single LLM agent + Report agent (compile_report, export_pdf).
8) NATS/Kafka + WS stream to UI.
9) Add 2nd/3rd LLM agents + Merge agent (confidence/disagreements).
10) Cultural agent + Figma export.
11) Hardening: DLQ, rate limits, cost dashboards.

---

## 10. Exit Criteria per Milestone
- M0: Login -> Project -> Single‑LLM run -> PDF works; traces visible end‑to‑end.
- M1: 3×LLM + Merge with confidence/disagreements; degraded mode proven.
- M2: Cultural localization present; Figma export opens template correctly.
- M3: RBAC enforced, DLQ operational, token cost within budget; runbooks ready.
