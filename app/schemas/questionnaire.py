from typing import List, Optional
from pydantic import BaseModel, HttpUrl, Field

class ProjectMetadata(BaseModel):
    brand_name: str
    website_url: HttpUrl
    target_country: str = Field(..., description="e.g., USA, Israel")
    industry: str

class ProductDefinition(BaseModel):
    product_description: str = Field(..., description="What are you selling?")
    core_problem_solved: str = Field(..., description="What pain point does it address?")
    unique_selling_proposition: str = Field(..., description="Why are you different?")

class TargetAudience(BaseModel):
    demographics: str = Field(..., description="Age, gender, location")
    psychographics: str = Field(..., description="Interests, values, behavior")
    cultural_nuances: Optional[str] = Field(None, description="Any specific cultural taboos or preferences?")

class MarketContext(BaseModel):
    main_competitors: List[str] = Field(..., description="List of 3-5 competitors")
    current_marketing_efforts: Optional[str] = Field(None, description="What are you doing now?")
    known_customer_objections: Optional[str] = Field(None, description="Why do people say 'no' to you?")

class CreativeGoal(BaseModel):
    primary_objective: str = Field(..., description="e.g., Awareness, Rebranding, New Launch")
    desired_tone_of_voice: str = Field(..., description="e.g., Bold, Professional, Humorous")
    specific_channels: List[str] = Field(..., description="e.g., TikTok, LinkedIn, Meta")

class QuestionnaireRequest(BaseModel):
    project_metadata: ProjectMetadata
    product_definition: ProductDefinition
    target_audience: TargetAudience
    market_context: MarketContext
    the_creative_goal: CreativeGoal
