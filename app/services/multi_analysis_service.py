import asyncio
import json
import logging

import google.generativeai as genai
import httpx
from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from app.core.config import settings

logger = logging.getLogger(__name__)


class MultiAnalysisService:
    """
    Runs triple analysis using GPT-4o, Gemini, and Perplexity in parallel.
    Each model analyses the consolidated research independently.
    """

    def __init__(self):
        self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.gpt_model = settings.GPT_MODEL

        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.gemini_model = genai.GenerativeModel(settings.GEMINI_MODEL)

        self.perplexity_api_key = settings.PERPLEXITY_API_KEY
        self.perplexity_base_url = "https://api.perplexity.ai/chat/completions"
        self.perplexity_model = settings.PERPLEXITY_MODEL

    # ------------------------------------------------------------------ #
    # GPT-4o
    # ------------------------------------------------------------------ #
    @retry(
        retry=retry_if_exception_type(Exception),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        stop=stop_after_attempt(3),
        reraise=True,
    )
    async def _gpt4o_analysis(self, questionnaire: dict, research: dict) -> dict:
        brand_name = questionnaire.get("project_metadata", {}).get("brand_name", "Unknown Brand")
        research_summary = json.dumps(research, indent=2)[:6000]  # Guard against oversized payloads

        system_prompt = (
            "You are a world-class Marketing Strategist. "
            "Analyse the research data and propose a creative marketing strategy. "
            "Output must be valid JSON."
        )
        user_content = (
            f"Brand: {brand_name}\n"
            f"Research Data: {research_summary}\n\n"
            "Generate a strategy with:\n"
            '1. "hooks": List of 3 powerful marketing hooks (1 sentence each).\n'
            '2. "angles": List of 2 creative angles (title + description).\n'
            '3. "creative_pivot": Strategic recommendation on differentiation.\n\n'
            "Return ONLY valid JSON."
        )

        try:
            response = self.openai_client.chat.completions.create(
                model=self.gpt_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content},
                ],
                response_format={"type": "json_object"},
                temperature=0.7,
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"GPT-4o Analysis error: {e}")
            raise

    # ------------------------------------------------------------------ #
    # Gemini
    # ------------------------------------------------------------------ #
    @retry(
        retry=retry_if_exception_type(Exception),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        stop=stop_after_attempt(3),
        reraise=True,
    )
    async def _gemini_analysis(self, questionnaire: dict, research: dict) -> dict:
        brand_name = questionnaire.get("project_metadata", {}).get("brand_name", "Unknown Brand")
        research_summary = json.dumps(research, indent=2)[:6000]

        prompt = (
            "You are a world-class Marketing Strategist. Analyse this research data and propose a creative "
            "marketing strategy.\n\n"
            f"Brand: {brand_name}\n"
            f"Research Data: {research_summary}\n\n"
            "Generate a strategy with this JSON structure:\n"
            '{"hooks": ["hook1", "hook2", "hook3"], '
            '"angles": [{"title": "angle1", "description": "..."}], '
            '"creative_pivot": "strategic recommendation"}\n\n'
            "Return ONLY valid JSON, no markdown formatting."
        )

        try:
            response = await self.gemini_model.generate_content_async(prompt)
            clean_text = response.text.replace("```json", "").replace("```", "").strip()
            result = json.loads(clean_text)
            result["source"] = "gemini"
            return result
        except Exception as e:
            logger.error(f"Gemini Analysis error: {e}")
            raise

    # ------------------------------------------------------------------ #
    # Perplexity
    # ------------------------------------------------------------------ #
    @retry(
        retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.TimeoutException, httpx.ConnectError)),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        stop=stop_after_attempt(3),
        reraise=True,
    )
    async def _perplexity_analysis(self, questionnaire: dict, research: dict) -> dict:
        brand_name = questionnaire.get("project_metadata", {}).get("brand_name", "Unknown Brand")
        industry = questionnaire.get("project_metadata", {}).get("industry", "")
        research_summary = json.dumps(research, indent=2)[:1000]

        query = (
            f"As a marketing strategist, analyse the following research data and propose creative marketing "
            f"hooks and angles for {brand_name} in the {industry} industry.\n\n"
            f"Research Summary: {research_summary}...\n\n"
            "Provide 3 marketing hooks and 2 creative angles with descriptions."
        )

        payload = {
            "model": self.perplexity_model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a marketing strategist. Provide analysis in JSON format with hooks, angles, and creative_pivot.",
                },
                {"role": "user", "content": query},
            ],
            "temperature": 0.7,
        }
        headers = {
            "Authorization": f"Bearer {self.perplexity_api_key}",
            "Content-Type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(self.perplexity_base_url, headers=headers, json=payload)
                response.raise_for_status()
                content = response.json()["choices"][0]["message"]["content"]

                try:
                    parsed = json.loads(content)
                    parsed["source"] = "perplexity"
                    return parsed
                except json.JSONDecodeError:
                    # Response was plain text — wrap it into the expected schema
                    return {
                        "hooks": [content[:150]] if content else [],
                        "angles": [],
                        "creative_pivot": content[:300] if content else "",
                        "source": "perplexity",
                    }
        except Exception as e:
            logger.error(f"Perplexity Analysis error: {e}")
            raise

    # ------------------------------------------------------------------ #
    # Orchestrator
    # ------------------------------------------------------------------ #
    async def run_triple_analysis(self, questionnaire: dict, research: dict) -> dict:
        logger.info("Starting Triple Analysis (GPT-4o, Gemini, Perplexity)")

        # Return per-model error dicts rather than crashing the whole pipeline
        async def safe(coro, source: str):
            try:
                return await coro
            except Exception as e:
                logger.error(f"{source} analysis ultimately failed after retries: {e}")
                return {"error": str(e), "source": source, "hooks": [], "angles": [], "creative_pivot": ""}

        gpt4o_result, gemini_result, perplexity_result = await asyncio.gather(
            safe(self._gpt4o_analysis(questionnaire, research), "gpt4o"),
            safe(self._gemini_analysis(questionnaire, research), "gemini"),
            safe(self._perplexity_analysis(questionnaire, research), "perplexity"),
        )

        return {
            "gpt4o_analysis": gpt4o_result,
            "gemini_analysis": gemini_result,
            "perplexity_analysis": perplexity_result,
        }


multi_analysis_service = MultiAnalysisService()
