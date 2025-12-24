# System Architecture: Creative Marketing Strategy Engine

**Version:** 1.0  
**Date:** December 21, 2025  
**Status:** Finalized for Implementation  

---

## 1. High-Level Overview
The system is built as an **Event-Driven Orchestration** platform using the **Model Context Protocol (MCP)**. It separates the management of task lifecycles from the execution of specialized AI agents to ensure scalability and reliability.

## 2. Architectural Layers

### 2.1 Orchestration Layer (The Host)
* **Orchestrator Service:** Acts as the central brain managing the job state machine, from initial intake to final file generation.
* **Task Lifecycle Management:** Handles state transitions (e.g., `Pending` -> `Validating` -> `Researching` -> `Analyzing` -> `Generating`).
* **MCP Host:** Discovers and invokes tools from specialized agent servers via a standardized protocol.

### 2.2 Messaging & Communication
* **Event Bus:** Utilizes **NATS** or **Kafka** to distribute tasks asynchronously across the system.
* **Progress Streaming:** Emits real-time status updates to the UI so users can track the "Discovery Phase" and "Analysis Phase".

### 2.3 Agent Execution Fleet (The Workers)
* **Validation Agent (Gemini API):** Performs a logic-based quality gate on the incoming questionnaire to ensure data integrity.
* **Research Fleet (Dual-Source):**
    * **Perplexity Agent:** Performs deep web scans for competitor hooks and social media sentiment analysis.
    * **Gemini Agent:** Utilizes Google Search grounding for real-time market trend identification.
* **Analysis Workers (Triple-Analysis):** Parallel execution of **GPT-4o**, **Gemini 1.5 Pro**, and **Perplexity** to process research data and propose creative pivots.
* **Presentation Agent (Gemini API):** Transforms synthesized findings into a structured JSON slide-deck representation.

### 2.4 Data & Infrastructure Layer
* **Relational Database (Postgres):** Stores user profiles, project metadata, and job history logs.
* **Object Storage (MinIO/S3):** Caches intermediate JSON research blobs (Artifacts) and hosts the final `.pptx` deliverables.
* **Observability Platform:** Uses **OpenTelemetry** and **Jaeger** to track jobs via a unique `trace_id` across all API boundaries.

---

## 3. Detailed Data Flow

1.  **Intake:** The system receives the questionnaire and saves the initial state in **Postgres**.
2.  **Validation:** The Orchestrator triggers the **Gemini Validation Agent**. If successful, it proceeds; otherwise, it returns feedback to the user.
3.  **Dual-Research:** Parallel tasks are sent to **Perplexity** and **Gemini**. Both agents perform live web searches to map "The Talk" and market gaps.
4.  **Consolidation:** The Orchestrator merges research data into a "Full Research Resource" and saves it to **MinIO**.
5.  **Triple-Analysis:** The combined resource is analyzed by **GPT-4o**, **Gemini**, and **Perplexity** simultaneously to find consensus and creative disagreements.
6.  **Presentation Generation:** The **Presentation Agent** processes the merged analysis into slide content.
7.  **Final Export:** A background worker converts the JSON slide structure into a downloadable **.pptx** file.

---

## 4. Security & Resilience
* **PII Masking:** Personally Identifiable Information is redacted from the questionnaire before being transmitted to external vendor APIs.
* **Degraded Mode:** If one of the three Analysis Workers fails, the job continues with the remaining two, surfacing a modified confidence score.
* **Retry Policy:** Exponential backoff and circuit breakers are applied to all external API calls to manage rate limits and transient outages.