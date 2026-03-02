import json
import logging

import google.generativeai as genai
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from app.core.config import settings

logger = logging.getLogger(__name__)

genai.configure(api_key=settings.GEMINI_API_KEY)


class ConsensusService:
    """
    Synthesises the three independent model proposals into a final strategy.
    Uses Gemini as the judge to avoid GPT-4o self-bias.
    """

    def __init__(self):
        # Gemini as judge — avoids GPT-4o grading its own output
        self.model = genai.GenerativeModel(
            settings.GEMINI_MODEL,
            system_instruction=(
                "You are the Chief Strategy Officer. You have received strategic proposals from your team. "
                "Your job is to synthesise these into a single FINAL strategy. "
                "Identify where they agree (High Confidence) and where they disagree. "
                "Pick the best ideas from each source. Output must be valid JSON only."
            ),
        )

    @retry(
        retry=retry_if_exception_type(Exception),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        stop=stop_after_attempt(3),
        reraise=True,
    )
    def generate_consensus(self, analysis_results: dict) -> dict:
        logger.info("Starting Consensus Generation (Gemini judge)")

        gpt4o = analysis_results.get("gpt4o_analysis", {})
        gemini = analysis_results.get("gemini_analysis", {})
        perplexity = analysis_results.get("perplexity_analysis", {})

        valid_sources = [s for s in [gpt4o, gemini, perplexity] if "error" not in s]
        if len(valid_sources) == 0:
            logger.error("All three analysis models failed — cannot generate consensus")
            return {
                "error": "All upstream models failed",
                "hooks": [],
                "angles": [],
                "creative_pivot": "Consensus could not be generated.",
                "brand_awareness_strategy": {},
                "consensus_notes": "All three upstream analysis models returned errors.",
            }

        user_content = (
            f"# Proposal 1 (GPT-4o):\n{json.dumps(gpt4o, indent=2)}\n\n"
            f"# Proposal 2 (Gemini):\n{json.dumps(gemini, indent=2)}\n\n"
            f"# Proposal 3 (Perplexity):\n{json.dumps(perplexity, indent=2)}\n\n"
            "# Task\n"
            "Create a Final Consensus Strategy JSON with:\n"
            '1. "hooks": Select the top 5 hooks from ALL sources. Label each with its source.\n'
            '2. "angles": Select the top 3 distinct angles. Prioritise angles appearing in multiple proposals.\n'
            '3. "creative_pivot": Synthesise a single powerful pivot statement.\n'
            '4. "brand_awareness_strategy": An object with:\n'
            '   - "summary": How to build brand recognition (2-3 sentences)\n'
            '   - "channel_tactics": List of 3-4 channel-specific awareness tactics (each a string mentioning the channel)\n'
            '   - "positioning_recommendation": How to differentiate vs. competitors (1-2 sentences)\n'
            '   - "quick_wins": List of 3 immediate actions to boost brand visibility\n'
            '5. "consensus_notes": Brief text explaining where models agreed vs. disagreed.\n\n'
            "Return ONLY valid JSON. No markdown."
        )

        try:
            response = self.model.generate_content(
                user_content,
                generation_config={"response_mime_type": "application/json", "temperature": 0.5},
            )
            result = json.loads(response.text)
            logger.info("Consensus generated successfully")
            return result
        except Exception as e:
            logger.error(f"Consensus error: {e}")
            raise


consensus_service = ConsensusService()
