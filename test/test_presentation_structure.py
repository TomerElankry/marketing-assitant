
from dotenv import load_dotenv
import json
from app.services.presentation_service import presentation_service

load_dotenv()

# Mock Data (Simulating previous steps)
mock_questionnaire = {
    "project_metadata": {"brand_name": "EcoFit"},
    "product_definition": {"core_problem_solved": "Plastic waste"},
    "target_audience": {"demographics": "Gen Z"},
}

mock_analysis = {
    "hooks": [
        "Wear the ocean change.", 
        "Plastic is now power.", 
        "Sweat responsibly."
    ],
    "angles": [
        {"title": "The Eco Warrior", "description": "For the activist athlete."},
        {"title": "Tech & Nature", "description": "High performance recycled materials."}
    ],
    "creative_pivot": "Transparency in supply chain."
}

def test_structure():
    print("--- Testing Presentation Structuring (GPT-4o) ---")
    
    result = presentation_service.structure_content(mock_questionnaire, mock_analysis)
    
    print("\n[ Structure Result ]")
    print(json.dumps(result, indent=2))
    
    if "slides" in result and len(result["slides"]) >= 7:
        print("\nSUCCESS: Generated 7+ slides.")
    else:
        print("\nFAILURE: Slide count mismatch or missing content.")

if __name__ == "__main__":
    test_structure()
