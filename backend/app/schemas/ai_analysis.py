from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


AITool = Literal["ChatGPT", "Gemini", "Claude"]


class AIAnalysisCreate(BaseModel):

    article_id: int

    tool_name: AITool

    model_version: str | None = None

    analysis_text: str = Field(min_length=10)

    claims_extracted: int = Field(
        default=0,
        ge=0
    )

    source_suggestions: str | None = None

    limitations: str | None = None

    analysis_date: datetime | None = None


class AIAnalysisUpdate(BaseModel):

    tool_name: AITool | None = None

    model_version: str | None = None

    analysis_text: str | None = Field(
        default=None,
        min_length=10
    )

    claims_extracted: int | None = Field(
        default=None,
        ge=0
    )

    source_suggestions: str | None = None

    limitations: str | None = None

    analysis_date: datetime | None = None


class AIAnalysisResponse(BaseModel):

    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    article_id: int
    tool_name: str
    model_version: str | None
    analysis_text: str
    claims_extracted: int
    source_suggestions: str | None
    limitations: str | None
    analysis_date: datetime | None
    created_at: datetime
    updated_at: datetime | None