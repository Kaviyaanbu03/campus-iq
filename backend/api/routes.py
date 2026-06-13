"""
CampusIQ X - API Routes
---------------------------
All REST endpoints required by the CampusIQ X specification:

    GET  /students
    GET  /student/{id}
    POST /chat
    POST /studyplan
    POST /resume/upload
    POST /placement/predict
    POST /interview/questions
    GET  /analytics
    GET  /dashboard
"""

from __future__ import annotations

from fastapi import APIRouter, File, HTTPException, UploadFile

from agents.campus_copilot import campus_copilot_agent
from agents.career_agent import CareerAgent
from agents.interview_agent import InterviewPrepAgent
from agents.resume_agent import ResumeAgent
from agents.study_agent import StudyPlanAgent
from models.schemas import (
    AnalyticsResponse,
    ChatRequest,
    ChatResponse,
    DashboardSummary,
    InterviewRequest,
    PlacementPredictRequest,
    Student,
    StudyPlanRequest,
)
from services.analytics_service import analytics_service
from services.document_intelligence import document_intelligence_service
from services.student_repository import student_repository

router = APIRouter()

_career_agent = CareerAgent()
_study_agent = StudyPlanAgent()
_interview_agent = InterviewPrepAgent()
_resume_agent = ResumeAgent()


def _get_student_or_404(student_id: str) -> Student:
    student = student_repository.get_by_id(student_id)
    if student is None:
        raise HTTPException(status_code=404, detail=f"Student '{student_id}' not found.")
    return student


# ---------------------------------------------------------------------------
# Student endpoints
# ---------------------------------------------------------------------------

@router.get("/students", response_model=list[Student], tags=["Students"])
def get_students():
    """Return all students in the synthetic dataset."""
    return student_repository.list_all()


@router.get("/student/{student_id}", response_model=Student, tags=["Students"])
def get_student(student_id: str):
    """Return a single student's profile by ID (e.g. CIQ0001)."""
    return _get_student_or_404(student_id)


# ---------------------------------------------------------------------------
# AI Chat (CampusCopilotAgent orchestration)
# ---------------------------------------------------------------------------

@router.post("/chat", response_model=ChatResponse, tags=["AI Chat"])
def chat(request: ChatRequest):
    """
    Route a student's natural-language query through CampusCopilotAgent,
    which orchestrates AnalysisAgent, StudyPlanAgent, CareerAgent,
    ResumeAgent, InterviewPrepAgent, and VerifierAgent as needed.
    """
    student = _get_student_or_404(request.student_id)
    return campus_copilot_agent.handle_query(student=student, query=request.message)


# ---------------------------------------------------------------------------
# Study Plan
# ---------------------------------------------------------------------------

@router.post("/studyplan", tags=["Study Planner"])
def generate_study_plan(request: StudyPlanRequest):
    """Generate a personalized weekly study plan via StudyPlanAgent."""
    student = _get_student_or_404(request.student_id)
    result = _study_agent.run(student=student)
    return result


# ---------------------------------------------------------------------------
# Resume Upload & Analysis
# ---------------------------------------------------------------------------

@router.post("/resume/upload", tags=["Resume Review"])
async def upload_resume(student_id: str, file: UploadFile = File(...)):
    """
    Upload a resume PDF for analysis. Text is extracted via Azure
    Document Intelligence (with a local pypdf fallback) and analyzed
    by ResumeAgent for ATS score, skill gaps, and recommendations.
    """
    student = _get_student_or_404(student_id)

    if file.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    file_bytes = await file.read()
    resume_text = document_intelligence_service.extract_text(file_bytes)

    if not resume_text.strip():
        raise HTTPException(
            status_code=422,
            detail="Could not extract text from the uploaded PDF. Please try a different file.",
        )

    result = _resume_agent.run(student=student, resume_text=resume_text)
    return result


# ---------------------------------------------------------------------------
# Placement Prediction
# ---------------------------------------------------------------------------

@router.post("/placement/predict", tags=["Placement Readiness"])
def predict_placement(request: PlacementPredictRequest):
    """Generate placement readiness score and career roadmap via CareerAgent."""
    student = _get_student_or_404(request.student_id)
    result = _career_agent.run(student=student)
    return result


# ---------------------------------------------------------------------------
# Interview Prep
# ---------------------------------------------------------------------------

@router.post("/interview/questions", tags=["Interview Coach"])
def generate_interview_questions(request: InterviewRequest):
    """Generate mock interview questions and readiness score via InterviewPrepAgent."""
    student = _get_student_or_404(request.student_id)
    result = _interview_agent.run(
        student=student, role=request.role, difficulty=request.difficulty
    )
    return result


# ---------------------------------------------------------------------------
# Analytics & Dashboard
# ---------------------------------------------------------------------------

@router.get("/analytics", response_model=AnalyticsResponse, tags=["Analytics"])
def get_analytics():
    """Return chart-ready analytics data (trends, distributions)."""
    return analytics_service.analytics()


@router.get("/dashboard", response_model=DashboardSummary, tags=["Dashboard"])
def get_dashboard():
    """Return aggregated dashboard summary metrics."""
    return analytics_service.dashboard_summary()
