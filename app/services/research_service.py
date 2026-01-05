import httpx
import json
from app.core.config import settings
from app.schemas.questionnaire import QuestionnaireRequest

class ResearchService:
    def __init__(self):
        self.api_key = settings.PERPLEXITY_API_KEY
        self.base_url = "https://api.perplexity.ai/chat/completions"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        # Using a reliable online model
        self.model = "sonar-pro" 

    async def _search(self, query: str) -> str:
        """
        Executes a single search query against Perplexity API.
        """
        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a professional market researcher and creative strategist. Provide detailed, factual, and cited summaries based on the search query. Focus on recent data (last 6 months), visual trends, and cultural nuances."
                },
                {
                    "role": "user",
                    "content": query
                }
            ],
            "temperature": 0.2
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(self.base_url, headers=self.headers, json=payload)
                response.raise_for_status()
                result = response.json()
                return result["choices"][0]["message"]["content"]
            except httpx.HTTPStatusError as e:
                print(f"Perplexity API Error: {e}")
                print(f"Response Body: {e.response.text}")
                return f"Error executing search. Status: {e.response.status_code}, Body: {e.response.text}"
            except Exception as e:
                print(f"General Error: {e}")
                return f"Error executing search for query: {query}. Details: {e}"

    def _generate_queries(self, data: QuestionnaireRequest) -> dict:
        """
        Generates specific research queries based on the questionnaire inputs.
        """
        brand = data.project_metadata.brand_name
        industry = data.project_metadata.industry
        country = data.project_metadata.target_country
        competitors = ", ".join(data.market_context.main_competitors)
        usp = data.product_definition.unique_selling_proposition
        
        return {
            "competitor_analysis": f"Analyze the current pricing, marketing messaging, and customer sentiment for these competitors in the {industry} space: {competitors}. Highlight their weaknesses.",
            "usp_validation": f"Search for consumer discussions and reviews regarding {industry} to interpret if this value proposition is truly unique or desired: '{usp}'. Are customers asking for this?",
            "social_sentiment": f"Search Reddit and social threads for recent 'talk' or honest opinions about '{brand}' (if existing) or general frustrations with current solutions in the {industry} market.",
            
            # Creative Focus Queries
            "visual_trends": f"What are the dominant visual styles, color palettes, and imagery trends used by top competitors in the {industry} industry in {country}? Describe specific ad creatives.",
            "emotional_triggers": f"What emotional triggers and psychological hooks are most effective in recent successful marketing campaigns for {industry} products in {country}?",
            "creative_formats": f"What creative formats (e.g., UGC, short-form video, static carousels) are trending and performing best for {industry} marketing on social media in {country}?",
            "brand_voice": f"Analyze the tone of voice and brand personality of the top {industry} brands ({competitors}). How do they speak to their audience?",
            "cultural_trends": f"What are the emerging cultural trends or consumer behaviors in {country} that are impacting the {industry} market right now?"
        }

    async def conduct_deep_research(self, data: QuestionnaireRequest) -> dict:
        """
        Main entry point: Generates queries and runs them in parallel.
        """
        import asyncio
        queries = self._generate_queries(data)
        results = {}

        print(f"--- Starting Research for {data.project_metadata.brand_name} ---")
        
        # Create tasks for all queries
        tasks = []
        keys = []
        for category, query in queries.items():
            print(f"Queueing Query ({category}): {query}")
            tasks.append(self._search(query))
            keys.append(category)
            
        # Run in parallel
        responses = await asyncio.gather(*tasks)
        
        for i, content in enumerate(responses):
            key = keys[i]
            results[key] = {
                "query": queries[key],
                "content": content
            }
            
        return results

research_service = ResearchService()
