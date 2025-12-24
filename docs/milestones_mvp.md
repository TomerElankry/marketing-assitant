# MVP Project Milestones: Creative Marketing Strategy Engine

**Project State:** MVP (Layer 0 - Single Thread)  
**Backend:** Python / FastAPI  
**Primary Deliverable:** Functional .pptx generator based on validated questionnaires and web research.

---

## Milestone 1: Foundation & Data Schema (Days 1-3)
**Goal:** Establish the system backbone and the data "contract."
* **Deliverables:**
    * Functional **FastAPI** skeleton with a `/health` status endpoint.
    * **Pydantic Models** implementing the `questionnaire_schema.json`.
    * Local **Postgres** (Metadata) and **MinIO/S3** (Artifacts) containers running in Docker.
* **Success Criteria:** A `POST` request with a valid JSON questionnaire is successfully parsed, stored in the DB, and returns a 200 OK.

---

## Milestone 2: The Logic Gate - AI Validation (Days 4-6)
**Goal:** Implement the Gemini quality gate to ensure high-fidelity inputs.
* **Deliverables:**
    * **Gemini Validation Service:** Python integration via the `google-generativeai` SDK.
    * **The Critic Prompt:** A system instruction that forces Gemini to return a boolean `valid` flag and a `feedback` array.
* **Success Criteria:** Submitting "garbage" data (e.g., "Product: stuff, Audience: people") results in a `400 Bad Request` with specific AI-generated improvement tips.

---

## Milestone 3: Grounded Research via Perplexity (Days 7-10)
**Goal:** Automate the "Discovery Phase" using live, web-grounded data.
* **Deliverables:**
    * **Perplexity Research Worker:** Automated queries for competitor hooks and social sentiment ("The Talk").
    * **Artifact Persistence:** Raw research results are saved as a `.json` file in MinIO/S3 mapped to the `job_id`.
* **Success Criteria:** For every validated job, a research file exists in storage containing verified market links and sentiment snippets.

---

## Milestone 4: Strategic Analysis & Slide Structuring (Days 11-14)
**Goal:** Transform raw research data into a marketing narrative and slide deck structure.
* **Deliverables:**
    * **GPT-4o Analysis Service:** Processes research artifacts to define the "Creative Pivot" (Hooks, Angles, Gaps).
    * **Gemini Slide Structuring Agent:** Converts the analysis into a JSON list of 7 slides (Title, Bullets, Visual Prompt).
* **Success Criteria:** The system generates a valid JSON object representing a full strategy deck based on Milestone 3's research.

---

## Milestone 5: Presentation Generation & Delivery (Days 15-18)
**Goal:** Generate the physical PowerPoint file and finalize the user loop.
* **Deliverables:**
    * **`python-pptx` Engine:** A utility that renders the Slide JSON into a professional .pptx file.
    * **Download Service:** A FastAPI endpoint that provides a secure, signed URL for the user to download the final file.
* **Success Criteria:** A full end-to-end execution (Intake → Validate → Research → Analyze → PPTX) completes successfully, providing a downloadable file.

---

### MVP Summary Table
| Milestone | Focus | Primary Tech |
| :--- | :--- | :--- |
| **M1** | Infrastructure | FastAPI, Postgres, Pydantic |
| **M2** | Validation | Gemini API |
| **M3** | Web Research | Perplexity API, MinIO |
| **M4** | Strategy | GPT-4o, Gemini API |
| **M5** | Delivery | `python-pptx`, Signed URLs |