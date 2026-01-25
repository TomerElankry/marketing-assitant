# Marketing Strategy AI Agent 🚀

A powerful, agentic AI system that autonomously conducts deep market research, generates strategic marketing angles, and produces ready-to-use PowerPoint presentations using **triple AI model consensus**.

## 🎯 What It Does
1.  **Ingests Brand Info**: Takes a detailed questionnaire about a brand or product.
2.  **Validates Input (Gemini)**: Ensures the input is sufficient and meaningful using `google-generativeai`.
3.  **Dual-Source Research**: 
    - **Perplexity**: Live web research on competitors, social sentiment, and market trends
    - **Gemini**: Creative research on visual trends, cultural insights, and campaign examples
4.  **Triple Analysis & Consensus**: 
    - **GPT-4o, Gemini, and Perplexity** analyze research in parallel
    - **Consensus Engine** synthesizes three proposals into a final strategy
    - Identifies agreements and disagreements between models
5.  **Generates Presentation**: Structures a 7-slide deck and builds a `.pptx` file using `python-pptx`.
6.  **AI-Themed UI**: Modern, futuristic React interface with glassmorphism, neural network animations, and holographic effects.

## 🏗 Architecture
*   **Backend**: FastAPI (Python), SQLAlchemy (Postgres)
*   **Frontend**: React, Vite, Tailwind CSS v4, TypeScript
*   **Storage**: MinIO (S3-compatible) for JSON artifacts and PPTX files
*   **AI Models**:
    *   **Gemini 2.0 Flash**: Validation Agent + Creative Research + Analysis
    *   **Perplexity (Sonar)**: Market Research Agent + Analysis
    *   **GPT-4o**: Strategic Analysis + Consensus Generation + Presentation

## ✨ Key Features

### Enhanced Research Pipeline
- **Dual-Source Research**: Perplexity (data-focused) + Gemini (creative-focused) run in parallel
- **Research Consolidation**: Merges both sources into unified research document

### Triple Analysis & Consensus
- **Parallel Analysis**: GPT-4o, Gemini, and Perplexity analyze research simultaneously
- **Consensus Engine**: Synthesizes three independent proposals into final strategy
- **Transparency**: Shows where models agreed vs. disagreed in consensus notes

### Modern AI-Themed UI
- **Glassmorphism**: Frosted glass effects throughout
- **Neural Network Animations**: Animated grid patterns
- **Holographic Effects**: Gradient shifts and particle animations
- **Glow Effects**: Blue, purple, and cyan glow animations
- **Real-time Status**: Enhanced progress tracking with AI agent indicators

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
