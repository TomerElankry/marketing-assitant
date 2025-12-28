export interface ProjectMetadata {
    brand_name: string;
    website_url: string;
    target_country: string;
    industry: string;
}

export interface ProductDefinition {
    product_description: string;
    core_problem_solved: string;
    unique_selling_proposition: string;
}

export interface TargetAudience {
    demographics: string;
    psychographics: string;
    cultural_nuances?: string;
}

export interface MarketContext {
    main_competitors: string[];
    current_marketing_efforts?: string;
    known_customer_objections?: string;
}

export interface CreativeGoal {
    primary_objective: string;
    desired_tone_of_voice: string;
    specific_channels: string[];
}

export interface QuestionnaireRequest {
    project_metadata: ProjectMetadata;
    product_definition: ProductDefinition;
    target_audience: TargetAudience;
    market_context: MarketContext;
    the_creative_goal: CreativeGoal;
}

export interface JobResponse {
    job_id: string;
    status: string;
    message: string;
    validation_passed: boolean;
}
