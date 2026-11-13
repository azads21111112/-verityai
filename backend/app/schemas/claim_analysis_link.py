from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ClaimAnalysisLinkCreate(BaseModel):
    claim_id: int
    analysis_id: int


class ClaimAnalysisLinkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    claim_id: int
    analysis_id: int
    created_at: datetime | None = None