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
            "You are a world-class Marketing Strategist for major consumer brands. "
            "Your goal is to synthesize raw research data into a winning strategy.\n"
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
        1. "hooks": List of 3 powerful marketing hooks (1 sentence each).
        2. "angles": List of 2 creative angles (title + description).
        3. "creative_pivot": A strategic recommendation on how to stand out from the competitors found in research.
        
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
