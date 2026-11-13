from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Evidence
from app.schemas.evidence import EvidenceResponse


router = APIRouter(
    prefix="/api/evidences",
    tags=["Global Evidence Repository"]
)


@router.get("/", response_model=list[EvidenceResponse])
def get_all_evidences(
    claim_id: int | None = None,

    evidence_type: str | None = None,

    source_type: str | None = None,

    min_reliability: float | None = Query(
        default=None,
        ge=0,
        le=100
    ),

    max_reliability: float | None = Query(
        default=None,
        ge=0,
        le=100
    ),

    limit: int = Query(
        default=100,
        ge=1,
        le=500
    ),

    offset: int = Query(
        default=0,
        ge=0
    ),

    db: Session = Depends(get_db)
):

    query = db.query(Evidence)

    # Filter by Claim ID
    if claim_id is not None:
        query = query.filter(
            Evidence.claim_id == claim_id
        )

    # Filter by Evidence Position
    if evidence_type:
        query = query.filter(
            Evidence.evidence_type == evidence_type.lower()
        )

    # Filter by Source Type
    if source_type:
        query = query.filter(
            Evidence.source_type.ilike(
                f"%{source_type.strip()}%"
            )
        )

    # Minimum Reliability
    if min_reliability is not None:
        query = query.filter(
            Evidence.reliability_score >= min_reliability
        )

    # Maximum Reliability
    if max_reliability is not None:
        query = query.filter(
            Evidence.reliability_score <= max_reliability
        )

    return (
        query
        .order_by(Evidence.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
