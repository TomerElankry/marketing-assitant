# Marketing Strategy AI Agent 🚀

A powerful, agentic AI system that autonomously conducts deep market research, generates strategic marketing angles, and produces ready-to-use PowerPoint presentations.

## 🎯 What It Does
1.  **Ingests Brand Info**: Takes a detailed questionnaire about a brand or product through an intuitive multi-step form.
2.  **Validates Input (Gemini)**: Ensures the input is sufficient and meaningful using `google-generativeai`.
3.  **Dual-Source Research**:
    *   **Market Data (Perplexity)**: Competitor analysis, pricing, and social sentiment ("The Talk").
    *   **Creative Trends (Gemini)**: Visual trends, cultural insights, and campaign examples.
4.  **Consolidated Intelligence**: An AI agent merges these two research streams into a single strategic resource.
5.  **Triple Analysis**: Three distinct AI personas analyze the data in parallel to find the best strategy:
    *   **Creative Director (GPT-4o)**: Focuses on hooks, narrative, and bold pivots.
    *   **Brand Strategist (Gemini)**: Focuses on positioning and long-term brand health.
    *   **Market Analyst (Perplexity)**: Focuses on data, gaps, and competitor weaknesses.
6.  **Consensus Engine**: A "Chief Strategy Officer" agent synthesizes the three proposals into a final **Consensus Strategy**, resolving conflicts and picking the best ideas.
7.  **Generates Presentation**: Structures a deck and builds a `.pptx` file with custom layouts and your logo.
8.  **Interactive UI**: Provides a modern React interface with real-time progress tracking of the entire multi-agent workflow.

## 🏗 Architecture
*   **Backend**: FastAPI (Python 3.12+), SQLAlchemy (Postgres)
*   **Frontend**: React 19, Vite, Tailwind CSS, TypeScript
*   **Storage**: MinIO (S3-compatible) for JSON artifacts and PPTX files
*   **Database**: PostgreSQL for job tracking and metadata
*   **AI Models**:
    *   **Gemini 2.0 Flash**: Validation, Creative Research, Brand Strategy
    *   **Perplexity (Sonar-Pro)**: Market Research, Market Analysis
    *   **GPT-4o**: Creative Direction, Consensus Generation, Presentation Structuring

## ⚡ Quick Start

### Prerequisites
*   Python 3.12+
*   Node.js 18+
*   Docker & Docker Compose (for Postgres/MinIO)

### 1. Clone Repository
```bash
git clone https://github.com/TomerElankry/marketing-assitant.git
cd marketing-assitant
```

### 2. Setup Environment
Create a `.env` file in the root:
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/marketing_db

# Storage (MinIO)
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# AI Keys (Required)
GEMINI_API_KEY=your_gemini_key
PERPLEXITY_API_KEY=your_perplexity_key
OPENAI_API_KEY=your_openai_key
```

### 3. Run Infrastructure
Start PostgreSQL and MinIO services:
```bash
docker-compose up -d
```

This will start:
- **PostgreSQL** on port `5432`
- **MinIO** API on port `9000` and Console on port `9001`

### 4. Install Backend Dependencies
```bash
pip install -r requirements.txt
```

### 5. Start Backend Server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
The API will be available at:
- API: `http://localhost:8000`
- Docs: `http://localhost:8000/docs` (Swagger UI)
- Health: `http://localhost:8000/health`

### 6. Install Frontend Dependencies
```bash
cd frontend
npm install
```

### 7. Start Frontend Development Server
```bash
npm run dev
```
The UI will be available at `http://localhost:5173`.

## 🚀 Usage

1. **Fill Out Questionnaire**: Navigate to the web UI and complete the multi-step form with:
   - Brand/project metadata
   - Product definition and USP
   - Target audience demographics
   - Market context and competitors
   - Creative goals and channels

2. **Submit & Track**: Submit the form and watch real-time progress as AI agents:
   - **Validate** your input
   - **Research** (Dual Source: Perplexity + Gemini)
   - **Analyze** (Triple Analysis: GPT-4o, Gemini, Perplexity)
   - **Consolidate** findings into a Consensus Strategy
   - **Generate** your presentation

3. **Download Results**: Once complete, download your professional PowerPoint presentation.

## 🧪 Testing
The project includes a comprehensive test suite in the `test/` directory:
*   `test_phase2_workflow.py`: Verifies the full Dual Research -> Triple Analysis -> Consensus pipeline.
*   `test_research.py`: Verifies Perplexity integration and web research.
*   `test_analysis.py`: Verifies GPT-4o strategy generation.
*   `test_pptx_generation.py`: Verifies PowerPoint slide creation.
*   `test_logo_integration.py`: Verifies custom logo placement.
*   `test_presentation_structure.py`: Tests slide structure generation.
*   `test_full_workflow.py`: Runs the legacy pipeline end-to-end.
*   `test_storage.py`: Tests MinIO storage operations.
*   `test_validation.py`: Tests Gemini validation agent.

Run tests individually:
```bash
python test/test_phase2_workflow.py
python test/test_logo_integration.py
```

## 📂 Project Structure
```
marketing-assistant2/
├── app/
│   ├── api/              # FastAPI endpoints
│   │   └── endpoints.py  # /jobs, /validate, /download
│   ├── assets/           # Static assets (logos, images)
│   ├── core/             # Configuration
│   ├── db/               # Database models and sessions
│   ├── schemas/          # Pydantic models
│   ├── services/         # Core business logic
│   │   ├── research_service.py       # Perplexity Research
│   │   ├── gemini_research_service.py # Gemini Research
│   │   ├── research_consolidator.py  # Research Synthesis
│   │   ├── multi_analysis_service.py # Triple Analysis Engine
│   │   ├── consensus_service.py      # Consensus Engine
│   │   ├── analysis_service.py       # Legacy Analysis
│   │   ├── presentation_service.py   # PPTX Generation
│   │   ├── storage_service.py        # MinIO Storage
│   │   ├── gemini_service.py         # Validation
│   │   └── workflow.py               # Orchestrator
│   └── main.py           # FastAPI application
├── frontend/             # React application
│   ├── src/
│   │   ├── components/  # React components
│   │   └── App.tsx       # Main app component
│   └── package.json
├── test/                 # Test scripts
├── docs/                 # Documentation (PRD, architecture)
├── docker-compose.yml    # Infrastructure setup
└── requirements.txt     # Python dependencies
```

## 🔄 Workflow

The system follows this automated pipeline:

1. **Validation** → Gemini validates questionnaire quality
2. **Dual Research** → Perplexity (Market) + Gemini (Creative) run in parallel
3. **Consolidation** → AI merges findings into a single resource
4. **Triple Analysis** → GPT-4o + Gemini + Perplexity analyze data in parallel
5. **Consensus** → "Chief Strategy Officer" agent synthesizes a final strategy
6. **Structuring** → GPT-4o structures content into slides based on Consensus
7. **Generation** → Python-pptx creates PowerPoint file with logo
8. **Storage** → Files saved to MinIO, metadata to PostgreSQL

## 📋 API Endpoints

- `POST /api/validate` - Validate questionnaire input
- `POST /api/jobs` - Submit a new marketing strategy job
- `GET /api/jobs/{job_id}` - Get job status
- `GET /api/jobs/{job_id}/analysis` - Get analysis results (JSON)
- `GET /api/jobs/{job_id}/download` - Download PowerPoint presentation

## 🌿 Branches

- **`main`**: Active development branch (current)
- **`mvp`**: Preserved MVP snapshot for reference

## 🛠 Tech Stack

**Backend:**
- FastAPI - Modern Python web framework
- SQLAlchemy - ORM for database operations
- Pydantic - Data validation
- python-pptx - PowerPoint generation
- boto3 - S3/MinIO client

**Frontend:**
- React 19 - UI library
- TypeScript - Type safety
- Vite - Build tool
- Tailwind CSS - Styling
- React Hook Form - Form management
- TanStack Query - Data fetching

**Infrastructure:**
- PostgreSQL - Relational database
- MinIO - S3-compatible object storage
- Docker - Containerization

## 📝 License

This project is private and proprietary.

## 🤝 Contributing

This is a private project. For questions or contributions, please contact the repository owner.
