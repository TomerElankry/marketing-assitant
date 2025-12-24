
**Project:** Creative Marketing Strategy Engine  \
**Version:** 1.0  \
**Date:** December 21, 2025  \
**Status:** Ready for Implementation  \
\
---\
\
## 1. Executive Summary\
### 1.1 Problem Statement\
Modern marketing teams and founders struggle to distill massive amounts of social sentiment, competitor data, and cultural nuances into actionable creative strategies. Current tools often provide single-model responses that lack real-time web grounding or fail to flag strategic disagreements, leading to generic or misaligned creative pivots.\
\
### 1.2 Product Vision\
To build a high-trust marketing co-pilot that converts raw business inputs into professional, validated, and slide-ready creative strategies. The system ensures reliability by triangulating insights across three distinct AI models and grounding all analysis in dual-source real-time research.\
\
---\
\
## 2. Target Audience\
* **Growth Marketers:** Who need rapid, data-backed creative pivots and hooks.\
* **Brand Strategists:** Seeking to understand "The Talk" (social sentiment) and competitive gaps.\
* **Agencies:** Requiring a high-quality "first-draft" strategy deck for client presentations.\
\
---\
\
## 3. User Workflow & Experience\
The product follows a linear, automated pipeline managed by an orchestrator:\
\
1.  **Intake:** The user submits a detailed questionnaire regarding their product, audience, and goals.\
2.  **AI Validation:** Gemini API evaluates the input for quality. If context is missing, the user is prompted to refine their answers before the research phase begins.\
3.  **Discovery Phase:** The system performs parallel research using Perplexity and Gemini to map market trends and social sentiment.\
4.  **Strategic Analysis:** Three LLMs (GPT-4o, Gemini, and Perplexity) analyze the research data to propose creative angles.\
5.  **Final Delivery:** The user downloads a professional `.pptx` presentation containing the consensus-backed strategy.\
\
---\
\
## 4. Key Features & Functional Requirements\
\
### 4.1 Intelligent Validation Agent (Gemini-Powered)\
* **Logic Gatekeeping:** The system must verify that questionnaire content is sufficient and logical for professional analysis.\
* **Content Normalization:** Raw inputs are cleaned and structured into a standard JSON format for downstream agents.\
\
### 4.2 Dual-Source Research Fleet ("The Talk")\
* **Sentiment Analysis:** Perplexity API crawls social media and web data to summarize brand perception and "What's the talk".\
* **Market Grounding:** Gemini API (with search grounding) identifies competitor creative strategies and visual hooks.\
* **Cultural Profiling:** Research agents identify target country norms and sensitivities to inform localization.\
\
### 4.3 Triple-Analysis & Consensus Engine\
* **Model Triangulation:** Parallel analysis of consolidated research data using GPT-4o, Gemini 1.5 Pro, and Perplexity.\
* **Agreement Mapping:** Automated identification of strategic points agreed upon by at least two models.\
* **Conflict Surface:** Explicitly highlighting "Disagreements" where models propose divergent creative directions.\
* **Confidence Scoring:** Generation of a reliability metric based on model alignment levels.\
\
### 4.4 Presentation-First Output\
* **Slide Generation:** Gemini API drafts a structured, slide-by-slide narrative.\
* **Mandatory Modules:**\
    * **Creative Audit:** High-level analysis of current marketing efforts.\
    * **Brand Sentiment Map:** Visualization of social perception data.\
    * **Competitive Landscape:** Mapping of competitor angles and identified market gaps.\
    * **The Creative Pivot:** Specific proposed hooks, messaging angles, and campaign concepts.\
* **File Export:** The final output must be rendered as a downloadable **.pptx** file.\
\
---\
\
## 5. Technical Requirements & Infrastructure\
* **Protocol:** Use Model Context Protocol (MCP) for agent tool discovery and invocation.\
* **Asynchronicity:** Implement NATS or Kafka for task distribution and progress streaming.\
* **Storage:** Postgres for metadata and MinIO (S3) for caching research and analysis artifacts.\
* **Observability:** Full OpenTelemetry tracing with unique `trace_id` per job.\
* **Security:** Mask PII in questionnaire fields before transmission to external vendor APIs.\
\
---\
\
## 6. Acceptance Criteria\
* **Validation Gate:** Gemini successfully flags and blocks low-quality or illogical inputs.\
* **Research Integrity:** Final reports contain verified data from both Perplexity and Gemini research streams.\
* **Strategic Transparency:** The output clearly identifies consensus points versus model disagreements.\
* **Deliverable Quality:** The system delivers a valid, openable **.pptx** file containing all specified strategy modules.}