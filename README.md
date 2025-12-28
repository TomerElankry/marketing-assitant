# Marketing Strategy AI Agent (MVP) 🚀

A powerful, agentic AI system that autonomously conducts deep market research, generates strategic marketing angles, and produces ready-to-use PowerPoint presentations.

## 🎯 What It Does
1.  **Ingests Brand Info**: Takes a detailed questionnaire about a brand or product.
2.  **Validates Input (Gemini)**: Ensures the input is sufficient and meaningful using `google-generativeai`.
3.  **Deep Research (Perplexity)**: Conducts live web research on competitors, social sentiment, and market trends.
4.  **Strategic Analysis (GPT-4o)**: Synthesizes research into unique "Hooks", "Angles", and a "Creative Pivot".
5.  **Generates Presentation**: Structures a 7-slide deck and builds a `.pptx` file using `python-pptx`.
6.  **Interactive UI**: Provides a modern React interface to submit jobs, track real-time progress, and download results.

## 🏗 Architecture
*   **Backend**: FastAPI (Python), SQLAlchemy (Postgres)
*   **Frontend**: React, Vite, Tailwind CSS, TypeScript
*   **Storage**: MinIO (S3-compatible) for JSON artifacts and PPTX files
*   **AI Models**:
    *   **Gemini 1.5 Flash**: Validation Agent
    *   **Perplexity (Sonar)**: Research Agent
    *   **GPT-4o**: Analysis & Presentation Agent

## ⚡ Quick Start

### Prerequisites
*   Python 3.12+
*   Node.js 18+
*   Docker (for Postgres/MinIO)

### 1. Setup Environment
Create a `.env` file in the root:
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/marketing_db

# Storage (MinIO)
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# AI Keys
GEMINI_API_KEY=your_gemini_key
PERPLEXITY_API_KEY=your_perplexity_key
OPENAI_API_KEY=your_openai_key
```

### 2. Run Infrastructure
```bash
docker-compose up -d
```

### 3. Run Backend
```bash
# Install dependencies
pip install -r requirements.txt

# Start API Server
uvicorn app.main:app --reload
```
The API will be available at `http://localhost:8000`.

### 4. Run Frontend
```bash
cd frontend
npm install
npm run dev
```
The UI will be available at `http://localhost:5173`.

## 🧪 Testing
The project includes a suite of test scripts in the root and `test/` directory to verify each component:
*   `test_research.py`: Verifies Perplexity integration.
*   `test_analysis.py`: Verifies GPT-4o strategy generation.
*   `test_pptx_generation.py`: Verifies slide creation.
*   `test_full_workflow.py`: Runs the entire pipeline end-to-end.

## 📂 Project Structure
*   `app/api`: FastAPI endpoints (`/jobs`, `/download`).
*   `app/services`: Core logic (`research_service`, `analysis_service`, `presentation_service`).
*   `app/db`: Database models and session management.
*   `frontend/`: React application.
