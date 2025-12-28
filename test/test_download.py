
import requests
import os
from app.db.session import SessionLocal
from app.db.models import Job, JobStatus
from app.services.storage_service import storage_service

BASE_URL = "http://localhost:8000/api/v1/jobs"

def test_download():
    print("--- Testing Download Endpoint ---")
    
    # 1. Create a Fake Completed Job in DB
    db = SessionLocal()
    fake_job = Job(
        project_metadata={"brand_name": "DownloadTest"},
        status=JobStatus.COMPLETED
    )
    db.add(fake_job)
    db.commit()
    db.refresh(fake_job)
    job_id = str(fake_job.id)
    db.close()
    
    print(f"Created Mock Job: {job_id}")
    
    # 2. Upload a Mock PPTX to MinIO
    pptx_key = f"jobs/{job_id}/presentation.pptx"
    mock_content = b"Mock PPTX Content"
    
    # We cheat and use string upload for simplicity, or stream upload
    storage_service.s3_client.put_object(
        Bucket=storage_service.bucket_name,
        Key=pptx_key,
        Body=mock_content,
        ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation"
    )
    print("Uploaded Mock PPTX to Storage")
    
    # 3. Request Download
    download_url = f"{BASE_URL}/{job_id}/download"
    print(f"Requesting: {download_url}")
    
    res = requests.get(download_url, stream=True)
    
    if res.status_code == 200:
        print("SUCCESS: Endpoint returned 200 OK")
        
        # Verify Headers
        disposition = res.headers.get("Content-Disposition", "")
        print(f"Header: {disposition}")
        
        if f"marketing_strategy_{job_id}.pptx" in disposition:
             print("SUCCESS: Filename correct in header")
             
        # Check Content
        content = res.content
        if content == mock_content:
            print("SUCCESS: Downloaded content matches mock content")
        else:
            print("FAILURE: Content mismatch")
            
    else:
        print(f"FAILURE: Status {res.status_code} - {res.text}")

if __name__ == "__main__":
    test_download()
