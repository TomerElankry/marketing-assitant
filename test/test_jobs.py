
import os
from dotenv import load_dotenv
import requests

load_dotenv()

BASE_URL = "http://localhost:8000/api/v1/jobs"

def test_jobs_endpoint():
    print("--- Testing API Job Submission ---")
    
    # Payload: GOOD Data (Should pass)
    good_payload = {
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

    try:
        print("\nSubmitting JOB payload (Expect 201)...")
        res = requests.post(BASE_URL, json=good_payload)
        print(f"Status: {res.status_code}")
        
        if res.status_code == 201:
            data = res.json()
            print("SUCCESS: Job Created!")
            print(f"Job ID: {data.get('job_id')}")
            print(f"Status: {data.get('status')}")
        else:
            print(f"FAILURE: {res.text}")

    except Exception as e:
        print(f"Test Error: {e}")

if __name__ == "__main__":
    test_jobs_endpoint()
