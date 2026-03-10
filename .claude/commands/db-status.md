# /db-status

Show database statistics: job counts by status, recent failures, and schema info.

## Steps

1. Run a DB summary query:

```bash
cd /Users/tomerelankry/Desktop/Work/marketing_assistant2/.claude/worktrees/hungry-hellman
python3 -c "
from app.db.session import SessionLocal
from app.db.models import Job, JobStatus
from sqlalchemy import func

db = SessionLocal()

# Count by status
print('=== Job Counts by Status ===')
counts = db.query(Job.status, func.count(Job.id)).group_by(Job.status).all()
for status, count in counts:
    print(f'  {status:<15} {count}')

# Recent failures
print()
print('=== Recent Failures (last 5) ===')
failures = db.query(Job).filter(Job.status == 'failed').order_by(Job.created_at.desc()).limit(5).all()
if failures:
    for j in failures:
        brand = (j.project_metadata or {}).get('brand_name', 'N/A')
        print(f'  {str(j.id)[:8]}...  {brand:<20}  step={j.failed_step or \"?\"}  err={(j.error_message or \"\")[:60]}')
else:
    print('  No failures found.')

# Recent completions
print()
print('=== Recent Completions (last 5) ===')
done = db.query(Job).filter(Job.status == 'completed').order_by(Job.created_at.desc()).limit(5).all()
for j in done:
    brand = (j.project_metadata or {}).get('brand_name', 'N/A')
    print(f'  {str(j.id)[:8]}...  {brand:<20}  {str(j.created_at)[:19]}')

db.close()
"
```

2. Present the results in a clear, readable format. Highlight any patterns in failures (e.g., always failing at the same step).
