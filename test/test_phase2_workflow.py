import asyncio
import json
import os
import sys
from pathlib import Path

# Add project root to path
sys.path.append(str(Path(__file__).parent.parent))

from app.services.research_service import research_service
from app.services.gemini_research_service import gemini_research_service
from app.services.research_consolidator import research_consolidator
from app.services.multi_analysis_service import multi_analysis_service
from app.services.consensus_service import consensus_service
from app.schemas.questionnaire import QuestionnaireRequest

# Load sample questionnaire
def load_questionnaire():
    with open("questionnaire.json", "r") as f:
        data = json.load(f)
        return QuestionnaireRequest(**data)

async def test_phase2_workflow():
    print("--- Starting Phase 2 Test: Dual Research -> Consolidation -> Triple Analysis -> Consensus ---")
    
    questionnaire = load_questionnaire()
    
    # 1. Dual Research
    print("\n[1] Running Dual Research (Perplexity + Gemini)...")
    # For testing, we might want to mock these or run them with a simple query to save time/cost
    # But let's try running them for real to verify integration
    
    # Run in parallel
    results = await asyncio.gather(
        research_service.conduct_deep_research(questionnaire),
        gemini_research_service.conduct_creative_research(questionnaire)
    )
    perplexity_results = results[0]
    gemini_results = results[1]
    
    print(f"  > Perplexity Results: {len(json.dumps(perplexity_results))} chars")
    print(f"  > Gemini Results: {len(json.dumps(gemini_results))} chars")

    # 2. Consolidation
    print("\n[2] Consolidating Research...")
    consolidated_research = await research_consolidator.consolidate_research(perplexity_results, gemini_results)
    print(f"  > Consolidated Research: {len(json.dumps(consolidated_research))} chars")
    
    # 3. Triple Analysis
    print("\n[3] Running Triple Analysis (GPT-4o, Gemini, Perplexity)...")
    triple_analysis_results = await multi_analysis_service.run_triple_analysis(questionnaire, consolidated_research)
    
    print("\n  > Analysis Results:")
    for model, result in triple_analysis_results.items():
        print(f"    - {model}: {len(json.dumps(result))} chars")
        if "error" in result:
            print(f"      ERROR: {result['error']}")

    # 4. Consensus
    print("\n[4] Generating Consensus...")
    consensus_result = consensus_service.generate_consensus(triple_analysis_results)
    
    print("\n--- FINAL CONSENSUS STRATEGY ---")
    print(json.dumps(consensus_result, indent=2))
    
    # Check for key fields
    required_keys = ["hooks", "angles", "creative_pivot", "visual_concepts", "brand_voice", "campaign_concepts"]
    missing = [k for k in required_keys if k not in consensus_result]
    if missing:
        print(f"\n[FAIL] Missing keys in consensus: {missing}")
    else:
        print("\n[PASS] Consensus structure valid.")

if __name__ == "__main__":
    asyncio.run(test_phase2_workflow())

