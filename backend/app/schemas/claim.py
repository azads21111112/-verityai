from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# ==========================================
# SINGLE CLAIM CREATE
# ==========================================

class ClaimCreate(BaseModel):
    title: str
    claim_text: str
    category: str | None = None
    source_url: str | None = None


# ==========================================
# CLAIM RESPONSE
# ==========================================

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


# ==========================================
# BULK CLAIM CREATE
# ==========================================

class BulkClaimCreate(BaseModel):
    claims: list[ClaimCreate] = Field(
        ...,
        min_length=1,
        max_length=100
    )


# ==========================================
# BULK CLAIM RESPONSE
# ==========================================

class BulkClaimResponse(BaseModel):
    total_submitted: int
    created_count: int
    duplicate_count: int
    created_claims: list[ClaimResponse]
    duplicate_claims: list[str]

    # ==========================================
# HUMAN FACT-CHECKING REQUEST
# ==========================================

from typing import Literal


class HumanVerificationRequest(BaseModel):
    verdict: Literal[
        "Verified",
        "False",
        "Misleading",
        "Partially True",
        "Unverifiable"
    ]

    review_notes: str = Field(
        ...,
        min_length=10,
        max_length=10000
    )