import json
import google.generativeai as genai
from google.generativeai import protos
from app.core.config import settings
from app.schemas.questionnaire import QuestionnaireRequest
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Configure API Key
genai.configure(api_key=settings.GEMINI_API_KEY)

class GeminiResearchService:
    def __init__(self):
        # Using Gemini 2.0 Flash Exp which might support the tool or valid syntax
        self.model_name = "gemini-2.0-flash-exp"
        
        # Configure tools for Google Search grounding
        # We use the string alias which SDK maps to the correct proto
        self.tools = 'google_search_retrieval'
        
    def _generate_creative_queries(self, data: QuestionnaireRequest) -> dict:
        """
        Generates creative-focused research queries/prompts for Gemini.
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
        Conducts research using Gemini with Google Search grounding.
        """
        model = genai.GenerativeModel(self.model_name, tools=self.tools)
        
        queries = self._generate_creative_queries(data)
        results = {}
        
        print(f"--- Starting Gemini Creative Research for {data.project_metadata.brand_name} ---")
        
        for category, query in queries.items():
            print(f"Gemini Researching ({category})...")
            try:
                # Using generate_content_async if available, otherwise synchronous in a wrapper if needed
                # The SDK usually exposes generate_content_async
                response = await model.generate_content_async(query)
                
                # Extract text
                content = response.text
                
                # Check for grounding metadata if needed (response.candidates[0].grounding_metadata)
                
                results[category] = {
                    "query": query,
                    "content": content,
                    "source": "gemini_search"
                }
                
            except Exception as e:
                logger.error(f"Gemini Research Error ({category}): {e}")
                results[category] = {
                    "query": query,
                    "content": f"Error conducting research: {str(e)}",
                    "error": True
                }
                
        return results

gemini_research_service = GeminiResearchService()


