from openai import OpenAI
import json
import os
from pathlib import Path
from app.core.config import settings

class PresentationService:
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = "gpt-4o"
        
        # Design colors matching mockups
        self.colors = {
            'yellow': (255, 193, 7),      # Yellow branding #FFC107
            'yellow_dark': (255, 152, 0),  # Darker yellow
            'red': (244, 67, 54),          # Red for risks #F44336
            'green': (76, 175, 80),        # Green for wins #4CAF50
            'orange': (255, 152, 0),       # Orange for warnings #FF9800
            'dark_gray': (33, 33, 33),     # Dark text #212121
            'light_gray': (158, 158, 158), # Light text #9E9E9E
            'white': (255, 255, 255),      # White background
            'black': (0, 0, 0)             # Black
        }
        
        # Logo path - check for logo file in assets directory
        self.logo_path = None
        base_dir = Path(__file__).parent.parent
        possible_logo_paths = [
            base_dir / "assets" / "yellowHeadLogo.png",  # Actual filename
            base_dir / "assets" / "yellowhead_logo.png",
            base_dir / "assets" / "yellowhead_logo.svg",
            base_dir / "assets" / "logo.png",
            base_dir / "assets" / "logo.svg",
        ]
        for path in possible_logo_paths:
            if path.exists():
                self.logo_path = str(path)
                break

    def structure_content(self, questionnaire: dict, analysis: dict) -> dict:
        """
        Generates the text content for the slides based on the analysis.
        Returns a JSON object representing the deck structure matching the mockup design.
        """
        brand_name = questionnaire.get("project_metadata", {}).get("brand_name", "Brand")
        industry = questionnaire.get("project_metadata", {}).get("industry", "")
        
        system_prompt = (
            "You are an expert Marketing Strategy Presentation Designer. "
            "Your task is to create a comprehensive marketing strategy deck matching the yellowHEAD AI style.\n"
            "Output must be valid JSON matching the specified structure."
        )

        user_content = f"""
        # Context
        Brand: {brand_name}
        Industry: {industry}
        Strategy Analysis: {json.dumps(analysis, indent=2)}
        Original Input: {json.dumps(questionnaire, indent=2)}

        # Task
        Create a comprehensive marketing strategy deck with the following slide structure:
        
        1. **Title Slide** (type: "title")
           - title: Brand name
           - subtitle: "Prepared by yellowHEAD AI"
           - confidential_badge: true

        2. **Brand Health Dashboard** (type: "dashboard")
           - brand_health_score: number (0-100)
           - executive_summary: string
           - summary_tag: string (e.g., "AGGRESSIVE CHALLENGER")
           - key_metrics: [
               {{"name": "D30 Retention", "value": "14.5%", "status": "good", "verified": 92}},
               {{"name": "Target CPA", "value": "$4.50", "status": "good", "verified": 88}},
               {{"name": "Est. LTV", "value": "$12.80", "status": "warning", "verified": 61}}
             ]

        3. **Strategic Overview** (type: "strategic_overview")
           - upcoming_moments: [{{"date": "Oct 31", "event": "Halloween"}}, ...]
           - current_wins: ["Win 1", "Win 2", "Win 3"]
           - critical_risks: ["Risk 1", "Risk 2"]
           - growth_unlocks: ["Unlock 1", "Unlock 2"]

        4. **Critical Strategic Gaps** (type: "gaps")
           - title: "CRITICAL STRATEGIC GAPS"
           - gaps: [
               {{"description": "Gap description 1"}},
               {{"description": "Gap description 2"}},
               {{"description": "Gap description 3"}}
             ]

        5. **Platform Analysis** (type: "platform_analysis")
           - platforms: [
               {{
                 "name": "Discord",
                 "current_usage": "Current usage description",
                 "feedback": "Strategic feedback with red arrow icon"
               }},
               {{
                 "name": "TikTok",
                 "current_usage": "Current usage description",
                 "feedback": "Strategic feedback"
               }},
               {{
                 "name": "X (Twitter)",
                 "current_usage": "Current usage description",
                 "feedback": "Strategic feedback"
               }}
             ]

        6. **Core Strategic Intelligence** (type: "insights")
           - title: "Core Strategic Intelligence"
           - subtitle: "Your Strategy Is Obsolete. These Insights Explain Why."
           - insights: [
               {{
                 "category": "CREATIVE",
                 "impact": "HIGH IMPACT",
                 "title": "Insight title",
                 "description": "Insight description",
                 "directive": "Strategic directive"
               }},
               {{
                 "category": "AUDIENCE",
                 "impact": "CRITICAL IMPACT",
                 "title": "Insight title",
                 "description": "Insight description",
                 "directive": "Strategic directive"
               }},
               {{
                 "category": "MONETIZATION",
                 "impact": "MEDIUM IMPACT",
                 "title": "Insight title",
                 "description": "Insight description",
                 "directive": "Strategic directive"
               }}
             ]

        7. **The Playbook** (type: "playbook")
           - title: "The Playbook"
           - subtitle: "Creative tagline based on brand"
           - acquisition_plays: [
               {{
                 "number": "01",
                 "title": "Play title",
                 "description": "Detailed play description"
               }},
               {{
                 "number": "02",
                 "title": "Play title",
                 "description": "Detailed play description"
               }}
             ]
           - creative_direction: [
               {{
                 "number": "01",
                 "title": "Creative title",
                 "description": "Detailed creative description"
               }},
               {{
                 "number": "02",
                 "title": "Creative title",
                 "description": "Detailed creative description"
               }}
             ]

        8. **Hooks Showcase** (type: "hooks_showcase")
           - title: "Creative Hooks"
           - hooks: [
               {{"hook": "Hook text...", "type": "Emotional"}},
               {{"hook": "Hook text...", "type": "Contrarian"}}
             ]

        9. **Brand Voice & Visuals** (type: "brand_identity")
           - title: "Brand Identity"
           - voice_tone: "Bold and Sassy"
           - voice_keywords: ["Real", "Unfiltered", "Smart"]
           - visual_concepts: [
               {{"name": "Concept Name", "description": "Desc...", "style": "Minimalist"}}
             ]

        10. **Campaign Concepts** (type: "campaign_concepts")
            - title: "Campaign Concepts"
            - campaigns: [
                {{"name": "Campaign A", "tagline": "Tagline...", "narrative": "Story..."}}
              ]

        11. **Consensus Strategy** (type: "consensus")
            - title: "Final Consensus Strategy"
            - pivot: "Strategic pivot description..."
            - notes: "Why this strategy won..."

        # JSON Structure
        Return a JSON object with a "slides" key, containing a list of slide objects.
        Each slide must have a "type" field and type-specific fields as described above.
        
        Ensure the content is strategic, actionable, and matches the yellowHEAD AI style.
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
        Renders the slide structure into a .pptx file with custom styling matching mockups.
        """
        from pptx import Presentation
        from pptx.util import Inches, Pt
        from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
        from pptx.dml.color import RGBColor
        from pptx.enum.shapes import MSO_SHAPE

        prs = Presentation()
        prs.slide_width = Inches(10)
        prs.slide_height = Inches(7.5)

        for slide_info in slides_data.get("slides", []):
            slide_type = slide_info.get("type", "content")
            
            # Create blank slide
            blank_slide_layout = prs.slide_layouts[6]  # Blank layout
            slide = prs.slides.add_slide(blank_slide_layout)
            
            if slide_type == "title":
                self._create_title_slide(slide, slide_info)
            elif slide_type == "dashboard":
                self._create_dashboard_slide(slide, slide_info)
            elif slide_type == "strategic_overview":
                self._create_strategic_overview_slide(slide, slide_info)
            elif slide_type == "gaps":
                self._create_gaps_slide(slide, slide_info)
            elif slide_type == "platform_analysis":
                self._create_platform_analysis_slide(slide, slide_info)
            elif slide_type == "insights":
                self._create_insights_slide(slide, slide_info)
            elif slide_type == "playbook":
                self._create_playbook_slide(slide, slide_info)
            elif slide_type == "hooks_showcase":
                self._create_hooks_showcase_slide(slide, slide_info)
            elif slide_type == "brand_identity":
                self._create_brand_identity_slide(slide, slide_info)
            elif slide_type == "campaign_concepts":
                self._create_campaign_concepts_slide(slide, slide_info)
            elif slide_type == "consensus":
                self._create_consensus_slide(slide, slide_info)
            else:
                self._create_content_slide(slide, slide_info)
            
            # Add yellowHEAD logo to every slide
            self._add_logo_to_slide(slide, slide_type)

        try:
            prs.save(output_path)
            return output_path
        except Exception as e:
            print(f"PPTX Generation Error: {e}")
            import traceback
            traceback.print_exc()
            return None

    def _create_title_slide(self, slide, slide_info):
        """Create title slide with confidential badge"""
        from pptx.util import Inches, Pt
        from pptx.enum.text import PP_ALIGN
        from pptx.dml.color import RGBColor
        from pptx.enum.shapes import MSO_SHAPE
        
        # Confidential badge at top
        badge = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE, Inches(3.5), Inches(0.5), Inches(3), Inches(0.4)
        )
        badge.fill.solid()
        badge.fill.fore_color.rgb = RGBColor(*self.colors['yellow'])
        badge.line.color.rgb = RGBColor(*self.colors['yellow'])
        tf = badge.text_frame
        tf.text = "CONFIDENTIAL STRATEGY DECK"
        tf.paragraphs[0].font.size = Pt(10)
        tf.paragraphs[0].font.bold = True
        tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['black'])
        tf.paragraphs[0].alignment = PP_ALIGN.CENTER
        
        # Main title
        title_box = slide.shapes.add_textbox(Inches(1), Inches(2.5), Inches(8), Inches(1.5))
        tf = title_box.text_frame
        tf.text = slide_info.get("title", "Brand Name")
        tf.paragraphs[0].font.size = Pt(48)
        tf.paragraphs[0].font.bold = True
        tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['dark_gray'])
        tf.paragraphs[0].alignment = PP_ALIGN.CENTER
        
        # Yellow line
        line = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE, Inches(1), Inches(4.2), Inches(8), Inches(0.05)
        )
        line.fill.solid()
        line.fill.fore_color.rgb = RGBColor(*self.colors['yellow'])
        line.line.fill.background()
        
        # Subtitle
        subtitle_box = slide.shapes.add_textbox(Inches(1), Inches(4.5), Inches(8), Inches(0.5))
        tf = subtitle_box.text_frame
        tf.text = slide_info.get("subtitle", "Prepared by yellowHEAD AI")
        tf.paragraphs[0].font.size = Pt(14)
        tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['dark_gray'])
        tf.paragraphs[0].alignment = PP_ALIGN.CENTER

    def _create_dashboard_slide(self, slide, slide_info):
        """Create dashboard slide with brand health score and metrics"""
        from pptx.util import Inches, Pt
        from pptx.enum.text import PP_ALIGN
        from pptx.dml.color import RGBColor
        from pptx.enum.shapes import MSO_SHAPE
        
        # Title
        title_box = slide.shapes.add_textbox(Inches(0.5), Inches(0.3), Inches(9), Inches(0.6))
        tf = title_box.text_frame
        tf.text = "Brand Health Dashboard"
        tf.paragraphs[0].font.size = Pt(32)
        tf.paragraphs[0].font.bold = True
        tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['dark_gray'])
        
        # Brand Health Score Circle (simplified as a rounded rectangle with text)
        score = slide_info.get("brand_health_score", 78)
        score_box = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.5), Inches(1.2), Inches(2.5), Inches(2.5)
        )
        score_box.fill.solid()
        score_box.fill.fore_color.rgb = RGBColor(*self.colors['white'])
        score_box.line.color.rgb = RGBColor(*self.colors['yellow'])
        score_box.line.width = Pt(3)
        tf = score_box.text_frame
        tf.text = f"{score}\nBRAND HEALTH\nSCORE"
        tf.paragraphs[0].font.size = Pt(36)
        tf.paragraphs[0].font.bold = True
        tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['yellow'])
        tf.paragraphs[0].alignment = PP_ALIGN.CENTER
        if len(tf.paragraphs) > 1:
            tf.paragraphs[1].font.size = Pt(10)
            tf.paragraphs[1].font.bold = False
            tf.paragraphs[1].font.color.rgb = RGBColor(*self.colors['dark_gray'])
        
        # Executive Summary
        summary_tag = slide_info.get("summary_tag", "AGGRESSIVE CHALLENGER")
        tag_box = slide.shapes.add_textbox(Inches(3.5), Inches(1.2), Inches(6), Inches(0.4))
        tf = tag_box.text_frame
        tf.text = summary_tag
        tf.paragraphs[0].font.size = Pt(14)
        tf.paragraphs[0].font.bold = True
        tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['dark_gray'])
        
        summary_box = slide.shapes.add_textbox(Inches(3.5), Inches(1.7), Inches(6), Inches(1))
        tf = summary_box.text_frame
        tf.text = slide_info.get("executive_summary", "Executive summary text")
        tf.paragraphs[0].font.size = Pt(11)
        tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['dark_gray'])
        tf.word_wrap = True
        
        # Key Performance Signals
        signals_title = slide.shapes.add_textbox(Inches(0.5), Inches(4), Inches(9), Inches(0.3))
        tf = signals_title.text_frame
        tf.text = "• KEY PERFORMANCE SIGNALS"
        tf.paragraphs[0].font.size = Pt(14)
        tf.paragraphs[0].font.bold = True
        tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['dark_gray'])
        
        # Metrics cards
        metrics = slide_info.get("key_metrics", [])
        x_start = 0.5
        card_width = 2.8
        for i, metric in enumerate(metrics[:3]):
            x_pos = x_start + i * (card_width + 0.2)
            self._create_metric_card(slide, metric, Inches(x_pos), Inches(4.5), Inches(card_width), Inches(2))

    def _create_metric_card(self, slide, metric, left, top, width, height):
        """Create a metric card with value, status, and verification bar"""
        from pptx.util import Inches, Pt
        from pptx.enum.text import PP_ALIGN
        from pptx.dml.color import RGBColor
        from pptx.enum.shapes import MSO_SHAPE
        
        # Card background
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = RGBColor(*self.colors['white'])
        card.line.color.rgb = RGBColor(*self.colors['light_gray'])
        card.line.width = Pt(1)
        
        # Metric name
        name_box = slide.shapes.add_textbox(left + Inches(0.1), top + Inches(0.1), width - Inches(0.2), Inches(0.3))
        tf = name_box.text_frame
        tf.text = metric.get("name", "Metric")
        tf.paragraphs[0].font.size = Pt(10)
        tf.paragraphs[0].font.bold = True
        tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['dark_gray'])
        
        # Metric value
        value_box = slide.shapes.add_textbox(left + Inches(0.1), top + Inches(0.5), width - Inches(0.2), Inches(0.5))
        tf = value_box.text_frame
        tf.text = metric.get("value", "N/A")
        tf.paragraphs[0].font.size = Pt(24)
        tf.paragraphs[0].font.bold = True
        status = metric.get("status", "good")
        color = self.colors['green'] if status == "good" else self.colors['orange']
        tf.paragraphs[0].font.color.rgb = RGBColor(*color)
        
        # Status text
        status_text = metric.get("status_text", "")
        if status_text:
            status_box = slide.shapes.add_textbox(left + Inches(0.1), top + Inches(1.1), width - Inches(0.2), Inches(0.3))
            tf = status_box.text_frame
            tf.text = status_text
            tf.paragraphs[0].font.size = Pt(9)
            tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['light_gray'])
        
        # Verification bar
        verified = metric.get("verified", 0)
        bar_width = (width - Inches(0.2)) * (verified / 100)
        bar_color = self.colors['green'] if verified >= 80 else self.colors['orange']
        bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left + Inches(0.1), top + Inches(1.5), bar_width, Inches(0.15))
        bar.fill.solid()
        bar.fill.fore_color.rgb = RGBColor(*bar_color)
        bar.line.fill.background()
        
        # Verified percentage
        verified_box = slide.shapes.add_textbox(left + Inches(0.1), top + Inches(1.7), width - Inches(0.2), Inches(0.2))
        tf = verified_box.text_frame
        tf.text = f"{verified}% VERIFIED"
        tf.paragraphs[0].font.size = Pt(8)
        tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['light_gray'])

    def _create_strategic_overview_slide(self, slide, slide_info):
        """Create strategic overview with upcoming moments, wins, risks, and growth unlocks"""
        from pptx.util import Inches, Pt
        from pptx.enum.text import PP_ALIGN
        from pptx.dml.color import RGBColor
        from pptx.enum.shapes import MSO_SHAPE
        
        # Left panel (white background)
        left_panel = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.5), Inches(0.5), Inches(4.5), Inches(6.5))
        left_panel.fill.solid()
        left_panel.fill.fore_color.rgb = RGBColor(*self.colors['white'])
        left_panel.line.fill.background()
        
        y_pos = 0.8
        
        # Upcoming Moments
        moments = slide_info.get("upcoming_moments", [])
        if moments:
            # Yellow accent bar
            accent = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.5), Inches(y_pos), Inches(0.1), Inches(0.8))
            accent.fill.solid()
            accent.fill.fore_color.rgb = RGBColor(*self.colors['yellow'])
            accent.line.fill.background()
            
            title_box = slide.shapes.add_textbox(Inches(0.7), Inches(y_pos), Inches(4), Inches(0.3))
            tf = title_box.text_frame
            tf.text = "UPCOMING MOMENTS"
            tf.paragraphs[0].font.size = Pt(12)
            tf.paragraphs[0].font.bold = True
            tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['dark_gray'])
            
            y_pos += 0.4
            for moment in moments:
                moment_box = slide.shapes.add_textbox(Inches(0.7), Inches(y_pos), Inches(4), Inches(0.25))
                tf = moment_box.text_frame
                tf.text = f"{moment.get('date', '')} | {moment.get('event', '')}"
                tf.paragraphs[0].font.size = Pt(10)
                tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['dark_gray'])
                y_pos += 0.3
        
        y_pos += 0.3
        
        # Current Wins
        wins = slide_info.get("current_wins", [])
        if wins:
            title_box = slide.shapes.add_textbox(Inches(0.7), Inches(y_pos), Inches(4), Inches(0.3))
            tf = title_box.text_frame
            tf.text = "CURRENT WINS"
            tf.paragraphs[0].font.size = Pt(12)
            tf.paragraphs[0].font.bold = True
            tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['green'])
            y_pos += 0.4
            
            for win in wins:
                # Green arrow (simplified as text)
                arrow_box = slide.shapes.add_textbox(Inches(0.7), Inches(y_pos), Inches(0.3), Inches(0.25))
                tf = arrow_box.text_frame
                tf.text = "↑"
                tf.paragraphs[0].font.size = Pt(14)
                tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['green'])
                
                win_box = slide.shapes.add_textbox(Inches(1.1), Inches(y_pos), Inches(3.5), Inches(0.5))
                tf = win_box.text_frame
                tf.text = win
                tf.paragraphs[0].font.size = Pt(10)
                tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['dark_gray'])
                tf.word_wrap = True
                y_pos += 0.6
        
        y_pos += 0.3
        
        # Critical Risks
        risks = slide_info.get("critical_risks", [])
        if risks:
            title_box = slide.shapes.add_textbox(Inches(0.7), Inches(y_pos), Inches(4), Inches(0.3))
            tf = title_box.text_frame
            tf.text = "CRITICAL RISKS"
            tf.paragraphs[0].font.size = Pt(12)
            tf.paragraphs[0].font.bold = True
            tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['red'])
            y_pos += 0.4
            
            for risk in risks:
                # Red arrow
                arrow_box = slide.shapes.add_textbox(Inches(0.7), Inches(y_pos), Inches(0.3), Inches(0.25))
                tf = arrow_box.text_frame
                tf.text = "↓"
                tf.paragraphs[0].font.size = Pt(14)
                tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['red'])
                
                risk_box = slide.shapes.add_textbox(Inches(1.1), Inches(y_pos), Inches(3.5), Inches(0.5))
                tf = risk_box.text_frame
                tf.text = risk
                tf.paragraphs[0].font.size = Pt(10)
                tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['dark_gray'])
                tf.word_wrap = True
                y_pos += 0.6
        
        # Right panel (yellow background) - Growth Unlock
        right_panel = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(5.5), Inches(0.5), Inches(4), Inches(6.5))
        right_panel.fill.solid()
        right_panel.fill.fore_color.rgb = RGBColor(*self.colors['yellow'])
        right_panel.line.fill.background()
        
        title_box = slide.shapes.add_textbox(Inches(5.7), Inches(0.8), Inches(3.6), Inches(0.4))
        tf = title_box.text_frame
        tf.text = "Growth Unlock"
        tf.paragraphs[0].font.size = Pt(16)
        tf.paragraphs[0].font.bold = True
        tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['black'])
        
        unlocks = slide_info.get("growth_unlocks", [])
        y_pos = 1.5
        for i, unlock in enumerate(unlocks, 1):
            unlock_box = slide.shapes.add_textbox(Inches(5.7), Inches(y_pos), Inches(3.6), Inches(0.8))
            tf = unlock_box.text_frame
            tf.text = f"{i:02d} {unlock}"
            tf.paragraphs[0].font.size = Pt(11)
            tf.paragraphs[0].font.bold = True
            tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['black'])
            tf.word_wrap = True
            y_pos += 1.0

    def _create_gaps_slide(self, slide, slide_info):
        """Create critical strategic gaps slide"""
        from pptx.util import Inches, Pt
        from pptx.enum.text import PP_ALIGN
        from pptx.dml.color import RGBColor
        from pptx.enum.shapes import MSO_SHAPE
        
        # Title
        title_box = slide.shapes.add_textbox(Inches(0.5), Inches(0.5), Inches(9), Inches(0.6))
        tf = title_box.text_frame
        tf.text = slide_info.get("title", "CRITICAL STRATEGIC GAPS")
        tf.paragraphs[0].font.size = Pt(32)
        tf.paragraphs[0].font.bold = True
        tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['red'])
        
        # Gaps
        gaps = slide_info.get("gaps", [])
        y_pos = 1.5
        for gap in gaps:
            # Red vertical line
            line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.5), Inches(y_pos), Inches(0.1), Inches(1))
            line.fill.solid()
            line.fill.fore_color.rgb = RGBColor(*self.colors['red'])
            line.line.fill.background()
            
            # Gap description
            gap_box = slide.shapes.add_textbox(Inches(0.7), Inches(y_pos), Inches(8.5), Inches(1))
            tf = gap_box.text_frame
            tf.text = gap.get("description", "")
            tf.paragraphs[0].font.size = Pt(12)
            tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['dark_gray'])
            tf.word_wrap = True
            y_pos += 1.3

    def _create_platform_analysis_slide(self, slide, slide_info):
        """Create platform analysis slide with current usage and feedback"""
        from pptx.util import Inches, Pt
        from pptx.enum.text import PP_ALIGN
        from pptx.dml.color import RGBColor
        from pptx.enum.shapes import MSO_SHAPE
        
        # Title
        title_box = slide.shapes.add_textbox(Inches(0.5), Inches(0.3), Inches(9), Inches(0.5))
        tf = title_box.text_frame
        tf.text = "Platform Strategy Analysis"
        tf.paragraphs[0].font.size = Pt(28)
        tf.paragraphs[0].font.bold = True
        tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['dark_gray'])
        
        platforms = slide_info.get("platforms", [])
        y_pos = 1.2
        for platform in platforms:
            # Platform name
            name_box = slide.shapes.add_textbox(Inches(0.5), Inches(y_pos), Inches(9), Inches(0.4))
            tf = name_box.text_frame
            tf.text = platform.get("name", "Platform")
            tf.paragraphs[0].font.size = Pt(18)
            tf.paragraphs[0].font.bold = True
            tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['dark_gray'])
            y_pos += 0.5
            
            # Current usage (italic)
            usage_box = slide.shapes.add_textbox(Inches(0.7), Inches(y_pos), Inches(8.5), Inches(0.4))
            tf = usage_box.text_frame
            tf.text = f'"{platform.get("current_usage", "")}"'
            tf.paragraphs[0].font.size = Pt(10)
            tf.paragraphs[0].font.italic = True
            tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['light_gray'])
            tf.word_wrap = True
            y_pos += 0.5
            
            # Feedback with red arrow
            arrow_box = slide.shapes.add_textbox(Inches(0.7), Inches(y_pos), Inches(0.3), Inches(0.3))
            tf = arrow_box.text_frame
            tf.text = "→"
            tf.paragraphs[0].font.size = Pt(14)
            tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['red'])
            
            feedback_box = slide.shapes.add_textbox(Inches(1.1), Inches(y_pos), Inches(8), Inches(0.8))
            tf = feedback_box.text_frame
            tf.text = platform.get("feedback", "")
            tf.paragraphs[0].font.size = Pt(10)
            tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['dark_gray'])
            tf.word_wrap = True
            y_pos += 1.2

    def _create_insights_slide(self, slide, slide_info):
        """Create insights slide with three insight cards"""
        from pptx.util import Inches, Pt
        from pptx.enum.text import PP_ALIGN
        from pptx.dml.color import RGBColor
        from pptx.enum.shapes import MSO_SHAPE
        
        # Title
        title_box = slide.shapes.add_textbox(Inches(0.5), Inches(0.3), Inches(9), Inches(0.4))
        tf = title_box.text_frame
        tf.text = slide_info.get("title", "Core Strategic Intelligence")
        tf.paragraphs[0].font.size = Pt(28)
        tf.paragraphs[0].font.bold = True
        tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['dark_gray'])
        
        # Subtitle
        subtitle_box = slide.shapes.add_textbox(Inches(0.5), Inches(0.7), Inches(9), Inches(0.3))
        tf = subtitle_box.text_frame
        tf.text = slide_info.get("subtitle", "Your Strategy Is Obsolete. These Insights Explain Why.")
        tf.paragraphs[0].font.size = Pt(12)
        tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['light_gray'])
        
        # Insight cards
        insights = slide_info.get("insights", [])
        card_width = Inches(2.8)
        card_height = Inches(5)
        x_start = 0.5
        spacing = 0.2
        
        for i, insight in enumerate(insights[:3]):
            x_pos = x_start + i * (card_width + Inches(spacing))
            self._create_insight_card(slide, insight, x_pos, Inches(1.2), card_width, card_height)

    def _create_insight_card(self, slide, insight, left, top, width, height):
        """Create an individual insight card"""
        from pptx.util import Inches, Pt
        from pptx.enum.text import PP_ALIGN
        from pptx.dml.color import RGBColor
        from pptx.enum.shapes import MSO_SHAPE
        
        # Card background
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = RGBColor(*self.colors['white'])
        card.line.color.rgb = RGBColor(*self.colors['light_gray'])
        card.line.width = Pt(1)
        
        y_pos = top + Inches(0.2)
        
        # Category badge
        category = insight.get("category", "CATEGORY")
        cat_box = slide.shapes.add_textbox(left + Inches(0.1), y_pos, width - Inches(0.2), Inches(0.25))
        tf = cat_box.text_frame
        tf.text = category
        tf.paragraphs[0].font.size = Pt(9)
        tf.paragraphs[0].font.bold = True
        tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['dark_gray'])
        y_pos += Inches(0.3)
        
        # Impact
        impact = insight.get("impact", "IMPACT")
        impact_box = slide.shapes.add_textbox(left + Inches(0.1), y_pos, width - Inches(0.2), Inches(0.2))
        tf = impact_box.text_frame
        tf.text = impact
        tf.paragraphs[0].font.size = Pt(8)
        tf.paragraphs[0].font.bold = True
        tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['red'])
        y_pos += Inches(0.3)
        
        # Title
        title_box = slide.shapes.add_textbox(left + Inches(0.1), y_pos, width - Inches(0.2), Inches(0.4))
        tf = title_box.text_frame
        tf.text = insight.get("title", "Insight Title")
        tf.paragraphs[0].font.size = Pt(12)
        tf.paragraphs[0].font.bold = True
        tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['dark_gray'])
        tf.word_wrap = True
        y_pos += Inches(0.5)
        
        # Description
        desc_box = slide.shapes.add_textbox(left + Inches(0.1), y_pos, width - Inches(0.2), Inches(1.2))
        tf = desc_box.text_frame
        tf.text = insight.get("description", "")
        tf.paragraphs[0].font.size = Pt(9)
        tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['dark_gray'])
        tf.word_wrap = True
        y_pos += Inches(1.4)
        
        # Strategic Directive
        directive_box = slide.shapes.add_textbox(left + Inches(0.1), y_pos, width - Inches(0.2), Inches(1.5))
        tf = directive_box.text_frame
        tf.text = f"Strategic Directive: {insight.get('directive', '')}"
        tf.paragraphs[0].font.size = Pt(9)
        tf.paragraphs[0].font.bold = True
        tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['dark_gray'])
        tf.word_wrap = True

    def _create_playbook_slide(self, slide, slide_info):
        """Create playbook slide with two columns"""
        from pptx.util import Inches, Pt
        from pptx.enum.text import PP_ALIGN
        from pptx.dml.color import RGBColor
        from pptx.enum.shapes import MSO_SHAPE
        
        # Title
        title_box = slide.shapes.add_textbox(Inches(0.5), Inches(0.3), Inches(9), Inches(0.5))
        tf = title_box.text_frame
        tf.text = slide_info.get("title", "The Playbook")
        tf.paragraphs[0].font.size = Pt(32)
        tf.paragraphs[0].font.bold = True
        tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['dark_gray'])
        tf.paragraphs[0].alignment = PP_ALIGN.CENTER
        
        # Subtitle
        subtitle = slide_info.get("subtitle", "")
        if subtitle:
            subtitle_box = slide.shapes.add_textbox(Inches(0.5), Inches(0.8), Inches(9), Inches(0.3))
            tf = subtitle_box.text_frame
            tf.text = f'"{subtitle}"'
            tf.paragraphs[0].font.size = Pt(12)
            tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['yellow'])
            tf.paragraphs[0].alignment = PP_ALIGN.CENTER
        
        # Left column - Acquisition Plays
        left_title = slide.shapes.add_textbox(Inches(0.5), Inches(1.3), Inches(4.5), Inches(0.4))
        tf = left_title.text_frame
        tf.text = "ACQUISITION PLAYS"
        tf.paragraphs[0].font.size = Pt(14)
        tf.paragraphs[0].font.bold = True
        tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['dark_gray'])
        
        plays = slide_info.get("acquisition_plays", [])
        y_pos = 1.8
        for play in plays:
            play_box = slide.shapes.add_textbox(Inches(0.5), Inches(y_pos), Inches(4.5), Inches(1.2))
            tf = play_box.text_frame
            number = play.get("number", "01")
            title = play.get("title", "")
            desc = play.get("description", "")
            tf.text = f"{number} {title}\n{desc}"
            tf.paragraphs[0].font.size = Pt(11)
            tf.paragraphs[0].font.bold = True
            tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['dark_gray'])
            if len(tf.paragraphs) > 1:
                tf.paragraphs[1].font.size = Pt(9)
                tf.paragraphs[1].font.bold = False
                tf.paragraphs[1].font.color.rgb = RGBColor(*self.colors['dark_gray'])
            tf.word_wrap = True
            y_pos += 1.4
        
        # Right column - Creative Direction
        right_title = slide.shapes.add_textbox(Inches(5.5), Inches(1.3), Inches(4), Inches(0.4))
        tf = right_title.text_frame
        tf.text = "CREATIVE DIRECTION"
        tf.paragraphs[0].font.size = Pt(14)
        tf.paragraphs[0].font.bold = True
        tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['dark_gray'])
        
        creatives = slide_info.get("creative_direction", [])
        y_pos = 1.8
        for creative in creatives:
            creative_box = slide.shapes.add_textbox(Inches(5.5), Inches(y_pos), Inches(4), Inches(1.2))
            tf = creative_box.text_frame
            number = creative.get("number", "01")
            title = creative.get("title", "")
            desc = creative.get("description", "")
            tf.text = f"{number} {title}\n{desc}"
            tf.paragraphs[0].font.size = Pt(11)
            tf.paragraphs[0].font.bold = True
            tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['dark_gray'])
            if len(tf.paragraphs) > 1:
                tf.paragraphs[1].font.size = Pt(9)
                tf.paragraphs[1].font.bold = False
                tf.paragraphs[1].font.color.rgb = RGBColor(*self.colors['dark_gray'])
            tf.word_wrap = True
            y_pos += 1.4

    def _create_content_slide(self, slide, slide_info):
        """Fallback content slide"""
        from pptx.util import Inches, Pt
        from pptx.dml.color import RGBColor
        
        title_box = slide.shapes.add_textbox(Inches(0.5), Inches(0.5), Inches(9), Inches(0.6))
        tf = title_box.text_frame
        tf.text = slide_info.get("title", "Slide Title")
        tf.paragraphs[0].font.size = Pt(32)
        tf.paragraphs[0].font.bold = True
        tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['dark_gray'])
        
        content = slide_info.get("content", [])
        y_pos = 1.5
        for item in content:
            item_box = slide.shapes.add_textbox(Inches(0.7), Inches(y_pos), Inches(8.5), Inches(0.5))
            tf = item_box.text_frame
            tf.text = f"• {item}"
            tf.paragraphs[0].font.size = Pt(12)
            tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['dark_gray'])
            tf.word_wrap = True
            y_pos += 0.7

    def _add_logo_to_slide(self, slide, slide_type="content"):
        """Add yellowHEAD logo to every slide in the top-left corner"""
        from pptx.util import Inches, Pt
        from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
        from pptx.dml.color import RGBColor
        from pptx.enum.shapes import MSO_SHAPE
        
        # Logo position (top-left, matching mockup style)
        logo_left = Inches(0.5)
        logo_top = Inches(0.15)
        logo_width = Inches(1.8)
        logo_height = Inches(0.4)
        
        # Try to add logo image if file exists
        if self.logo_path and os.path.exists(self.logo_path):
            try:
                slide.shapes.add_picture(self.logo_path, logo_left, logo_top, width=logo_width, height=logo_height)
                return
            except Exception as e:
                print(f"Warning: Could not add logo image: {e}. Using text logo instead.")
        
        # Fallback: Create text-based logo representation
        # Logo background (optional, can be removed if you prefer just text)
        logo_bg = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE, logo_left, logo_top, logo_width, logo_height
        )
        logo_bg.fill.solid()
        logo_bg.fill.fore_color.rgb = RGBColor(*self.colors['white'])
        logo_bg.line.fill.background()
        
        # Logo text: "yellowHEAD"
        logo_text = slide.shapes.add_textbox(logo_left + Inches(0.1), logo_top, logo_width - Inches(0.2), logo_height)
        tf = logo_text.text_frame
        tf.text = "yellowHEAD"
        tf.paragraphs[0].font.size = Pt(14)
        tf.paragraphs[0].font.bold = True
        # Style: "yellow" in light gray, "HEAD" in dark gray (matching logo design)
        # Since we can't style parts of text easily, we'll use a compromise
        tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['dark_gray'])
        tf.paragraphs[0].alignment = PP_ALIGN.LEFT
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        
        # Add "| AI Strategy" text next to logo (matching mockup)
        strategy_text = slide.shapes.add_textbox(
            logo_left + logo_width + Inches(0.1), logo_top, Inches(1.5), logo_height
        )
        tf = strategy_text.text_frame
        tf.text = "| AI Strategy"
        tf.paragraphs[0].font.size = Pt(11)
        tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['light_gray'])
        tf.paragraphs[0].alignment = PP_ALIGN.LEFT
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE

    def _create_hooks_showcase_slide(self, slide, slide_info):
        """Create hooks showcase slide"""
        from pptx.util import Inches, Pt
        from pptx.dml.color import RGBColor
        from pptx.enum.shapes import MSO_SHAPE
        
        # Title
        title_box = slide.shapes.add_textbox(Inches(0.5), Inches(0.5), Inches(9), Inches(0.8))
        tf = title_box.text_frame
        tf.text = slide_info.get("title", "Creative Hooks")
        tf.paragraphs[0].font.size = Pt(32)
        tf.paragraphs[0].font.bold = True
        tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['dark_gray'])

        hooks = slide_info.get("hooks", [])
        y_pos = 1.5
        for hook in hooks:
            # Hook Box
            box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.5), Inches(y_pos), Inches(9), Inches(1))
            box.fill.solid()
            box.fill.fore_color.rgb = RGBColor(*self.colors['white'])
            box.line.color.rgb = RGBColor(*self.colors['yellow'])
            
            tf = box.text_frame
            p = tf.paragraphs[0]
            p.text = f"{hook.get('type', 'Hook')}: {hook.get('hook', '')}"
            p.font.size = Pt(14)
            p.font.color.rgb = RGBColor(*self.colors['black'])
            
            y_pos += 1.2

    def _create_brand_identity_slide(self, slide, slide_info):
        """Create brand identity slide"""
        from pptx.util import Inches, Pt
        from pptx.dml.color import RGBColor
        
        # Title
        title_box = slide.shapes.add_textbox(Inches(0.5), Inches(0.5), Inches(9), Inches(0.8))
        tf = title_box.text_frame
        tf.text = slide_info.get("title", "Brand Identity")
        tf.paragraphs[0].font.size = Pt(32)
        tf.paragraphs[0].font.bold = True
        tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['dark_gray'])

        # Tone
        y_pos = 1.5
        tone_box = slide.shapes.add_textbox(Inches(0.5), Inches(y_pos), Inches(9), Inches(0.5))
        tf = tone_box.text_frame
        tf.text = f"Tone: {slide_info.get('voice_tone', '')}"
        tf.paragraphs[0].font.size = Pt(18)
        tf.paragraphs[0].font.bold = True
        tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['dark_gray'])
        y_pos += 0.8

        # Keywords
        keywords = ", ".join(slide_info.get("voice_keywords", []))
        kw_box = slide.shapes.add_textbox(Inches(0.5), Inches(y_pos), Inches(9), Inches(0.5))
        tf = kw_box.text_frame
        tf.text = f"Keywords: {keywords}"
        tf.paragraphs[0].font.size = Pt(16)
        tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['dark_gray'])
        y_pos += 1.0

        # Visual Concepts
        concepts = slide_info.get("visual_concepts", [])
        for concept in concepts:
            c_box = slide.shapes.add_textbox(Inches(0.5), Inches(y_pos), Inches(9), Inches(0.8))
            tf = c_box.text_frame
            tf.text = f"{concept.get('name', '')}: {concept.get('description', '')}"
            tf.paragraphs[0].font.size = Pt(12)
            tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['dark_gray'])
            y_pos += 1.0

    def _create_campaign_concepts_slide(self, slide, slide_info):
        """Create campaign concepts slide"""
        from pptx.util import Inches, Pt
        from pptx.dml.color import RGBColor
        from pptx.enum.shapes import MSO_SHAPE
        
        # Title
        title_box = slide.shapes.add_textbox(Inches(0.5), Inches(0.5), Inches(9), Inches(0.8))
        tf = title_box.text_frame
        tf.text = slide_info.get("title", "Campaign Concepts")
        tf.paragraphs[0].font.size = Pt(32)
        tf.paragraphs[0].font.bold = True
        tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['dark_gray'])

        campaigns = slide_info.get("campaigns", [])
        y_pos = 1.5
        for camp in campaigns:
            # Campaign Box
            box = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.5), Inches(y_pos), Inches(9), Inches(2))
            box.fill.solid()
            box.fill.fore_color.rgb = RGBColor(*self.colors['light_gray'])
            
            tf = box.text_frame
            p = tf.paragraphs[0]
            p.text = camp.get("name", "Campaign")
            p.font.size = Pt(18)
            p.font.bold = True
            p.font.color.rgb = RGBColor(*self.colors['black'])
            
            p2 = tf.add_paragraph()
            p2.text = f"Tagline: {camp.get('tagline', '')}"
            p2.font.size = Pt(14)
            p2.font.italic = True
            p2.font.color.rgb = RGBColor(*self.colors['black'])
            
            p3 = tf.add_paragraph()
            p3.text = camp.get("narrative", "")
            p3.font.size = Pt(12)
            p3.font.color.rgb = RGBColor(*self.colors['black'])
            
            y_pos += 2.2

    def _create_consensus_slide(self, slide, slide_info):
        """Create consensus strategy slide"""
        from pptx.util import Inches, Pt
        from pptx.dml.color import RGBColor
        from pptx.enum.shapes import MSO_SHAPE
        
        # Title
        title_box = slide.shapes.add_textbox(Inches(0.5), Inches(0.5), Inches(9), Inches(0.8))
        tf = title_box.text_frame
        tf.text = slide_info.get("title", "Final Consensus Strategy")
        tf.paragraphs[0].font.size = Pt(32)
        tf.paragraphs[0].font.bold = True
        tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['dark_gray'])

        # Pivot
        pivot_box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.5), Inches(1.5), Inches(9), Inches(2))
        pivot_box.fill.solid()
        pivot_box.fill.fore_color.rgb = RGBColor(*self.colors['yellow'])
        
        tf = pivot_box.text_frame
        p = tf.paragraphs[0]
        p.text = "STRATEGIC PIVOT"
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = RGBColor(*self.colors['black'])
        
        p2 = tf.add_paragraph()
        p2.text = slide_info.get("pivot", "")
        p2.font.size = Pt(20)
        p2.font.bold = True
        p2.font.color.rgb = RGBColor(*self.colors['black'])
        
        # Notes
        notes_box = slide.shapes.add_textbox(Inches(0.5), Inches(3.8), Inches(9), Inches(3))
        tf = notes_box.text_frame
        tf.text = "CONSENSUS NOTES"
        tf.paragraphs[0].font.size = Pt(12)
        tf.paragraphs[0].font.bold = True
        tf.paragraphs[0].font.color.rgb = RGBColor(*self.colors['light_gray'])
        
        p3 = tf.add_paragraph()
        p3.text = slide_info.get("notes", "")
        p3.font.size = Pt(14)
        p3.font.color.rgb = RGBColor(*self.colors['dark_gray'])

presentation_service = PresentationService()
