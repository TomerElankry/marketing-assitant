
**Project:** AI-Driven Creative Marketing Strategy Engine  \
**Version:** 2.5 (Dual-Research & Presentation-First)  \
**Date:** December 21, 2025  \
**Status:** Finalized for Implementation  \
\
---\
\
## 1. Purpose & Scope\
The system is designed to transform a structured client questionnaire into a professional, data-backed creative marketing strategy presentation. It utilizes an orchestration layer to perform deep research across multiple sources, triangulate insights using three distinct AI models, and automate the production of a strategic slide deck.\
\
**Core Objectives:**\
* **Intelligent Validation:** Ensure all user inputs are high-quality, logical, and sufficient before processing.\
* **Comprehensive Research:** Utilize dual-source data (Perplexity and Gemini) to map the market and social sentiment ("The Talk").\
* **Strategic Triangulation:** Leverage GPT-4o, Gemini, and Perplexity in parallel to identify creative consensus and deviations.\
* **Dynamic Presentation Output:** Deliver a professional, slide-based strategy ready for client use in .pptx format.\
\
---\
\
## 2. System Architecture & Agents\
The system follows the **Model Context Protocol (MCP)**, where a central Orchestrator acts as the Host managing specialized API-driven agents.\
\
### 2.1 Agent Roster\
* **Orchestrator Service:** Controls the workflow, state transitions, and asynchronous task dispatching.\
* **Validation Agent (Gemini API):** Acts as the gatekeeper to verify questionnaire logic, completeness, and context.\
* **Research Fleet:**\
    * **Agent A (Perplexity API):** Conducts deep web scans for competitor hooks and social media sentiment analysis.\
    * **Agent B (Gemini API + Search):** Performs real-time market grounding and creative trend identification.\
* **Analysis Workers (GPT-4o, Gemini 1.5 Pro, Perplexity API):** Three independent models that analyze consolidated research to propose creative strategies.\
* **Validation & Merging Agent:** Synthesizes analysis outputs into a consensus-based report, highlighting disagreements and providing a confidence score.\
* **Presentation Agent (Gemini API):** Transforms the final strategic findings into a structured, slide-by-slide presentation.\
\
---\
\
## 3. Functional Requirements\
\
### 3.1 Questionnaire Intake & Validation (Gemini)\
* **Input Handling:** The system accepts structured business and product data via an intake form.\
* **AI Validation:** Gemini API evaluates the quality of inputs; if content is vague or insufficient, the system flags specific fields for user refinement.\
* **Normalization:** Validated data is converted into a standard JSON schema optimized for the research agents.\
\
### 3.2 Dual-Source Research (Perplexity & Gemini)\
* **Sentiment Analysis:** Research agents analyze social media and web data to define "What's the talk" about the brand.\
* **Competitor Audit:** Identify existing competitor creative strategies and visual angles.\
* **Cultural Context:** Research target country norms, tone, and sensitivities to inform localization.\
* **Data Aggregation:** The Orchestrator merges research from both Perplexity and Gemini into a single high-fidelity research resource.\
\
### 3.3 Triple-Analysis Engine (Consensus Model)\
* **Parallel Analysis:** GPT-4o, Gemini Pro, and Perplexity simultaneously evaluate research data to propose creative pivots.\
* **Consensus Detection:** The system automatically maps points of agreement across at least two models.\
* **Conflict Visualization:** Areas of disagreement (divergent creative directions) are highlighted to provide multiple strategic perspectives.\
* **Confidence Calculation:** A confidence score is generated based on the level of alignment among the three models.\
\
### 3.4 Presentation Generation (Gemini)\
* **Structured Output:** The Presentation Agent generates a structured JSON representation of a slide deck.\
* **Core Slide Modules:**\
    * **Creative Audit:** Analysis of current marketing efforts.\
    * **Brand Sentiment:** Summary of "The Talk" and public perception.\
    * **Competitive Landscape:** Mapping hooks, angles, and market gaps.\
    * **Creative Improvements:** New proposed messaging, hooks, and campaign concepts.\
* **Format Conversion:** The system renders the JSON structure into a downloadable **.pptx** (PowerPoint) file.\
\
---\
\
## 4. Technical Infrastructure\
\
### 4.1 Messaging & Communication\
* **Event Bus:** Use NATS or Kafka for asynchronous task distribution and status streaming.\
* **Protocols:** Use MCP for tool discovery and resource sharing between agents.\
\
### 4.2 Storage & Data Persistence\
* **Relational DB:** Postgres for project metadata, user profiles, and job history.\
* **Resource Store:** MinIO (S3-compatible) for caching intermediate JSON blobs and finalized presentation artifacts.\
\
### 4.3 Observability & Security\
* **Tracing:** Implement OpenTelemetry to track every run with a unique `trace_id`.\
* **Privacy:** Mask PII in questionnaire fields before data is transmitted to external vendor APIs.\
\
---\
\
## 5. Acceptance Criteria\
* **Validation Success:** Gemini accurately flags incomplete or illogical questionnaires.\
* **Research Depth:** Perplexity and Gemini return verified competitor strategies and social sentiment data.\
* **Consensus Accuracy:** The final report clearly distinguishes between multi-model agreements and disagreements.\
* **Deliverable Quality:** The system generates a valid, downloadable **.pptx** file containing all specified strategy modules.}