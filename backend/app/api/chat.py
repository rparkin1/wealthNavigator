"""
Chat API with Server-Sent Events (SSE) streaming

Real-time streaming of LangGraph agent execution to frontend.
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
import json
import asyncio
from datetime import datetime

from app.core.database import get_db
from app.models import Thread, Message, User, Goal
from app.agents import run_financial_planning_workflow
from app.agents.state import create_initial_state


router = APIRouter(tags=["chat"])


class ChatRequest(BaseModel):
    """Chat message request"""
    thread_id: Optional[str] = None  # If None, creates new thread
    message: str
    user_id: str  # In production, get from auth token


class ChatResponse(BaseModel):
    """Chat response"""
    thread_id: str
    message_id: str
    response: str


async def format_sse_event(event_type: str, data: dict) -> str:
    """
    Format data as Server-Sent Event.

    SSE format:
    event: <event_type>
    data: <json_data>

    """
    json_data = json.dumps(data, default=str)
    return f"event: {event_type}\ndata: {json_data}\n\n"


async def stream_langgraph_events(
    user_query: str,
    thread_id: str,
    user_id: str,
    db: AsyncSession
):
    """
    Stream LangGraph workflow execution as SSE events.

    Yields SSE-formatted events as agents execute.
    """
    # Send connection confirmation
    yield await format_sse_event("connected", {
        "thread_id": thread_id,
        "timestamp": datetime.utcnow().isoformat()
    })

    # Load user profile and goals
    from sqlalchemy import select

    # Get user profile
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()

    user_profile = {
        "risk_tolerance": user.risk_tolerance if user else 0.5,
        "age": user.age if user else None,
        "tax_rate": user.tax_rate if user else 0.24
    }

    # Get user goals
    result = await db.execute(
        select(Goal).where(Goal.user_id == user_id)
    )
    goals = result.scalars().all()

    # Send agent started event
    yield await format_sse_event("agent_started", {
        "agent_id": "orchestrator",
        "agent_name": "Financial Planning Orchestrator",
        "timestamp": datetime.utcnow().isoformat()
    })

    try:
        # Execute LangGraph workflow with streaming
        async for event in run_financial_planning_workflow(
            user_query=user_query,
            thread_id=thread_id,
            user_id=user_id,
            user_profile=user_profile,
            stream=True
        ):
            # Event is a dict with node_name: state updates
            for node_name, state_update in event.items():
                # Send agent progress
                if "agent_responses" in state_update:
                    for agent_resp in state_update["agent_responses"]:
                        yield await format_sse_event("agent_progress", {
                            "agent_id": agent_resp["agent_id"],
                            "agent_name": agent_resp["agent_name"],
                            "response": agent_resp["response"],
                            "timestamp": datetime.utcnow().isoformat()
                        })

                # Send intermediate results
                if "analysis_results" in state_update:
                    yield await format_sse_event("result", {
                        "type": "analysis",
                        "data": state_update["analysis_results"],
                        "timestamp": datetime.utcnow().isoformat()
                    })

                # Send visualizations
                if "visualizations" in state_update:
                    for viz in state_update["visualizations"]:
                        yield await format_sse_event("visualization", {
                            "type": viz["type"],
                            "title": viz["title"],
                            "data": viz["data"],
                            "config": viz.get("config", {}),
                            "timestamp": datetime.utcnow().isoformat()
                        })

                # Send final response
                if "final_response" in state_update and state_update["final_response"]:
                    yield await format_sse_event("message", {
                        "role": "assistant",
                        "content": state_update["final_response"],
                        "timestamp": datetime.utcnow().isoformat()
                    })

                # Send completion
                if state_update.get("workflow_status") == "complete":
                    yield await format_sse_event("done", {
                        "thread_id": thread_id,
                        "recommendations": state_update.get("recommendations", []),
                        "timestamp": datetime.utcnow().isoformat()
                    })

    except Exception as e:
        # Send error event
        yield await format_sse_event("error", {
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        })


@router.get("/stream")
async def chat_stream_get(
    thread_id: str = "",
    message: str = "",
    user_id: str = "",
    db: AsyncSession = Depends(get_db)
):
    """
    Stream chat responses using Server-Sent Events (SSE) via GET.

    EventSource requires GET requests, so this endpoint accepts query parameters.

    Query Parameters:
        thread_id: Optional thread ID (empty string for new thread)
        message: User message to send
        user_id: User ID

    Returns:
        SSE stream with real-time agent updates
    """
    import uuid

    # Create or load thread
    if thread_id and thread_id != "":
        # Verify thread exists
        from sqlalchemy import select
        result = await db.execute(
            select(Thread).where(
                Thread.id == thread_id,
                Thread.user_id == user_id
            )
        )
        thread = result.scalar_one_or_none()
        if not thread:
            raise HTTPException(status_code=404, detail="Thread not found")
        final_thread_id = thread_id
    else:
        # Create new thread
        final_thread_id = str(uuid.uuid4())
        thread = Thread(
            id=final_thread_id,
            user_id=user_id,
            title=message[:100] if message else "New Conversation",
            goal_types=[]
        )
        db.add(thread)
        await db.commit()

    # Save user message
    user_message = Message(
        id=str(uuid.uuid4()),
        thread_id=final_thread_id,
        role="user",
        content=message
    )
    db.add(user_message)
    await db.commit()

    # Stream response
    return StreamingResponse(
        stream_langgraph_events(
            user_query=message,
            thread_id=final_thread_id,
            user_id=user_id,
            db=db
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )


@router.post("/message")
async def send_message(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Send chat message without streaming (returns complete response).

    Use this for clients that don't support SSE.

    Returns:
        Complete chat response
    """
    import uuid

    # Create or load thread
    if request.thread_id:
        thread_id = request.thread_id
    else:
        thread_id = str(uuid.uuid4())
        thread = Thread(
            id=thread_id,
            user_id=request.user_id,
            title=request.message[:100],
            goal_types=[]
        )
        db.add(thread)
        await db.commit()

    # Save user message
    user_message = Message(
        id=str(uuid.uuid4()),
        thread_id=thread_id,
        role="user",
        content=request.message
    )
    db.add(user_message)
    await db.commit()

    # Execute workflow without streaming
    from app.agents import create_financial_planning_graph

    graph = create_financial_planning_graph()

    initial_state = create_initial_state(
        thread_id=thread_id,
        user_id=request.user_id,
        user_query=request.message
    )

    config = {"configurable": {"thread_id": thread_id}}
    final_state = await graph.ainvoke(initial_state, config=config)

    # Save assistant response
    assistant_message = Message(
        id=str(uuid.uuid4()),
        thread_id=thread_id,
        role="assistant",
        content=final_state.get("final_response", ""),
        agent_id="visualization"
    )
    db.add(assistant_message)
    await db.commit()

    return ChatResponse(
        thread_id=thread_id,
        message_id=assistant_message.id,
        response=final_state.get("final_response", "")
    )
