from datetime import date, datetime
from typing import Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    HttpUrl,
    field_validator
)


ArticleType = Literal[
    "Politics",
    "Business",
    "Technology",
    "Health",
    "International"
]

CredibilityLabel = Literal[
    "Not assessed",
    "High",
    "Medium",
    "Low",
    "Questionable"
]


class ArticleCreate(BaseModel):

    title: str = Field(min_length=5, max_length=500)

    publisher: str = Field(min_length=2, max_length=250)

    author: str | None = Field(default=None, max_length=250)

    publication_date: date | None = None

    url: str

    article_type: ArticleType

    subject: str = Field(min_length=3, max_length=500)

    summary: str | None = None

    initial_credibility: CredibilityLabel = "Not assessed"

    credibility_notes: str | None = None

    @field_validator("url")
    @classmethod
    def validate_url(cls, value: str) -> str:

        value = value.strip()

        parsed = HttpUrl(value)

        return str(parsed)


class ArticleUpdate(BaseModel):

    title: str | None = Field(
        default=None,
        min_length=5,
        max_length=500
    )

    publisher: str | None = Field(
        default=None,
        min_length=2,
        max_length=250
    )

    author: str | None = None

    publication_date: date | None = None

    url: str | None = None

    article_type: ArticleType | None = None

    subject: str | None = None

    summary: str | None = None

    initial_credibility: CredibilityLabel | None = None

    credibility_notes: str | None = None

    @field_validator("url")
    @classmethod
    def validate_url(cls, value: str | None) -> str | None:

        if value is None:
            return value

        return str(HttpUrl(value.strip()))


class ArticleResponse(BaseModel):

    model_config = ConfigDict(from_attributes=True)

    id: int

    title: str

    publisher: str

    author: str | None

    publication_date: date | None

    url: str

    article_type: str

    subject: str

    summary: str | None

    initial_credibility: str

    credibility_notes: str | None

    created_at: datetime | None

    updated_at: datetime | None