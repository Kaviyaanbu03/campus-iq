"""
CampusIQ X - Pydantic Data Models
-----------------------------------
Centralized schema definitions used across the API layer, agents,
and services. Keeping these in one module enforces a single
source of truth for request/response contracts (Clean Architecture).
"""

from __future__ import annotations

from enum import Enum
from typing import Dict, List, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class RiskLevel(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class PlacementStatus(str, Enum):
    PLACED = "Placed"
    IN_PROGRESS = "In Progress"
    NOT_STARTED = "Not Started"


class AgentStatus(str, Enum):
    PENDING = "Pending"
    RUNNING = "Running"
    COMPLETED = "Completed"
    FAILED = "Failed"


# ---------------------------------------------------------------------------
# Core Student Model
# ---------------------------------------------------------------------------

class Student(BaseModel):
    student_id: str
    name: str
    department: str
    semester: int
    attendance_percent: float
    subjects: List[str]
    internal_marks: Dict[str, int]
    external_marks: Dict[str, int]
    cgpa: float
    skills: List[str]
    certifications: List[str]
    placement_status: PlacementStatus
    interview_readiness: float
    study_hours_per_day: float
    risk_level: RiskLevel
    weak_subjects: List[str]
    resume_score: float


# ---------------------------------------------------------------------------
# Agent Output Models
# ---------------------------------------------------------------------------

class AgentResult(BaseModel):
    """Common envelope returned by every sub-agent."""
    agent_name: str
    status: AgentStatus
    confidence_score: float = Field(ge=0, le=100)
    summary: str
    data: dict = Field(default_factory=dict)


class AnalysisOutput(BaseModel):
    academic_score: float
    risk_level: RiskLevel
    weak_subjects: List[str]
    recommendations: List[str]
    confidence_score: float


class StudyPlanOutput(BaseModel):
    weekly_plan: Dict[str, List[str]]
    daily_tasks: List[str]
    progress_tracker: Dict[str, int]
    confidence_score: float


class CareerOutput(BaseModel):
    placement_score: float
    career_path: List[str]
    salary_prediction: str
    skill_gaps: List[str]
    recommended_certifications: List[str]
    confidence_score: float


class ResumeOutput(BaseModel):
    resume_score: float
    skills_extracted: List[str]
    missing_skills: List[str]
    recommendations: List[str]
    job_match_percent: float
    confidence_score: float


class InterviewOutput(BaseModel):
    interview_score: float
    technical_questions: List[str]
    hr_questions: List[str]
    improvement_areas: List[str]
    confidence_score: float


# ---------------------------------------------------------------------------
# Chat / Orchestration Models
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    student_id: str
    message: str


class AgentTimelineStep(BaseModel):
    agent_name: str
    status: AgentStatus
    confidence_score: float
    summary: str


class ChatResponse(BaseModel):
    query: str
    student_id: str
    reasoning_timeline: List[AgentTimelineStep]
    final_response: str
    overall_confidence: float


# ---------------------------------------------------------------------------
# Study Plan Request
# ---------------------------------------------------------------------------

class StudyPlanRequest(BaseModel):
    student_id: str
    exam_date: Optional[str] = None
    hours_available_per_day: Optional[float] = None


# ---------------------------------------------------------------------------
# Placement Prediction Request
# ---------------------------------------------------------------------------

class PlacementPredictRequest(BaseModel):
    student_id: str
    target_companies: Optional[List[str]] = None


# ---------------------------------------------------------------------------
# Interview Questions Request
# ---------------------------------------------------------------------------

class InterviewRequest(BaseModel):
    student_id: str
    role: Optional[str] = "Software Engineer"
    difficulty: Optional[str] = "Intermediate"


# ---------------------------------------------------------------------------
# Dashboard / Analytics
# ---------------------------------------------------------------------------

class DashboardSummary(BaseModel):
    total_students: int
    placement_ready: int
    academic_risk_high: int
    average_cgpa: float
    average_attendance: float
    average_resume_score: float
    average_placement_score: float
    average_interview_score: float
    agent_health: Dict[str, str]
    recent_activities: List[str]


class AnalyticsResponse(BaseModel):
    attendance_trend: List[Dict[str, float]]
    cgpa_trend: List[Dict[str, float]]
    risk_distribution: Dict[str, int]
    placement_probability_distribution: List[Dict[str, float]]
    skill_distribution: Dict[str, int]
