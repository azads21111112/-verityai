from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class SourceCreate(BaseModel):
    name: str
    url: str
    source_type: str | None = None
    reliability_score: float | None = Field(
        default=None,
        ge=0,
        le=100
    )
    description: str | None = None


class SourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    url: str
    source_type: str | None
    reliability_score: float | None
    description: str | None
    created_at: datetime | None