"""
CampusIQ X - Azure AI Foundry Client Service
-----------------------------------------------
Centralized wrapper around Azure OpenAI (via Azure AI Foundry) used by
every agent in the system. This isolates SDK details from agent logic
(Clean Architecture / Dependency Inversion) and provides a graceful
local fallback so the app runs end-to-end even without Azure credentials
configured (useful for demos and local development).

Environment variables (set these in production / Azure App Service):
    AZURE_OPENAI_ENDPOINT      e.g. https://<resource>.openai.azure.com/
    AZURE_OPENAI_API_KEY       Azure OpenAI key
    AZURE_OPENAI_DEPLOYMENT    deployment name for GPT-4o
    AZURE_OPENAI_API_VERSION   e.g. 2024-08-01-preview

    AZURE_SEARCH_ENDPOINT      Azure AI Search endpoint (RAG)
    AZURE_SEARCH_KEY           Azure AI Search admin/query key
    AZURE_SEARCH_INDEX         Index name for Foundry IQ knowledge sources

    AZURE_DOC_INTELLIGENCE_ENDPOINT
    AZURE_DOC_INTELLIGENCE_KEY

    AZURE_STORAGE_CONNECTION_STRING
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any, Optional

logger = logging.getLogger("campusiq.azure_ai_client")

# ---------------------------------------------------------------------------
# Optional dependency: openai SDK (Azure flavor)
# ---------------------------------------------------------------------------
try:
    from openai import AzureOpenAI  # type: ignore
    _OPENAI_SDK_AVAILABLE = True
except ImportError:  # pragma: no cover - allows running without the package
    _OPENAI_SDK_AVAILABLE = False


class AzureAIFoundryClient:
    """
    Thin wrapper around Azure OpenAI (GPT-4o) chat completions, with an
    optional RAG step against Azure AI Search ("Foundry IQ" knowledge layer).

    If credentials are not configured, `is_live` is False and
    `generate_reasoning` falls back to a deterministic local heuristic
    so the rest of the application keeps working (demo-safe mode).
    """

    def __init__(self) -> None:
        self.endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
        self.api_key = os.getenv("AZURE_OPENAI_API_KEY")
        self.deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o")
        self.api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2024-08-01-preview")

        self.search_endpoint = os.getenv("AZURE_SEARCH_ENDPOINT")
        self.search_key = os.getenv("AZURE_SEARCH_KEY")
        self.search_index = os.getenv("AZURE_SEARCH_INDEX", "campusiq-knowledge")

        self._client: Optional["AzureOpenAI"] = None

        if _OPENAI_SDK_AVAILABLE and self.endpoint and self.api_key:
            try:
                self._client = AzureOpenAI(
                    azure_endpoint=self.endpoint,
                    api_key=self.api_key,
                    api_version=self.api_version,
                )
                logger.info("Azure OpenAI client initialized (live mode).")
            except Exception as exc:  # pragma: no cover
                logger.warning("Failed to initialize Azure OpenAI client: %s", exc)
                self._client = None

    @property
    def is_live(self) -> bool:
        return self._client is not None

    # ------------------------------------------------------------------
    # RAG retrieval ("Foundry IQ" knowledge sources)
    # ------------------------------------------------------------------
    def retrieve_knowledge(self, query: str, top: int = 3) -> list[str]:
        """
        Retrieve relevant snippets from Azure AI Search index containing
        the Student Handbook, Placement Guide, Academic Policies, etc.

        Falls back to an empty list if Azure AI Search is not configured.
        """
        if not (self.search_endpoint and self.search_key):
            return []

        try:
            from azure.core.credentials import AzureKeyCredential  # type: ignore
            from azure.search.documents import SearchClient  # type: ignore

            client = SearchClient(
                endpoint=self.search_endpoint,
                index_name=self.search_index,
                credential=AzureKeyCredential(self.search_key),
            )
            results = client.search(search_text=query, top=top)
            return [str(r.get("content", "")) for r in results]
        except Exception as exc:  # pragma: no cover
            logger.warning("Azure AI Search retrieval failed: %s", exc)
            return []

    # ------------------------------------------------------------------
    # Chat completion ("Reasoning" call)
    # ------------------------------------------------------------------
    def generate_reasoning(
        self,
        system_prompt: str,
        user_prompt: str,
        context: Optional[dict[str, Any]] = None,
        json_mode: bool = True,
        temperature: float = 0.3,
    ) -> dict[str, Any]:
        """
        Calls GPT-4o (via Azure OpenAI) with the given prompts and returns
        a parsed JSON dict. If the live client is unavailable, returns a
        deterministic fallback payload built from `context` so the caller
        can still proceed (demo-safe mode).
        """
        if self._client is None:
            return self._fallback_response(context)

        messages = [{"role": "system", "content": system_prompt}]

        knowledge = self.retrieve_knowledge(user_prompt)
        if knowledge:
            knowledge_block = "\n".join(f"- {snippet}" for snippet in knowledge)
            messages.append({
                "role": "system",
                "content": f"Relevant institutional knowledge (Foundry IQ):\n{knowledge_block}",
            })

        if context:
            messages.append({
                "role": "user",
                "content": f"Student data context (JSON):\n{json.dumps(context, default=str)}",
            })

        messages.append({"role": "user", "content": user_prompt})

        try:
            response = self._client.chat.completions.create(
                model=self.deployment,
                messages=messages,
                temperature=temperature,
                response_format={"type": "json_object"} if json_mode else None,
            )
            content = response.choices[0].message.content
            return json.loads(content) if json_mode else {"text": content}
        except Exception as exc:  # pragma: no cover
            logger.error("Azure OpenAI call failed, using fallback: %s", exc)
            return self._fallback_response(context)

    # ------------------------------------------------------------------
    # Demo-safe fallback
    # ------------------------------------------------------------------
    @staticmethod
    def _fallback_response(context: Optional[dict[str, Any]]) -> dict[str, Any]:
        """
        Returns an empty dict; individual agents implement their own
        rule-based fallback logic using `context` when this is returned.
        """
        return {}


# Singleton instance shared across the application
azure_ai_client = AzureAIFoundryClient()
