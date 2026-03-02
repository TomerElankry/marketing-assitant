import asyncio
import json
import logging

import google.generativeai as genai
import httpx
from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from app.core.config import settings

logger = logging.getLogger(__name__)


def _format_questionnaire_context(questionnaire: dict) -> str:
    """Formats the full questionnaire into a concise context string for analysis prompts."""
    meta = questionnaire.get("project_metadata", {})
    product = questionnaire.get("product_definition", {})
    audience = questionnaire.get("target_audience", {})
    market = questionnaire.get("market_context", {})
    goal = questionnaire.get("the_creative_goal", {})

    return (
        f"Brand: {meta.get('brand_name', 'Unknown')}\n"
        f"Industry: {meta.get('industry', '')}\n"
        f"Country: {meta.get('target_country', '')}\n"
        f"Product: {product.get('product_description', '')}\n"
        f"Core problem solved: {product.get('core_problem_solved', '')}\n"
        f"USP: {product.get('unique_selling_proposition', '')}\n"
        f"Target demographics: {audience.get('demographics', '')}\n"
        f"Psychographics: {audience.get('psychographics', '')}\n"
        f"Cultural nuances: {audience.get('cultural_nuances', '')}\n"
        f"Competitors: {', '.join(market.get('main_competitors', []))}\n"
        f"Current marketing: {market.get('current_marketing_efforts', 'none')}\n"
        f"Customer objections: {market.get('known_customer_objections', 'none')}\n"
        f"Primary objective: {goal.get('primary_objective', '')}\n"
        f"Desired tone: {goal.get('desired_tone_of_voice', '')}\n"
        f"Channels: {', '.join(goal.get('specific_channels', []))}"
    )


_ANALYSIS_OUTPUT_SCHEMA = (
    "Return a JSON object with:\n"
    '1. "hooks": List of 3 powerful marketing hooks (1 sentence each, specific to the channels and tone above).\n'
    '2. "angles": List of 2 creative angles (title + description).\n'
    '3. "creative_pivot": Strategic recommendation on differentiation.\n'
    '4. "brand_awareness_strategy": An object with:\n'
    '   - "summary": How this brand should build recognition (2-3 sentences)\n'
    '   - "channel_tactics": List of 3 channel-specific brand awareness tactics\n'
    '   - "positioning_recommendation": How to own a clear position vs. competitors\n'
    '   - "quick_wins": List of 3 immediate actions to boost brand visibility\n\n'
    "Return ONLY valid JSON."
)


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
        questionnaire_context = _format_questionnaire_context(questionnaire)
        research_summary = json.dumps(research, indent=2)[:6000]

        system_prompt = (
            "You are a world-class Marketing Strategist. "
            "Analyse the research data and propose a creative marketing strategy tailored to the brand's "
            "specific audience, channels, and objectives. Output must be valid JSON."
        )
        user_content = (
            f"# Brand Context\n{questionnaire_context}\n\n"
            f"# Research Data\n{research_summary}\n\n"
            + _ANALYSIS_OUTPUT_SCHEMA
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
        questionnaire_context = _format_questionnaire_context(questionnaire)
        research_summary = json.dumps(research, indent=2)[:6000]

        prompt = (
            "You are a world-class Marketing Strategist specialising in creative and visual brand building.\n\n"
            f"# Brand Context\n{questionnaire_context}\n\n"
            f"# Research Data\n{research_summary}\n\n"
            + _ANALYSIS_OUTPUT_SCHEMA
            + "\nNo markdown formatting."
        )

        try:
            response = await self.gemini_model.generate_content_async(
                prompt,
                generation_config={"response_mime_type": "application/json"},
            )
            result = json.loads(response.text)
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
        questionnaire_context = _format_questionnaire_context(questionnaire)
        research_summary = json.dumps(research, indent=2)[:6000]  # Fixed: was 1000

        query = (
            "As a data-driven marketing strategist, analyse the following research and propose creative "
            "marketing hooks, angles, and a brand awareness strategy.\n\n"
            f"# Brand Context\n{questionnaire_context}\n\n"
            f"# Research Summary\n{research_summary}\n\n"
            + _ANALYSIS_OUTPUT_SCHEMA
        )

        payload = {
            "model": self.perplexity_model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a marketing strategist. Provide analysis in JSON format.",
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
                    return {
                        "hooks": [content[:150]] if content else [],
                        "angles": [],
                        "creative_pivot": content[:300] if content else "",
                        "brand_awareness_strategy": {},
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

        async def safe(coro, source: str):
            try:
                return await coro
            except Exception as e:
                logger.error(f"{source} analysis ultimately failed after retries: {e}")
                return {
                    "error": str(e),
                    "source": source,
                    "hooks": [],
                    "angles": [],
                    "creative_pivot": "",
                    "brand_awareness_strategy": {},
                }

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
