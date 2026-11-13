from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.database import get_db

from app.models.article import Article
from app.models.ai_analysis import AIAnalysis

from app.schemas.ai_analysis import (
    AIAnalysisCreate,
    AIAnalysisUpdate,
    AIAnalysisResponse,
)


router = APIRouter(
    prefix="/api/ai-analyses",
    tags=["AI Analysis Management"],
)


# CREATE AI ANALYSIS
@router.post(
    "/",
    response_model=AIAnalysisResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_analysis(
    data: AIAnalysisCreate,
    db: Session = Depends(get_db),
):

    article = db.query(Article).filter(
        Article.id == data.article_id
    ).first()

    if not article:
        raise HTTPException(
            status_code=404,
            detail="Article not found.",
        )

    analysis = AIAnalysis(
        **data.model_dump()
    )

    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return analysis


# GET ALL ANALYSES
@router.get(
    "/",
    response_model=list[AIAnalysisResponse],
)
def get_analyses(
    article_id: int | None = None,
    tool_name: str | None = None,
    db: Session = Depends(get_db),
):

    query = db.query(AIAnalysis)

    if article_id is not None:
        query = query.filter(
            AIAnalysis.article_id == article_id
        )

    if tool_name:
        query = query.filter(
            AIAnalysis.tool_name == tool_name
        )

    return query.order_by(
        AIAnalysis.created_at.desc()
    ).all()


# GET SINGLE ANALYSIS
@router.get(
    "/{analysis_id}",
    response_model=AIAnalysisResponse,
)
def get_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
):

    analysis = db.query(AIAnalysis).filter(
        AIAnalysis.id == analysis_id
    ).first()

    if not analysis:
        raise HTTPException(
            status_code=404,
            detail="Analysis not found.",
        )

    return analysis


# UPDATE ANALYSIS
@router.patch(
    "/{analysis_id}",
    response_model=AIAnalysisResponse,
)
def update_analysis(
    analysis_id: int,
    data: AIAnalysisUpdate,
    db: Session = Depends(get_db),
):

    analysis = db.query(AIAnalysis).filter(
        AIAnalysis.id == analysis_id
    ).first()

    if not analysis:
        raise HTTPException(
            status_code=404,
            detail="Analysis not found.",
        )

    update_data = data.model_dump(
        exclude_unset=True
    )

    required_fields = {
        "tool_name",
        "analysis_text",
        "claims_extracted",
    }

    for field in required_fields:
        if field in update_data and update_data[field] is None:
            raise HTTPException(
                status_code=422,
                detail=f"{field} cannot be null.",
            )

    for field, value in update_data.items():
        setattr(analysis, field, value)

    db.commit()
    db.refresh(analysis)

    return analysis


# DELETE ANALYSIS
@router.delete(
    "/{analysis_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
):

    analysis = db.query(AIAnalysis).filter(
        AIAnalysis.id == analysis_id
    ).first()

    if not analysis:
        raise HTTPException(
            status_code=404,
            detail="Analysis not found.",
        )

    db.delete(analysis)
    db.commit()

    return None