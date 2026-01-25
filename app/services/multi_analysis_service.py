from openai import OpenAI
import json
import google.generativeai as genai
import httpx
import asyncio
from app.core.config import settings

class MultiAnalysisService:
    """
    Runs triple analysis using GPT-4o, Gemini, and Perplexity in parallel.
    Each model analyzes the consolidated research independently.
    """
    
    def __init__(self):
        self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.gpt_model = "gpt-4o"
        
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.gemini_model = genai.GenerativeModel("gemini-2.0-flash")
        
        self.perplexity_api_key = settings.PERPLEXITY_API_KEY
        self.perplexity_base_url = "https://api.perplexity.ai/chat/completions"
        
    async def _gpt4o_analysis(self, questionnaire: dict, research: dict) -> dict:
        """GPT-4o analysis"""
        brand_name = questionnaire.get("project_metadata", {}).get("brand_name", "Unknown Brand")
        
        system_prompt = (
            "You are a world-class Marketing Strategist. "
            "Analyze the research data and propose a creative marketing strategy. "
            "Output must be valid JSON."
        )
        
        user_content = f"""
        Brand: {brand_name}
        Research Data: {json.dumps(research, indent=2)}
        
        Generate a strategy with:
        1. "hooks": List of 3 powerful marketing hooks (1 sentence each).
        2. "angles": List of 2 creative angles (title + description).
        3. "creative_pivot": Strategic recommendation on differentiation.
        
        Return ONLY valid JSON.
        """
        
        try:
            response = self.openai_client.chat.completions.create(
                model=self.gpt_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content}
                ],
                response_format={"type": "json_object"},
                temperature=0.7
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"GPT-4o Analysis Error: {e}")
            return {"error": str(e), "source": "gpt4o"}
    
    async def _gemini_analysis(self, questionnaire: dict, research: dict) -> dict:
        """Gemini analysis"""
        brand_name = questionnaire.get("project_metadata", {}).get("brand_name", "Unknown Brand")
        
        prompt = f"""
        You are a world-class Marketing Strategist. Analyze this research data and propose a creative marketing strategy.
        
        Brand: {brand_name}
        Research Data: {json.dumps(research, indent=2)}
        
        Generate a strategy with this JSON structure:
        {{
            "hooks": ["hook1", "hook2", "hook3"],
            "angles": [{{"title": "angle1", "description": "..."}}, {{"title": "angle2", "description": "..."}}],
            "creative_pivot": "strategic recommendation"
        }}
        
        Return ONLY valid JSON, no markdown formatting.
        """
        
        try:
            response = await self.gemini_model.generate_content_async(prompt)
            clean_text = response.text.replace("```json", "").replace("```", "").strip()
            result = json.loads(clean_text)
            result["source"] = "gemini"
            return result
        except Exception as e:
            print(f"Gemini Analysis Error: {e}")
            return {"error": str(e), "source": "gemini"}
    
    async def _perplexity_analysis(self, questionnaire: dict, research: dict) -> dict:
        """Perplexity analysis"""
        brand_name = questionnaire.get("project_metadata", {}).get("brand_name", "Unknown Brand")
        industry = questionnaire.get("project_metadata", {}).get("industry", "")
        
        query = f"""
        As a marketing strategist, analyze the following research data and propose creative marketing hooks and angles for {brand_name} in the {industry} industry.
        
        Research Summary: {json.dumps(research, indent=2)[:1000]}...
        
        Provide 3 marketing hooks and 2 creative angles with descriptions.
        """
        
        payload = {
            "model": "sonar",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a marketing strategist. Provide analysis in JSON format with hooks, angles, and creative_pivot."
                },
                {
                    "role": "user",
                    "content": query
                }
            ],
            "temperature": 0.7
        }
        
        headers = {
            "Authorization": f"Bearer {self.perplexity_api_key}",
            "Content-Type": "application/json"
        }
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(self.perplexity_base_url, headers=headers, json=payload)
                response.raise_for_status()
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                
                # Try to parse as JSON, fallback to structured response
                try:
                    parsed = json.loads(content)
                    parsed["source"] = "perplexity"
                    return parsed
                except:
                    # If not JSON, structure it
                    return {
                        "hooks": [content[:100] + "..."] if content else [],
                        "angles": [],
                        "creative_pivot": content[:200] if content else "",
                        "source": "perplexity",
                        "raw_response": content
                    }
        except Exception as e:
            print(f"Perplexity Analysis Error: {e}")
            return {"error": str(e), "source": "perplexity"}
    
    async def run_triple_analysis(self, questionnaire: dict, research: dict) -> dict:
        """
        Runs all three analyses in parallel and returns results.
        """
        print("--- Starting Triple Analysis ---")
        
        # Run all three in parallel
        gpt4o_result, gemini_result, perplexity_result = await asyncio.gather(
            self._gpt4o_analysis(questionnaire, research),
            self._gemini_analysis(questionnaire, research),
            self._perplexity_analysis(questionnaire, research)
        )
        
        return {
            "gpt4o_analysis": gpt4o_result,
            "gemini_analysis": gemini_result,
            "perplexity_analysis": perplexity_result
        }

multi_analysis_service = MultiAnalysisService()
