import json
import google.generativeai as genai
from app.core.config import settings
from app.schemas.questionnaire import QuestionnaireRequest
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Configure API Key
genai.configure(api_key=settings.GEMINI_API_KEY)

class GeminiResearchService:
    def __init__(self):
        # Using gemini-2.0-flash as it is available and stable
        self.model_name = "gemini-2.0-flash"
        
    def _generate_creative_queries(self, data: QuestionnaireRequest) -> dict:
        """
        Generates creative-focused research queries for Gemini.
        Focuses on visual trends, cultural insights, and creative strategies.
        """
        brand = data.project_metadata.brand_name
        industry = data.project_metadata.industry
        country = data.project_metadata.target_country
        
        return {
            "visual_trends": f"Search for current visual marketing trends in the {industry} industry in {country}. Describe color palettes, photography styles, and graphic design elements that are popular right now. Look for specific examples from top brands.",
            "cultural_insights": f"What are the current cultural conversations or shifts in {country} that are relevant to {industry}? Identify slang, memes, or social movements that brands are tapping into.",
            "campaign_examples": f"Find 3 examples of recent, successful creative marketing campaigns in the {industry} sector (globally or in {country}). Describe the core creative concept and why it worked.",
            "brand_archetypes": f"Analyze the common brand archetypes used in the {industry} market. Are they mostly 'Ruler', 'Caregiver', 'Outlaw'? Where is the whitespace?"
        }

    async def conduct_creative_research(self, data: QuestionnaireRequest) -> dict:
        """
        Conducts creative-focused research using Gemini.
        This complements Perplexity's data-focused research with creative/visual insights.
        """
        model = genai.GenerativeModel(self.model_name)
        
        queries = self._generate_creative_queries(data)
        results = {}
        
        print(f"--- Starting Gemini Creative Research for {data.project_metadata.brand_name} ---")
        
        import asyncio
        
        async def _search_async(query: str, category: str):
            """Helper to run Gemini search asynchronously"""
            try:
                response = await model.generate_content_async(query)
                content = response.text
                return {
                    "query": query,
                    "content": content,
                    "source": "gemini_search"
                }
            except Exception as e:
                logger.error(f"Gemini Research Error ({category}): {e}")
                return {
                    "query": query,
                    "content": f"Error conducting research: {str(e)}",
                    "error": True
                }
        
        # Create tasks for all queries
        tasks = []
        keys = []
        for category, query in queries.items():
            print(f"Gemini Researching ({category})...")
            tasks.append(_search_async(query, category))
            keys.append(category)
            
        # Run in parallel
        responses = await asyncio.gather(*tasks)
        
        for i, result in enumerate(responses):
            results[keys[i]] = result
                
        return results

gemini_research_service = GeminiResearchService()
