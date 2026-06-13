"""
CampusIQ X - Base Agent
---------------------------
Abstract base class for all CampusIQ X agents. Provides shared
utilities: timing, confidence normalization, and a consistent
`AgentResult` envelope (Template Method pattern).
"""

from __future__ import annotations

import functools
import time
from abc import ABC, abstractmethod
from typing import Any

from models.schemas import AgentResult, AgentStatus, Student
from services.azure_ai_client import AzureAIFoundryClient, azure_ai_client


class BaseAgent(ABC):
    """Common interface every CampusIQ X agent must implement."""

    name: str = "BaseAgent"

    def __init__(self, ai_client: AzureAIFoundryClient = azure_ai_client) -> None:
        self.ai_client = ai_client

    @abstractmethod
    def run(self, student: Student, query: str = "", **kwargs: Any) -> AgentResult:
        """
        Execute the agent's reasoning and return an AgentResult.

        Subclasses may accept additional keyword-only arguments specific
        to their domain (e.g. VerifierAgent's `agent_results`,
        ResumeAgent's `resume_text`, InterviewPrepAgent's `role` and
        `difficulty`). `**kwargs` here documents that this is expected
        and keeps the base interface compatible with all subclasses.
        """
        raise NotImplementedError

    # ------------------------------------------------------------------
    # Shared helpers
    # ------------------------------------------------------------------
    @staticmethod
    def _clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
        return max(low, min(high, value))

    def _build_result(
        self,
        status: AgentStatus,
        confidence_score: float,
        summary: str,
        data: dict[str, Any],
    ) -> AgentResult:
        return AgentResult(
            agent_name=self.name,
            status=status,
            confidence_score=self._clamp(confidence_score),
            summary=summary,
            data=data,
        )

    @staticmethod
    def timed(fn):
        """Decorator to measure agent execution time (used for telemetry)."""

        @functools.wraps(fn)
        def wrapper(self, *args, **kwargs):
            start = time.perf_counter()
            result = fn(self, *args, **kwargs)
            elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
            result.data["execution_time_ms"] = elapsed_ms
            return result

        return wrapper
