# System Architecture: Creative Marketing Strategy Engine

**Version:** 2.0
**Date:** March 2026
**Status:** Implemented

---

## 1. High-Level Overview
The system is a **FastAPI-based async pipeline** that orchestrates multiple AI providers to transform a marketing questionnaire into a downloadable strategy presentation. A React SPA serves as the frontend, a PostgreSQL database tracks job state, and MinIO stores intermediate and final artifacts.

---

## 2. Architectural Layers

### 2.1 API Layer (FastAPI)
* **REST API:** Exposes endpoints for job submission, status polling, result retrieval, and file download.
* **Auth Endpoints:** JWT-based registration, login, and token refresh.
* **Admin Endpoints:** Cross-user job management for admins.
* **Background Tasks:** Pipeline execution is handed off to `asyncio` background tasks so the HTTP response returns immediately with a job ID.

### 2.2 Pipeline Orchestration (`workflow.py`)
The orchestrator runs as an async background task and manages the full job lifecycle. It owns all state transitions and error handling.

**State Machine:**
```
PENDING → RESEARCHING → ANALYZING → COMPLETED
                                  ↘ FAILED (+ failed_step + error_message)
```

**Pipeline Steps (in order):**
1. `triple_research` — Parallel execution of Perplexity, Gemini, and Brand Audit
2. `consolidation` — Merge research outputs into a single resource
3. `persist_research` — Upload individual and consolidated JSON blobs to MinIO
4. `triple_analysis` — Parallel execution of GPT-4o, Gemini, and Perplexity analysis
5. `consensus` — Generate consensus report with confidence score
6. `slide_structure` — Structure slide content from consensus data
7. `pptx_generation` — Render slides to `.pptx` and upload to MinIO

### 2.3 Service Layer
Each service is a stateless module called directly by the orchestrator:

| Service | Responsibility | Provider |
|---|---|---|
| `research_service` | Competitor data, social sentiment, USP validation | Perplexity (Sonar) |
| `gemini_research_service` | Visual trends, cultural context, campaign examples | Gemini 2.0 Flash |
| `brand_audit_service` | Live website scrape for brand positioning & tone | HTTP scrape |
| `research_consolidator` | Merges triple research into unified resource | In-process |
| `multi_analysis_service` | Parallel creative strategy analysis | GPT-4o, Gemini, Perplexity |
| `consensus_service` | Maps agreement/disagreement, generates confidence score | In-process |
| `presentation_service` | Structures slides + renders `.pptx` with dynamic theming | Gemini 2.0 Flash + python-pptx |
| `storage_service` | Upload/download JSON blobs and binary files | MinIO (S3) |
| `auth_service` | JWT creation, password hashing, user lookup | In-process |

### 2.4 Data & Storage Layer
* **PostgreSQL:** Stores `User` and `Job` records. Jobs carry status, timestamps, project metadata (questionnaire JSON), and diagnostic fields (`failed_step`, `error_message`).
* **MinIO (S3-compatible):** Stores all pipeline artifacts under `jobs/{job_id}/`:
    * `research_perplexity.json`
    * `research_gemini.json`
    * `research_brand_audit.json`
    * `research_consolidated.json`
    * `analysis_raw_triple.json`
    * `analysis.json` (consensus)
    * `slides.json`
    * `presentation.pptx`

### 2.5 Frontend (React + TypeScript)
* Single-page application communicating with the FastAPI backend via REST.
* Auth context with JWT token management.
* Job submission form, real-time status polling, and results/download view.

---

## 3. Detailed Data Flow

1. **Auth:** User logs in, receives JWT access token.
2. **Intake:** User submits questionnaire. API creates a `Job` record (status: `PENDING`) and fires off the background pipeline task, returning the `job_id` immediately.
3. **Triple Research (`RESEARCHING`):** Perplexity, Gemini, and Brand Audit run in parallel via `asyncio.gather`. Perplexity and Brand Audit failures are caught and logged — the pipeline degrades gracefully to Gemini-only if needed. A 120s timeout applies to the whole gather.
4. **Consolidation:** `research_consolidator` merges all available research into one unified document. All individual and consolidated artifacts are uploaded to MinIO.
5. **Triple Analysis (`ANALYZING`):** GPT-4o, Gemini, and Perplexity analyze the consolidated research in parallel. A 90s timeout applies.
6. **Consensus:** `consensus_service` identifies agreement/disagreement points and calculates a confidence score. Raw and consensus analysis artifacts saved to MinIO.
7. **Slide Structure:** `presentation_service.structure_content` converts the consensus into a slide-by-slide JSON structure.
8. **PPTX Generation:** `presentation_service.generate_pptx` renders the slide JSON to a `.pptx` file with dynamic industry-based theming, uploaded to MinIO.
9. **Completion:** Job status set to `COMPLETED`. Frontend polling detects this and presents the download link.

---

## 4. Resilience & Error Handling
* **Graceful Degradation:** Perplexity and Brand Audit services are wrapped in `try/except` — failures produce empty dicts and log warnings rather than aborting the job.
* **Timeout Management:** `asyncio.wait_for` enforces 120s on research and 90s on analysis. Timeouts fail the job with a clear `failed_step`.
* **Diagnostic Fields:** Every failed job records `failed_step` (which pipeline stage failed) and `error_message` (truncated to 1000 chars) in the database.
* **DB Session Safety:** Each background task creates its own `SessionLocal` session, independent of the HTTP request lifecycle.

---

## 5. Security
* **Auth:** Passwords hashed with bcrypt. JWT tokens expire after 8 hours.
* **Admin vs User:** `is_admin` flag on `User` model gates admin-only endpoints.
* **Config via Env:** All secrets (API keys, DB URL, MinIO credentials, JWT secret) are loaded from environment variables — no secrets in source code.
