import os

from fastapi import FastAPI
from sqlalchemy import text
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.models import Claim, Evidence, Source

from app.routers.claims import router as claims_router
from app.routers.evidences import router as evidences_router


from app.routers.evidence_repository import router as evidence_repository_router

from app.routers.sources import router as sources_router
from app.models import Claim, Evidence, Source, Article, AIAnalysis
from app.routers import claim_analysis_links
from app.routers import comparison

from app.models import (
    Claim,
    Evidence,
    Source,
    Article,
    AIAnalysis,
    ClaimAnalysisLink,
)

from app.routers.articles import router as articles_router
from app.routers.ai_analyses import router as ai_analyses_router


app = FastAPI(
    title="VerityAI API",
    description="AI Fake News Detection and Verification Platform",
    version="1.0.0",
)

# Configure CORS for local and production frontend
frontend_urls = os.getenv("FRONTEND_URL", "")

allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://localhost",
    "http://localhost",
    "capacitor://localhost",
]

if frontend_urls:
    allowed_origins.extend(
        url.strip()
        for url in frontend_urls.split(",")
        if url.strip()
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Register API routers
app.include_router(claims_router)
app.include_router(evidences_router)

app.include_router(evidence_repository_router)
app.include_router(sources_router)
app.include_router(articles_router)
app.include_router(ai_analyses_router)
app.include_router(claim_analysis_links.router)
app.include_router(comparison.router)

@app.get("/")
def root():
    return {
        "message": "Welcome to VerityAI API",
        "status": "running",
        "version": "1.0.0",
    }


@app.get("/health")
def health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "connected",
        }

    except Exception:
        return {
            "status": "unhealthy",
            "database": "disconnected",
        }
