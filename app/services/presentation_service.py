from openai import OpenAI
import json
from app.core.config import settings

class PresentationService:
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = "gpt-4o"

    def structure_content(self, questionnaire: dict, analysis: dict) -> dict:
        """
        Generates the text content for the slides based on the analysis.
        Returns a JSON object representing the deck structure.
        """
        brand_name = questionnaire.get("project_metadata", {}).get("brand_name", "Brand")
        
        system_prompt = (
            "You are an expert Presentation Designer and Copywriter. "
            "Your task is to take a raw marketing strategy and structure it into a compelling 7-slide pitch deck.\n"
            "Output must be valid JSON matching the specified structure."
        )

        user_content = f"""
        # Context
        Brand: {brand_name}
        Strategy Analysis: {json.dumps(analysis)}
        Original Input: {json.dumps(questionnaire)}

        # Task
        Create content for exactly these 7 slides:
        1. Title Slide (Catchy Title, Subtitle)
        2. The Problem (3 bullet points on customer pain points)
        3. The Solution (3 bullet points on how the product solves it)
        4. Market Context (Competitor weakness vs Our Strength)
        5. The Strategy (The 'Creative Pivot' and approach)
        6. Marketing Hooks (Display the generated hooks)
        7. Next Steps (3 actionable recommendations)

        # JSON Structure
        Return a JSON object with a "slides" key, containing a list of objects.
        Each slide object must have:
        - "type": One of ["title", "content"]
        - "title": string
        - "subtitle": string (optional, for title slide)
        - "content": list of strings (bullet points)
        
        Ensure the copy is punchy, professional, and persuasive.
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
            
            return json.loads(response.choices[0].message.content)

        except Exception as e:
            print(f"Presentation Structuring Error: {e}")
            return {"error": str(e), "slides": []}

    def generate_pptx(self, slides_data: dict, output_path: str) -> str:
        """
        Renders the slide structure into a .pptx file.
        """
        from pptx import Presentation
        from pptx.util import Inches, Pt

        prs = Presentation()

        for slide_info in slides_data.get("slides", []):
            slide_type = slide_info.get("type", "content")
            
            if slide_type == "title":
                # Title Slide Layout (Index 0 usually)
                layout = prs.slide_layouts[0]
                slide = prs.slides.add_slide(layout)
                
                title = slide.shapes.title
                subtitle = slide.placeholders[1]
                
                title.text = slide_info.get("title", "Untitled")
                subtitle.text = slide_info.get("subtitle", "")
                
            else:
                # Title and Content Layout (Index 1 usually)
                layout = prs.slide_layouts[1]
                slide = prs.slides.add_slide(layout)
                
                title = slide.shapes.title
                title.text = slide_info.get("title", "Untitled")
                
                # Add content bullet points
                content = slide_info.get("content", [])
                if content:
                    body_shape = slide.placeholders[1]
                    tf = body_shape.text_frame
                    tf.text = content[0] # First point
                    
                    for point in content[1:]:
                        p = tf.add_paragraph()
                        p.text = point
                        p.level = 0

        try:
            prs.save(output_path)
            return output_path
        except Exception as e:
            print(f"PPTX Generation Error: {e}")
            return None

presentation_service = PresentationService()
