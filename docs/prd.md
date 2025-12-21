# Product Requirements Document (PRD)
**Product:** AI Multi‑Agent Marketing Analysis System (MCP‑Enabled)  
**Version:** 1.0  
**Date:** 2025-11-19  
**Owner:** <Your team>  

---

## 1. Overview

### 1.1 Problem Statement
Marketing teams and founders need fast, reliable, and culturally accurate **creative strategies**. While performance data is abundant, crafting high-converting **messaging, hooks, and brand positioning** remains a manual, hit-or-miss process. Single-model LLM outputs often lack the nuanced creativity and cultural context required for top-tier campaigns. We need a product that blends multiple LLM perspectives to generate **qualitative, creative intelligence** rather than quantitative performance forecasts.
Marketing teams and founders need fast, reliable, and culturally accurate **creative strategies**. While performance data is abundant, crafting high-converting **messaging, hooks, and brand positioning** remains a manual, hit-or-miss process. Single-model LLM outputs often lack the nuanced creativity and cultural context required for top-tier campaigns. We need a product that blends multiple LLM perspectives to generate **qualitative, creative intelligence** rather than quantitative performance forecasts. Our focus is on generating novel, culturally resonant creative concepts, not predicting campaign ROI.

### 1.2 Product Vision
A **trustworthy marketing copilot** that ingests a structured questionnaire and produces a **validated, culturally‑aware analysis** (personas, positioning, channels, SWOT, risks, campaign ideas) with confidence signals and clear disagreements, exportable to PDF and Figma.

### 1.3 Goals & Non‑Goals
**Goals**
- Generate a comprehensive **creative marketing strategy** (messaging, visuals, hooks, angles) from a questionnaire in minutes.
- Increase trust by triangulating results across **GPT, Gemini, and Grok** and surfacing consensus + confidence.
- Localize outputs by country (cultural norms, tone, slang, visual sensitivities).
- Provide polished exports (PDF, Figma) ready for design teams.

**Non‑Goals**
- **Performance Marketing execution**: We do not handle media buying, bid management, or quantitative forecasting (CPC, ROI, ROAS).
- Billing and payments.
- Human review workflows (approve/reject), beyond basic artifact viewing.
- Procurement or vendor contract management.

---

## 2. Target Users & Personas

- **Growth Marketer (Dana)** — needs insights in 24–48h; cares about channel picks and messaging; moderate technical skills.
- **Founder/PM (Avi)** — wants quick validation of market assumptions; needs risk/opp summary and go‑to‑market starting point.
- **Agency Strategist (Leah)** — repeats analyses per client; values repeatability, audit trail, and exportable decks.

**Primary Jobs‑to‑Be‑Done (JTBD)**
- “When planning a new campaign, I need **fresh creative angles and hooks** so that I can stand out in a crowded market.”
- “When targeting a new country, I want culturally aligned **messaging and visual cues** so that I avoid missteps and maximize resonance.”

---

## 3. Use Cases & User Stories

### 3.1 Core
- As a user, I can **fill a questionnaire** (product, audience, objectives, country) and submit a job.
- As a user, I can **track progress** (validation → 3×LLM analysis → merge → localization → report).
- As a user, I receive a **final report** with personas, positioning, channel plan, SWOT, risks/opportunities, and campaign ideas.
- As a user, I can **download a PDF** or **open a Figma file** generated from the report.
- As a user, I can **view confidence** indicators and a **disagreements** section.

### 3.2 Advanced
- As an admin, I can **tune prompt templates** per LLM agent.
- As a user, I can **re‑run** a failed step or re‑localize for another country using the cached artifacts.
- As a user, I can **export structured JSON** of the analysis to use elsewhere.

**Acceptance criteria** for each story align with section 8.

---

## 4. Scope

### 4.1 In Scope
- Questionnaire UI, job submission, and status streaming.
- Multi‑agent pipeline (Data validation, 3×LLM workers, Validation/Merge, Cultural Localization, Report Generation).
- **MCP** for capability discovery and tool/resource access; **message bus** (e.g., NATS/Kafka) for task orchestration.
- Exports: PDF (mandatory), Figma (MVP with provided templates).

### 4.2 Out of Scope
- Payment/billing, SSO/enterprise auth (beyond email + OTP or OAuth), and manual human review.

---

## 5. Key Product Requirements (mapped to FRD)

> Derived from FRD v1.4 (MCP‑enabled) at `/mnt/data/frd.md`

### 5.1 Functional Requirements
1. **Questionnaire Intake** — Validate completeness; normalize structure.  
2. **Parallel LLM Analyses** — Run GPT, Gemini, Grok with identical prompt scaffolds.  
3. **Validation & Merge** — Compute consensus (threshold ≥2), flag disagreements, and produce confidence.  
4. **Cultural Localization** — Country‑aware adaptation (tone, channels, sensitivities, norms).  
5. **Report Generation** — Compile results; export to **PDF** and **Figma**; provide JSON/MD/HTML internal formats.  
6. **Progress Streaming** — Emit stepwise progress and partials to the UI.  
7. **Artifacts Access** — Users can download PDF and view key artifacts; JSON available via API.

### 5.2 Non‑Functional Requirements
- Performance: P95 job time within product target (set by release); streaming updates every ≤10% progress.
- Reliability: Auto‑retry transient failures; DLQ for irrecoverable cases; degraded mode with <3 analyses.
- Security: Least‑privilege scopes per tool; masked PII; 90‑day retention default.
- Observability: Correlated traces across bus events and MCP calls (OpenTelemetry).

### 5.3 MCP & Orchestration (Product‑level)
- The **Orchestrator** acts as the **MCP Host** that discovers agent capabilities on boot.
- Each agent is an **MCP Server** exposing versioned tools and resources (e.g., `merge_findings@v1`).
- The **message bus** transports lightweight task events; heavy payloads referenced as `mcp://` resources.
- The UI displays MCP‑derived **confidence** and **disagreements** surfaced by the Validation agent.

---

## 6. User Experience (UX) Requirements

### 6.1 Flows
1. **Submit** → Questionnaire form with validation & autosave.  
2. **Track** → Job timeline with checkpoints (validate → 3×LLM → merge → localize → report).  
3. **Review** → Final report page with tabs: *Overview*, *Personas*, *Messaging*, *Channels*, *Cultural Notes*, *SWOT*, *Risks & Opps*, *Disagreements*.  
4. **Export** → Buttons: *Download PDF*, *Open in Figma*, *Get JSON*.

### 6.2 UI/Content
- Show **country flag/name** and a “Cultural Fit: ✓/⚠︎” indicator.
- Confidence meter (0–100 or Low/Med/High) with a tooltip on how it’s computed.
- Disagreements panel listing model‑specific deviations.
- Accessible design (WCAG AA), responsive layouts.

---

## 7. Analytics & Success Metrics

**North‑Star:** Decision confidence uplift and time‑to‑insight.  
**Key Metrics**
- Job success rate (no manual intervention).
- Median completion time.
- Number of re‑runs per job.
- Export usage (PDF/Figma/JSON) and share rate.
- User satisfaction (CSAT) and perceived accuracy (survey).

**Instrumentation**
- Emit events per stage; tag with `trace_id`, country, and template version.
- Capture token usage and cost per stage for optimization.

---

## 8. Acceptance Criteria (MVP)

- Users can submit a valid questionnaire and receive a completed **PDF** report.  
- System runs **3 parallel LLM analyses**; when one fails, a job still completes with confidence reflecting degraded mode.  
- Validation agent exposes **confidence** and **disagreements**; UI renders both.  
- Orchestrator successfully discovers ≥5 MCP tools on boot and uses them during a run.  
- Streaming status is visible during each stage.  
- Exports: **PDF mandatory**, **Figma optional** (behind a feature flag if needed).

---

## 9. Release Plan

### 9.1 Milestones
- **M0 — Foundations (2–3 sprints):** Questionnaire UI, bus + MCP host, single LLM happy‑path, PDF export.  
- **M1 — Multi‑LLM & Merge:** Add Gemini/Grok workers, Validation agent with consensus, confidence, disagreements.  
- **M2 — Localization & Exports:** Cultural agent + Figma export; UI enhancements.  
- **M3 — Hardening:** Observability, rate‑limits, retries/DLQ, PII masking, SLO tuning.

### 9.2 Feature Flags
- `export.figma`, `agent.grok`, `consensus.strict`, `ui.disagreements`.

---

## 10. Dependencies & Risks

**Dependencies**
- LLM vendor access (GPT, Gemini, Grok).
- Figma API access & templates.
- Message bus (NATS/Kafka) and object storage for artifacts.

**Risks & Mitigations**
- Vendor outages → circuit breakers + retries; model fallbacks.  
- Cultural misalignment → curated country profiles + review loop.  
- Cost overruns → token caps, caching, selective re‑runs.  
- Schema drift → versioned tool contracts; discovery refresh on mismatch.

---

## 11. Privacy, Security, Compliance

- Tag and minimize PII in questionnaire; suppress from logs.  
- Data retention defaults to 90 days (configurable).  
- Role‑gated artifact access; signed URLs for downloads.  
- Audit trail for MCP calls and bus events.

---

## 12. Open Questions

- Bus choice (NATS vs Kafka) and gRPC usage.  
- Confidence algorithm weighting across models.  
- Canonical culture profile source and update cadence.  
- SLA targets for P95 and availability.

---

## 13. Appendix

### 13.1 Public APIs
- `POST /v1/jobs` (submit), `GET /v1/jobs/{task_id}` (status), `GET /v1/artifacts/{ref}` (download), `WS /v1/stream/{task_id}` (progress).

### 13.2 Mapping to FRD
- FRD sections 3–7 define the agent roster, MCP contracts, storage, and security. This PRD operationalizes those capabilities into user‑facing features and UX requirements.
