# /test-pptx

Generate a themed PPTX from a questionnaire file WITHOUT calling GPT-4o — uses hardcoded slide content so it's instant and free. Great for iterating on the visual design.

## Steps

1. Determine the questionnaire file:
   - If $ARGUMENTS is provided, use that path
   - Otherwise use `questionnaire.json` in the project root

2. Run this Python snippet directly via bash:

```bash
cd /Users/tomerelankry/Desktop/Work/marketing_assistant2/.claude/worktrees/hungry-hellman
python3 -c "
import json
from app.services.presentation_service import presentation_service

with open('$ARGUMENTS' if '$ARGUMENTS' else 'questionnaire.json') as f:
    questionnaire = json.load(f)

brand = questionnaire.get('project_metadata', {}).get('brand_name', 'Brand')

slides_data = {
  'slides': [
    {'type': 'title', 'title': f'{brand} — Marketing Strategy', 'subtitle': 'AI-generated strategic narrative'},
    {'type': 'content', 'title': 'The Problem', 'content': ['Pain point 1 for the customer.', 'Pain point 2 that drives urgency.', 'The gap competitors fail to fill.']},
    {'type': 'content', 'title': 'The Solution', 'content': ['How the product solves it uniquely.', 'The core differentiator in action.', 'Why now is the right moment.']},
    {'type': 'content', 'title': 'Market Context', 'content': ['Competitor A weakness vs our strength.', 'Competitor B weakness vs our strength.', 'The white space we own.']},
    {'type': 'content', 'title': 'The Strategy', 'content': ['Creative pivot: reframe the category.', 'Lead with emotion, back with proof.', 'Own one channel before expanding.']},
    {'type': 'content', 'title': 'Marketing Hooks', 'content': ['Hook 1: The bold claim that stops the scroll.', 'Hook 2: The relatable pain they did not know they had.', 'Hook 3: The unexpected comparison.', 'Hook 4: The social proof angle.', 'Hook 5: The curiosity gap.']},
    {'type': 'content', 'title': 'Next Steps', 'content': ['Launch channel 1 campaign within 2 weeks.', 'Secure 3 influencer partnerships this month.', 'A/B test hooks on paid social for 14 days.']},
  ]
}

out = presentation_service.generate_pptx(slides_data, '/tmp/test_design.pptx', questionnaire=questionnaire)
if out:
    import os
    print(f'SUCCESS: {out} ({os.path.getsize(out):,} bytes)')
else:
    print('FAILED')
"
```

3. If successful, open the file so the user can review it:
   ```bash
   open /tmp/test_design.pptx
   ```

4. Tell the user:
   - Which theme was derived (industry, tone)
   - What color palette was applied (primary/secondary/accent)
   - The file size and location
