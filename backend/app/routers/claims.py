from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Claim
from app.schemas.claim import HumanVerificationRequest

from app.schemas.claim import (
    ClaimCreate,
    ClaimResponse,
    BulkClaimCreate,
    BulkClaimResponse,
)

from app.services.verification import verify_claim


router = APIRouter(
    prefix="/api/claims",
    tags=["Claim Management"]
)


# ==========================================
# BULK CREATE CLAIMS
# ==========================================

@router.post(
    "/bulk",
    response_model=BulkClaimResponse,
    status_code=status.HTTP_201_CREATED
)
def bulk_create_claims(
    data: BulkClaimCreate,
    db: Session = Depends(get_db)
):
    existing_claims = db.query(Claim).all()

    existing_texts = {
        " ".join(claim.claim_text.lower().split())
        for claim in existing_claims
    }

    created_claims = []
    duplicate_claims = []

    try:
        for item in data.claims:

            normalized_text = " ".join(
                item.claim_text.lower().split()
            )

            # Skip duplicate claims
            if normalized_text in existing_texts:
                duplicate_claims.append(item.claim_text)
                continue

            new_claim = Claim(
                title=item.title,
                claim_text=item.claim_text,
                category=item.category,
                source_url=item.source_url
            )

            db.add(new_claim)
            db.flush()

            created_claims.append(new_claim)
            existing_texts.add(normalized_text)

        db.commit()

        for claim in created_claims:
            db.refresh(claim)

    except Exception:
        db.rollback()
        raise

    return BulkClaimResponse(
        total_submitted=len(data.claims),
        created_count=len(created_claims),
        duplicate_count=len(duplicate_claims),
        created_claims=created_claims,
        duplicate_claims=duplicate_claims
    )


# ==========================================
# CREATE SINGLE CLAIM
# ==========================================

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


# ==========================================
# GET ALL CLAIMS
# ==========================================

@router.get(
    "/",
    response_model=list[ClaimResponse]
)
def get_all_claims(
    db: Session = Depends(get_db)
):
    return (
        db.query(Claim)
        .order_by(Claim.created_at.desc())
        .all()
    )


# ==========================================
# GET SINGLE CLAIM
# ==========================================

@router.get(
    "/{claim_id}",
    response_model=ClaimResponse
)
def get_claim(
    claim_id: int,
    db: Session = Depends(get_db)
):
    claim = db.query(Claim).filter(
        Claim.id == claim_id
    ).first()

    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )

    return claim


# ==========================================
# VERIFY CLAIM
# ==========================================

    # ==========================================
# # ==========================================
# AI CLAIM VERIFICATION
# ==========================================

@router.post("/{claim_id}/verify")
def verify_claim_endpoint(
    claim_id: int,
    db: Session = Depends(get_db)
):
    result = verify_claim(db, claim_id)

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )

    return result


# ==========================================
# HUMAN FACT-CHECKING
# ==========================================

@router.post("/{claim_id}/human-review")
def human_verify_claim(
    claim_id: int,
    review: HumanVerificationRequest,
    db: Session = Depends(get_db)
):
    claim = db.query(Claim).filter(
        Claim.id == claim_id
    ).first()

    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )

    # Retrieve evidence for this claim
    from app.models import Evidence

    evidences = db.query(Evidence).filter(
        Evidence.claim_id == claim_id
    ).all()

    if not evidences:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Add independent evidence before completing human verification."
        )

    # Validate review notes
    if not review.review_notes.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Investigation notes are required."
        )

    # Save human assessment
    claim.verdict = review.verdict
    claim.status = "human_reviewed"
    claim.review_notes = review.review_notes.strip()

    try:
        db.commit()
        db.refresh(claim)

    except Exception:
        db.rollback()
        raise

    return {
        "message": "Human fact-checking completed successfully.",
        "claim_id": claim.id,
        "claim_text": claim.claim_text,
        "human_verdict": claim.verdict,
        "status": claim.status,
        "evidence_count": len(evidences),
        "review_notes": claim.review_notes
    }