"""
CampusIQ X - FastAPI Application Entrypoint
------------------------------------------------
Run locally:
    uvicorn main:app --reload --port 8000

API docs available at:
    http://localhost:8000/docs
"""

from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import router as api_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("campusiq.main")

app = FastAPI(
    title="CampusIQ X API",
    description=(
        "CampusIQ X - AI Powered Academic Intelligence Platform. "
        "Multi-agent reasoning system built on Microsoft Azure AI Foundry "
        "(Azure OpenAI GPT-4o, Azure AI Search, Azure Document "
        "Intelligence, Azure Cosmos DB, Azure Blob Storage)."
    ),
    version="1.0.0",
)

# CORS - allow the React frontend (Vite dev server + production build) to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your frontend domain(s)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/", tags=["Health"])
def root():
    return {
        "service": "CampusIQ X API",
        "status": "running",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health_check():
    from services.azure_ai_client import azure_ai_client

    return {
        "status": "healthy",
        "azure_openai_live": azure_ai_client.is_live,
        "agents": [
            "CampusCopilotAgent",
            "AnalysisAgent",
            "StudyPlanAgent",
            "CareerAgent",
            "ResumeAgent",
            "InterviewPrepAgent",
            "VerifierAgent",
        ],
    }
