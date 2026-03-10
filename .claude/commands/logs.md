# /logs

Show recent backend logs, optionally filtered by job ID or log level.

Usage:
- `/logs` — last 50 lines of the backend log
- `/logs ERROR` — only error lines
- `/logs <job_id>` — all log lines mentioning a specific job ID

## Steps

1. Parse $ARGUMENTS:
   - If empty → show last 50 lines of `/tmp/backend.log`
   - If it looks like a UUID (contains `-`) → filter for that job ID
   - If it's a keyword like ERROR, WARNING, INFO → filter by that level

2. Run the appropriate command:

   **All recent logs:**
   ```bash
   tail -50 /tmp/backend.log
   ```

   **Filtered by job ID:**
   ```bash
   grep "$ARGUMENTS" /tmp/backend.log | tail -30
   ```

   **Filtered by level:**
   ```bash
   grep "\[$ARGUMENTS\]" /tmp/backend.log | tail -30
   ```

3. Also check if uvicorn is actually running:
   ```bash
   pgrep -f "uvicorn app.main" && echo "Backend running" || echo "Backend NOT running"
   ```

4. Summarise: how many ERROR lines appeared recently? Any FAILED jobs? Highlight any critical issues you see.
