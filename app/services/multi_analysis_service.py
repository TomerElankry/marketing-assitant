import json
import asyncio
from app.core.config import settings
from openai import OpenAI
import google.generativeai as genai
import httpx

class MultiAnalysisService:
    def __init__(self):
        # Initialize clients
        self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.gemini_model = genai.GenerativeModel("gemini-2.0-flash")
        
        self.perplexity_api_key = settings.PERPLEXITY_API_KEY
        self.perplexity_url = "https://api.perplexity.ai/chat/completions"
        self.perplexity_headers = {
            "Authorization": f"Bearer {self.perplexity_api_key}",
            "Content-Type": "application/json"
        }

    async def analyze_with_gpt4o(self, context: str, user_content: str) -> dict:
        """Role: Creative Director - Focus on hooks, narrative, and bold pivots."""
        system_prompt = (
            "You are a visionary Creative Director. Your goal is to find the 'Creative Pivot'. "
            "Focus on emotional triggers, visual storytelling, and distinct brand voice. "
            "Be bold, provocative, and avoid generic marketing jargon."
        )
        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": f"{system_prompt}\nOutput JSON."},
                    {"role": "user", "content": f"{context}\n\n{user_content}"}
                ],
                response_format={"type": "json_object"},
                temperature=0.8
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            return {"error": f"GPT-4o Analysis Failed: {str(e)}"}

    async def analyze_with_gemini(self, context: str, user_content: str) -> dict:
        """Role: Brand Strategist - Focus on positioning, archetypes, and long-term brand health."""
        system_prompt = (
            "You are a senior Brand Strategist. Your goal is to build a sustainable Brand Identity. "
            "Focus on brand archetypes, positioning, and long-term cultural relevance. "
            "Ensure the strategy is consistent and authentic."
        )
        try:
            # Gemini Python SDK is synchronous by default for generate_content, 
            # but usually wrapped or uses async method if available. 
            # We'll use the async method if supported, or run in executor.
            full_prompt = f"{system_prompt}\n\nContext:\n{context}\n\nTask:\n{user_content}\n\nReturn JSON."
            response = await self.gemini_model.generate_content_async(
                full_prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            return json.loads(response.text)
        except Exception as e:
            return {"error": f"Gemini Analysis Failed: {str(e)}"}

    async def analyze_with_perplexity(self, context: str, user_content: str) -> dict:
        """Role: Market Intelligence - Focus on data, competitors, and gaps."""
        system_prompt = (
            "You are a Market Intelligence Expert. Your goal is to find the 'Strategic Gap'. "
            "Focus on competitor weaknesses, market data, and consumer pain points. "
            "Be analytical, factual, and direct."
        )
        payload = {
            "model": "sonar-pro",
            "messages": [
                {"role": "system", "content": f"{system_prompt} Return valid JSON."},
                {"role": "user", "content": f"{context}\n\n{user_content}"}
            ],
            "temperature": 0.2
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(self.perplexity_url, headers=self.perplexity_headers, json=payload)
                response.raise_for_status()
                # Perplexity might return text that includes JSON, so we need to be careful parsing
                content = response.json()["choices"][0]["message"]["content"]
                
                # Attempt to extract JSON if wrapped in code blocks
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0].strip()
                    
                return json.loads(content)
            except Exception as e:
                return {"error": f"Perplexity Analysis Failed: {str(e)}"}

    async def run_triple_analysis(self, questionnaire: any, research: dict) -> dict:
        """
        Runs all three analysis models in parallel.
        """
        # Prepare Context
        if hasattr(questionnaire, "project_metadata"):
            # It's a Pydantic model
            brand_name = questionnaire.project_metadata.brand_name
            product = questionnaire.product_definition
            audience = questionnaire.target_audience
        else:
            # It's a dict
            brand_name = questionnaire.get("project_metadata", {}).get("brand_name", "Unknown Brand")
            product = questionnaire.get("product_definition", {})
            audience = questionnaire.get("target_audience", {})
        
        context_str = f"Brand: {brand_name}\nProduct: {product}\nAudience: {audience}"
        
        task_str = """
        Generate a strategic analysis JSON with:
        1. "hooks": List of 3-5 creative hooks (1 sentence each).
        2. "angles": List of 2 creative angles (title + description).
        3. "creative_pivot": A strategic recommendation.
        4. "visual_concepts": List of 2 visual directions.
        5. "brand_voice": Tone and keywords.
        """
        
        print(f"--- Starting Triple Analysis for {brand_name} ---")
        
        # Run in parallel
        results = await asyncio.gather(
            self.analyze_with_gpt4o(context_str, task_str),
            self.analyze_with_gemini(context_str, task_str),
            self.analyze_with_perplexity(context_str, task_str)
        )
        
        return {
            "gpt4o_analysis": results[0],
            "gemini_analysis": results[1],
            "perplexity_analysis": results[2]
        }

multi_analysis_service = MultiAnalysisService()


