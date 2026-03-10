**Project:** Creative Marketing Strategy Engine
**Version:** 2.0
**Date:** March 2026
**Status:** Implemented

---

## 1. Executive Summary

### 1.1 Problem Statement
Modern marketing teams and founders struggle to distill massive amounts of social sentiment, competitor data, and cultural nuances into actionable creative strategies. Current tools often provide single-model responses that lack real-time web grounding or fail to flag strategic disagreements, leading to generic or misaligned creative pivots.

### 1.2 Product Vision
A high-trust marketing co-pilot that converts raw business inputs into professional, validated, and slide-ready creative strategies. The system ensures reliability by triangulating insights across three distinct AI models and grounding all analysis in triple-source real-time research (Perplexity, Gemini, and live brand audit).

---

## 2. Target Audience
* **Growth Marketers:** Who need rapid, data-backed creative pivots and hooks.
* **Brand Strategists:** Seeking to understand "The Talk" (social sentiment) and competitive gaps.
* **Agencies:** Requiring a high-quality "first-draft" strategy deck for client presentations.

---

## 3. User Workflow & Experience
The product follows a linear, automated pipeline orchestrated by a background async worker:

1. **Auth:** Users register and log in via JWT-based authentication.
2. **Intake:** The user submits a detailed questionnaire about their product, audience, and goals.
3. **Discovery Phase:** The system performs parallel research using Perplexity (competitor/sentiment data), Gemini (visual trends, cultural context), and a live brand audit (website scrape of the client's homepage).
4. **Strategic Analysis:** Three LLMs (GPT-4o, Gemini, Perplexity) simultaneously analyze consolidated research to propose creative angles.
5. **Consensus Engine:** Agreement and disagreement points across models are surfaced with a confidence score.
6. **Final Delivery:** The user downloads a professional `.pptx` presentation containing the consensus-backed strategy.

---

## 4. Key Features & Functional Requirements

### 4.1 User Authentication
* JWT-based auth with 8-hour access tokens.
* User registration, login, and profile management.
* Jobs are associated with the owning user; admin endpoints for cross-user job management.

### 4.2 Triple-Source Research Fleet
* **Perplexity (Sonar model):** Crawls web and social media data to summarize brand perception, competitor hooks, and "What's the talk". Fails gracefully — pipeline continues in Gemini-only mode if unavailable.
* **Gemini (gemini-2.0-flash):** Identifies visual trends, campaign examples, cultural norms, and content format insights using Google Search grounding.
* **Brand Audit:** Scrapes the client's live website to extract current brand positioning, tone, and messaging gaps. Fails gracefully if URL is unreachable.

### 4.3 Triple-Analysis & Consensus Engine
* **Model Triangulation:** Parallel analysis of consolidated research using GPT-4o, Gemini, and Perplexity.
* **Agreement Mapping:** Automated identification of strategic points agreed upon by at least two models.
* **Conflict Surface:** Explicitly highlighting divergent creative directions across models.
* **Confidence Scoring:** Reliability metric based on the level of model alignment.

### 4.4 Presentation-First Output
* **Slide Generation:** Gemini drafts a structured, slide-by-slide narrative in JSON.
* **Core Slide Modules:**
    * **Creative Audit:** Analysis of current marketing efforts.
    * **Brand Sentiment:** Summary of "The Talk" and public perception.
    * **Competitive Landscape:** Mapping of competitor angles and identified market gaps.
    * **Creative Pivot:** Specific proposed hooks, messaging angles, and campaign concepts.
* **Dynamic Theming:** PPTX styling adapts based on brand/industry context.
* **File Export:** Rendered as a downloadable `.pptx` file.

### 4.5 Job Reliability & Diagnostics
* **Graceful Degradation:** If Perplexity or Brand Audit fail, the job continues on available data rather than failing entirely.
* **Timeout Management:** Research phase capped at 120s; analysis phase capped at 90s.
* **Failure Diagnostics:** Failed jobs record the exact pipeline step and error message for debugging.

---

## 5. Technical Requirements & Infrastructure
* **API Framework:** FastAPI with async background task execution.
* **Database:** PostgreSQL via SQLAlchemy for job metadata, user profiles, and job history.
* **Artifact Storage:** MinIO (S3-compatible) for caching intermediate JSON blobs (research, analysis, slides) and the final `.pptx`.
* **AI Models:** GPT-4o (OpenAI), gemini-2.0-flash (Google), Sonar (Perplexity).
* **Auth:** JWT with bcrypt password hashing.
* **Frontend:** React + TypeScript SPA consuming the REST API.

---

## 6. Acceptance Criteria
* **Research Integrity:** At least Gemini research completes; Perplexity and Brand Audit degrade gracefully.
* **Strategic Transparency:** The output clearly identifies consensus points versus model disagreements with a confidence score.
* **Deliverable Quality:** The system generates a valid, downloadable `.pptx` file containing all specified strategy modules.
* **Job Auditability:** Every job records its status transitions and any failure step/error message.
