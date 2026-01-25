from openai import OpenAI
import json
from app.core.config import settings

class ConsensusService:
    """
    Analyzes outputs from GPT-4o, Gemini, and Perplexity to find consensus and conflicts.
    Generates a final strategy based on model agreement.
    """
    
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = "gpt-4o"  # Using GPT-4o as the 'Judge'
    
    def generate_consensus(self, analysis_results: dict) -> dict:
        """
        Analyzes the outputs from GPT-4o, Gemini, and Perplexity to find consensus and conflicts.
        
        Args:
            analysis_results: Dictionary with keys:
                - "gpt4o_analysis": GPT-4o's strategy proposal
                - "gemini_analysis": Gemini's strategy proposal
                - "perplexity_analysis": Perplexity's strategy proposal
                
        Returns:
            Consensus strategy with:
                - "hooks": Top hooks from all sources (with source labels)
                - "angles": Top angles (prioritizing consensus)
                - "creative_pivot": Synthesized pivot statement
                - "consensus_notes": Where models agreed/disagreed
        """
        print("--- Starting Consensus Generation ---")
        
        gpt4o = analysis_results.get("gpt4o_analysis", {})
        gemini = analysis_results.get("gemini_analysis", {})
        perplexity = analysis_results.get("perplexity_analysis", {})
        
        system_prompt = (
            "You are the Chief Strategy Officer. You have received three strategic proposals from your team.\n"
            "Your job is to synthesize these into a single, FINAL strategy.\n"
            "Identify where they agree (High Confidence) and where they disagree.\n"
            "Pick the best ideas from each source."
        )
        
        user_content = f"""
        # Proposal 1 (GPT-4o):
        {json.dumps(gpt4o, indent=2)}
        
        # Proposal 2 (Gemini):
        {json.dumps(gemini, indent=2)}
        
        # Proposal 3 (Perplexity):
        {json.dumps(perplexity, indent=2)}
        
        # Task
        Create a Final Consensus Strategy JSON with:
        1. "hooks": Select the top 5 hooks from ALL sources. Label each with its source (e.g., "Proposal 1", "Proposal 2").
        2. "angles": Select the top 3 distinct angles. Prioritize angles that appear in multiple proposals.
        3. "creative_pivot": Synthesize a single powerful pivot statement that captures the best insights.
        4. "consensus_notes": A brief text explaining where the models agreed vs. disagreed.
        
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
            return {
                "error": str(e),
                "hooks": [],
                "angles": [],
                "creative_pivot": "Error generating consensus.",
                "consensus_notes": "An error occurred during consensus generation."
            }

consensus_service = ConsensusService()
