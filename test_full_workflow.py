import requests
import time
import json
from app.db.session import SessionLocal
from app.db.models import Job, JobStatus
from app.services.storage_service import storage_service

BASE_URL = "http://localhost:8000/api/v1/jobs"

# Mock Data
payload = {
    "project_metadata": {
        "brand_name": "EcoFit",
        "website_url": "https://ecofit-example.com",
        "target_country": "USA",
        "industry": "Fitness Apparel"
    },
    "product_definition": {
        "product_description": "Sustainable activewear made from recycled ocean plastic.", 
        "core_problem_solved": "Providing high-performance workout gear that doesn't harm the planet.",
        "unique_selling_proposition": "The only brand with a lifetime durability guarantee on recycled fabrics."
    },
    "target_audience": {
        "demographics": "Women aged 25-40, urban dwellers, income $70k+",
        "psychographics": "Environmentally conscious, yoga enthusiasts, values transparency",
        "cultural_nuances": "Values authenticity over polished corporate messaging."
    },
    "market_context": {
        "main_competitors": ["Lululemon", "Patagonia", "Gymshark"],
        "current_marketing_efforts": "Instagram organic posts and influencer gifting.",
        "known_customer_objections": "Perceived lack of durability compared to virgin synthetic fabrics."
    },
    "the_creative_goal": {
        "primary_objective": "Brand Awareness and Trust Building",
        "desired_tone_of_voice": "Empowering, Honest, Energetic",
        "specific_channels": ["Instagram Reels", "TikTok", "Pinterest"]
    }
}

def test_workflow():
    print("--- Testing Full Background Research Workflow ---")
    
    # 1. Submit Job
    print("Submitting Job...")
    res = requests.post(BASE_URL, json=payload)
    if res.status_code != 201:
        print(f"Failed to create job: {res.text}")
        return

    job_id = res.json()["job_id"]
    print(f"Job Created: {job_id}")
    
    # 2. Poll DB for status change (Wait for Background Task)
    print("Waiting for background research (Scanning DB)...")
    db = SessionLocal()
    try:
        max_retries = 20 # 20 * 2s = 40s timeout
        for i in range(max_retries):
            db.expire_all() # Refresh
            job = db.query(Job).filter(Job.id == job_id).first()
            print(f"[{i}] Job Status: {job.status}")
            
            if job.status == JobStatus.ANALYZING: # Success state
                print("SUCCESS: Job moved to ANALYZING state!")
                break
            if job.status == JobStatus.FAILED:
                print("FAILURE: Job marked as FAILED.")
                break
                
            time.sleep(2)
        else:
            print("TIMEOUT: Job did not complete research in time.")
            
    finally:
        db.close()

    # 3. Check Storage for Research Artifact
    print("Checking MinIO for 'research.json'...")
    research_key = f"jobs/{job_id}/research.json"
    artifact = storage_service.get_json(research_key)
    
    if artifact:
        print("SUCCESS: Research artifact found in storage!")
    else:
        print("FAILURE: Research artifact NOT found.")

if __name__ == "__main__":
    test_workflow()
