from sqlalchemy import Column, Integer, String, Text, Float, DateTime
from sqlalchemy.sql import func

from app.database import Base


class Source(Base):
    __tablename__ = "sources"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(250), nullable=False)
    url = Column(Text, nullable=False)
    source_type = Column(String(100), nullable=True)

    reliability_score = Column(
        Float,
        nullable=True
    )

    description = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )