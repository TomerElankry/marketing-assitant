# MVP Implementation Plan: Creative Marketing Strategy Engine (Python Backend)

**Version:** 1.1 (MVP - Python Focus)  
**Goal:** Deliver a stable "Questionnaire to Presentation" flow using FastAPI and a single-agent path.  
**Focus:** Backend-First stability, asynchronous task management, and core API integrations.

---

## 1. Phase 1: Environment & Schema (Week 1)
**Objective:** Establish the technical foundation using Python-based tools.

* **Project Initialization:**
    * Initialize a **FastAPI** project with `uvicorn` as the server.
    * Use `pydantic` to define the `QuestionnaireSchema` based on the `questionnaire_schema.md` to ensure automatic data validation and type safety.
    * Configure environment variables using `python-dotenv` for: `GEMINI_API_KEY`, `PERPLEXITY_API_KEY`, and `OPENAI_API_KEY`.
* **Storage Setup:**
    * Use `SQLAlchemy` to connect to **Postgres** for managing project metadata, job statuses, and user data.
    * Use the `boto3` library to communicate with **MinIO** (S3-compatible) for storing intermediate JSON artifacts and final reports.

---

## 2. Phase 2: The Validation Gate (Week 1)
**Objective:** Ensure high-quality input using a Gemini-powered validation agent.

* **Validation Agent Development:**
    * Implement a service using the `google-generativeai` Python package to send the questionnaire data to **Gemini**.
    * **Logic:** Gemini evaluates the data for coherence and completeness, returning a structured JSON response: `{ "valid": boolean, "feedback": string[] }`.
* **Gatekeeping:**
    * If validation fails, FastAPI returns a `400 Bad Request` with Gemini's specific feedback for user refinement.
    * If valid, the system saves the job status as `VALIDATED` and triggers a background task for research.

---

## 3. Phase 3: Single-Source Research (Week 2)
**Objective:** Gather real-time web-grounded data using the Perplexity API.

* **Perplexity Integration:**
    * Use the `httpx` library to send optimized search queries to **Perplexity** based on the validated questionnaire.
    * **Research Focus:** Specifically crawl for social media sentiment ("The Talk") and competitor creative strategies.
* **Data Archiving:**
    * Save the research output as a `.json` artifact in **MinIO**, associated with the unique `job_id`.

---

## 4. Phase 4: Creative Analysis & Presentation (Week 2-3)
**Objective:** Transform raw research into a professional PowerPoint strategy.



* **Core Analysis (GPT-4o):**
    * Pass the research JSON to **GPT-4o** using the `openai` Python library to generate the "Creative Pivot" (Messaging Hooks, Angles, and Market Gaps).
* **Slide Structuring (Gemini):**
    * Gemini processes the GPT-4o analysis into a structured JSON list of slides, including Title, Content, and Visual Suggestions.
* **PPTX Rendering:**
    * Use the **`python-pptx`** library to programmatically generate the presentation based on the slide JSON.
    * The service applies a standard marketing template and saves the final `.pptx` file back to **MinIO**.

---

## 5. MVP Acceptance Criteria (Definition of Done)
* **API Response:** FastAPI returns a successful `job_id` upon questionnaire submission.
* **Validation:** Gemini successfully identifies and blocks shallow or illogical questionnaire inputs.
* **Grounding:** The system retrieves and caches verified web data from Perplexity.
* **Deliverable:** A functional, downloadable **.pptx** file is generated and accessible via a signed URL.

---

**Would you like me to generate the "System Prompt" for the Gemini Validation Agent?** This is the first logical piece of code to implement in your FastAPI project.