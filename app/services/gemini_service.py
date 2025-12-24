import json
import google.generativeai as genai
from app.core.config import settings
from app.schemas.questionnaire import QuestionnaireRequest

# Configure API Key (Best practice: Move this to a lifespan event or config init, but global here is fine for MVP)
genai.configure(api_key=settings.GEMINI_API_KEY)

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
