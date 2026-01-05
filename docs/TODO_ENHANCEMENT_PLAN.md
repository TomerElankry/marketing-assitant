# Creative Marketing Agent Enhancement - Detailed TODO List

Based on the Creative Marketing Agent Enhancement Plan

---

## PHASE 1: Foundation - Enhanced Prompts & Dual Research (Week 1)

### Layer 1: Enhanced Agent Prompts & Creative Focus

#### 1.1 Upgrade Research Agent Prompts
- [ ] **L1.1.1** Update `app/services/research_service.py` - Enhance `_generate_queries()` method
  - [ ] Add creative-focused query: "What visual styles/imagery are competitors using in [industry]?"
  - [ ] Add creative-focused query: "What emotional triggers are working in [category] campaigns?"
  - [ ] Add creative-focused query: "What creative formats are trending (video styles, copy patterns) in [target_country]?"
  - [ ] Add query for brand voice analysis: "What tone and voice do competitors use in their messaging?"
  - [ ] Add query for cultural creative trends: "What creative trends are emerging in [target_country] for [industry]?"
- [ ] **L1.1.2** Update research service system prompt to emphasize creative elements
- [ ] **L1.1.3** Test enhanced research queries with sample questionnaire

#### 1.2 Upgrade Analysis Agent Prompts
- [ ] **L1.2.1** Update `app/services/analysis_service.py` - Replace system prompt
  - [ ] Use creative director persona from `docs/prompts/analysis_agent.md`
  - [ ] Add focus on creative hooks (not just messaging)
  - [ ] Add focus on visual angles and concepts
  - [ ] Add focus on brand voice recommendations
  - [ ] Add focus on campaign concepts
- [ ] **L1.2.2** Enhance analysis output structure
  - [ ] Add "visual_concepts" field to output
  - [ ] Add "brand_voice_recommendations" field
  - [ ] Add "campaign_concepts" field
  - [ ] Enhance "hooks" to include hook type (emotional, problem-solution, aspirational, contrarian)
- [ ] **L1.2.3** Add creative frameworks to prompts (Hero's Journey, Emotional Triggers, Visual Metaphors)
- [ ] **L1.2.4** Test enhanced analysis with sample research data

#### 1.3 Upgrade Presentation Structuring
- [ ] **L1.3.1** Update `app/services/presentation_service.py` - Enhance `structure_content()` method
  - [ ] Update prompt to emphasize creative elements
  - [ ] Request visual concept descriptions for each recommendation
  - [ ] Request brand voice guidelines
  - [ ] Request campaign concept descriptions
- [ ] **L1.3.2** Add visual prompt generation for each creative recommendation
- [ ] **L1.3.3** Test enhanced slide structure generation

### Layer 2: Dual-Source Research Fleet

#### 2.1 Add Gemini Research Agent
- [ ] **L2.1.1** Create `app/services/gemini_research_service.py`
  - [ ] Initialize Gemini client with **gemini-2.5-pro** model (better for research than flash)
  - [ ] Enable Google Search grounding for real-time web data
  - [ ] Create `_generate_creative_queries()` method for creative-focused research
  - [ ] Implement `conduct_creative_research()` method
  - [ ] Add queries for:
    - Visual trends and aesthetics
    - Creative campaign examples
    - Brand positioning in market
    - Cultural creative insights
- [ ] **L2.1.2** Add error handling and retry logic
- [ ] **L2.1.3** Add tests for Gemini research service
- [ ] **L2.1.4** Update `app/core/config.py` to ensure Gemini API key is available

#### 2.2 Research Consolidation Agent (AI-Powered)
- [ ] **L2.2.1** Create `app/services/research_consolidator.py`
  - [ ] Use **Gemini 2.5 Pro** as an AI agent to intelligently merge research
  - [ ] Implement `consolidate_research_with_ai()` method that:
    - Takes Perplexity + Gemini research results
    - Uses Gemini to synthesize and merge findings intelligently
    - Identifies complementary insights (not just deduplication)
    - Categorizes by research type (sentiment, creative, competitive, cultural)
    - Creates structured "Full Research Resource" JSON
    - Highlights key insights and contradictions
  - [ ] Add programmatic pre-processing:
    - Basic deduplication of exact matches
    - Structure normalization
  - [ ] Add AI-powered synthesis:
    - Intelligent merging of related findings
    - Contradiction detection
    - Insight prioritization
- [ ] **L2.2.2** Create consolidation prompt for Gemini agent
  - [ ] System prompt: "You are a research synthesis expert. Merge research from multiple sources..."
  - [ ] Request structured output with categories
  - [ ] Request confidence scores for merged insights
- [ ] **L2.2.3** Add research quality scoring
- [ ] **L2.2.4** Add tests for consolidation agent

#### 2.3 Update Workflow
- [ ] **L2.3.1** Update `app/services/workflow.py`
  - [ ] Import `gemini_research_service` and `research_consolidator`
  - [ ] Modify `perform_research_workflow()` to:
    - Run both research agents (Perplexity + Gemini) in parallel
    - Wait for both to complete
    - Call consolidation agent (Gemini) to merge results
    - Store individual research results + consolidated result
  - [ ] Update job status progression:
    - "researching_perplexity" and "researching_gemini" (parallel)
    - "consolidating_research" (AI agent merging)
    - "researching" (complete)
  - [ ] Add error handling for partial research completion
- [ ] **L2.3.2** Update `app/db/models.py` if needed for new status types
- [ ] **L2.3.3** Test end-to-end dual research + consolidation workflow

---

## PHASE 2: Multi-Model Analysis & Consensus (Week 2)

### Layer 3: Triple-Analysis & Consensus Engine

#### 3.1 Multi-Model Analysis Service
- [ ] **L3.1.1** Create `app/services/multi_analysis_service.py`
  - [ ] Implement `analyze_with_gpt4o()` - Creative Director persona
  - [ ] Implement `analyze_with_gemini()` - Brand Strategist persona
  - [ ] Implement `analyze_with_perplexity()` - Market Intelligence persona
  - [ ] Implement `run_triple_analysis()` to execute all three in parallel
  - [ ] Each model generates:
    - Creative hooks (3-5 per model)
    - Messaging angles (2-3 per model)
    - Creative pivot recommendations
    - Brand voice suggestions
- [ ] **L3.1.2** Add proper error handling for each model
  - [ ] Degraded mode: continue if one model fails
  - [ ] Log which models succeeded/failed
- [ ] **L3.1.3** Add tests for multi-analysis service
- [ ] **L3.1.4** Add configuration to enable/disable specific models

#### 3.2 Consensus Engine
- [ ] **L3.2.1** Create `app/services/consensus_service.py`
  - [ ] Implement `compare_outputs()` to analyze all 3 model outputs
  - [ ] Implement `identify_agreements()` - find points mentioned by 2+ models
  - [ ] Implement `identify_disagreements()` - find divergent creative directions
  - [ ] Implement `calculate_confidence()` - score based on alignment
  - [ ] Implement `generate_consensus_report()` with:
    - High-confidence recommendations (agreed by all)
    - Medium-confidence (agreed by 2)
    - Low-confidence (single model, flagged for review)
    - Creative conflicts (explicitly different directions)
- [ ] **L3.2.2** Add semantic similarity checking for agreement detection
- [ ] **L3.2.3** Add tests for consensus engine
- [ ] **L3.2.4** Create consensus report schema/structure

#### 3.3 Update Analysis Workflow
- [ ] **L3.3.1** Update `app/services/workflow.py`
  - [ ] Replace single `analysis_service.analyze_research()` with `multi_analysis_service.run_triple_analysis()`
  - [ ] Add consensus step after triple-analysis
  - [ ] Store individual model outputs in storage (for transparency)
  - [ ] Store consensus result
  - [ ] Update presentation generation to use consensus data
- [ ] **L3.3.2** Update storage keys:
  - [ ] `jobs/{job_id}/analysis_gpt4o.json`
  - [ ] `jobs/{job_id}/analysis_gemini.json`
  - [ ] `jobs/{job_id}/analysis_perplexity.json`
  - [ ] `jobs/{job_id}/analysis_consensus.json`
- [ ] **L3.3.3** Test end-to-end triple-analysis workflow

---

## PHASE 3: Creative Tools & Capabilities (Week 3)

### Layer 4: Creative Tools

#### 4.1 Creative Hooks Generator Tool
- [ ] **L4.1.1** Create `app/services/tools/__init__.py` (tools package)
- [ ] **L4.1.2** Create `app/services/tools/hooks_generator.py`
  - [ ] Implement `generate_emotional_hooks()` based on audience psychology
  - [ ] Implement `generate_problem_solution_hooks()` based on pain points
  - [ ] Implement `generate_aspirational_hooks()` based on goals
  - [ ] Implement `generate_contrarian_hooks()` based on competitive landscape
  - [ ] Implement `generate_all_hooks()` - master function
- [ ] **L4.1.3** Add hook quality scoring
- [ ] **L4.1.4** Add tests for hooks generator

#### 4.2 Messaging Angle Finder Tool
- [ ] **L4.2.1** Create `app/services/tools/angle_finder.py`
  - [ ] Implement `analyze_competitive_messaging()` - extract messaging patterns
  - [ ] Implement `identify_white_space()` - find positioning opportunities
  - [ ] Implement `generate_positioning_angles()` - create unique angles
  - [ ] Implement `adapt_for_culture()` - consider cultural nuances
- [ ] **L4.2.2** Add angle uniqueness scoring
- [ ] **L4.2.3** Add tests for angle finder

#### 4.3 Brand Voice Analyzer Tool
- [ ] **L4.3.1** Create `app/services/tools/voice_analyzer.py`
  - [ ] Implement `analyze_current_voice()` - extract from research
  - [ ] Implement `compare_to_competitors()` - voice differentiation
  - [ ] Implement `recommend_voice_shift()` - strategic voice changes
  - [ ] Implement `generate_tone_guidelines()` - specific tone recommendations
- [ ] **L4.3.2** Add voice consistency scoring
- [ ] **L4.3.3** Add tests for voice analyzer

#### 4.4 Visual Concept Generator Tool
- [ ] **L4.4.1** Create `app/services/tools/visual_concepts.py`
  - [ ] Implement `analyze_visual_trends()` - category visual analysis
  - [ ] Implement `generate_visual_concepts()` - aesthetic recommendations
  - [ ] Implement `create_visual_prompts()` - Midjourney/DALL-E prompts
  - [ ] Implement `recommend_visual_styles()` - style guidelines
- [ ] **L4.4.2** Add visual trend analysis
- [ ] **L4.4.3** Add tests for visual concepts tool

#### 4.5 Campaign Concept Builder Tool
- [ ] **L4.5.1** Create `app/services/tools/campaign_builder.py`
  - [ ] Implement `combine_creative_elements()` - merge hooks, angles, voice
  - [ ] Implement `generate_campaign_narrative()` - story framework
  - [ ] Implement `adapt_for_channels()` - channel-specific creative
  - [ ] Implement `create_campaign_brief()` - structured brief output
- [ ] **L4.5.2** Add campaign coherence scoring
- [ ] **L4.5.3** Add tests for campaign builder

#### 4.6 Integrate Tools into Analysis Pipeline
- [ ] **L4.6.1** Update `app/services/multi_analysis_service.py`
  - [ ] Integrate hooks generator into analysis
  - [ ] Integrate angle finder into analysis
  - [ ] Integrate voice analyzer into analysis
  - [ ] Integrate visual concepts into analysis
  - [ ] Integrate campaign builder into final output
- [ ] **L4.6.2** Update consensus service to handle tool outputs
- [ ] **L4.6.3** Test integrated creative tools workflow

---

## PHASE 4: Enhanced Presentation Output (Week 4)

### Layer 5: Enhanced Presentation with Creative Elements

#### 5.1 Creative-Focused Slide Types
- [ ] **L5.1.1** Update `app/services/presentation_service.py` - Add new slide types
  - [ ] Implement `_create_hooks_showcase_slide()` - visual + copy hooks
  - [ ] Implement `_create_voice_guidelines_slide()` - brand voice recommendations
  - [ ] Implement `_create_campaign_concepts_slide()` - campaign concept boards
  - [ ] Implement `_create_visual_style_slide()` - visual style guide
  - [ ] Implement `_create_messaging_framework_slide()` - messaging framework
- [ ] **L5.1.2** Update `structure_content()` to request creative slide types
- [ ] **L5.1.3** Enhance existing slides with creative elements
  - [ ] Add visual prompts to strategic overview
  - [ ] Add creative hooks to playbook slides
  - [ ] Add brand voice to platform analysis

#### 5.2 Visual Prompt Integration
- [ ] **L5.2.1** Update slide structure generation
  - [ ] Add visual concept descriptions to each creative recommendation
  - [ ] Include style references and aesthetic directions
  - [ ] Generate Midjourney/DALL-E prompts for campaign visuals
- [ ] **L5.2.2** Add visual prompt field to slide JSON structure
- [ ] **L5.2.3** Update presentation rendering to display visual prompts

#### 5.3 Enhanced Presentation Generation
- [ ] **L5.3.1** Update `generate_pptx()` to handle new creative slide types
- [ ] **L5.3.2** Add visual concept placeholders in slides
- [ ] **L5.3.3** Enhance slide styling for creative elements
- [ ] **L5.3.4** Test all new slide types render correctly

---

## PHASE 5: Advanced Creative Capabilities (Week 5+)

### Layer 6: Advanced Features

#### 6.1 Cultural Localization Agent
- [ ] **L6.1.1** Create `app/services/cultural_agent.py`
  - [ ] Implement `analyze_cultural_norms()` - target country analysis
  - [ ] Implement `adapt_creative_for_culture()` - cultural adaptation
  - [ ] Implement `identify_cultural_taboos()` - avoid cultural missteps
  - [ ] Implement `find_cultural_opportunities()` - cultural advantages
  - [ ] Implement `localize_messaging()` - message adaptation
  - [ ] Implement `localize_visuals()` - visual concept adaptation
- [ ] **L6.1.2** Add cultural profile database/structure
- [ ] **L6.1.3** Integrate into analysis pipeline
- [ ] **L6.1.4** Add tests for cultural agent

#### 6.2 Trend Analysis Agent
- [ ] **L6.2.1** Create `app/services/trend_agent.py`
  - [ ] Implement `identify_emerging_trends()` - trend detection
  - [ ] Implement `predict_trend_longevity()` - trend sustainability
  - [ ] Implement `recommend_trend_adoption()` - adoption strategy
  - [ ] Implement `balance_trend_authenticity()` - brand fit analysis
- [ ] **L6.2.2** Add trend database/structure
- [ ] **L6.2.3** Integrate into research phase
- [ ] **L6.2.4** Add tests for trend agent

#### 6.3 Competitive Creative Audit
- [ ] **L6.3.1** Create `app/services/competitive_creative_audit.py`
  - [ ] Implement `analyze_competitor_visuals()` - visual style analysis
  - [ ] Implement `analyze_competitor_messaging()` - messaging tone analysis
  - [ ] Implement `analyze_competitor_campaigns()` - campaign theme analysis
  - [ ] Implement `identify_creative_patterns()` - pattern detection
  - [ ] Implement `identify_creative_gaps()` - opportunity identification
  - [ ] Implement `generate_creative_intelligence()` - comprehensive report
- [ ] **L6.3.2** Integrate into research phase
- [ ] **L6.3.3** Add tests for competitive audit

---

## Testing & Quality Assurance

### Unit Tests
- [ ] Create tests for all new services
- [ ] Create tests for all new tools
- [ ] Create tests for consensus engine
- [ ] Create tests for research consolidation

### Integration Tests
- [ ] Test dual research workflow end-to-end
- [ ] Test triple-analysis workflow end-to-end
- [ ] Test consensus generation
- [ ] Test creative tools integration
- [ ] Test enhanced presentation generation

### End-to-End Tests
- [ ] Full workflow: Questionnaire → Dual Research → Triple Analysis → Consensus → Creative Tools → Enhanced Presentation
- [ ] Test degraded mode (one model fails)
- [ ] Test with various questionnaire types
- [ ] Test presentation quality and completeness

---

## Documentation Updates

- [ ] Update README with new features
- [ ] Document new agent capabilities
- [ ] Document creative tools usage
- [ ] Update API documentation
- [ ] Create user guide for enhanced features

---

## Configuration & Deployment

- [ ] Add feature flags for enabling/disabling:
  - [ ] Dual research
  - [ ] Triple analysis
  - [ ] Creative tools
  - [ ] Advanced features
- [ ] Update environment variables documentation
- [ ] Add configuration for model selection
- [ ] Update deployment documentation

---

## Total Tasks: ~80+ actionable items

**Estimated Timeline:** 5-6 weeks for full implementation
**Priority Order:** Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5

