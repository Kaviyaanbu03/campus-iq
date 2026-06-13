"""
CampusIQ X - ResumeAgent
----------------------------
Responsible for:
- Resume Upload (PDF)
- PDF Parsing (Azure Document Intelligence)
- ATS Score
- Missing Skills
- Resume Suggestions
- Job Match Percentage
"""

from __future__ import annotations

import os
import re
from typing import Optional

from agents.base_agent import BaseAgent
from models.schemas import AgentResult, AgentStatus, Student

# Master skill vocabulary used for keyword extraction / ATS matching
SKILL_VOCABULARY = [
    "Python", "Java", "C++", "JavaScript", "TypeScript", "React", "Angular",
    "Vue", "Node.js", "Express", "FastAPI", "Django", "Flask", "SQL",
    "PostgreSQL", "MongoDB", "Machine Learning", "Deep Learning",
    "TensorFlow", "PyTorch", "NLP", "Computer Vision", "AWS", "Azure",
    "GCP", "Docker", "Kubernetes", "Git", "REST APIs", "GraphQL",
    "Data Structures", "Algorithms", "CI/CD", "Linux", "Power BI", "Excel",
    "Communication", "Leadership", "Problem Solving",
]


class ResumeAgent(BaseAgent):
    name = "ResumeAgent"

    SYSTEM_PROMPT = (
        "You are ResumeAgent inside CampusIQ X, an Azure AI Foundry "
        "powered academic platform. Given extracted resume text and a "
        "target job role, produce a JSON object with keys: "
        "'resume_score' (0-100 float, ATS-style score), 'skills_extracted' "
        "(array of skills found in the resume), 'missing_skills' (array of "
        "important skills missing for the target role), 'recommendations' "
        "(array of 3-5 short actionable resume improvement tips), "
        "'job_match_percent' (0-100 float), and 'confidence_score' "
        "(0-100 float). Respond ONLY with valid JSON."
    )

    @BaseAgent.timed
    def run(self, student: Student, query: str = "", resume_text: Optional[str] = None) -> AgentResult:
        """
        `resume_text` is the text extracted from an uploaded resume PDF via
        Azure Document Intelligence (see services/document_intelligence.py).
        If not provided (no upload yet), the agent analyzes the student's
        profile-listed skills as a proxy, so the platform still returns a
        meaningful result for demo purposes.
        """
        text_source = resume_text or self._profile_as_text(student)
        extracted_skills = self._extract_skills(text_source)
        ats_score = self._compute_ats_score(text_source, extracted_skills)
        job_match = self._job_match_percent(extracted_skills, student)

        ai_output = self.ai_client.generate_reasoning(
            system_prompt=self.SYSTEM_PROMPT,
            user_prompt=(
                f"Analyze this resume content for student {student.name} "
                f"targeting roles in {student.department}.\n\nResume text:\n{text_source[:4000]}"
            ),
            context={
                "extracted_skills": extracted_skills,
                "computed_ats_score": ats_score,
                "computed_job_match": job_match,
                "is_profile_proxy": resume_text is None,
            },
        )

        resume_score = ai_output.get("resume_score", ats_score)
        skills_extracted = ai_output.get("skills_extracted") or extracted_skills
        missing_skills = ai_output.get("missing_skills") or self._missing_skills(extracted_skills)
        recommendations = ai_output.get("recommendations") or self._fallback_recommendations(
            student, resume_text, extracted_skills
        )
        job_match_final = ai_output.get("job_match_percent", job_match)
        confidence = ai_output.get("confidence_score", 90.0 if self.ai_client.is_live else 84.0)

        summary = (
            f"Resume ATS score: {round(resume_score, 1)}/100, "
            f"job match: {round(job_match_final, 1)}%. "
            f"{len(skills_extracted)} relevant skill(s) detected."
        )

        return self._build_result(
            status=AgentStatus.COMPLETED,
            confidence_score=confidence,
            summary=summary,
            data={
                "resume_score": round(resume_score, 1),
                "skills_extracted": skills_extracted,
                "missing_skills": missing_skills,
                "recommendations": recommendations,
                "job_match_percent": round(job_match_final, 1),
                "source": "uploaded_resume" if resume_text else "profile_proxy",
            },
        )

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    @staticmethod
    def _profile_as_text(student: Student) -> str:
        return (
            f"{student.name} - {student.department} student. "
            f"Skills: {', '.join(student.skills)}. "
            f"Certifications: {', '.join(student.certifications)}. "
            f"CGPA: {student.cgpa}."
        )

    @staticmethod
    def _extract_skills(text: str) -> list[str]:
        text_lower = text.lower()
        found = []
        for skill in SKILL_VOCABULARY:
            pattern = r"\b" + re.escape(skill.lower()) + r"\b"
            if re.search(pattern, text_lower):
                found.append(skill)
        return found

    @staticmethod
    def _compute_ats_score(text: str, extracted_skills: list[str]) -> float:
        # Heuristic ATS scoring: skill density + length + section keywords
        score = 40.0
        score += min(len(extracted_skills), 12) * 3  # up to +36
        for keyword in ["experience", "education", "project", "certification", "summary"]:
            if keyword in text.lower():
                score += 3  # up to +15
        return round(min(score, 100.0), 1)

    @staticmethod
    def _job_match_percent(extracted_skills: list[str], student: Student) -> float:
        if not SKILL_VOCABULARY:
            return 0.0
        match = len(set(extracted_skills) & set(SKILL_VOCABULARY))
        return round((match / len(SKILL_VOCABULARY)) * 100, 1)

    @staticmethod
    def _missing_skills(extracted_skills: list[str]) -> list[str]:
        high_value = ["Azure", "Docker", "Kubernetes", "Data Structures", "Algorithms", "REST APIs"]
        return [s for s in high_value if s not in extracted_skills][:5]

    @staticmethod
    def _fallback_recommendations(
        student: Student, resume_text: Optional[str], extracted_skills: list[str]
    ) -> list[str]:
        recs = []
        if resume_text is None:
            recs.append("Upload your resume (PDF) for a full ATS analysis via Azure Document Intelligence.")
        if "Azure" not in extracted_skills:
            recs.append("Add Azure cloud experience or certifications (e.g., AZ-900, AI-900).")
        if len(extracted_skills) < 6:
            recs.append("Add a dedicated 'Technical Skills' section listing relevant tools and languages.")
        recs.append("Quantify project impact with metrics (e.g., 'improved performance by 30%').")
        recs.append("Use strong action verbs (built, designed, optimized, deployed).")
        return recs[:5]
