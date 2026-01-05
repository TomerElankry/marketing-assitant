from openai import OpenAI
import json
from app.core.config import settings

class AnalysisService:
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = "gpt-4o"

    def analyze_research(self, questionnaire: dict, research: dict) -> dict:
        """
        Analyzes the questionnaire and research data to generate a marketing strategy.
        """
        # 1. Prepare Context
        brand_name = questionnaire.get("project_metadata", {}).get("brand_name", "Unknown Brand")
        product_info = questionnaire.get("product_definition", {})
        audience = questionnaire.get("target_audience", {})
        goals = questionnaire.get("the_creative_goal", {})

        # 2. Construct System Prompt
        system_prompt = (
            "You are a world-class Creative Director & Brand Strategist. "
            "Your goal is to find the 'Creative Pivot' and synthesize raw research data into a bold, insight-driven strategy. "
            "Focus on emotional triggers, visual storytelling, and distinct brand voice.\n"
            "Output must be valid JSON."
        )

        # 3. Construct User Prompt
        user_content = f"""
        # Client Profile
        Brand: {brand_name}
        Product: {product_info}
        Audience: {audience}
        Goals: {goals}

        # Market Research Data
        {json.dumps(research, indent=2)}

        # Task
        Based on the above, generate a strategy with the following structure:
        1. "hooks": List of 5 distinct creative hooks. Each item should be an object with:
           - "hook": The hook text (1 sentence).
           - "type": One of "Emotional", "Problem-Solution", "Aspirational", "Contrarian".
        2. "angles": List of 3 unique creative angles. Each item should be an object with:
           - "title": Angle title.
           - "description": Description of the angle.
           - "visual_idea": A brief visual concept for this angle.
        3. "creative_pivot": A bold strategic recommendation on how to break the pattern of the current market and stand out.
        4. "visual_concepts": List of 3 visual directions. Each item with:
           - "concept_name": Name of the visual concept.
           - "description": Detailed description.
           - "style_reference": e.g., "Minimalist High-Contrast", "UGC-style Authentic".
        5. "brand_voice": Object defining the recommended brand voice:
           - "tone": String (adjectives).
           - "keywords": List of 3-5 keywords.
           - "guidelines": List of short Dos/Donts.
        6. "campaign_concepts": List of 2 high-level campaign concepts. Each with:
           - "name": Campaign name.
           - "tagline": Campaign tagline.
           - "narrative": Short story/narrative.
        
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
                temperature=0.7
            )
            
            content = response.choices[0].message.content
            return json.loads(content)

        except Exception as e:
            print(f"Analysis Error: {e}")
            return {"error": str(e)}

analysis_service = AnalysisService()
