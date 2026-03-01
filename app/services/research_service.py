import asyncio
import logging

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from app.core.config import settings
from app.schemas.questionnaire import QuestionnaireRequest

logger = logging.getLogger(__name__)


class ResearchService:
    def __init__(self):
        self.api_key = settings.PERPLEXITY_API_KEY
        self.base_url = "https://api.perplexity.ai/chat/completions"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        self.model = settings.PERPLEXITY_MODEL

    @retry(
        retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.TimeoutException, httpx.ConnectError)),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        stop=stop_after_attempt(3),
        reraise=True,
    )
    async def _search(self, query: str) -> str:
        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are a professional market researcher. "
                        "Provide detailed, factual, and cited summaries based on the search query. "
                        "Focus on recent data (last 6 months)."
                    ),
                },
                {"role": "user", "content": query},
            ],
            "temperature": 0.2,
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(self.base_url, headers=self.headers, json=payload)
            response.raise_for_status()
            result = response.json()
            return result["choices"][0]["message"]["content"]

    def _generate_queries(self, data: QuestionnaireRequest) -> dict:
        brand = data.project_metadata.brand_name
        industry = data.project_metadata.industry
        competitors = ", ".join(data.market_context.main_competitors)
        usp = data.product_definition.unique_selling_proposition

        return {
            "competitor_analysis": (
                f"Analyze the current pricing, marketing messaging, and customer sentiment for these competitors "
                f"in the {industry} space: {competitors}. Highlight their weaknesses."
            ),
            "usp_validation": (
                f"Search for consumer discussions and reviews regarding {industry} to interpret if this value "
                f"proposition is truly unique or desired: '{usp}'. Are customers asking for this?"
            ),
            "social_sentiment": (
                f"Search Reddit and social threads for recent 'talk' or honest opinions about '{brand}' "
                f"(if existing) or general frustrations with current solutions in the {industry} market."
            ),
        }

    async def conduct_deep_research(self, data: QuestionnaireRequest) -> dict:
        queries = self._generate_queries(data)
        logger.info(f"Starting Perplexity research for {data.project_metadata.brand_name}")

        tasks = [self._search(query) for query in queries.values()]
        keys = list(queries.keys())

        try:
            responses = await asyncio.gather(*tasks)
        except Exception as e:
            logger.error(f"Perplexity research failed: {e}")
            raise

        return {
            key: {"query": queries[key], "content": content}
            for key, content in zip(keys, responses)
        }


research_service = ResearchService()
