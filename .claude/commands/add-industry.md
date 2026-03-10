# /add-industry [industry_name] [primary_hex] [secondary_hex] [accent_hex] [bg_hex]

Add a new industry color palette to the presentation theme system.

Usage examples:
- `/add-industry "crypto" 3b82f6 8b5cf6 f59e0b 0f172a`
- `/add-industry "pharma"` (Claude will suggest appropriate colors)

## Steps

1. Parse $ARGUMENTS. Expected format: `"industry name" primary secondary accent bg`
   - If only the industry name is provided (no hex values), suggest an appropriate color palette based on the industry's typical visual identity and ask the user to confirm before proceeding.
   - If all 5 values are provided, proceed directly.

2. Read the current PALETTES dict in `app/services/presentation_service.py` to check if the industry already exists.

3. Add the new entry to the PALETTES dict in `_derive_theme()`. The key should be lowercase. If the industry name has multiple words, add both the full phrase and key individual words as separate entries pointing to the same palette.

4. Show the user a diff of the change and confirm it was applied.

5. Run the quick PPTX design test to show the new palette in action:
   ```bash
   cd /Users/tomerelankry/Desktop/Work/marketing_assistant2/.claude/worktrees/hungry-hellman
   python3 -c "
   from app.services.presentation_service import presentation_service
   from pptx.dml.color import RGBColor

   questionnaire = {
     'project_metadata': {'brand_name': 'Test Brand', 'industry': '<INDUSTRY_NAME>', 'website_url': 'https://example.com', 'target_country': 'US'},
     'the_creative_goal': {'desired_tone_of_voice': 'Bold', 'specific_channels': ['TikTok', 'Instagram']}
   }
   theme = presentation_service._derive_theme(questionnaire)
   print('Theme derived:')
   for k, v in theme.items():
       if hasattr(v, '__class__') and 'RGBColor' in str(type(v)):
           print(f'  {k}: #{v[0]:02x}{v[1]:02x}{v[2]:02x}')
       elif isinstance(v, (str, bool, list)):
           print(f'  {k}: {v}')
   "
   ```

6. Tell the user the full theme that will be applied for this industry.
