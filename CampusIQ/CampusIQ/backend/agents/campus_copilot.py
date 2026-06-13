"""
CampusIQ X - CampusCopilotAgent (Master Orchestrator)
----------------------------------------------------------
Responsibilities:
- Receive user query
- Understand intent
- Decide which agents execute
- Collect outputs
- Generate unified response via VerifierAgent

Implements a simple intent-routing strategy: keywords in the student's
query determine which sub-agents are relevant. If no specific intent is
detected (or the query is general, e.g. "How am I doing overall?"), all
agents are run to give a holistic picture - matching the full workflow
diagram in the architecture spec.
"""

from __future__ import annotations

from agents.analysis_agent import AnalysisAgent
from agents.career_agent import CareerAgent
from agents.interview_agent import InterviewPrepAgent
from agents.resume_agent import ResumeAgent
from agents.study_agent import StudyPlanAgent
from agents.verifier_agent import VerifierAgent
from models.schemas import (
    AgentResult,
    AgentStatus,
    AgentTimelineStep,
    ChatResponse,
    Student,
)

# Keyword -> agent intent map
INTENT_KEYWORDS = {
    "analysis": ["attendance", "marks", "cgpa", "risk", "weak subject", "fail", "performance"],
    "study_plan": ["study plan", "schedule", "revision", "exam prep", "timetable", "plan"],
    "career": ["career", "placement", "roadmap", "company", "eligibility", "salary"],
    "resume": ["resume", "cv", "ats"],
    "interview": ["interview", "hr question", "technical question", "mock"],
}


class CampusCopilotAgent:
    """Master orchestrator that routes student queries to sub-agents."""

    name = "CampusCopilotAgent"

    def __init__(self) -> None:
        self.analysis_agent = AnalysisAgent()
        self.study_agent = StudyPlanAgent()
        self.career_agent = CareerAgent()
        self.resume_agent = ResumeAgent()
        self.interview_agent = InterviewPrepAgent()
        self.verifier_agent = VerifierAgent()

    # ------------------------------------------------------------------
    # Intent detection
    # ------------------------------------------------------------------
    def _detect_intents(self, query: str) -> list[str]:
        query_lower = query.lower()
        detected = []
        for intent, keywords in INTENT_KEYWORDS.items():
            if any(kw in query_lower for kw in keywords):
                detected.append(intent)

        # If nothing matched, run the full pipeline (holistic overview)
        if not detected:
            detected = ["analysis", "study_plan", "career", "resume", "interview"]

        return detected

    # ------------------------------------------------------------------
    # Main orchestration entry point
    # ------------------------------------------------------------------
    def handle_query(self, student: Student, query: str) -> ChatResponse:
        intents = self._detect_intents(query)
        agent_results: list[AgentResult] = []
        timeline: list[AgentTimelineStep] = []

        agent_map = {
            "analysis": self.analysis_agent,
            "study_plan": self.study_agent,
            "career": self.career_agent,
            "resume": self.resume_agent,
            "interview": self.interview_agent,
        }

        # Always run AnalysisAgent first - other agents benefit from its
        # risk/weak-subject signals (matches the documented AI Workflow:
        # CampusCopilotAgent -> AnalysisAgent -> StudyPlanAgent -> ... )
        ordered_intents = sorted(intents, key=lambda i: 0 if i == "analysis" else 1)
        if "analysis" not in ordered_intents:
            ordered_intents.insert(0, "analysis")

        for intent in ordered_intents:
            agent = agent_map[intent]
            result = agent.run(student=student, query=query)
            agent_results.append(result)
            timeline.append(
                AgentTimelineStep(
                    agent_name=result.agent_name,
                    status=result.status,
                    confidence_score=result.confidence_score,
                    summary=result.summary,
                )
            )

        # Final verification & synthesis
        verifier_result = self.verifier_agent.run(
            student=student, query=query, agent_results=agent_results
        )
        timeline.append(
            AgentTimelineStep(
                agent_name=verifier_result.agent_name,
                status=verifier_result.status,
                confidence_score=verifier_result.confidence_score,
                summary=verifier_result.summary,
            )
        )

        return ChatResponse(
            query=query,
            student_id=student.student_id,
            reasoning_timeline=timeline,
            final_response=verifier_result.data["final_response"],
            overall_confidence=verifier_result.data["overall_confidence"],
        )


# Singleton orchestrator instance
campus_copilot_agent = CampusCopilotAgent()
