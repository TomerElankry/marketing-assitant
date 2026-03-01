from app.schemas.questionnaire import QuestionnaireRequest

class ResearchConsolidator:
    """
    Consolidates research from multiple sources (Perplexity + Gemini)
    into a unified research document for analysis.
    """
    
    def consolidate_research(self, perplexity_results: dict, gemini_results: dict) -> dict:
        """
        Merges research from Perplexity (data-focused) and Gemini (creative-focused)
        into a single consolidated research document.
        
        Args:
            perplexity_results: Research from Perplexity API (competitor analysis, sentiment, USP validation)
            gemini_results: Research from Gemini API (visual trends, cultural insights, campaigns, archetypes)
            
        Returns:
            Consolidated research dictionary with both sources clearly labeled
        """
        active_sources = (1 if perplexity_results else 0) + (1 if gemini_results else 0)
        consolidated = {
            "perplexity_research": perplexity_results,
            "gemini_research": gemini_results,
            "summary": {
                "data_sources": active_sources,
                "perplexity_categories": list(perplexity_results.keys()) if perplexity_results else [],
                "gemini_categories": list(gemini_results.keys()) if gemini_results else [],
                "degraded_mode": perplexity_results == {},
            }
        }
        
        return consolidated

research_consolidator = ResearchConsolidator()
