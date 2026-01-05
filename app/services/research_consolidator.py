import json
import google.generativeai as genai
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

genai.configure(api_key=settings.GEMINI_API_KEY)

class ResearchConsolidator:
    def __init__(self):
        self.model_name = "gemini-2.0-flash"
        self.model = genai.GenerativeModel(self.model_name)
        
    async def consolidate_research(self, perplexity_results: dict, gemini_results: dict) -> dict:
        """
        Uses Gemini to intelligently synthesize and merge research from multiple sources.
        """
        print("--- Starting Research Consolidation ---")
        
        # Prepare context
        combined_text = "### Perplexity Research (Deep Web & Social)\n"
        for key, val in perplexity_results.items():
            combined_text += f"\n[Category: {key}]\nQuery: {val.get('query')}\nResult: {val.get('content')}\n"
            
        combined_text += "\n\n### Gemini Research (Creative & Visual)\n"
        for key, val in gemini_results.items():
            combined_text += f"\n[Category: {key}]\nQuery: {val.get('query')}\nResult: {val.get('content')}\n"
            
        # System Prompt
        system_prompt = """
        You are a Research Synthesis Expert. Your task is to merge distinct research streams into a single, comprehensive strategic resource.
        
        Input:
        1. Perplexity Research: Focused on "The Talk" (social sentiment), competitor hooks, and market gaps.
        2. Gemini Research: Focused on visual trends, creative examples, and cultural nuances.
        
        Task:
        1. Synthesize: Merge related findings. If Perplexity notes a gap and Gemini finds a trend filling it, link them.
        2. Deduplicate: Remove repetitive information.
        3. Categorize: Organize the output into the following sections:
           - "market_reality": Competitor analysis, pricing, market share.
           - "consumer_voice": Social sentiment, pain points, "The Talk".
           - "creative_landscape": Visual trends, hooks, ad formats, campaign examples.
           - "strategic_opportunities": Gaps, whitespace, cultural trends.
           
        Output Structure (JSON):
        {
            "market_reality": "...",
            "consumer_voice": "...",
            "creative_landscape": "...",
            "strategic_opportunities": "...",
            "key_contradictions": ["List any points where sources disagreed"],
            "synthesis_confidence": "High/Medium/Low"
        }
        
        Return ONLY valid JSON.
        """
        
        prompt = f"{system_prompt}\n\nResearch Data to Synthesize:\n{combined_text}"
        
        try:
            # Generate synthesis
            response = await self.model.generate_content_async(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            
            # Parse result
            content = response.text
            return json.loads(content)
            
        except Exception as e:
            logger.error(f"Research Consolidation Error: {e}")
            # Fallback: Return raw combination if AI fails
            return {
                "market_reality": "Error in synthesis",
                "consumer_voice": "Error in synthesis",
                "creative_landscape": "Error in synthesis",
                "strategic_opportunities": "Error in synthesis",
                "raw_perplexity": perplexity_results,
                "raw_gemini": gemini_results
            }

research_consolidator = ResearchConsolidator()


