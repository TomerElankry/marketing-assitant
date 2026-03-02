class ResearchConsolidator:
    """
    Consolidates research from multiple sources (Perplexity + Gemini + Brand Audit)
    into a unified research document for the analysis phase.
    """

    def consolidate_research(
        self,
        perplexity_results: dict,
        gemini_results: dict,
        brand_audit: dict = None,
    ) -> dict:
        """
        Merges research from all three sources into a single document.

        Args:
            perplexity_results: Perplexity (competitor, USP, sentiment, brand awareness, share of voice)
            gemini_results:     Gemini (visual trends, cultural insights, campaigns, archetypes, content formats)
            brand_audit:        Homepage audit (current positioning, tone, key claims, gaps)

        Returns:
            Consolidated research dict with all sources clearly labelled.
        """
        brand_audit = brand_audit or {}
        active_sources = sum([
            1 if perplexity_results else 0,
            1 if gemini_results else 0,
            1 if brand_audit else 0,
        ])

        return {
            "perplexity_research": perplexity_results,
            "gemini_research": gemini_results,
            "brand_audit": brand_audit,
            "summary": {
                "data_sources": active_sources,
                "perplexity_categories": list(perplexity_results.keys()) if perplexity_results else [],
                "gemini_categories": list(gemini_results.keys()) if gemini_results else [],
                "brand_audit_available": bool(brand_audit),
                "current_brand_tone": brand_audit.get("tone_of_voice"),
                "current_brand_maturity": brand_audit.get("brand_maturity"),
                "degraded_mode": not perplexity_results and not brand_audit,
            },
        }


research_consolidator = ResearchConsolidator()
