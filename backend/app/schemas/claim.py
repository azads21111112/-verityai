from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ClaimCreate(BaseModel):
    title: str
    claim_text: str
    category: str | None = None
    source_url: str | None = None


class ClaimResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    claim_text: str
    category: str | None
    source_url: str | None
    status: str
    verdict: str | None
    review_notes: str | None
    created_at: datetime | None