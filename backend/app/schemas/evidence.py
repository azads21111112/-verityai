from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class EvidenceCreate(BaseModel):

    title: str

    source_name: str

    source_url: str

    evidence_type: Literal[
        "supporting",
        "contradicting",
        "neutral"
    ]

    source_type: str | None = None

    excerpt: str | None = None

    description: str | None = None

    reliability_score: float | None = Field(
        default=None,
        ge=0,
        le=100
    )

    published_at: datetime | None = None

    accessed_at: datetime | None = None


class EvidenceResponse(BaseModel):

    model_config = ConfigDict(from_attributes=True)

    id: int

    claim_id: int

    title: str

    source_name: str

    source_url: str

    evidence_type: str

    source_type: str | None = None

    excerpt: str | None = None

    description: str | None

    reliability_score: float | None

    published_at: datetime | None

    accessed_at: datetime | None

    created_at: datetime | None
class EvidenceUpdate(BaseModel):

    title: str | None = None

    source_name: str | None = None

    source_url: str | None = None

    evidence_type: Literal[
        "supporting",
        "contradicting",
        "neutral"
    ] | None = None

    source_type: str | None = None

    excerpt: str | None = None

    description: str | None = None

    reliability_score: float | None = Field(
        default=None,
        ge=0,
        le=100
    )

    published_at: datetime | None = None

    accessed_at: datetime | None = None
