from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Claim, Article, AIAnalysis
from app.models.claim_analysis_link import ClaimAnalysisLink

router = APIRouter(
    prefix="/api/comparison",
    tags=["AI vs Human Comparison"],
)


@router.get("/")
def get_ai_human_comparison(
    db: Session = Depends(get_db),
):
    claims = (
        db.query(Claim)
        .order_by(Claim.created_at.desc())
        .all()
    )

    results = []

    total_claims = len(claims)
    human_reviewed = 0
    claims_with_ai = 0
    claims_without_ai = 0

    for claim in claims:

        # Human review statistics
        is_reviewed = claim.status == "human_reviewed"

        if is_reviewed:
            human_reviewed += 1

        # Find AI analyses linked to this claim
        links = (
            db.query(ClaimAnalysisLink)
            .filter(
                ClaimAnalysisLink.claim_id == claim.id
            )
            .all()
        )

        ai_reports = []

        for link in links:

            analysis = (
                db.query(AIAnalysis)
                .filter(
                    AIAnalysis.id == link.analysis_id
                )
                .first()
            )

            if not analysis:
                continue

            article = (
                db.query(Article)
                .filter(
                    Article.id == analysis.article_id
                )
                .first()
            )

            ai_reports.append({
                "analysis_id": analysis.id,
                "tool_name": analysis.tool_name,
                "model_version": analysis.model_version,
                "article_id": analysis.article_id,

                "article_title": (
                    article.title if article else None
                ),

                "publisher": (
                    article.publisher if article else None
                ),

                "article_url": (
                    article.url if article else None
                ),

                "analysis_text": analysis.analysis_text,
                "source_suggestions": analysis.source_suggestions,
                "limitations": analysis.limitations,

                # No structured AI verdict exists yet
                "ai_verdict": None,
                "comparison_status": "not_comparable",
            })

        if ai_reports:
            claims_with_ai += 1
        else:
            claims_without_ai += 1

        results.append({
            "claim_id": claim.id,
            "claim_title": claim.title,
            "claim_text": claim.claim_text,
            "category": claim.category,

            "human_status": claim.status,
            "human_verdict": claim.verdict,
            "human_review_notes": claim.review_notes,

            "human_reviewed": is_reviewed,

            "ai_reports_count": len(ai_reports),
            "ai_reports": ai_reports,

            "comparison_status": (
                "awaiting_structured_ai_verdict"
                if ai_reports
                else "no_ai_analysis_linked"
            ),
        })

    return {
        "summary": {
            "total_claims": total_claims,
            "human_reviewed": human_reviewed,
            "pending_human_review": (
                total_claims - human_reviewed
            ),
            "claims_with_ai_analysis": claims_with_ai,
            "claims_without_ai_analysis": claims_without_ai,

            # Cannot calculate honestly yet
            "comparable_claims": 0,
            "agreement_rate": None,
        },

        "comparisons": results,
    }