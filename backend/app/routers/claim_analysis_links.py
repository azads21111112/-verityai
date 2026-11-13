from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.claim import Claim
from app.models.ai_analysis import AIAnalysis
from app.models.claim_analysis_link import ClaimAnalysisLink
from app.schemas.claim_analysis_link import (
    ClaimAnalysisLinkCreate,
    ClaimAnalysisLinkResponse,
)

router = APIRouter(
    prefix="/api/claim-analysis-links",
    tags=["Claim Analysis Links"],
)


@router.post(
    "/",
    response_model=ClaimAnalysisLinkResponse,
)
def create_claim_analysis_link(
    payload: ClaimAnalysisLinkCreate,
    db: Session = Depends(get_db),
):
    # Check claim
    claim = db.query(Claim).filter(
        Claim.id == payload.claim_id
    ).first()

    if not claim:
        raise HTTPException(
            status_code=404,
            detail="Claim not found.",
        )

    # Check AI analysis
    analysis = db.query(AIAnalysis).filter(
        AIAnalysis.id == payload.analysis_id
    ).first()

    if not analysis:
        raise HTTPException(
            status_code=404,
            detail="AI Analysis not found.",
        )

    # Check existing relationship
    existing = db.query(ClaimAnalysisLink).filter(
        ClaimAnalysisLink.claim_id == payload.claim_id,
        ClaimAnalysisLink.analysis_id == payload.analysis_id,
    ).first()

    if existing:
        return existing

    link = ClaimAnalysisLink(
        claim_id=payload.claim_id,
        analysis_id=payload.analysis_id,
    )

    db.add(link)
    db.commit()
    db.refresh(link)

    return link


@router.get("/")
def get_claim_analysis_links(
    claim_id: int | None = None,
    analysis_id: int | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(ClaimAnalysisLink)

    if claim_id is not None:
        query = query.filter(
            ClaimAnalysisLink.claim_id == claim_id
        )

    if analysis_id is not None:
        query = query.filter(
            ClaimAnalysisLink.analysis_id == analysis_id
        )

    return query.order_by(
        ClaimAnalysisLink.id.desc()
    ).all()