"""
x_research_service.py

Uses the Grok API (api.x.ai) to search X (Twitter/X) for brand mentions,
competitor activity, and live industry conversation data.

Grok 2 supports Live Search via `search_parameters` in the OpenAI-compatible API.
If GROK_API_KEY is not set, all methods return empty dicts gracefully.
"""

import logging
from typing import Optional

from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from app.core.config import settings

logger = logging.getLogger(__name__)


class XResearchService:
    def __init__(self):
        self._client = None

    @property
    def client(self) -> Optional[OpenAI]:
        if self._client is None and settings.GROK_API_KEY:
            self._client = OpenAI(
                api_key=settings.GROK_API_KEY,
                base_url="https://api.x.ai/v1",
            )
        return self._client

    def is_available(self) -> bool:
        return bool(settings.GROK_API_KEY)

    @retry(
        retry=retry_if_exception_type(Exception),
        wait=wait_exponential(multiplier=1, min=2, max=20),
        stop=stop_after_attempt(2),
        reraise=True,
    )
    def _search(self, query: str) -> str:
        if not self.client:
            raise RuntimeError("GROK_API_KEY is not configured")

        response = self.client.chat.completions.create(
            model=settings.GROK_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a social media analyst with access to real-time X (Twitter) data. "
                        "Search X posts and provide: (1) key themes and sentiment, "
                        "(2) specific quotes or paraphrased posts with context, "
                        "(3) patterns in complaints, praise, or unmet needs. "
                        "Be specific — cite actual content, not generic summaries."
                    ),
                },
                {"role": "user", "content": query},
            ],
            extra_body={
                "search_parameters": {
                    "mode": "auto",
                    "sources": [{"type": "x"}],
                }
            },
            temperature=0.3,
        )
        return response.choices[0].message.content

    def conduct_x_research(
        self,
        brand_name: str,
        industry: str,
        competitors: list,
    ) -> dict:
        """
        Runs 3 targeted X searches: brand mentions, competitor X activity,
        and industry conversation trends. Returns empty dict if Grok unavailable.
        """
        if not self.is_available():
            logger.info("GROK_API_KEY not set — skipping X research")
            return {}

        competitor_str = ", ".join(competitors[:3]) if competitors else "N/A"

        queries = {
            "brand_mentions": (
                f"Search X (Twitter) for recent posts mentioning '{brand_name}'. "
                f"What are people saying? Include specific complaints, praise, "
                f"questions, and recurring themes. Quote actual post language."
            ),
            "competitor_x_activity": (
                f"Find recent X posts and discussions about {competitor_str} in the "
                f"{industry} space. What content performs best? What do customers "
                f"complain about? What campaigns are they running on X?"
            ),
            "industry_pain_points": (
                f"What are the hottest topics and biggest frustrations being discussed "
                f"on X right now in the {industry} industry? What do customers wish "
                f"existed? What common problems keep surfacing?"
            ),
        }

        results = {}
        for key, query in queries.items():
            try:
                content = self._search(query)
                results[key] = {"query": query, "content": content}
                logger.info(f"X research completed: {key}")
            except Exception as e:
                logger.warning(f"X research query '{key}' failed: {e}")
                results[key] = {"query": query, "content": "", "error": str(e)}

        return results


x_research_service = XResearchService()
