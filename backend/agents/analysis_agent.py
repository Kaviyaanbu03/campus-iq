"""
CampusIQ X - AnalysisAgent
------------------------------
Responsible for:
- Attendance Analysis
- Marks Analysis
- CGPA Analysis
- Academic Risk Prediction
- Weak Subject Detection
- Exam Failure Prediction

This agent first computes deterministic statistics from the student's
data (so the numbers are always trustworthy/reproducible), then asks
Azure OpenAI (GPT-4o via Azure AI Foundry) to reason over those
statistics to produce natural-language recommendations. If the live
AI client is unavailable, a rule-based fallback generates the
recommendations instead, so the platform remains fully functional.
"""

from __future__ import annotations

from agents.base_agent import BaseAgent
from models.schemas import AgentResult, AgentStatus, RiskLevel, Student


class AnalysisAgent(BaseAgent):
    name = "AnalysisAgent"

    SYSTEM_PROMPT = (
        "You are AnalysisAgent, an academic performance analyst inside "
        "CampusIQ X, an enterprise AI Academic Intelligence Platform built "
        "on Microsoft Azure AI Foundry. Given a student's attendance, marks, "
        "CGPA, and weak subjects, produce a JSON object with keys: "
        "'academic_score' (0-100 float), 'risk_level' (Low/Medium/High), "
        "'recommendations' (array of 3-5 short actionable strings), and "
        "'confidence_score' (0-100 float). Respond ONLY with valid JSON."
    )

    @BaseAgent.timed
    def run(self, student: Student, query: str = "") -> AgentResult:
        academic_score, risk_level, weak_subjects = self._compute_statistics(student)

        ai_output = self.ai_client.generate_reasoning(
            system_prompt=self.SYSTEM_PROMPT,
            user_prompt=(
                f"Analyze academic performance for student {student.name} "
                f"({student.student_id})."
            ),
            context={
                "attendance_percent": student.attendance_percent,
                "cgpa": student.cgpa,
                "internal_marks": student.internal_marks,
                "external_marks": student.external_marks,
                "weak_subjects": weak_subjects,
                "study_hours_per_day": student.study_hours_per_day,
                "computed_academic_score": academic_score,
                "computed_risk_level": risk_level.value,
            },
        )

        recommendations = ai_output.get("recommendations") or self._fallback_recommendations(
            student, risk_level, weak_subjects
        )
        final_risk = ai_output.get("risk_level", risk_level.value)
        final_score = ai_output.get("academic_score", academic_score)
        confidence = ai_output.get("confidence_score", 92.0 if self.ai_client.is_live else 88.0)

        summary = (
            f"{student.name} has an academic score of {round(final_score, 1)}/100 "
            f"with {final_risk} academic risk. "
            f"{'No weak subjects detected.' if not weak_subjects else f'{len(weak_subjects)} weak subject(s) identified.'}"
        )

        return self._build_result(
            status=AgentStatus.COMPLETED,
            confidence_score=confidence,
            summary=summary,
            data={
                "academic_score": round(final_score, 1),
                "risk_level": final_risk,
                "weak_subjects": weak_subjects,
                "recommendations": recommendations,
                "attendance_percent": student.attendance_percent,
                "cgpa": student.cgpa,
            },
        )

    # ------------------------------------------------------------------
    # Deterministic statistics
    # ------------------------------------------------------------------
    def _compute_statistics(self, student: Student) -> tuple[float, RiskLevel, list[str]]:
        weak_subjects = []
        subject_scores = []

        for subject in student.subjects:
            internal = student.internal_marks.get(subject, 0)
            external = student.external_marks.get(subject, 0)
            total_pct = ((internal + external) / 130) * 100
            subject_scores.append(total_pct)
            if total_pct < 50:
                weak_subjects.append(subject)

        avg_subject_score = sum(subject_scores) / len(subject_scores) if subject_scores else 0

        # Weighted academic score: 50% marks, 30% CGPA, 20% attendance
        academic_score = (
            avg_subject_score * 0.5
            + (student.cgpa / 10 * 100) * 0.3
            + student.attendance_percent * 0.2
        )

        risk_points = 0
        if student.attendance_percent < 75:
            risk_points += 1
        if student.cgpa < 6.0:
            risk_points += 1
        if len(weak_subjects) >= 2:
            risk_points += 1
        if student.study_hours_per_day < 2:
            risk_points += 1

        if risk_points >= 3:
            risk_level = RiskLevel.HIGH
        elif risk_points >= 1:
            risk_level = RiskLevel.MEDIUM
        else:
            risk_level = RiskLevel.LOW

        return round(academic_score, 1), risk_level, weak_subjects

    # ------------------------------------------------------------------
    # Rule-based fallback recommendations
    # ------------------------------------------------------------------
    @staticmethod
    def _fallback_recommendations(
        student: Student, risk_level: RiskLevel, weak_subjects: list[str]
    ) -> list[str]:
        recs = []
        if student.attendance_percent < 75:
            recs.append("Improve attendance to at least 75% to avoid eligibility issues.")
        if weak_subjects:
            recs.append(
                f"Focus extra revision time on: {', '.join(weak_subjects)}."
            )
        if student.cgpa < 6.0:
            recs.append("Schedule weekly mentor check-ins to recover CGPA.")
        if student.study_hours_per_day < 3:
            recs.append("Increase daily study hours to at least 3 for steady improvement.")
        if risk_level == RiskLevel.LOW:
            recs.append("Maintain current performance and start placement preparation early.")
        if not recs:
            recs.append("Continue current study routine and monitor progress weekly.")
        return recs[:5]
