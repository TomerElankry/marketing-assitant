# /dev

Start (or restart) the full local dev stack: backend + frontend.

## Steps

1. Kill any existing uvicorn and vite processes:
   ```bash
   pkill -f "uvicorn app.main" 2>/dev/null
   pkill -f "vite" 2>/dev/null
   sleep 1
   ```

2. Check Docker services are running (Postgres + MinIO):
   ```bash
   docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "db|minio|postgres"
   ```
   If they're not running:
   ```bash
   cd /Users/tomerelankry/Desktop/Work/marketing_assistant2/.claude/worktrees/hungry-hellman
   docker compose up -d
   sleep 3
   ```

3. Start the FastAPI backend:
   ```bash
   cd /Users/tomerelankry/Desktop/Work/marketing_assistant2/.claude/worktrees/hungry-hellman
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > /tmp/backend.log 2>&1 &
   sleep 3
   curl -s http://localhost:8000/health
   ```

4. Start the Vite frontend:
   ```bash
   cd /Users/tomerelankry/Desktop/Work/marketing_assistant2/.claude/worktrees/hungry-hellman/frontend
   npm run dev > /tmp/frontend.log 2>&1 &
   sleep 4
   ```

5. Find the actual port the frontend started on (Vite auto-increments if 5173 is taken):
   ```bash
   grep -o "http://localhost:[0-9]*" /tmp/frontend.log | tail -1
   ```

6. Report to the user:
   - Backend: http://localhost:8000 (health status)
   - Backend API docs: http://localhost:8000/docs
   - Frontend: the URL found in step 5
   - Postgres + MinIO: running/not running status
