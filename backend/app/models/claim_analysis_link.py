from sqlalchemy import (
    Column,
    Integer,
    ForeignKey,
    DateTime,
    UniqueConstraint,
)
from sqlalchemy.sql import func

from app.database import Base


class ClaimAnalysisLink(Base):
    __tablename__ = "claim_analysis_links"

    id = Column(Integer, primary_key=True, index=True)

    claim_id = Column(
        Integer,
        ForeignKey("claims.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    analysis_id = Column(
        Integer,
        ForeignKey("ai_analyses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "claim_id",
            "analysis_id",
            name="uq_claim_analysis_link",
        ),
    )