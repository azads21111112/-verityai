from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status
)

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db

from app.models.article import Article

from app.schemas.article import (
    ArticleCreate,
    ArticleResponse,
    ArticleUpdate
)


router = APIRouter(
    prefix="/api/articles",
    tags=["News Article Management"]
)


# CREATE ARTICLE
@router.post(
    "/",
    response_model=ArticleResponse,
    status_code=status.HTTP_201_CREATED
)
def create_article(
    article_data: ArticleCreate,
    db: Session = Depends(get_db)
):

    article = Article(**article_data.model_dump())

    db.add(article)

    try:

        db.commit()

    except IntegrityError:

        db.rollback()

        raise HTTPException(
            status_code=409,
            detail="An article with this URL already exists."
        )

    db.refresh(article)

    return article


# GET ALL ARTICLES
@router.get("/", response_model=list[ArticleResponse])
def get_articles(
    article_type: str | None = Query(default=None),
    search: str | None = Query(default=None, min_length=1),
    db: Session = Depends(get_db)
):

    query = db.query(Article)

    if article_type:

        query = query.filter(
            Article.article_type == article_type
        )

    if search:

        term = f"%{search.strip()}%"

        query = query.filter(
            Article.title.ilike(term)
            | Article.publisher.ilike(term)
            | Article.subject.ilike(term)
        )

    return query.order_by(
        Article.created_at.desc(),
        Article.id.desc()
    ).all()


# GET SINGLE ARTICLE
@router.get("/{article_id}", response_model=ArticleResponse)
def get_article(
    article_id: int,
    db: Session = Depends(get_db)
):

    article = db.query(Article).filter(
        Article.id == article_id
    ).first()

    if not article:

        raise HTTPException(
            status_code=404,
            detail="Article not found."
        )

    return article


# UPDATE ARTICLE
@router.patch("/{article_id}", response_model=ArticleResponse)
def update_article(
    article_id: int,
    article_data: ArticleUpdate,
    db: Session = Depends(get_db)
):

    article = db.query(Article).filter(
        Article.id == article_id
    ).first()

    if not article:

        raise HTTPException(
            status_code=404,
            detail="Article not found."
        )

    update_data = article_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():

        setattr(article, field, value)

    try:

        db.commit()

    except IntegrityError:

        db.rollback()

        raise HTTPException(
            status_code=409,
            detail="An article with this URL already exists."
        )

    db.refresh(article)

    return article


# DELETE ARTICLE
@router.delete(
    "/{article_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_article(
    article_id: int,
    db: Session = Depends(get_db)
):

    article = db.query(Article).filter(
        Article.id == article_id
    ).first()

    if not article:

        raise HTTPException(
            status_code=404,
            detail="Article not found."
        )

    db.delete(article)

    db.commit()

    return None