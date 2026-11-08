from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class EvidenceCreate(BaseModel):
    title: str
    source_name: str
    source_url: str
    evidence_type: str
    description: str | None = None

    reliability_score: float | None = Field(
        default=None,
        ge=0,
        le=100
    )

    published_at: datetime | None = None


class EvidenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    claim_id: int
    title: str
    source_name: str
    source_url: str
    evidence_type: str
    description: str | None
    reliability_score: float | None
    published_at: datetime | None
    created_at: datetime | None