**Project:** AI-Driven Creative Marketing Strategy Engine
**Version:** 2.0
**Date:** March 2026
**Status:** Implemented

---

## 1. Purpose & Scope
The system transforms a structured client questionnaire into a professional, data-backed creative marketing strategy presentation. A FastAPI backend orchestrates triple-source research, triple-model analysis, consensus scoring, and PPTX generation as an async background pipeline. A React frontend provides job submission, status tracking, and file download.

**Core Objectives:**
* **Triple-Source Research:** Gather real-time data from Perplexity (social/competitor), Gemini (trends/cultural), and a live brand audit (homepage scrape).
* **Strategic Triangulation:** Leverage GPT-4o, Gemini, and Perplexity in parallel to identify creative consensus and deviations.
* **Dynamic Presentation Output:** Deliver a professionally themed, slide-based strategy in `.pptx` format.
* **Reliability:** Graceful degradation when optional data sources fail; diagnostic fields for every failed job.

---

## 2. System Architecture & Services
The system is a **direct-orchestration pipeline** where a central `workflow.py` background task calls specialized services in a defined sequence. There is no message broker or external orchestration layer.

### 2.1 Service Roster

* **`workflow.py` (Orchestrator):** Controls the entire pipeline, manages job state transitions in PostgreSQL, and handles timeouts and failures.
* **`research_service` (Perplexity):** Conducts deep web and social media scans for competitor hooks, USP validation, brand awareness, and share of voice using the Sonar model. Optional — pipeline continues if it fails.
* **`gemini_research_service` (Gemini 2.0 Flash):** Performs real-time research on visual trends, cultural norms, campaign examples, and content format insights using Google Search grounding.
* **`brand_audit_service` (HTTP Scrape):** Scrapes the client's live website to extract current brand positioning, messaging tone, and content gaps. Optional — pipeline continues if the URL is unreachable.
* **`research_consolidator`:** Merges outputs from all three research sources into a single unified research document passed to analysis.
* **`multi_analysis_service` (GPT-4o + Gemini + Perplexity):** Runs three independent strategic analyses in parallel against the consolidated research.
* **`consensus_service`:** Maps agreement and disagreement points across the three analysis outputs and generates a confidence score.
* **`presentation_service` (Gemini 2.0 Flash + python-pptx):** Structures the consensus into a slide-by-slide JSON layout, then renders it as a dynamically themed `.pptx` file.
* **`storage_service` (MinIO):** Handles all artifact uploads and downloads against an S3-compatible object store.
* **`auth_service`:** JWT creation/validation and bcrypt password management.

---

## 3. Functional Requirements

### 3.1 Authentication
* **Registration:** Users create an account with email and password.
* **Login:** Returns a JWT access token valid for 8 hours.
* **Protected Routes:** All job and result endpoints require a valid Bearer token.
* **Admin Access:** Users with `is_admin=True` can access cross-user job management endpoints.

### 3.2 Questionnaire Intake
* **Input Handling:** The system accepts structured business and product data via a frontend form.
* **Job Creation:** A `Job` record is immediately created in PostgreSQL with status `PENDING` and the full questionnaire stored as `project_metadata` (JSON).
* **Async Dispatch:** The pipeline is handed off to a background async task; the API returns `job_id` immediately.

### 3.3 Triple-Source Research
* **Perplexity (Sonar):** Analyzes web and social media to define "What's the talk," competitor creative strategies, USP clarity, and share of voice.
* **Gemini (gemini-2.0-flash):** Uses Google Search grounding to identify visual trends, cultural sensitivities, campaign examples, and optimal content formats for the target market.
* **Brand Audit:** Scrapes the client's homepage URL to extract current positioning, tone of voice, and messaging gaps.
* **Parallel Execution:** All three sources run concurrently via `asyncio.gather` with a 120s combined timeout.
* **Graceful Degradation:** Perplexity and Brand Audit failures are caught silently; the pipeline warns and continues on available data. Gemini research is required.
* **Consolidation:** `research_consolidator` merges all available results into a single document. All individual and consolidated blobs are saved to MinIO.

### 3.4 Triple-Analysis Engine
* **Parallel Analysis:** GPT-4o, Gemini, and Perplexity simultaneously analyze the consolidated research to propose creative pivots, messaging angles, and campaign hooks. Runs with a 90s timeout.
* **Raw Artifact:** The three raw analysis outputs are saved to MinIO as `analysis_raw_triple.json`.

### 3.5 Consensus Engine
* **Agreement Mapping:** Identifies strategic points agreed upon by at least two of the three models.
* **Conflict Surface:** Highlights divergent creative directions where models disagree.
* **Confidence Score:** Calculates a reliability metric based on the degree of model alignment.
* **Artifact:** Consensus report saved to MinIO as `analysis.json`.

### 3.6 Presentation Generation
* **Slide Structuring:** `presentation_service.structure_content` converts the consensus into a slide-by-slide JSON layout covering:
    * Creative Audit (current marketing efforts)
    * Brand Sentiment ("The Talk" and public perception)
    * Competitive Landscape (competitor hooks and market gaps)
    * Creative Pivot (proposed messaging, hooks, campaign concepts)
* **Dynamic Theming:** PPTX visual design adapts based on industry/brand context.
* **PPTX Rendering:** `python-pptx` renders the JSON structure into a `.pptx` file via a safe temp file, which is then uploaded to MinIO.
* **Download:** A signed or direct download endpoint serves the final `.pptx` to the authenticated user.

---

## 4. Technical Infrastructure

### 4.1 API & Async Execution
* **Framework:** FastAPI with `asyncio` background tasks for non-blocking pipeline execution.
* **No Message Broker:** Task dispatch is in-process; there is no NATS, Kafka, or Celery dependency.

### 4.2 Storage & Data Persistence
* **PostgreSQL:** Stores `User` and `Job` records. Key job fields: `status`, `project_metadata` (JSON), `failed_step`, `error_message`, `user_id`.
* **MinIO (S3-compatible):** Stores all pipeline artifacts under `jobs/{job_id}/`. Bucket: `marketing-artifacts`.

### 4.3 Configuration
* All secrets and tunables are loaded from environment variables (`.env` file in development).
* Key settings: `GEMINI_API_KEY`, `PERPLEXITY_API_KEY`, `OPENAI_API_KEY`, `DATABASE_URL`, `MINIO_*`, `SECRET_KEY`, `RESEARCH_TIMEOUT` (120s), `ANALYSIS_TIMEOUT` (90s).
* Model versions are configurable via env: `GPT_MODEL`, `GEMINI_MODEL`, `PERPLEXITY_MODEL`.

---

## 5. Acceptance Criteria
* **Research Integrity:** Gemini research completes successfully on every job. Perplexity and Brand Audit degrade gracefully with logged warnings.
* **Analysis Coverage:** All three analysis models run and produce outputs. Consensus correctly surfaces agreement/disagreement points.
* **Deliverable Quality:** The system generates a valid, openable `.pptx` file containing all four specified strategy modules with dynamic theming applied.
* **Job Auditability:** Every failed job records `failed_step` and `error_message` in the database. Completed jobs have all artifacts accessible in MinIO.
* **Auth Security:** Unauthenticated requests to protected endpoints return 401. Admin endpoints reject non-admin users with 403.
