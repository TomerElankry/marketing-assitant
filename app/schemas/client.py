from typing import List, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, HttpUrl


class ClientCreate(BaseModel):
    brand_name: str
    website_url: str
    target_country: str
    industry: str
    product_description: str
    core_problem_solved: str
    unique_selling_proposition: str
    demographics: str
    psychographics: str
    cultural_nuances: Optional[str] = None
    main_competitors: List[str]
    current_marketing_efforts: Optional[str] = None
    known_customer_objections: Optional[str] = None


class ClientUpdate(ClientCreate):
    pass


class ClientResponse(BaseModel):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    brand_name: str
    website_url: str
    target_country: str
    industry: str
    product_description: str
    core_problem_solved: str
    unique_selling_proposition: str
    demographics: str
    psychographics: str
    cultural_nuances: Optional[str]
    main_competitors: List[str]
    current_marketing_efforts: Optional[str]
    known_customer_objections: Optional[str]
    campaign_count: int = 0

    model_config = {"from_attributes": True}
