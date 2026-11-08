from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Source
from app.schemas.source import SourceCreate, SourceResponse

router = APIRouter(
    prefix="/api/sources",
    tags=["Source Verification"]
)


@router.post("/", response_model=SourceResponse, status_code=201)
def create_source(
    source_data: SourceCreate,
    db: Session = Depends(get_db)
):
    source = Source(**source_data.model_dump())

    db.add(source)
    db.commit()
    db.refresh(source)

    return source


@router.get("/", response_model=list[SourceResponse])
def get_sources(db: Session = Depends(get_db)):
    return db.query(Source).order_by(Source.id.desc()).all()


@router.get("/{source_id}", response_model=SourceResponse)
def get_source(
    source_id: int,
    db: Session = Depends(get_db)
):
    source = db.query(Source).filter(
        Source.id == source_id
    ).first()

    if not source:
        raise HTTPException(
            status_code=404,
            detail="Source not found"
        )

    return source