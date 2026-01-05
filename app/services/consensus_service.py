import json
from openai import OpenAI
from app.core.config import settings

class ConsensusService:
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = "gpt-4o" # Using GPT-4o as the 'Judge'

    def generate_consensus(self, analysis_results: dict) -> dict:
        """
        Analyzes the outputs from GPT-4o, Gemini, and Perplexity to find consensus and conflicts.
        """
        print("--- Starting Consensus Generation ---")
        
        gpt4o = analysis_results.get("gpt4o_analysis", {})
        gemini = analysis_results.get("gemini_analysis", {})
        perplexity = analysis_results.get("perplexity_analysis", {})
        
        system_prompt = (
            "You are the Chief Strategy Officer. You have received three strategic proposals from your team:\n"
            "1. Creative Director (GPT-4o)\n"
            "2. Brand Strategist (Gemini)\n"
            "3. Market Analyst (Perplexity)\n\n"
            "Your job is to synthesize these into a single, FINAL strategy.\n"
            "Identify where they agree (High Confidence) and where they disagree.\n"
            "Pick the best ideas from each."
        )
        
        user_content = f"""
        # Proposal 1 (Creative Focus):
        {json.dumps(gpt4o, indent=2)}
        
        # Proposal 2 (Brand Focus):
        {json.dumps(gemini, indent=2)}
        
        # Proposal 3 (Market Focus):
        {json.dumps(perplexity, indent=2)}
        
        # Task
        Create a Final Consensus Strategy JSON with:
        1. "hooks": Select the top 5 hooks from all proposals. Label each with its source (e.g., "Hook text" (Source: Creative Director)).
        2. "angles": Select the top 3 distinct angles.
        3. "creative_pivot": Synthesize a single powerful pivot statement.
        4. "visual_concepts": Combine visual directions into 3 cohesive concepts.
        5. "brand_voice": Define the final voice, noting if you had to resolve a conflict.
        6. "campaign_concepts": Create 2 holistic campaign concepts merging the best narrative and market data.
        7. "consensus_notes": A brief text explaining where the models agreed vs. disagreed.
        
        Return ONLY valid JSON.
        """
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content}
                ],
                response_format={"type": "json_object"},
                temperature=0.5
            )
            
            return json.loads(response.choices[0].message.content)
            
        except Exception as e:
            print(f"Consensus Error: {e}")
            return {"error": str(e)}

consensus_service = ConsensusService()


