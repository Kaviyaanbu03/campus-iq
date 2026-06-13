"""
CampusIQ X - Document Intelligence Service
-----------------------------------------------
Wraps Azure AI Document Intelligence (formerly Form Recognizer) to
extract text from uploaded resume PDFs. Falls back to pypdf-based
extraction if Azure credentials are not configured, so the
ResumeAgent always receives usable text in local/demo mode.

Environment variables:
    AZURE_DOC_INTELLIGENCE_ENDPOINT
    AZURE_DOC_INTELLIGENCE_KEY
"""

from __future__ import annotations

import base64
import logging
import os

logger = logging.getLogger("campusiq.document_intelligence")


class DocumentIntelligenceService:
    def __init__(self) -> None:
        self.endpoint = os.getenv("AZURE_DOC_INTELLIGENCE_ENDPOINT")
        self.key = os.getenv("AZURE_DOC_INTELLIGENCE_KEY")

    @property
    def is_live(self) -> bool:
        return bool(self.endpoint and self.key)

    def extract_text(self, file_bytes: bytes) -> str:
        if self.is_live:
            try:
                return self._extract_with_azure(file_bytes)
            except Exception as exc:  # pragma: no cover
                logger.warning("Azure Document Intelligence failed, falling back to pypdf: %s", exc)

        return self._extract_with_pypdf(file_bytes)

    # ------------------------------------------------------------------
    # Azure Document Intelligence (prebuilt-read model)
    # ------------------------------------------------------------------
    def _extract_with_azure(self, file_bytes: bytes) -> str:
        from azure.ai.documentintelligence import DocumentIntelligenceClient  # type: ignore
        from azure.core.credentials import AzureKeyCredential  # type: ignore

        client = DocumentIntelligenceClient(
            endpoint=self.endpoint, credential=AzureKeyCredential(self.key)
        )

        # The "base64Source" field of analyze_request expects a
        # base64-ENCODED STRING, not raw bytes. Encoding here avoids a
        # serialization error when this path is active.
        b64_content = base64.b64encode(file_bytes).decode("utf-8")

        poller = client.begin_analyze_document(
            "prebuilt-read", analyze_request={"base64Source": b64_content}
        )
        result = poller.result()
        return result.content or ""

    # ------------------------------------------------------------------
    # Local fallback (pypdf)
    # ------------------------------------------------------------------
    @staticmethod
    def _extract_with_pypdf(file_bytes: bytes) -> str:
        try:
            import io

            from pypdf import PdfReader  # type: ignore

            reader = PdfReader(io.BytesIO(file_bytes))
            return "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as exc:  # pragma: no cover
            logger.warning("PDF text extraction failed: %s", exc)
            return ""


document_intelligence_service = DocumentIntelligenceService()
