from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func

from app.database import Base


class Claim(Base):
    __tablename__ = "claims"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(250), nullable=False)
    claim_text = Column(Text, nullable=False)
    category = Column(String(100), nullable=True)
    source_url = Column(Text, nullable=True)
    status = Column(String(30), default="pending", nullable=False)
    verdict = Column(String(30), nullable=True)
    review_notes = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )