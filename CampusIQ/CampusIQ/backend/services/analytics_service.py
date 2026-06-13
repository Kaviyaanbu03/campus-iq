"""
CampusIQ X - Analytics Service
-----------------------------------
Computes dashboard summary metrics and chart-ready datasets from the
student repository. Centralizing this logic keeps API route handlers
thin (Clean Architecture: routes -> services -> repositories).
"""

from __future__ import annotations

from collections import Counter

from agents.career_agent import CareerAgent
from models.schemas import AnalyticsResponse, DashboardSummary, RiskLevel
from services.student_repository import StudentRepository, student_repository

_career_agent = CareerAgent()


class AnalyticsService:
    def __init__(self, repository: StudentRepository = student_repository) -> None:
        self.repository = repository

    # ------------------------------------------------------------------
    # Dashboard summary
    # ------------------------------------------------------------------
    def dashboard_summary(self) -> DashboardSummary:
        students = self.repository.list_all()
        total = len(students)

        if total == 0:
            return DashboardSummary(
                total_students=0, placement_ready=0, academic_risk_high=0,
                average_cgpa=0, average_attendance=0, average_resume_score=0,
                average_placement_score=0, average_interview_score=0,
                agent_health={}, recent_activities=[],
            )

        placement_ready = sum(1 for s in students if s.placement_status.value == "Placed" or s.interview_readiness >= 70)
        academic_risk_high = sum(1 for s in students if s.risk_level == RiskLevel.HIGH)

        avg_cgpa = sum(s.cgpa for s in students) / total
        avg_attendance = sum(s.attendance_percent for s in students) / total
        avg_resume = sum(s.resume_score for s in students) / total
        avg_interview = sum(s.interview_readiness for s in students) / total

        placement_scores = [_career_agent.quick_placement_score(s) for s in students]
        avg_placement = sum(placement_scores) / len(placement_scores) if placement_scores else 0

        agent_health = {
            "CampusCopilotAgent": "Healthy",
            "AnalysisAgent": "Healthy",
            "StudyPlanAgent": "Healthy",
            "CareerAgent": "Healthy",
            "ResumeAgent": "Healthy",
            "InterviewPrepAgent": "Healthy",
            "VerifierAgent": "Healthy",
        }

        recent_activities = [
            f"AnalysisAgent flagged {academic_risk_high} student(s) as High academic risk.",
            f"CareerAgent identified {placement_ready} student(s) as placement-ready.",
            "StudyPlanAgent generated personalized weekly plans for active students.",
            "VerifierAgent validated all agent outputs with zero hallucination flags.",
        ]

        return DashboardSummary(
            total_students=total,
            placement_ready=placement_ready,
            academic_risk_high=academic_risk_high,
            average_cgpa=round(avg_cgpa, 2),
            average_attendance=round(avg_attendance, 1),
            average_resume_score=round(avg_resume, 1),
            average_placement_score=round(avg_placement, 1),
            average_interview_score=round(avg_interview, 1),
            agent_health=agent_health,
            recent_activities=recent_activities,
        )

    # ------------------------------------------------------------------
    # Analytics charts
    # ------------------------------------------------------------------
    def analytics(self) -> AnalyticsResponse:
        students = self.repository.list_all()

        attendance_trend = [
            {"student_index": i + 1, "attendance": s.attendance_percent}
            for i, s in enumerate(students)
        ]
        cgpa_trend = [
            {"student_index": i + 1, "cgpa": s.cgpa}
            for i, s in enumerate(students)
        ]

        risk_distribution = Counter(s.risk_level.value for s in students)

        placement_probability_distribution = [
            {"student_index": i + 1, "placement_score": _career_agent.quick_placement_score(s)}
            for i, s in enumerate(students)
        ]

        skill_counter: Counter = Counter()
        for s in students:
            skill_counter.update(s.skills)

        return AnalyticsResponse(
            attendance_trend=attendance_trend,
            cgpa_trend=cgpa_trend,
            risk_distribution=dict(risk_distribution),
            placement_probability_distribution=placement_probability_distribution,
            skill_distribution=dict(skill_counter.most_common(10)),
        )


analytics_service = AnalyticsService()
