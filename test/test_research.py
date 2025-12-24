
import asyncio
from dotenv import load_dotenv
from app.services.research_service import research_service
from app.schemas.questionnaire import QuestionnaireRequest

# Load environment variables to get the API key
load_dotenv()

# Mock Data (Same as our "Good" payload)
mock_data = {
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

async def test_research():
    print("--- Testing Perplexity Research Service ---")
    
    # Convert dict to Pydantic model
    request = QuestionnaireRequest(**mock_data)
    
    # Run Research
    results = await research_service.conduct_deep_research(request)
    
    # Print Results
    for category, data in results.items():
        print(f"\n[ {category.upper()} ]")
        print(f"Query: {data['query']}")
        print(f"Result Snippet: {data['content'][:500]}...") # Show first 500 chars

if __name__ == "__main__":
    asyncio.run(test_research())
