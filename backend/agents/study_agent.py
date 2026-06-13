"""
CampusIQ X - StudyPlanAgent
-------------------------------
Responsible for:
- Personalized Weekly Plan
- Subject Prioritization
- Time Allocation
- Revision Schedule
- Exam Preparation Roadmap
"""

from __future__ import annotations

from agents.base_agent import BaseAgent
from models.schemas import AgentResult, AgentStatus, Student

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


class StudyPlanAgent(BaseAgent):
    name = "StudyPlanAgent"

    SYSTEM_PROMPT = (
        "You are StudyPlanAgent inside CampusIQ X, an Azure AI Foundry "
        "powered academic platform. Given a student's subjects, weak "
        "subjects, and available study hours per day, produce a JSON "
        "object with keys: 'weekly_plan' (object mapping each day of the "
        "week Monday-Sunday to an array of subject/topic strings), "
        "'daily_tasks' (array of 3-6 short task strings for today), and "
        "'confidence_score' (0-100 float). Prioritize weak subjects with "
        "more frequent sessions. Respond ONLY with valid JSON."
    )

    @BaseAgent.timed
    def run(self, student: Student, query: str = "") -> AgentResult:
        fallback_plan = self._fallback_plan(student)

        ai_output = self.ai_client.generate_reasoning(
            system_prompt=self.SYSTEM_PROMPT,
            user_prompt=(
                f"Create a personalized weekly study plan for student "
                f"{student.name} ({student.student_id})."
            ),
            context={
                "subjects": student.subjects,
                "weak_subjects": student.weak_subjects,
                "study_hours_per_day": student.study_hours_per_day,
                "cgpa": student.cgpa,
            },
        )

        weekly_plan = ai_output.get("weekly_plan") or fallback_plan["weekly_plan"]
        daily_tasks = ai_output.get("daily_tasks") or fallback_plan["daily_tasks"]
        confidence = ai_output.get("confidence_score", 90.0 if self.ai_client.is_live else 85.0)

        progress_tracker = {day: 0 for day in DAYS}

        summary = (
            f"Generated a {student.study_hours_per_day}-hour/day weekly study "
            f"plan for {student.name}, prioritizing "
            f"{', '.join(student.weak_subjects) if student.weak_subjects else 'all subjects evenly'}."
        )

        return self._build_result(
            status=AgentStatus.COMPLETED,
            confidence_score=confidence,
            summary=summary,
            data={
                "weekly_plan": weekly_plan,
                "daily_tasks": daily_tasks,
                "progress_tracker": progress_tracker,
            },
        )

    # ------------------------------------------------------------------
    # Rule-based fallback weekly plan
    # ------------------------------------------------------------------
    @staticmethod
    def _fallback_plan(student: Student) -> dict:
        subjects = student.subjects
        weak = set(student.weak_subjects)
        weekly_plan: dict[str, list[str]] = {}

        # Build a rotation that gives weak subjects extra slots
        rotation = []
        for s in subjects:
            rotation.append(s)
            if s in weak:
                rotation.append(s)  # weak subjects get an extra revision slot

        if not rotation:
            rotation = ["General Revision"]

        for i, day in enumerate(DAYS):
            primary = rotation[i % len(rotation)]
            secondary = rotation[(i + 1) % len(rotation)]
            tasks = [f"{primary}: Concept revision + practice problems"]
            if secondary != primary:
                tasks.append(f"{secondary}: Quick recap (30 min)")
            if day == "Sunday":
                tasks.append("Weekly mock test + self-assessment")
            weekly_plan[day] = tasks

        daily_tasks = weekly_plan[DAYS[0]] + [
            "Review previous day's notes (15 min)",
            "Update progress tracker",
        ]

        return {"weekly_plan": weekly_plan, "daily_tasks": daily_tasks}
