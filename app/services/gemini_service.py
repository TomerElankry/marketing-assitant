import json
import google.generativeai as genai
from app.core.config import settings
from app.schemas.questionnaire import QuestionnaireRequest

# Configure API Key (Best practice: Move this to a lifespan event or config init, but global here is fine for MVP)
genai.configure(api_key=settings.GEMINI_API_KEY)

def recommend_channels(
    primary_objective: str,
    desired_tone_of_voice: str,
    industry: str,
    demographics: str,
    psychographics: str,
) -> list:
    """
    Uses Gemini to recommend the best marketing channels for a campaign
    based on the objective, tone, and client audience profile.
    Returns a list of channel names (e.g. ["TikTok", "Instagram"]).
    Falls back to sensible defaults on error.
    """
    model = genai.GenerativeModel("gemini-2.0-flash")

    prompt = f"""You are a senior media strategist. Based on the campaign details below,
recommend the 3-5 most effective marketing channels. Return ONLY a raw JSON array of
channel name strings (no markdown, no explanation).

Campaign Objective: {primary_objective}
Tone of Voice: {desired_tone_of_voice}
Industry: {industry}
Target Demographics: {demographics}
Target Psychographics: {psychographics}

Example output: ["TikTok", "Instagram", "YouTube"]"""

    try:
        response = model.generate_content(prompt)
        clean_text = response.text.replace("```json", "").replace("```", "").strip()
        channels = json.loads(clean_text)
        if isinstance(channels, list) and channels:
            return channels
    except Exception as e:
        print(f"Gemini channel recommendation error: {e}")

    # Sensible default fallback
    return ["Instagram", "LinkedIn", "YouTube"]


def validate_questionnaire(data: QuestionnaireRequest) -> dict:
    """
    Sends the questionnaire data to Gemini to validate coherence and depth.
    Returns a dictionary: {"valid": bool, "feedback": list[str]}
    """
    model = genai.GenerativeModel('gemini-2.0-flash') # Updated to available model version

    system_instruction = """
    You are an expert Marketing Strategy Validator. Your role is to Gatekeep the quality of input data.
    Marketing strategies require specific, actionable details. 
    
    Analyze the provided Questionnaire JSON.
    
    Pass Criteria:
    1. Clarity: Can a stranger understand what the product is?
    2. Specificity: Are the goals and audience defined? (e.g., "Everyone" is a bad audience).
    3. Depth: Are the answers more than 1-2 words where detail is needed?
    
    Fail Criteria:
    - Gibberish or placeholder text (e.g., "asdf", "test").
    - Extremely generic answers (e.g., Target Audience: "People").
    - Contradictions (e.g., Product is "Luxury Cars" but Target Audience is "Toddlers").
    
    Return ONLY a raw JSON object (no markdown formatting) with this exact structure:
    {
        "valid": boolean,
        "feedback": ["List of specific, constructive feedback items for the user to fix. If valid, this list can be empty or have a compliment."]
    }
    """
    
    prompt = f"{system_instruction}\n\nInput Data:\n{data.model_dump_json()}"
    
    try:
        response = model.generate_content(prompt)
        
        # Clean potential markdown if Gemini adds it despite instructions
        clean_text = response.text.replace("```json", "").replace("```", "").strip()
        
        return json.loads(clean_text)
    except Exception as e:
        # Fallback in case of API error or JSON parse error
        print(f"Gemini Validation Error: {e}")
        return {
            "valid": False,
            "feedback": ["System error during validation. Please try again later or check your API key."]
        }
