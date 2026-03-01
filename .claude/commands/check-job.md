# /check-job [job_id]

Check the status of a specific job or list recent jobs from the database.

## Steps

1. If $ARGUMENTS contains a job ID, fetch that job's status:
   ```bash
   curl -s http://localhost:8000/api/v1/jobs/$ARGUMENTS | python3 -m json.tool
   ```
   Then check if the analysis JSON is available:
   ```bash
   curl -s http://localhost:8000/api/v1/jobs/$ARGUMENTS/analysis | python3 -m json.tool
   ```

2. If $ARGUMENTS is empty, list the 10 most recent jobs from the database:
   ```bash
   cd /Users/tomerelankry/Desktop/Work/marketing_assistant2/.claude/worktrees/hungry-hellman
   python3 -c "
   from app.db.session import SessionLocal
   from app.db.models import Job
   db = SessionLocal()
   jobs = db.query(Job).order_by(Job.created_at.desc()).limit(10).all()
   print(f'{'ID':<38} {'Status':<12} {'Brand':<20} {'Failed Step':<20} Error')
   print('-' * 110)
   for j in jobs:
       brand = (j.project_metadata or {}).get('brand_name', 'N/A')
       step  = j.failed_step or ''
       err   = (j.error_message or '')[:40]
       print(f'{str(j.id):<38} {j.status:<12} {brand:<20} {step:<20} {err}')
   db.close()
   "
   ```

3. Present the result clearly. If a job is `failed`, highlight the `failed_step` and `error_message`. If `completed`, show the download URL: `http://localhost:8000/api/v1/jobs/{job_id}/download`
