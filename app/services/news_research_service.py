"""
news_research_service.py

Searches NewsAPI for brand press coverage, competitor news, and industry trends.
Free developer tier: 100 req/day, articles from the last month.
Returns empty dict gracefully if NEWSAPI_KEY is not set.
"""

import logging
from datetime import datetime, timedelta
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


class NewsResearchService:
    def __init__(self):
        self._client = None

    @property
    def client(self):
        if self._client is None and settings.NEWSAPI_KEY:
            from newsapi import NewsApiClient
            self._client = NewsApiClient(api_key=settings.NEWSAPI_KEY)
        return self._client

    def is_available(self) -> bool:
        return bool(settings.NEWSAPI_KEY)

    def _search(self, query: str, max_results: int = 5) -> list:
        """Returns list of {title, source, description, url, publishedAt}."""
        from_date = (datetime.utcnow() - timedelta(days=28)).strftime("%Y-%m-%d")
        resp = self.client.get_everything(
            q=query,
            from_param=from_date,
            language="en",
            sort_by="relevancy",
            page_size=max_results,
        )
        articles = resp.get("articles", [])
        return [
            {
                "title": a.get("title", ""),
                "source": a.get("source", {}).get("name", ""),
                "description": a.get("description", ""),
                "url": a.get("url", ""),
                "published": a.get("publishedAt", "")[:10],
            }
            for a in articles
            if a.get("title") and "[Removed]" not in a.get("title", "")
        ]

    def _summarise(self, articles: list, context: str) -> str:
        """Turns a list of articles into a readable summary string."""
        if not articles:
            return f"No recent news found for: {context}"
        lines = [f"Recent news ({context}):"]
        for a in articles:
            lines.append(f'  • [{a["published"]}] {a["title"]} — {a["source"]}')
            if a["description"]:
                lines.append(f'    {a["description"][:160]}')
        return "\n".join(lines)

    def conduct_news_research(
        self,
        brand_name: str,
        industry: str,
        competitors: list,
    ) -> dict:
        """
        Runs 3 targeted searches:
          - brand_press: media coverage and press mentions of the brand
          - competitor_news: what competitors are doing in the news
          - industry_trends: macro trends and reports in the industry
        Returns empty dict if NEWSAPI_KEY not set.
        """
        if not self.is_available():
            logger.info("NEWSAPI_KEY not set — skipping news research")
            return {}

        competitor_str = " OR ".join(f'"{c}"' for c in competitors[:3]) if competitors else ""

        queries = {
            "brand_press": f'"{brand_name}"',
            "competitor_news": competitor_str or f"{industry} startup",
            "industry_trends": f"{industry} market trends 2025",
        }

        results = {}
        for key, query in queries.items():
            try:
                articles = self._search(query)
                results[key] = {
                    "query": query,
                    "articles": articles,
                    "summary": self._summarise(articles, query),
                }
                logger.info(f"News research completed: {key} ({len(articles)} articles)")
            except Exception as e:
                logger.warning(f"News research '{key}' failed: {e}")
                results[key] = {"query": query, "articles": [], "summary": "", "error": str(e)}

        return results


news_research_service = NewsResearchService()
