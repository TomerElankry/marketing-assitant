import asyncio
import logging

import google.generativeai as genai
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.schemas.questionnaire import QuestionnaireRequest

logger = logging.getLogger(__name__)

genai.configure(api_key=settings.GEMINI_API_KEY)


class GeminiResearchService:
    def __init__(self):
        self.model = genai.GenerativeModel(settings.GEMINI_MODEL)

    def _generate_creative_queries(self, data: QuestionnaireRequest) -> dict:
        """
        Generates creative-focused research queries.
        Focuses on visual trends, cultural insights, and creative strategies.
        """
        brand = data.project_metadata.brand_name
        industry = data.project_metadata.industry
        country = data.project_metadata.target_country

        return {
            "visual_trends": (
                f"Search for current visual marketing trends in the {industry} industry in {country}. "
                "Describe color palettes, photography styles, and graphic design elements that are popular right now. "
                "Look for specific examples from top brands."
            ),
            "cultural_insights": (
                f"What are the current cultural conversations or shifts in {country} that are relevant to {industry}? "
                "Identify slang, memes, or social movements that brands are tapping into."
            ),
            "campaign_examples": (
                f"Find 3 examples of recent, successful creative marketing campaigns in the {industry} sector "
                f"(globally or in {country}). Describe the core creative concept and why it worked."
            ),
            "brand_archetypes": (
                f"Analyze the common brand archetypes used in the {industry} market. "
                "Are they mostly 'Ruler', 'Caregiver', 'Outlaw'? Where is the whitespace for a new brand to stand out?"
            ),
            "content_formats": (
                f"What content formats and creative executions are performing best for {industry} brands "
                f"in {country} right now? Include platform-specific insights (TikTok, Instagram, LinkedIn, etc.) "
                f"and examples of what {brand} or similar brands could do."
            ),
        }

    @retry(
        retry=retry_if_exception_type(Exception),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        stop=stop_after_attempt(3),
        reraise=True,
    )
    async def _search_async(self, query: str, category: str) -> dict:
        response = await self.model.generate_content_async(query)
        return {
            "query": query,
            "content": response.text,
            "source": "gemini_search",
        }

    async def conduct_creative_research(self, data: QuestionnaireRequest) -> dict:
        """
        Conducts creative-focused research using Gemini.
        Complements Perplexity's data-focused research with creative/visual insights.
        """
        queries = self._generate_creative_queries(data)
        logger.info(
            f"Starting Gemini Creative Research for {data.project_metadata.brand_name} "
            f"({len(queries)} queries)"
        )

        async def safe_search(category: str, query: str) -> tuple:
            try:
                result = await self._search_async(query, category)
                return category, result
            except Exception as e:
                logger.warning(f"Gemini Research ({category}) failed after retries: {e}")
                return category, {"query": query, "content": "", "error": True}

        tasks = [safe_search(cat, q) for cat, q in queries.items()]
        responses = await asyncio.gather(*tasks)
        return {cat: result for cat, result in responses}


gemini_research_service = GeminiResearchService()
