"""
CampusIQ X - InterviewPrepAgent
-----------------------------------
Responsible for:
- Generate Technical Questions
- HR Questions
- Mock Interview
- Communication Suggestions
- STAR Method Guidance
"""

from __future__ import annotations

from agents.base_agent import BaseAgent
from models.schemas import AgentResult, AgentStatus, Student

TECH_QUESTION_BANK = {
    "Data Structures": [
        "Explain the difference between an array and a linked list.",
        "How does a hash map achieve O(1) average lookup time?",
        "Walk through how you would detect a cycle in a linked list.",
    ],
    "Operating Systems": [
        "What is the difference between a process and a thread?",
        "Explain deadlock and how it can be prevented.",
    ],
    "DBMS": [
        "What is normalization and why is it important?",
        "Explain ACID properties with an example.",
    ],
    "Computer Networks": [
        "Explain the difference between TCP and UDP.",
        "What happens when you type a URL into a browser?",
    ],
    "Machine Learning": [
        "Explain the bias-variance tradeoff.",
        "What is overfitting and how can it be prevented?",
    ],
    "Cloud Computing": [
        "What is the difference between IaaS, PaaS, and SaaS?",
        "Explain how Azure App Service differs from Azure Functions.",
    ],
    "default": [
        "Describe a challenging project you worked on and your role in it.",
        "How do you approach debugging a complex issue?",
    ],
}

HR_QUESTIONS = [
    "Tell me about yourself.",
    "What are your strengths and weaknesses?",
    "Why do you want to work at our company?",
    "Describe a time you worked in a team to solve a problem (use STAR method).",
    "Where do you see yourself in 5 years?",
]


class InterviewPrepAgent(BaseAgent):
    name = "InterviewPrepAgent"

    SYSTEM_PROMPT = (
        "You are InterviewPrepAgent inside CampusIQ X, an Azure AI Foundry "
        "powered academic platform. Given a student's department, weak "
        "subjects, target role, and interview readiness score, produce a "
        "JSON object with keys: 'interview_score' (0-100 float), "
        "'technical_questions' (array of 5 role-relevant technical "
        "questions), 'hr_questions' (array of 3-5 common HR questions), "
        "'improvement_areas' (array of 2-4 short strings using STAR method "
        "and communication guidance), and 'confidence_score' (0-100 "
        "float). Respond ONLY with valid JSON."
    )

    @BaseAgent.timed
    def run(self, student: Student, query: str = "", role: str = "Software Engineer", difficulty: str = "Intermediate") -> AgentResult:
        technical_questions = self._build_technical_questions(student)

        ai_output = self.ai_client.generate_reasoning(
            system_prompt=self.SYSTEM_PROMPT,
            user_prompt=(
                f"Generate interview preparation material for student "
                f"{student.name} targeting a '{role}' role at "
                f"'{difficulty}' difficulty."
            ),
            context={
                "department": student.department,
                "weak_subjects": student.weak_subjects,
                "interview_readiness": student.interview_readiness,
                "skills": student.skills,
                "computed_technical_questions": technical_questions,
            },
        )

        interview_score = ai_output.get("interview_score", student.interview_readiness)
        final_technical = ai_output.get("technical_questions") or technical_questions
        final_hr = ai_output.get("hr_questions") or HR_QUESTIONS[:4]
        improvement_areas = ai_output.get("improvement_areas") or self._fallback_improvements(student)
        confidence = ai_output.get("confidence_score", 93.0 if self.ai_client.is_live else 87.0)

        summary = (
            f"Interview readiness score: {round(interview_score, 1)}/100. "
            f"Generated {len(final_technical)} technical and "
            f"{len(final_hr)} HR questions for {role} role."
        )

        return self._build_result(
            status=AgentStatus.COMPLETED,
            confidence_score=confidence,
            summary=summary,
            data={
                "interview_score": round(interview_score, 1),
                "technical_questions": final_technical,
                "hr_questions": final_hr,
                "improvement_areas": improvement_areas,
                "target_role": role,
                "difficulty": difficulty,
            },
        )

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    @staticmethod
    def _build_technical_questions(student: Student) -> list[str]:
        questions: list[str] = []
        # Prioritize weak subjects first (so students practice gaps)
        ordered_subjects = student.weak_subjects + [
            s for s in student.subjects if s not in student.weak_subjects
        ]
        for subject in ordered_subjects:
            bank = TECH_QUESTION_BANK.get(subject, TECH_QUESTION_BANK["default"])
            for q in bank:
                if q not in questions:
                    questions.append(q)
                if len(questions) >= 5:
                    return questions
        while len(questions) < 5:
            for q in TECH_QUESTION_BANK["default"]:
                if q not in questions:
                    questions.append(q)
                if len(questions) >= 5:
                    break
        return questions[:5]

    @staticmethod
    def _fallback_improvements(student: Student) -> list[str]:
        improvements = []
        if student.interview_readiness < 60:
            improvements.append("Practice mock interviews twice a week to build confidence.")
        improvements.append("Use the STAR method (Situation, Task, Action, Result) for behavioral answers.")
        improvements.append("Record yourself answering questions to improve clarity and pacing.")
        if student.weak_subjects:
            improvements.append(
                f"Strengthen core concepts in: {', '.join(student.weak_subjects)} before technical rounds."
            )
        return improvements[:4]
