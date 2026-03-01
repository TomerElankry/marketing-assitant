"""
presentation_service.py

Generates a dynamically-themed 7-slide PPTX from a marketing strategy.
Visual design is derived from the questionnaire (industry → palette, tone → modifiers).

python-pptx 1.0.2: solid fills only (no native gradients).
Canvas: 10" × 5.625" widescreen (9,144,000 × 5,143,500 EMU).
"""

import json
import logging

from openai import OpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)

# Slide canvas dimensions in EMU
SLIDE_W = 9_144_000
SLIDE_H = 5_143_500


class PresentationService:
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.GPT_MODEL

    # =========================================================================
    # PUBLIC: structure_content — UNCHANGED
    # =========================================================================
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
                    {"role": "user", "content": user_content},
                ],
                response_format={"type": "json_object"},
                temperature=0.7,
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"Presentation structuring error: {e}")
            return {"error": str(e), "slides": []}

    # =========================================================================
    # PUBLIC: generate_pptx
    # =========================================================================
    def generate_pptx(
        self,
        slides_data: dict,
        output_path: str,
        questionnaire: dict = None,
    ) -> str:
        """
        Renders a fully-themed PPTX from the slide structure JSON.

        Args:
            slides_data:   Output of structure_content() — {"slides": [...]}
            output_path:   Absolute path for the .pptx file
            questionnaire: Raw questionnaire dict (model_dump output).
                           Drives the visual theme. Safe to omit.

        Returns:
            output_path on success, None on failure.
        """
        from pptx import Presentation
        from pptx.util import Emu

        try:
            theme = self._derive_theme(questionnaire or {})

            prs = Presentation()
            prs.slide_width = Emu(SLIDE_W)
            prs.slide_height = Emu(SLIDE_H)

            # Blank layout — index 6 in the default master; fall back to 0.
            blank_layout = (
                prs.slide_layouts[6]
                if len(prs.slide_layouts) > 6
                else prs.slide_layouts[0]
            )

            slides = slides_data.get("slides", [])
            for idx, slide_info in enumerate(slides):
                slide = prs.slides.add_slide(blank_layout)
                slide_type = slide_info.get("type", "content")

                if slide_type == "title":
                    self._build_slide_title(slide, slide_info, theme)
                elif idx == 5:
                    # Slide 6 (0-based 5) = Marketing Hooks
                    self._build_slide_hooks(slide, slide_info, theme)
                elif idx == 6:
                    # Slide 7 (0-based 6) = Next Steps + channel pills
                    self._build_slide_next_steps(slide, slide_info, theme)
                else:
                    self._build_slide_content(slide, slide_info, theme, idx)

            prs.save(output_path)
            logger.info(f"PPTX saved to {output_path}")
            return output_path

        except Exception as e:
            logger.error(f"PPTX generation error: {e}")
            return None

    # =========================================================================
    # PRIVATE: _derive_theme
    # =========================================================================
    def _derive_theme(self, questionnaire: dict) -> dict:
        """
        Maps questionnaire fields → complete visual theme palette.

        Reads:
          project_metadata.industry            → base color palette
          the_creative_goal.desired_tone_of_voice → style modifiers
          project_metadata.brand_name, website_url, target_country
          the_creative_goal.specific_channels

        Returns a dict with RGBColor objects and metadata strings.
        """
        from pptx.dml.color import RGBColor

        # ── 1. Extract fields safely ─────────────────────────────────────────
        meta     = questionnaire.get("project_metadata", {}) or {}
        creative = questionnaire.get("the_creative_goal", {}) or {}

        industry_raw = (meta.get("industry", "") or "").lower()
        tone_raw     = (creative.get("desired_tone_of_voice", "") or "").lower()
        brand_name   = (meta.get("brand_name", "Brand") or "Brand").strip()
        website_url  = str(meta.get("website_url", "") or "")
        country      = (meta.get("target_country", "") or "").strip()
        channels     = creative.get("specific_channels", []) or []

        # ── 2. Industry → base palette (primary, secondary, accent, bg) ──────
        # Each tuple: (primary_hex, secondary_hex, accent_hex, bg_hex)
        PALETTES = {
            "tech":          ("3b82f6", "6366f1", "06b6d4", "0f172a"),
            "saas":          ("3b82f6", "6366f1", "06b6d4", "0f172a"),
            "software":      ("3b82f6", "6366f1", "06b6d4", "0f172a"),
            "startup":       ("6366f1", "8b5cf6", "22d3ee", "0f172a"),
            "ai":            ("6366f1", "8b5cf6", "22d3ee", "0f172a"),
            "wellness":      ("10b981", "14b8a6", "84cc16", "f0fdf4"),
            "health":        ("10b981", "14b8a6", "84cc16", "f0fdf4"),
            "fitness":       ("10b981", "14b8a6", "a3e635", "f0fdf4"),
            "beauty":        ("a855f7", "ec4899", "f59e0b", "1a0a2e"),
            "fashion":       ("a855f7", "ec4899", "f59e0b", "1a0a2e"),
            "luxury":        ("a855f7", "c084fc", "f59e0b", "0d0014"),
            "finance":       ("1e40af", "0ea5e9", "f59e0b", "f8fafc"),
            "fintech":       ("1e40af", "0ea5e9", "f59e0b", "f8fafc"),
            "banking":       ("1e40af", "0369a1", "f59e0b", "f8fafc"),
            "b2b":           ("1e40af", "0ea5e9", "d97706", "f8fafc"),
            "consulting":    ("1e40af", "0ea5e9", "d97706", "f8fafc"),
            "food":          ("f97316", "ef4444", "fbbf24", "fff7ed"),
            "restaurant":    ("f97316", "ef4444", "fbbf24", "fff7ed"),
            "cpg":           ("f97316", "ef4444", "fbbf24", "fff7ed"),
            "beverage":      ("f97316", "dc2626", "fbbf24", "fff7ed"),
            "consumer goods":("f97316", "ef4444", "fbbf24", "fff7ed"),
            "sustainability":("10b981", "059669", "84cc16", "f0fdf4"),
            "education":     ("0284c7", "0ea5e9", "f59e0b", "eff6ff"),
            "elearning":     ("0284c7", "0ea5e9", "f59e0b", "eff6ff"),
            "real estate":   ("059669", "10b981", "f59e0b", "f0fdf4"),
            "travel":        ("0891b2", "06b6d4", "f59e0b", "ecfeff"),
            "hospitality":   ("0891b2", "06b6d4", "f59e0b", "ecfeff"),
            "media":         ("7c3aed", "8b5cf6", "f43f5e", "0f0720"),
            "entertainment": ("7c3aed", "8b5cf6", "f43f5e", "0f0720"),
            "gaming":        ("7c3aed", "8b5cf6", "22d3ee", "0f0720"),
            "retail":        ("e11d48", "f43f5e", "f59e0b", "fff1f2"),
            "ecommerce":     ("e11d48", "f43f5e", "f59e0b", "fff1f2"),
        }
        DEFAULT = ("3b82f6", "8b5cf6", "06b6d4", "0f172a")

        palette = DEFAULT
        for keyword, pal in PALETTES.items():
            if keyword in industry_raw:
                palette = pal
                break

        primary_hex, secondary_hex, accent_hex, bg_hex = palette

        # ── 3. Tone → style modifiers ────────────────────────────────────────
        tone_tokens = set(t.strip() for t in tone_raw.replace(",", " ").split())

        force_dark    = bool(tone_tokens & {"bold", "innovative", "edgy", "premium", "luxury", "dramatic"})
        force_light   = bool(tone_tokens & {"professional", "trustworthy", "clean", "minimal", "corporate"})
        force_gold    = bool(tone_tokens & {"premium", "luxury", "elegant", "exclusive"})
        force_vibrant = bool(tone_tokens & {"playful", "fun", "energetic", "youthful", "vibrant"})

        # Light bg = starts with 'f' or 'e' (high hex value = bright)
        is_light_bg = bg_hex[0] in ("f", "e")

        if force_dark and is_light_bg:
            bg_hex = "0f172a"
            is_light_bg = False
        if force_light and not is_light_bg:
            bg_hex = "f8fafc"
            is_light_bg = True
        if force_gold:
            accent_hex = "f59e0b"
        if force_vibrant:
            accent_hex = secondary_hex   # secondary is usually more saturated

        # ── 4. Text colours ──────────────────────────────────────────────────
        text_light = "f1f5f9"
        text_dark  = "0f172a"
        muted      = "94a3b8" if not is_light_bg else "64748b"
        text_main  = text_dark if is_light_bg else text_light

        # ── 5. Build RGBColor helper ─────────────────────────────────────────
        def h(hex_str: str) -> RGBColor:
            s = hex_str.lstrip("#")
            return RGBColor(int(s[0:2], 16), int(s[2:4], 16), int(s[4:6], 16))

        return {
            "primary":        h(primary_hex),
            "secondary":      h(secondary_hex),
            "accent":         h(accent_hex),
            "bg":             h(bg_hex),
            "text_main":      h(text_main),
            "text_light":     h(text_light),
            "text_dark":      h(text_dark),
            "muted":          h(muted),
            "dark_theme":     not is_light_bg,
            "brand_name":     brand_name,
            "website_url":    website_url,
            "target_country": country,
            "channels":       channels,
        }

    # =========================================================================
    # PRIVATE: low-level drawing utilities
    # =========================================================================

    def _set_background(self, slide, color) -> None:
        """Set the slide background to a solid colour."""
        fill = slide.background.fill
        fill.solid()
        fill.fore_color.rgb = color

    def _add_rect(self, slide, left, top, width, height, fill_color) -> object:
        """
        Add a coloured rectangle with no border.
        All dimensions in EMU (integers).
        """
        from pptx.util import Emu

        shape = slide.shapes.add_shape(
            1,  # MSO_AUTO_SHAPE_TYPE.RECTANGLE
            Emu(int(left)), Emu(int(top)),
            Emu(int(width)), Emu(int(height)),
        )
        shape.fill.solid()
        shape.fill.fore_color.rgb = fill_color
        shape.line.fill.background()   # no border
        return shape

    def _add_textbox(
        self,
        slide,
        left, top, width, height,
        text: str,
        font_size: float,
        font_color,
        bold: bool = False,
        italic: bool = False,
        word_wrap: bool = True,
    ):
        """
        Add a text box with a single paragraph and run.
        All dimensions in EMU. Returns the text frame.
        """
        from pptx.util import Emu, Pt

        txBox = slide.shapes.add_textbox(
            Emu(int(left)), Emu(int(top)),
            Emu(int(width)), Emu(int(height)),
        )
        tf = txBox.text_frame
        tf.word_wrap = word_wrap

        p = tf.paragraphs[0]
        run = p.add_run()
        run.text = str(text) if text else ""
        run.font.size = Pt(font_size)
        run.font.color.rgb = font_color
        run.font.bold = bold
        run.font.italic = italic
        return tf

    def _add_footer(self, slide, theme, right_text: str = "") -> None:
        """Brand-name watermark bottom-left; optional right label."""
        footer_top = int(SLIDE_H * 0.93)
        footer_h   = int(SLIDE_H * 0.07)
        margin     = int(SLIDE_W * 0.02)

        self._add_textbox(
            slide,
            left=margin, top=footer_top,
            width=int(SLIDE_W * 0.40), height=footer_h,
            text=theme["brand_name"],
            font_size=9, font_color=theme["muted"],
        )
        if right_text:
            self._add_textbox(
                slide,
                left=int(SLIDE_W * 0.58), top=footer_top,
                width=int(SLIDE_W * 0.40), height=footer_h,
                text=right_text,
                font_size=9, font_color=theme["muted"],
            )

    # =========================================================================
    # PRIVATE: slide builders
    # =========================================================================

    def _build_slide_title(self, slide, slide_info: dict, theme: dict) -> None:
        """
        Title slide:
          - Full bg background
          - Left accent sidebar (20% width)  + secondary inner stripe
          - Brand name (accent, 14pt bold uppercase)
          - Horizontal rule (primary)
          - Main title (text_main, 36pt bold)
          - Subtitle (muted, 20pt)
          - Website URL (muted, 10pt, bottom)
        """
        self._set_background(slide, theme["bg"])

        sidebar_w = int(SLIDE_W * 0.20)
        stripe_w  = int(sidebar_w * 0.12)

        # Accent sidebar
        self._add_rect(slide, 0, 0, sidebar_w, SLIDE_H, theme["accent"])
        # Secondary inner stripe on the right edge of the sidebar
        self._add_rect(slide, sidebar_w - stripe_w, 0, stripe_w, SLIDE_H, theme["primary"])

        content_left = int(SLIDE_W * 0.23)
        content_w    = int(SLIDE_W * 0.73)

        # Brand name
        self._add_textbox(
            slide,
            left=content_left, top=int(SLIDE_H * 0.08),
            width=content_w, height=int(SLIDE_H * 0.12),
            text=theme["brand_name"].upper(),
            font_size=14, font_color=theme["accent"], bold=True,
        )

        # Horizontal rule
        self._add_rect(
            slide,
            left=content_left, top=int(SLIDE_H * 0.21),
            width=int(SLIDE_W * 0.50), height=int(SLIDE_H * 0.008),
            fill_color=theme["primary"],
        )

        # Main title
        self._add_textbox(
            slide,
            left=content_left, top=int(SLIDE_H * 0.28),
            width=content_w, height=int(SLIDE_H * 0.30),
            text=slide_info.get("title", ""),
            font_size=36, font_color=theme["text_main"], bold=True,
        )

        # Subtitle
        subtitle = slide_info.get("subtitle", "")
        if subtitle:
            self._add_textbox(
                slide,
                left=content_left, top=int(SLIDE_H * 0.60),
                width=content_w, height=int(SLIDE_H * 0.20),
                text=subtitle,
                font_size=20, font_color=theme["muted"],
            )

        # Website URL
        if theme["website_url"]:
            self._add_textbox(
                slide,
                left=content_left, top=int(SLIDE_H * 0.87),
                width=content_w, height=int(SLIDE_H * 0.08),
                text=theme["website_url"],
                font_size=10, font_color=theme["muted"],
            )

    def _build_slide_content(self, slide, slide_info: dict, theme: dict, idx: int) -> None:
        """
        Standard content slide:
          - Full bg background
          - Full-width accent stripe at top + thinner primary line below
          - Slide title (primary, 28pt bold)
          - Accent rule under title
          - Bullet points: accent pip square + 16pt text_main text
          - Footer watermark
        """
        self._set_background(slide, theme["bg"])

        stripe_h = int(SLIDE_H * 0.013)
        self._add_rect(slide, 0, 0, SLIDE_W, stripe_h, theme["accent"])
        self._add_rect(slide, 0, stripe_h, SLIDE_W, int(stripe_h * 0.4), theme["primary"])

        margin = int(SLIDE_W * 0.06)
        content_w = int(SLIDE_W * 0.88)

        # Slide title
        self._add_textbox(
            slide,
            left=margin, top=int(SLIDE_H * 0.09),
            width=content_w, height=int(SLIDE_H * 0.14),
            text=slide_info.get("title", ""),
            font_size=28, font_color=theme["primary"], bold=True,
        )

        # Rule under title
        self._add_rect(
            slide,
            left=margin, top=int(SLIDE_H * 0.245),
            width=int(SLIDE_W * 0.55), height=int(SLIDE_H * 0.005),
            fill_color=theme["accent"],
        )

        # Bullet points
        bullets = slide_info.get("content", [])
        bullet_top = int(SLIDE_H * 0.31)
        row_h      = int(SLIDE_H * 0.165)
        pip_size   = int(SLIDE_H * 0.022)
        pip_gap    = int(SLIDE_W * 0.022)
        text_left  = margin + pip_size + pip_gap
        text_w     = content_w - pip_size - pip_gap

        for i, bullet in enumerate(bullets[:4]):
            row_top  = bullet_top + i * row_h
            pip_top  = row_top + int((row_h - pip_size) / 2)

            # Accent pip
            self._add_rect(slide, margin, pip_top, pip_size, pip_size, theme["accent"])

            # Bullet text
            self._add_textbox(
                slide,
                left=text_left, top=row_top,
                width=text_w, height=row_h,
                text=bullet,
                font_size=16, font_color=theme["text_main"],
            )

        self._add_footer(slide, theme, theme.get("target_country", ""))

    def _build_slide_hooks(self, slide, slide_info: dict, theme: dict) -> None:
        """
        Marketing Hooks slide:
          - Same top stripe as content slides
          - Slide title
          - Each hook in a primary/secondary alternating callout box
            with a left accent-color edge stripe and white bold text
        """
        self._set_background(slide, theme["bg"])

        stripe_h = int(SLIDE_H * 0.013)
        self._add_rect(slide, 0, 0, SLIDE_W, stripe_h, theme["accent"])
        self._add_rect(slide, 0, stripe_h, SLIDE_W, int(stripe_h * 0.4), theme["primary"])

        margin    = int(SLIDE_W * 0.06)
        content_w = int(SLIDE_W * 0.88)

        # Slide title
        self._add_textbox(
            slide,
            left=margin, top=int(SLIDE_H * 0.09),
            width=content_w, height=int(SLIDE_H * 0.14),
            text=slide_info.get("title", "Marketing Hooks"),
            font_size=28, font_color=theme["primary"], bold=True,
        )

        # Rule
        self._add_rect(
            slide,
            left=margin, top=int(SLIDE_H * 0.245),
            width=int(SLIDE_W * 0.55), height=int(SLIDE_H * 0.005),
            fill_color=theme["accent"],
        )

        # Hook callout boxes
        hooks = slide_info.get("content", [])
        max_hooks   = min(len(hooks), 5)
        if max_hooks == 0:
            self._add_footer(slide, theme)
            return

        gap       = int(SLIDE_H * 0.018)
        available = int(SLIDE_H * 0.62)
        box_h     = int((available - gap * (max_hooks - 1)) / max_hooks)
        box_top_0 = int(SLIDE_H * 0.30)

        for i, hook in enumerate(hooks[:max_hooks]):
            box_top   = box_top_0 + i * (box_h + gap)
            box_color = theme["primary"] if i % 2 == 0 else theme["secondary"]

            # Box background
            self._add_rect(slide, margin, box_top, content_w, box_h, box_color)

            # Left accent edge stripe on the box
            edge_w = int(SLIDE_W * 0.008)
            self._add_rect(slide, margin, box_top, edge_w, box_h, theme["accent"])

            # Hook text (always light text inside the dark box)
            text_pad = int(SLIDE_W * 0.02)
            self._add_textbox(
                slide,
                left=margin + edge_w + text_pad,
                top=box_top + int(box_h * 0.12),
                width=content_w - edge_w - text_pad,
                height=int(box_h * 0.76),
                text=hook,
                font_size=13, font_color=theme["text_light"], bold=True,
            )

        self._add_footer(slide, theme, theme.get("target_country", ""))

    def _build_slide_next_steps(self, slide, slide_info: dict, theme: dict) -> None:
        """
        Next Steps slide — standard content layout + channel pills at the bottom.
        """
        # Reuse the standard content builder for the main layout
        self._build_slide_content(slide, slide_info, theme, idx=6)

        channels = theme.get("channels", [])
        if not channels:
            return

        # Channel pills row
        pill_top  = int(SLIDE_H * 0.84)
        pill_h    = int(SLIDE_H * 0.07)
        pill_gap  = int(SLIDE_W * 0.013)
        pill_w    = int(SLIDE_W * 0.125)
        margin    = int(SLIDE_W * 0.06)

        for j, channel in enumerate(channels[:6]):
            pill_left  = margin + j * (pill_w + pill_gap)
            pill_color = theme["accent"] if j % 2 == 0 else theme["secondary"]

            # Pill background
            self._add_rect(slide, pill_left, pill_top, pill_w, pill_h, pill_color)

            # Channel label
            pad = int(pill_w * 0.06)
            self._add_textbox(
                slide,
                left=pill_left + pad,
                top=pill_top + int(pill_h * 0.12),
                width=pill_w - pad * 2,
                height=int(pill_h * 0.76),
                text=channel,
                font_size=10, font_color=theme["text_light"], bold=True,
            )


presentation_service = PresentationService()
