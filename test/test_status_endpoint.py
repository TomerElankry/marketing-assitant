
import requests
import json

BASE_URL = "http://localhost:8000/api/v1/jobs"

def test_status():
    print("--- Testing Status Endpoint ---")
    
    # 1. Create a Job via Submission
    payload = {
        "project_metadata": {"brand_name": "StatusTest"},
        "product_definition": {"unique_selling_proposition": "USP"},
        "target_audience": {"demographics": "Demo"},
        "the_creative_goal": {"primary_objective": "Goal"}
    }
    
    # Needs to be valid validation-wise or we mock it. 
    # Let's use valid "EcoFit" style minimums to pass validation.
    payload = {
        "project_metadata": {
            "brand_name": "StatusTestBrand",
            "website_url": "https://statustest.com",
            "target_country": "US",
            "industry": "Tech"
        },
        "product_definition": {
            "product_description": "A tool to test status endpoints.", 
            "core_problem_solved": "Uncertainty about job state.",
            "unique_selling_proposition": "Instant status updates."
        },
        "target_audience": {
            "demographics": "Developers",
            "psychographics": "Impatient",
            "cultural_nuances": "None"
        },
        "market_context": {
            "main_competitors": ["Logs"],
            "current_marketing_efforts": "None",
            "known_customer_objections": "None"
        },
        "the_creative_goal": {
            "primary_objective": "Verification",
            "desired_tone_of_voice": "Technical",
            "specific_channels": ["API"]
        }
    }

    print("Submitting Job...")
    res = requests.post(BASE_URL, json=payload)
    if res.status_code != 201:
        print(f"Failed to create job: {res.text}")
        return

    job_id = res.json()["job_id"]
    print(f"Job Created: {job_id}")
    
    # 2. Check Status
    status_url = f"{BASE_URL}/{job_id}"
    print(f"Requesting: {status_url}")
    
    res = requests.get(status_url)
    
    if res.status_code == 200:
        data = res.json()
        print("SUCCESS: Endpoint returned 200 OK")
        print(f"Response: {json.dumps(data, indent=2)}")
        
        if data["status"] == "approved" or data["status"] == "researching":
            print("SUCCESS: Status field correct (approved/researching)")
        else:
             print(f"WARNING: Unexpected status: {data['status']}")
            
    else:
        print(f"FAILURE: Status {res.status_code} - {res.text}")

if __name__ == "__main__":
    test_status()
