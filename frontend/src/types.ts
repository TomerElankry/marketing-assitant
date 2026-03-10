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
    recommended_channels?: string[];
}

export interface Client {
    id: string;
    user_id: string;
    brand_name: string;
    website_url: string;
    target_country: string;
    industry: string;
    product_description: string;
    core_problem_solved: string;
    unique_selling_proposition: string;
    demographics: string;
    psychographics: string;
    cultural_nuances?: string;
    main_competitors: string[];
    current_marketing_efforts?: string;
    known_customer_objections?: string;
    created_at: string;
    updated_at: string;
    campaign_count: number;
}

export interface JobEntry {
    job_id: string;
    status: string;
    brand_name?: string;
    industry?: string;
    target_country?: string;
    primary_objective?: string;
    campaign_name?: string;
    campaign_description?: string;
    recommended_channels?: string[];
    client_id?: string | null;
    created_at: string;
    updated_at: string;
    failed_step?: string | null;
    error_message?: string | null;
    owner_id?: string | null;
}

export interface CampaignCreateRequest {
    client_id: string;
    campaign_name: string;
    campaign_description?: string;
    primary_objective: string;
    desired_tone_of_voice: string;
}

export interface UserResponse {
    id: string;
    email: string;
    full_name?: string;
    is_active: boolean;
    is_admin: boolean;
    created_at: string;
}
