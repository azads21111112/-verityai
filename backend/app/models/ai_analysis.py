from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
)
from sqlalchemy.sql import func

from app.database import Base


class AIAnalysis(Base):

    __tablename__ = "ai_analyses"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    article_id = Column(
        Integer,
        ForeignKey(
            "news_articles.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    tool_name = Column(
        String(50),
        nullable=False,
        index=True
    )

    model_version = Column(
        String(150),
        nullable=True
    )

    analysis_text = Column(
        Text,
        nullable=False
    )

    claims_extracted = Column(
        Integer,
        nullable=False,
        default=0
    )

    source_suggestions = Column(
        Text,
        nullable=True
    )

    limitations = Column(
        Text,
        nullable=True
    )

    analysis_date = Column(
        DateTime(timezone=True),
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    updated_at = Column(
        DateTime(timezone=True),
        onupdate=func.now(),
        nullable=True
    )