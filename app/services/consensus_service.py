import json
import logging

from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from app.core.config import settings

logger = logging.getLogger(__name__)


class ConsensusService:
    """
    Synthesises the three independent model proposals into a final strategy.
    Uses Gemini as the judge to avoid GPT-4o self-bias.
    """

    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.GPT_MODEL

    @retry(
        retry=retry_if_exception_type(Exception),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        stop=stop_after_attempt(3),
        reraise=True,
    )
    def generate_consensus(self, analysis_results: dict) -> dict:
        logger.info("Starting Consensus Generation")

        gpt4o = analysis_results.get("gpt4o_analysis", {})
        gemini = analysis_results.get("gemini_analysis", {})
        perplexity = analysis_results.get("perplexity_analysis", {})

        # Validate that we have at least 2 non-error proposals
        valid_sources = [s for s in [gpt4o, gemini, perplexity] if "error" not in s]
        if len(valid_sources) == 0:
            logger.error("All three analysis models failed — cannot generate consensus")
            return {
                "error": "All upstream models failed",
                "hooks": [],
                "angles": [],
                "creative_pivot": "Consensus could not be generated.",
                "consensus_notes": "All three upstream analysis models returned errors.",
            }

        system_prompt = (
            "You are the Chief Strategy Officer. You have received strategic proposals from your team.\n"
            "Your job is to synthesise these into a single FINAL strategy.\n"
            "Identify where they agree (High Confidence) and where they disagree.\n"
            "Pick the best ideas from each source."
        )

        user_content = (
            f"# Proposal 1 (GPT-4o):\n{json.dumps(gpt4o, indent=2)}\n\n"
            f"# Proposal 2 (Gemini):\n{json.dumps(gemini, indent=2)}\n\n"
            f"# Proposal 3 (Perplexity):\n{json.dumps(perplexity, indent=2)}\n\n"
            "# Task\n"
            "Create a Final Consensus Strategy JSON with:\n"
            '1. "hooks": Select the top 5 hooks from ALL sources. Label each with its source.\n'
            '2. "angles": Select the top 3 distinct angles. Prioritise angles appearing in multiple proposals.\n'
            '3. "creative_pivot": Synthesise a single powerful pivot statement.\n'
            '4. "consensus_notes": Brief text explaining where models agreed vs. disagreed.\n\n'
            "Return ONLY valid JSON."
        )

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content},
                ],
                response_format={"type": "json_object"},
                temperature=0.5,
            )
            result = json.loads(response.choices[0].message.content)
            logger.info("Consensus generated successfully")
            return result
        except Exception as e:
            logger.error(f"Consensus error: {e}")
            raise


consensus_service = ConsensusService()
