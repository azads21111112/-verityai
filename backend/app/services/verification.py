from sqlalchemy.orm import Session

from app.models import Claim, Evidence


def verify_claim(db: Session, claim_id: int):

    claim = db.query(Claim).filter(
        Claim.id == claim_id
    ).first()

    if not claim:
        return None

    evidences = db.query(Evidence).filter(
        Evidence.claim_id == claim_id
    ).all()

    supporting_weight = 0.0
    contradicting_weight = 0.0

    supporting_count = 0
    contradicting_count = 0
    neutral_count = 0

    for evidence in evidences:

        reliability = evidence.reliability_score

        if reliability is None:
            continue

        reliability = max(0, min(100, reliability))

        if evidence.evidence_type == "supporting":
            supporting_weight += reliability
            supporting_count += 1

        elif evidence.evidence_type == "contradicting":
            contradicting_weight += reliability
            contradicting_count += 1

        elif evidence.evidence_type == "neutral":
            neutral_count += 1

    total_weight = supporting_weight + contradicting_weight

    if total_weight == 0:

        verdict = "Unverifiable"
        score = None

    else:

        score = round(
            (supporting_weight / total_weight) * 100,
            2
        )

        if score >= 70:
            verdict = "Verified"

        elif score <= 30:
            verdict = "False"

        else:
            verdict = "Misleading"

    claim.verdict = verdict
    claim.status = "reviewed"

    claim.review_notes = (
        f"Supporting evidence: {supporting_count}. "
        f"Contradicting evidence: {contradicting_count}. "
        f"Neutral evidence: {neutral_count}. "
        f"Supporting weight: {supporting_weight}. "
        f"Contradicting weight: {contradicting_weight}. "
        f"Evidence balance score: {score}."
    )

    db.commit()
    db.refresh(claim)

    return {
        "claim_id": claim.id,
        "claim_title": claim.title,
        "verdict": verdict,
        "verification_score": score,
        "supporting_evidence": supporting_count,
        "contradicting_evidence": contradicting_count,
        "neutral_evidence": neutral_count,
        "review_notes": claim.review_notes,
    }