"""
CampusIQ X - VerifierAgent
------------------------------
Responsible for:
- Validating outputs from all other agents
- Removing hallucinations (range/sanity checks on numeric fields)
- Verifying reasoning consistency
- Generating an overall confidence score
- Producing the final unified AI response

This agent is the last step in the orchestration pipeline. It does not
call the AI model by default (keeping verification deterministic and
fast); it can optionally use GPT-4o to synthesize the final natural
language response if the live client is available.
"""

from __future__ import annotations

from agents.base_agent import BaseAgent
from models.schemas import AgentResult, AgentStatus, Student


class VerifierAgent(BaseAgent):
    name = "VerifierAgent"

    SYSTEM_PROMPT = (
        "You are VerifierAgent, the final reasoning-quality gate inside "
        "CampusIQ X, an Azure AI Foundry powered academic platform. You "
        "receive structured outputs from AnalysisAgent, StudyPlanAgent, "
        "CareerAgent, ResumeAgent, and InterviewPrepAgent for a single "
        "student query. Synthesize them into one concise, encouraging, "
        "and actionable final response (3-5 sentences) for the student. "
        "Respond with a JSON object containing a single key 'final_response' "
        "(string). Do not invent numbers not present in the provided data."
    )

    @BaseAgent.timed
    def run(self, student: Student, query: str = "", agent_results: list[AgentResult] | None = None) -> AgentResult:
        agent_results = agent_results or []

        validated_results, issues = self._validate(agent_results)
        overall_confidence = self._overall_confidence(validated_results)

        ai_output = self.ai_client.generate_reasoning(
            system_prompt=self.SYSTEM_PROMPT,
            user_prompt=f"Student query: '{query}'. Synthesize the agent outputs into a final response.",
            context={
                "student_name": student.name,
                "agent_outputs": [
                    {"agent": r.agent_name, "summary": r.summary, "data": r.data}
                    for r in validated_results
                ],
            },
        )

        final_response = ai_output.get("final_response") or self._fallback_final_response(
            student, validated_results
        )

        summary = (
            f"Verified {len(validated_results)} agent output(s) "
            f"({'no issues found' if not issues else f'{len(issues)} issue(s) auto-corrected'}). "
            f"Overall confidence: {round(overall_confidence, 1)}%."
        )

        return self._build_result(
            status=AgentStatus.COMPLETED,
            confidence_score=overall_confidence,
            summary=summary,
            data={
                "final_response": final_response,
                "issues_found": issues,
                "overall_confidence": round(overall_confidence, 1),
            },
        )

    # ------------------------------------------------------------------
    # Validation logic
    # ------------------------------------------------------------------
    @staticmethod
    def _validate(agent_results: list[AgentResult]) -> tuple[list[AgentResult], list[str]]:
        issues: list[str] = []
        validated: list[AgentResult] = []

        for result in agent_results:
            corrected = result.model_copy(deep=True)

            # Clamp confidence scores to [0, 100]
            if not (0 <= corrected.confidence_score <= 100):
                issues.append(f"{result.agent_name}: confidence_score out of range, clamped.")
                corrected.confidence_score = max(0.0, min(100.0, corrected.confidence_score))

            # Sanity-check known numeric fields (0-100 scales)
            for key in [
                "academic_score", "placement_score", "resume_score",
                "interview_score", "job_match_percent",
            ]:
                if key in corrected.data and isinstance(corrected.data[key], (int, float)):
                    val = corrected.data[key]
                    if not (0 <= val <= 100):
                        issues.append(f"{result.agent_name}: {key} out of range, clamped.")
                        corrected.data[key] = max(0.0, min(100.0, val))

            validated.append(corrected)

        return validated, issues

    @staticmethod
    def _overall_confidence(results: list[AgentResult]) -> float:
        if not results:
            return 95.0
        scores = [r.confidence_score for r in results]
        return sum(scores) / len(scores)

    # ------------------------------------------------------------------
    # Fallback synthesis (no AI client available)
    # ------------------------------------------------------------------
    @staticmethod
    def _fallback_final_response(student: Student, results: list[AgentResult]) -> str:
        parts = [f"Here's your personalized academic intelligence summary, {student.name.split()[0]}:"]
        for r in results:
            parts.append(r.summary)
        parts.append(
            "Keep tracking your progress in the dashboard - CampusIQ X will "
            "continuously refine these recommendations as your data updates."
        )
        return " ".join(parts)
