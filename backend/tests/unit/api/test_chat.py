"""
Unit tests for Chat API endpoints
"""

import pytest
from datetime import datetime


@pytest.mark.unit
@pytest.mark.asyncio
class TestChatAPI:
    """Test chat API endpoints."""

    async def test_format_sse_event(self):
        """Test SSE event formatting."""
        from app.api.chat import format_sse_event

        event = await format_sse_event("test_event", {"key": "value", "number": 123})

        assert "event: test_event" in event
        assert "data:" in event
        assert '"key": "value"' in event or '"key":"value"' in event
        assert "123" in event
        assert event.endswith("\n\n")

    async def test_format_sse_event_with_datetime(self):
        """Test SSE event formatting with datetime objects."""
        from app.api.chat import format_sse_event

        now = datetime.utcnow()
        event = await format_sse_event("timestamp_event", {
            "timestamp": now,
            "message": "Test message"
        })

        assert "event: timestamp_event" in event
        assert "data:" in event
        assert "Test message" in event

    async def test_sse_event_structure(self):
        """Test SSE event has correct structure."""
        from app.api.chat import format_sse_event

        event = await format_sse_event("connected", {
            "thread_id": "test-123",
            "timestamp": "2024-01-01T00:00:00"
        })

        lines = event.strip().split('\n')

        # Should have 3 lines: event, data, and empty line
        assert len(lines) >= 2
        assert lines[0].startswith("event:")
        assert lines[1].startswith("data:")

    async def test_multiple_event_types(self):
        """Test formatting different event types."""
        from app.api.chat import format_sse_event

        events = [
            ("connected", {"thread_id": "123"}),
            ("agent_started", {"agent_id": "planner", "agent_name": "Goal Planner"}),
            ("message", {"role": "assistant", "content": "Hello"}),
            ("visualization", {"type": "pie_chart", "data": {}}),
            ("done", {"thread_id": "123"}),
        ]

        for event_type, data in events:
            formatted = await format_sse_event(event_type, data)
            assert f"event: {event_type}" in formatted
            assert "data:" in formatted
