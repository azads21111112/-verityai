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

    evidence_type = Column(
        String(30),
        nullable=False
    )

    description = Column(Text, nullable=True)

    reliability_score = Column(Float, nullable=True)

    published_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )



    