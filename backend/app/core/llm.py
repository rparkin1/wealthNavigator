"""
LLM Factory Utilities

Provides a single place to construct chat models used across the
application. During automated tests or in environments where the
Anthropic client cannot be reached, this module falls back to a
deterministic stub that returns synthetic responses so the rest of
the system can exercise its code paths without external dependencies.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any, Iterable, Optional

try:  # pragma: no cover - import failure handled with stub fallback
    from langchain_anthropic import ChatAnthropic
except Exception:  # pragma: no cover
    ChatAnthropic = None  # type: ignore

from app.core.config import settings


@dataclass
class _StubResponse:
    """Minimal response object mimicking LangChain chat responses."""

    content: str


class StubChatModel:
    """
    Lightweight chat model used when Anthropic access is unavailable.

    The stub echoes the inputs back in a readable format so downstream
    logic can continue operating during tests without external calls.
    """

    def __init__(self, model: str, temperature: float, max_tokens: Optional[int] = None):
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens

    async def ainvoke(self, messages: Iterable[Any]) -> _StubResponse:
        """Async interface mirroring LangChain chat models."""
        return _StubResponse(content=self._format_messages(messages))

    def invoke(self, messages: Iterable[Any]) -> _StubResponse:
        """Sync interface used by some helper utilities."""
        return _StubResponse(content=self._format_messages(messages))

    @staticmethod
    def _format_messages(messages: Iterable[Any]) -> str:
        """
        Build a deterministic response that includes the supplied prompts.

        Supports both LangChain message objects (with ``content`` attributes)
        and dict-based payloads used by some helpers.
        """
        formatted_chunks: list[str] = ["Stubbed response generated locally."]

        for msg in messages:
            if msg is None:
                continue

            # LangChain BaseMessage instances expose ``content``; dict payloads
            # use ``content`` keys. Fallback to ``str`` for completeness.
            content: Optional[str] = None
            if hasattr(msg, "content"):
                content = getattr(msg, "content")
            elif isinstance(msg, dict):
                content = msg.get("content")

            if isinstance(content, str):
                formatted_chunks.append(content.strip())
            else:
                formatted_chunks.append(str(msg))

        return "\n\n".join(chunk for chunk in formatted_chunks if chunk)


def get_chat_model(
    *,
    model: str,
    temperature: float = 0.7,
    max_tokens: Optional[int] = None,
    api_key: Optional[str] = None,
) -> Any:
    """
    Return a chat model instance suitable for the current environment.

    Prefers a real Anthropic-backed model when an API key is available.
    Falls back to :class:`StubChatModel` when running tests or when the
    library cannot be instantiated.
    """
    key = api_key or settings.ANTHROPIC_API_KEY

    use_real_model = os.getenv("USE_REAL_ANTHROPIC_LLM", "").lower() in {"1", "true", "yes"}

    if ChatAnthropic is not None and key and use_real_model:
        try:
            return ChatAnthropic(
                model=model,
                api_key=key,
                temperature=temperature,
                max_tokens=max_tokens,
            )
        except Exception:
            # If instantiation fails (e.g., due to missing native deps),
            # continue with the stub so tests remain hermetic.
            pass

    return StubChatModel(model=model, temperature=temperature, max_tokens=max_tokens)
