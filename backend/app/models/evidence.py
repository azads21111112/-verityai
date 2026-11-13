from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Float,
    DateTime,
    ForeignKey
)
from sqlalchemy.sql import func

from app.database import Base


class Evidence(Base):
    __tablename__ = "evidences"

    id = Column(Integer, primary_key=True, index=True)

    claim_id = Column(
        Integer,
        ForeignKey("claims.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    title = Column(String(250), nullable=False)

    source_name = Column(String(250), nullable=False)

    source_url = Column(Text, nullable=False)

    # Source classification
    source_type = Column(
        String(50),
        nullable=True
    )

    # Supporting / Contradicting / Neutral
    evidence_type = Column(
        String(30),
        nullable=False
    )

    # Relevant text from the original source
    excerpt = Column(Text, nullable=True)

    description = Column(Text, nullable=True)

    reliability_score = Column(Float, nullable=True)

    published_at = Column(DateTime(timezone=True), nullable=True)

    accessed_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )