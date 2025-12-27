
from dotenv import load_dotenv
import json
from app.services.analysis_service import analysis_service

load_dotenv()

# Mock Questionnaire Data
mock_questionnaire = {
    "project_metadata": {
        "brand_name": "EcoFit",
        "industry": "Fitness Apparel"
    },
    "product_definition": {
        "unique_selling_proposition": "Lifetime durability guarantee on recycled fabrics."
    },
    "target_audience": {
        "demographics": "Women 25-40"
    },
    "the_creative_goal": {
        "primary_objective": "Brand Awareness"
    }
}

# Mock Research Data (what we expect from Perplexity)
mock_research = {
    "competitor_analysis": {
        "content": "Lululemon is expensive but high quality. Patagonia is sustainable but not focused on gym wear."
    },
    "social_sentiment": {
        "content": "People hate leggings that rip after 3 months. They want durability."
    }
}

def test_analysis():
    print("--- Testing Analysis Service (GPT-4o) ---")
    
    result = analysis_service.analyze_research(mock_questionnaire, mock_research)
    
    print("\n[ Analysis Result ]")
    print(json.dumps(result, indent=2))
    
    if "hooks" in result and "angles" in result:
        print("\nSUCCESS: Strategy generated successfully.")
    else:
        print("\nFAILURE: Missing key fields in response.")

if __name__ == "__main__":
    test_analysis()
