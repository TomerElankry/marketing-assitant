# Marketing Strategy AI Agent

A powerful, agentic AI system that autonomously conducts deep market research, generates strategic marketing angles, and produces ready-to-use PowerPoint presentations using **triple AI model consensus**.

## What It Does

1. **Ingests Brand Info** — A 5-step guided wizard collects brand, product, audience, market, and creative goal details.
2. **Validates Input (Gemini)** — Ensures the input is sufficient and meaningful before processing.
3. **Dual-Source Research** — Runs in parallel:
   - **Perplexity**: Live web research on competitors, social sentiment, and market trends
   - **Gemini**: Creative research on visual trends, cultural insights, and campaign examples
4. **Triple Analysis & Consensus** — GPT-4o, Gemini, and Perplexity analyze research in parallel; a consensus engine synthesizes three proposals into a final strategy.
5. **Generates Presentation** — Builds a 7-slide `.pptx` deck with AI-themed branding using `python-pptx`.

## Architecture

| Layer | Stack |
|---|---|
| Backend | FastAPI (Python 3.9+), SQLAlchemy, PostgreSQL |
| Frontend | React 19, Vite 7, Tailwind CSS v4, TypeScript |
| Storage | MinIO (S3-compatible) for JSON artifacts and PPTX files |
| AI — Validation & Research | Gemini 2.0 Flash |
| AI — Market Research | Perplexity Sonar |
| AI — Strategy & Consensus | GPT-4o |

## UI Features

### Multi-Step Form Wizard
- 5-step progress wizard (Project → Product → Audience → Market → Goals)
- Per-step validation — can't advance until the current section is valid
- Completed steps are clickable to jump back and edit
- Import a pre-filled JSON file to skip straight to review

### Live Status Dashboard
- Real-time activity ticker that cycles through contextual messages per pipeline stage (e.g. "Scanning competitor websites...", "GPT-4o generating creative angles...")
- Step-by-step progress with ACTIVE / DONE badges
- Exponential-backoff polling (2s → 4s → … → 30s cap)

### Results View
- Stats bar: hook count, angle count, creative pivot
- Copy-to-clipboard on every individual hook + "Copy all hooks" button
- Copy button on the creative pivot card
- Expandable strategic angle cards — click to reveal full description and copy
- One-click PPTX download

### Job History
- Recent jobs stored in `localStorage` (last 10)
- History panel in the header — click any past brand to instantly reload its results
- "Clear all" to wipe history

### Visual Design
- Glassmorphism panels with backdrop blur
- Animated gradient background, neural grid, floating orbs, particle effects
- Blue / purple / cyan glow accents
- Holographic card effects and scan-line animations

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- Docker (for Postgres + MinIO)

### 1. Environment
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

### 2. Infrastructure
```bash
docker-compose up -d
```

### 3. Backend
```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
# → http://localhost:8000
# → http://localhost:8000/docs
```

### 4. Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/jobs` | Submit a new questionnaire and start a job |
| `GET` | `/api/v1/jobs/{job_id}` | Poll job status (`pending` → `researching` → `analyzing` → `completed`) |
| `GET` | `/api/v1/jobs/{job_id}/analysis` | Fetch hooks, angles, creative pivot, and consensus notes |
| `GET` | `/api/v1/jobs/{job_id}/download` | Download the generated `.pptx` file |

## Testing

```bash
python test_research.py          # Perplexity integration
python test_analysis.py          # GPT-4o strategy generation
python test_pptx_generation.py   # Slide creation
python test_full_workflow.py     # End-to-end pipeline
```

## Project Structure

```
├── app/
│   ├── api/          # FastAPI route handlers
│   ├── core/         # Config, settings
│   ├── db/           # SQLAlchemy models and session
│   └── services/     # research, analysis, presentation, storage logic
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── JobForm.tsx         # 5-step wizard form
│       │   ├── StatusDashboard.tsx # Live progress tracking
│       │   └── ResultsView.tsx     # Results with copy & expand
│       └── App.tsx                 # Root layout and job history
└── docker-compose.yml
```
