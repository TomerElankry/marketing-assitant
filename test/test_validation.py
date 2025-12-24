
import os
from dotenv import load_dotenv
import requests

load_dotenv()

BASE_URL = "http://localhost:8000/api/v1/validate"

def test_validation():
    print("--- Testing API Validation Gate ---")
    
    # Payload 1: BAD Data (Should fail)
    bad_payload = {
        "project_metadata": {
            "brand_name": "Test Brand",
            "website_url": "http://example.com",
            "target_country": "USA",
            "industry": "Tech"
        },
        "product_definition": {
            "product_description": "stuff", 
            "core_problem_solved": "idk",
            "unique_selling_proposition": "good"
        },
        "target_audience": {
            "demographics": "everyone",
            "psychographics": "nice people",
            "cultural_nuances": "none"
        },
        "market_context": {
            "main_competitors": ["google"],
            "current_marketing_efforts": "none",
            "known_customer_objections": "none"
        },
        "the_creative_goal": {
            "primary_objective": "money",
            "desired_tone_of_voice": "good",
            "specific_channels": ["web"]
        }
    }
    
    # Payload 2: GOOD Data (Should pass)
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
        print("\nSending BAD payload (Expect 400)...")
        res_bad = requests.post(BASE_URL, json=bad_payload)
        print(f"Status: {res_bad.status_code}")
        print(f"Response: {res_bad.json()}")

        print("\nSending GOOD payload (Expect 200)...")
        res_good = requests.post(BASE_URL, json=good_payload)
        print(f"Status: {res_good.status_code}")
        print(f"Response: {res_good.json()}")

    except Exception as e:
        print(f"Test Error: {e}")

if __name__ == "__main__":
    test_validation()
