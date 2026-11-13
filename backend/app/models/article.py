from sqlalchemy import Column, Integer, String, Text, Date, DateTime
from sqlalchemy.sql import func

from app.database import Base


class Article(Base):
    __tablename__ = "news_articles"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(500), nullable=False)
    publisher = Column(String(250), nullable=False)
    author = Column(String(250), nullable=True)

    publication_date = Column(Date, nullable=True)

    url = Column(Text, nullable=False, unique=True, index=True)

    article_type = Column(String(50), nullable=False, index=True)

    subject = Column(String(500), nullable=False)
    summary = Column(Text, nullable=True)

    initial_credibility = Column(
        String(30),
        nullable=False,
        default="Not assessed"
    )

    credibility_notes = Column(Text, nullable=True)

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