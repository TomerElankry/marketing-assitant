"""
brand_audit_service.py

Fetches the brand's website and uses Gemini to extract current brand positioning,
messaging, and tone. This grounds the AI analysis in what the brand already communicates
rather than working blind.
"""
import json
import logging
import re

import google.generativeai as genai
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

genai.configure(api_key=settings.GEMINI_API_KEY)

_HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; MarketingAI-Auditor/1.0)",
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "en-US,en;q=0.9",
}


def _strip_html(html: str) -> str:
    """Strip scripts, styles, and HTML tags. Returns up to 4 000 chars of readable text."""
    text = re.sub(r"<script[^>]*>.*?</script>", " ", html, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"<style[^>]*>.*?</style>", " ", text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text[:4000]


class BrandAuditService:
    def __init__(self):
        self.model = genai.GenerativeModel(settings.GEMINI_MODEL)

    async def audit_brand_website(self, website_url: str, brand_name: str) -> dict:
        """
        Fetches the brand homepage and uses Gemini to extract brand positioning signals.

        Returns an empty dict on any failure so the workflow degrades gracefully.
        """
        logger.info(f"Starting brand audit for {brand_name} ({website_url})")

        # 1. Fetch homepage
        try:
            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
                response = await client.get(str(website_url), headers=_HEADERS)
                response.raise_for_status()
                raw_text = _strip_html(response.text)
        except Exception as e:
            logger.warning(f"Brand audit fetch failed for {website_url}: {e} — skipping")
            return {}

        if not raw_text.strip():
            logger.warning(f"Brand audit: no readable text extracted from {website_url}")
            return {}

        # 2. Extract brand positioning with Gemini
        prompt = (
            f"You are a senior brand strategist auditing the homepage of '{brand_name}'.\n"
            f"Read the following website text and extract the brand's current positioning:\n\n"
            f"--- WEBSITE TEXT ---\n{raw_text}\n--- END ---\n\n"
            "Return a JSON object with these keys:\n"
            '- "headline": The main hero headline or primary message (1-2 sentences)\n'
            '- "tagline": The brand tagline or slogan if present, otherwise null\n'
            '- "positioning_statement": What the brand claims to stand for (1-2 sentences)\n'
            '- "tone_of_voice": The brand\'s current tone (e.g., professional, playful, bold, minimal)\n'
            '- "key_claims": Array of up to 4 main value propositions or benefit claims\n'
            '- "gaps": Brief assessment of what is missing, unclear, or inconsistent in the messaging\n'
            '- "brand_maturity": One of: "early-stage", "established", "mature"\n\n'
            "Return ONLY valid JSON. No markdown."
        )

        try:
            response = await self.model.generate_content_async(
                prompt,
                generation_config={"response_mime_type": "application/json"},
            )
            result = json.loads(response.text)
            result["source_url"] = str(website_url)
            logger.info(f"Brand audit completed for {brand_name}: tone={result.get('tone_of_voice')}")
            return result
        except Exception as e:
            logger.warning(f"Brand audit Gemini extraction failed for {brand_name}: {e}")
            return {}


brand_audit_service = BrandAuditService()
