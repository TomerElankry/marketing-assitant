# /run-job

Submit a full end-to-end marketing strategy job and tail its progress until completion.

## Steps

1. Check the backend is running:
   ```bash
   curl -s http://localhost:8000/health
   ```
   If it's not running, start it:
   ```bash
   cd /Users/tomerelankry/Desktop/Work/marketing_assistant2/.claude/worktrees/hungry-hellman
   uvicorn app.main:app --host 0.0.0.0 --port 8000 > /tmp/backend.log 2>&1 &
   sleep 3
   ```

2. Submit the job using the sample questionnaire (or a file path if the user passed one as $ARGUMENTS):
   - If $ARGUMENTS is empty, use `questionnaire.json` in the project root
   - Otherwise use the path provided

   ```bash
   curl -s -X POST http://localhost:8000/api/v1/jobs \
     -H "Content-Type: application/json" \
     -d @<questionnaire_file>
   ```

3. Extract the `job_id` from the response and poll `/api/v1/jobs/{job_id}` every 10 seconds.
   Print the status on each poll. Stop when `status` is `completed` or `failed`.

4. If `completed`: print a success message with the download URL:
   `http://localhost:8000/api/v1/jobs/{job_id}/download`

5. If `failed`: print the `failed_step` and `error_message` from the response so the user knows exactly where it broke.

Show the user the full job response JSON at the end.
