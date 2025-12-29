# AI Marketing Assistant — Project Milestones (Backend-First Plan)

## M0 — Foundations (Backend First)
**Duration:** 2–3 sprints  
**Goal:** Set up core infrastructure, orchestrator foundation, draft schemas, and a single-LLM end-to-end path.

### Deliverables
#### Infrastructure
- NATS (Event Bus)
- Postgres (Database)
- MinIO (Object Storage)
- Jaeger (Tracing)
- OpenTelemetry instrumentation

#### Schemas — Draft (v0)
- MCP tool schemas
- Event Bus schemas
- Job lifecycle schemas
- Agent request/response envelopes
- PII tagging rules

#### Orchestrator — Foundations
- Job state machine
- Correlation IDs + idempotency keys
- Retry primitives + timeout model
- Discovery Cache
- Resource Broker (mcp://)

#### Agents — MVP
- Data Collection Agent
- Report Agent
- Stub LLM Agent

#### PII Handling
- PII tagging
- Redaction rules

### Definition of Done
Submit → validate → LLM mock output → PDF → tracing OK → PII verified.

---

## M1 — Multi-LLM, Merge Engine & Schema Freeze
**Duration:** 2 sprints  
**Goal:** Multi-model support, merge logic, schema freezing.

### Deliverables
- Final schemas
- GPT/Gemini/Grok agents
- Fan-out orchestration
- Degraded mode (2-of-3 quorum)
- Merge agent with hallucination detection
- Golden tests + chaos tests
- PII-safe merge pipeline

### Definition of Done
3-model merge → disagreements shown → schemas frozen → PII-consistent.

---

## M2 — Localization & Advanced Report Artifacts
**Duration:** 1–2 sprints  
**Goal:** Localization engine + Figma export + artifact lifecycle.

### Deliverables
- Localization agent & country profiles
- Report → Figma export
- Template storage + node replacement
- Artifact metadata + cleanup rules

### Definition of Done
Localized report → Figma output → metadata & cleanup operational.

---

## M3 — Hardening & Portal API
**Duration:** 1–2 sprints  
**Goal:** Security, ops readiness, UI-enabling Portal API.

### Deliverables
- RBAC, message signing, retention policies
- Ops runbooks, dashboards, SLOs
- Portal API: auth, projects, jobs, artifacts
- Full tracing

### Definition of Done
RBAC enforced → retention applied → frontend fully supported.
