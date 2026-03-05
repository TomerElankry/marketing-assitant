"""
reddit_research_service.py

Uses Reddit API (PRAW) to search subreddits for brand mentions,
competitor discussions, and industry community sentiment.
Completely free — requires a Reddit app (client_id + client_secret).
Returns empty dict gracefully if credentials are not set.
"""

import logging
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

# Subreddits to search by industry keyword
INDUSTRY_SUBREDDITS = {
    "saas": ["SaaS", "startups", "Entrepreneur", "software"],
    "software": ["SaaS", "startups", "software", "webdev"],
    "marketing": ["marketing", "digital_marketing", "startups", "Entrepreneur"],
    "ecommerce": ["ecommerce", "Entrepreneur", "startups", "dropship"],
    "fintech": ["fintech", "personalfinance", "startups", "investing"],
    "health": ["HealthIT", "startups", "Entrepreneur", "health"],
    "sustainability": ["sustainability", "zerowaste", "environment", "Entrepreneur"],
    "consumer": ["Entrepreneur", "startups", "marketing", "smallbusiness"],
    "b2b": ["SaaS", "startups", "sales", "Entrepreneur"],
    "ai": ["MachineLearning", "artificial", "startups", "SaaS"],
    "food": ["food", "FoodService", "startups", "Entrepreneur"],
    "travel": ["travel", "digitalnomad", "startups", "Entrepreneur"],
    "education": ["edtech", "education", "startups", "Entrepreneur"],
    "real estate": ["realestate", "RealEstateInvesting", "startups"],
}

DEFAULT_SUBREDDITS = ["startups", "Entrepreneur", "marketing", "smallbusiness"]


def _pick_subreddits(industry: str) -> list:
    industry_lower = industry.lower()
    for key, subs in INDUSTRY_SUBREDDITS.items():
        if key in industry_lower:
            return subs
    return DEFAULT_SUBREDDITS


class RedditResearchService:
    def __init__(self):
        self._client = None

    @property
    def client(self):
        if self._client is None and settings.REDDIT_CLIENT_ID and settings.REDDIT_CLIENT_SECRET:
            import praw
            self._client = praw.Reddit(
                client_id=settings.REDDIT_CLIENT_ID,
                client_secret=settings.REDDIT_CLIENT_SECRET,
                user_agent=settings.REDDIT_USER_AGENT,
            )
        return self._client

    def is_available(self) -> bool:
        return bool(settings.REDDIT_CLIENT_ID and settings.REDDIT_CLIENT_SECRET)

    def _search_reddit(self, query: str, subreddits: list, limit: int = 8) -> list:
        """Search across multiple subreddits, return top posts."""
        results = []
        multi = self.client.subreddit("+".join(subreddits))
        for post in multi.search(query, sort="relevance", time_filter="year", limit=limit):
            results.append({
                "title": post.title,
                "subreddit": str(post.subreddit),
                "score": post.score,
                "num_comments": post.num_comments,
                "url": f"https://reddit.com{post.permalink}",
                "selftext": post.selftext[:300] if post.selftext else "",
            })
        return results

    def _top_comments(self, posts: list, max_comments: int = 5) -> list:
        """Pull top comments from the highest-scoring post."""
        if not posts:
            return []
        best_url = posts[0]["url"]
        try:
            submission = self.client.submission(url=best_url)
            submission.comments.replace_more(limit=0)
            comments = []
            for comment in submission.comments[:max_comments]:
                if hasattr(comment, "body") and len(comment.body) > 30:
                    comments.append({
                        "score": comment.score,
                        "text": comment.body[:250],
                    })
            return sorted(comments, key=lambda c: c["score"], reverse=True)
        except Exception:
            return []

    def _summarise(self, posts: list, context: str) -> str:
        if not posts:
            return f"No Reddit discussions found for: {context}"
        lines = [f"Reddit discussions ({context}):"]
        for p in posts[:5]:
            lines.append(
                f'  • r/{p["subreddit"]} | {p["score"]} upvotes | "{p["title"]}"'
            )
            if p["selftext"]:
                lines.append(f'    {p["selftext"][:120]}...')
        return "\n".join(lines)

    def conduct_reddit_research(
        self,
        brand_name: str,
        industry: str,
        competitors: list,
    ) -> dict:
        """
        Runs 3 targeted Reddit searches:
          - brand_discussions: what Reddit says about the brand
          - competitor_sentiment: community opinions on competitors
          - industry_pain_points: problems users vent about in relevant subreddits
        Returns empty dict if credentials not set.
        """
        if not self.is_available():
            logger.info("REDDIT_CLIENT_ID/SECRET not set — skipping Reddit research")
            return {}

        subs = _pick_subreddits(industry)
        competitor_str = " OR ".join(competitors[:3]) if competitors else industry

        queries = {
            "brand_discussions": brand_name,
            "competitor_sentiment": competitor_str,
            "industry_pain_points": f"{industry} problem OR frustration OR wish OR alternative",
        }

        results = {}
        for key, query in queries.items():
            try:
                posts = self._search_reddit(query, subs)
                comments = self._top_comments(posts) if key == "brand_discussions" else []
                results[key] = {
                    "query": query,
                    "posts": posts,
                    "top_comments": comments,
                    "summary": self._summarise(posts, query),
                }
                logger.info(f"Reddit research completed: {key} ({len(posts)} posts)")
            except Exception as e:
                logger.warning(f"Reddit research '{key}' failed: {e}")
                results[key] = {"query": query, "posts": [], "summary": "", "error": str(e)}

        return results


reddit_research_service = RedditResearchService()
