"""
CampusIQ X - CareerAgent
----------------------------
Responsible for:
- Skill Gap Analysis
- Placement Readiness
- Career Roadmap
- Certification Suggestions
- Company Eligibility
"""

from __future__ import annotations

from agents.base_agent import BaseAgent
from models.schemas import AgentResult, AgentStatus, Student

# Reference skill sets per career path (simplified industry benchmarks)
CAREER_SKILL_MAP = {
    "Software Development Engineer": ["Python", "Java", "Data Structures", "Algorithms", "Git", "REST APIs"],
    "Data Scientist / ML Engineer": ["Python", "Machine Learning", "Deep Learning", "Statistics for AI", "SQL"],
    "Cloud Engineer": ["Azure", "AWS", "Docker", "Kubernetes", "Linux", "Networking"],
    "Full Stack Developer": ["JavaScript", "React", "Node.js", "SQL", "REST APIs", "Git"],
}

SALARY_BANDS = {
    "Low": "₹3.5 - 5 LPA",
    "Medium": "₹5 - 9 LPA",
    "High": "₹9 - 18 LPA",
}


class CareerAgent(BaseAgent):
    name = "CareerAgent"

    SYSTEM_PROMPT = (
        "You are CareerAgent inside CampusIQ X, an Azure AI Foundry "
        "powered academic platform. Given a student's skills, "
        "certifications, CGPA, and department, produce a JSON object with "
        "keys: 'placement_score' (0-100 float), 'career_path' (array of "
        "2-4 recommended role titles, most suitable first), "
        "'salary_prediction' (short string range in INR LPA), "
        "'skill_gaps' (array of missing skills for the top career path), "
        "'recommended_certifications' (array of 2-3 certification names), "
        "and 'confidence_score' (0-100 float). Respond ONLY with valid JSON."
    )

    @BaseAgent.timed
    def run(self, student: Student, query: str = "") -> AgentResult:
        best_path, skill_gaps, match_pct = self._best_career_path(student)
        placement_score = self._compute_placement_score(student, match_pct)
        salary_band = self._salary_band(placement_score)

        ai_output = self.ai_client.generate_reasoning(
            system_prompt=self.SYSTEM_PROMPT,
            user_prompt=(
                f"Generate career guidance for student {student.name} "
                f"({student.student_id}) in {student.department}."
            ),
            context={
                "skills": student.skills,
                "certifications": student.certifications,
                "cgpa": student.cgpa,
                "department": student.department,
                "computed_placement_score": placement_score,
                "computed_best_path": best_path,
                "computed_skill_gaps": skill_gaps,
            },
        )

        placement_score_final = ai_output.get("placement_score", placement_score)
        career_path = ai_output.get("career_path") or [best_path] + [
            p for p in CAREER_SKILL_MAP if p != best_path
        ][:1]
        salary_prediction = ai_output.get("salary_prediction", salary_band)
        final_skill_gaps = ai_output.get("skill_gaps") or skill_gaps
        recommended_certs = ai_output.get("recommended_certifications") or self._fallback_certs(final_skill_gaps)
        confidence = ai_output.get("confidence_score", 91.0 if self.ai_client.is_live else 86.0)

        summary = (
            f"{student.name} has a placement readiness score of "
            f"{round(placement_score_final, 1)}/100. Best-fit role: {best_path}. "
            f"{'No major skill gaps.' if not final_skill_gaps else f'{len(final_skill_gaps)} skill gap(s) to close.'}"
        )

        return self._build_result(
            status=AgentStatus.COMPLETED,
            confidence_score=confidence,
            summary=summary,
            data={
                "placement_score": round(placement_score_final, 1),
                "career_path": career_path,
                "salary_prediction": salary_prediction,
                "skill_gaps": final_skill_gaps,
                "recommended_certifications": recommended_certs,
            },
        )

    # ------------------------------------------------------------------
    # Lightweight scoring (no AI reasoning call)
    # ------------------------------------------------------------------
    def quick_placement_score(self, student: Student) -> float:
        """
        Compute the deterministic placement score only, without invoking
        `generate_reasoning` (which may perform an Azure OpenAI round-trip).

        Used by AnalyticsService to avoid running a full agent reasoning
        pass for every student when building dashboard/analytics charts.
        """
        _, _, match_pct = self._best_career_path(student)
        return self._compute_placement_score(student, match_pct)

    # ------------------------------------------------------------------
    # Deterministic helpers
    # ------------------------------------------------------------------
    def _best_career_path(self, student: Student) -> tuple[str, list[str], float]:
        student_skills = {s.lower() for s in student.skills}
        best_path = ""
        best_match_pct = -1.0
        best_gaps: list[str] = []

        for path, required in CAREER_SKILL_MAP.items():
            required_lower = [r.lower() for r in required]
            matched = [r for r in required if r.lower() in student_skills]
            gaps = [r for r in required if r.lower() not in student_skills]
            match_pct = (len(matched) / len(required)) * 100

            if match_pct > best_match_pct:
                best_match_pct = match_pct
                best_path = path
                best_gaps = gaps

        return best_path, best_gaps, best_match_pct

    def _compute_placement_score(self, student: Student, match_pct: float) -> float:
        score = (
            match_pct * 0.4
            + (student.cgpa / 10 * 100) * 0.3
            + min(len(student.certifications), 3) / 3 * 100 * 0.15
            + student.interview_readiness * 0.15
        )
        return round(self._clamp(score), 1)

    @staticmethod
    def _salary_band(placement_score: float) -> str:
        if placement_score >= 75:
            return SALARY_BANDS["High"]
        if placement_score >= 50:
            return SALARY_BANDS["Medium"]
        return SALARY_BANDS["Low"]

    @staticmethod
    def _fallback_certs(skill_gaps: list[str]) -> list[str]:
        suggestions = []
        for gap in skill_gaps[:3]:
            if "azure" in gap.lower():
                suggestions.append("Microsoft Azure AI Fundamentals (AI-900)")
            elif "machine learning" in gap.lower() or "deep learning" in gap.lower():
                suggestions.append("Coursera Machine Learning Specialization")
            elif "aws" in gap.lower():
                suggestions.append("AWS Certified Cloud Practitioner")
            else:
                suggestions.append(f"Online course: {gap} Fundamentals")
        return suggestions or ["Microsoft Azure AI Fundamentals (AI-900)"]
