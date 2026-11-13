from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Claim, Evidence
from app.schemas.evidence import EvidenceCreate, EvidenceResponse
from app.schemas.evidence import (
    EvidenceCreate,
    EvidenceResponse,
    EvidenceUpdate,
)

router = APIRouter(
    prefix="/api/claims/{claim_id}/evidences",
    tags=["Evidence Management"]
)


@router.post(
    "/",
    response_model=EvidenceResponse,
    status_code=status.HTTP_201_CREATED
)
def create_evidence(
    claim_id: int,
    evidence_data: EvidenceCreate,
    db: Session = Depends(get_db)
):
    claim = db.query(Claim).filter(
        Claim.id == claim_id
    ).first()

    if not claim:
        raise HTTPException(
            status_code=404,
            detail="Claim not found"
        )

    if evidence_data.evidence_type not in [
        "supporting",
        "contradicting",
        "neutral"
    ]:
        raise HTTPException(
            status_code=422,
            detail="Invalid evidence type"
        )

    new_evidence = Evidence(
        claim_id=claim_id,
        **evidence_data.model_dump()
    )

    db.add(new_evidence)
    db.commit()
    db.refresh(new_evidence)

    return new_evidence


@router.get("/", response_model=list[EvidenceResponse])
def get_claim_evidences(
    claim_id: int,
    db: Session = Depends(get_db)
):
    claim = db.query(Claim).filter(
        Claim.id == claim_id
    ).first()

    if not claim:
        raise HTTPException(
            status_code=404,
            detail="Claim not found"
        )

    return (
        db.query(Evidence)
        .filter(Evidence.claim_id == claim_id)
        .order_by(Evidence.created_at.desc())
        .all()
    )
@router.patch(
    "/{evidence_id}",
    response_model=EvidenceResponse
)
def update_evidence(
    claim_id: int,
    evidence_id: int,
    evidence_data: EvidenceUpdate,
    db: Session = Depends(get_db)
):
    claim = db.query(Claim).filter(
        Claim.id == claim_id
    ).first()

    if not claim:
        raise HTTPException(
            status_code=404,
            detail="Claim not found"
        )

    evidence = db.query(Evidence).filter(
        Evidence.id == evidence_id,
        Evidence.claim_id == claim_id
    ).first()

    if not evidence:
        raise HTTPException(
            status_code=404,
            detail="Evidence not found for this claim"
        )

    update_data = evidence_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(evidence, field, value)

    db.commit()
    db.refresh(evidence)

    return evidence


@router.delete(
    "/{evidence_id}",
    status_code=204
)
def delete_evidence(
    claim_id: int,
    evidence_id: int,
    db: Session = Depends(get_db)
):
    evidence = db.query(Evidence).filter(
        Evidence.id == evidence_id,
        Evidence.claim_id == claim_id
    ).first()

    if not evidence:
        raise HTTPException(
            status_code=404,
            detail="Evidence not found for this claim"
        )

    db.delete(evidence)
    db.commit()

    return None
