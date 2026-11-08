from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Claim
from app.schemas.claim import ClaimCreate, ClaimResponse

from app.services.verification import verify_claim
router = APIRouter(
    prefix="/api/claims",
    tags=["Claim Management"]
)


@router.post(
    "/",
    response_model=ClaimResponse,
    status_code=status.HTTP_201_CREATED
)
def create_claim(
    claim_data: ClaimCreate,
    db: Session = Depends(get_db)
):
    new_claim = Claim(
        title=claim_data.title,
        claim_text=claim_data.claim_text,
        category=claim_data.category,
        source_url=claim_data.source_url
    )

    db.add(new_claim)
    db.commit()
    db.refresh(new_claim)

    return new_claim


@router.get("/", response_model=list[ClaimResponse])
def get_all_claims(db: Session = Depends(get_db)):
    return (
        db.query(Claim)
        .order_by(Claim.created_at.desc())
        .all()
    )


@router.get("/{claim_id}", response_model=ClaimResponse)
def get_claim(
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

    return claim

@router.post("/{claim_id}/verify")
def verify_claim_endpoint(
    claim_id: int,
    db: Session = Depends(get_db)
):
    result = verify_claim(db, claim_id)

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Claim not found"
        )

    return result