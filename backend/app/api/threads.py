"""Thread management API endpoints."""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from uuid import uuid4

from app.core.database import get_db
from app.models.thread import ThreadCreate, ThreadResponse, MessageCreate, MessageResponse
from app.models import database_models as db_models

router = APIRouter(prefix="/threads", tags=["threads"])


@router.get("/", response_model=List[ThreadResponse])
async def list_threads(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    include_deleted: bool = Query(False),
    db: Session = Depends(get_db),
):
    """
    List all conversation threads.

    - **skip**: Number of threads to skip (pagination)
    - **limit**: Maximum number of threads to return
    - **include_deleted**: Include soft-deleted threads
    """
    query = db.query(db_models.Thread)

    if not include_deleted:
        query = query.filter(db_models.Thread.deleted_at.is_(None))

    threads = query.order_by(db_models.Thread.updated_at.desc()).offset(skip).limit(limit).all()

    # Convert to response model
    return [
        ThreadResponse(
            id=thread.id,
            title=thread.title,
            created_at=thread.created_at,
            updated_at=thread.updated_at,
            goal_types=thread.goal_types or [],
            message_count=len(thread.messages),
        )
        for thread in threads
    ]


@router.post("/", response_model=ThreadResponse, status_code=201)
async def create_thread(
    thread_data: Optional[ThreadCreate] = None,
    db: Session = Depends(get_db),
):
    """
    Create a new conversation thread.

    - **title**: Optional custom title (defaults to "New Conversation")
    """
    thread_id = str(uuid4())
    title = thread_data.title if thread_data and thread_data.title else "New Conversation"

    db_thread = db_models.Thread(
        id=thread_id,
        title=title,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        goal_types=[],
    )

    db.add(db_thread)
    db.commit()
    db.refresh(db_thread)

    return ThreadResponse(
        id=db_thread.id,
        title=db_thread.title,
        created_at=db_thread.created_at,
        updated_at=db_thread.updated_at,
        goal_types=db_thread.goal_types,
        message_count=0,
    )


@router.get("/{thread_id}", response_model=ThreadResponse)
async def get_thread(
    thread_id: str,
    db: Session = Depends(get_db),
):
    """
    Get a specific thread by ID.

    - **thread_id**: The UUID of the thread
    """
    thread = db.query(db_models.Thread).filter(db_models.Thread.id == thread_id).first()

    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")

    if thread.deleted_at:
        raise HTTPException(status_code=410, detail="Thread has been deleted")

    return ThreadResponse(
        id=thread.id,
        title=thread.title,
        created_at=thread.created_at,
        updated_at=thread.updated_at,
        goal_types=thread.goal_types or [],
        message_count=len(thread.messages),
    )


@router.patch("/{thread_id}", response_model=ThreadResponse)
async def update_thread(
    thread_id: str,
    thread_data: ThreadCreate,
    db: Session = Depends(get_db),
):
    """
    Update a thread's title.

    - **thread_id**: The UUID of the thread
    - **title**: New title for the thread
    """
    thread = db.query(db_models.Thread).filter(db_models.Thread.id == thread_id).first()

    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")

    if thread.deleted_at:
        raise HTTPException(status_code=410, detail="Thread has been deleted")

    thread.title = thread_data.title
    thread.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(thread)

    return ThreadResponse(
        id=thread.id,
        title=thread.title,
        created_at=thread.created_at,
        updated_at=thread.updated_at,
        goal_types=thread.goal_types or [],
        message_count=len(thread.messages),
    )


@router.delete("/{thread_id}", status_code=204)
async def delete_thread(
    thread_id: str,
    permanent: bool = Query(False),
    db: Session = Depends(get_db),
):
    """
    Delete a thread (soft delete by default).

    - **thread_id**: The UUID of the thread
    - **permanent**: If true, permanently delete. Otherwise soft delete.
    """
    thread = db.query(db_models.Thread).filter(db_models.Thread.id == thread_id).first()

    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")

    if permanent:
        # Permanent delete
        db.delete(thread)
    else:
        # Soft delete
        thread.deleted_at = datetime.utcnow()

    db.commit()
    return None


@router.get("/{thread_id}/messages", response_model=List[MessageResponse])
async def list_messages(
    thread_id: str,
    db: Session = Depends(get_db),
):
    """
    Get all messages in a thread.

    - **thread_id**: The UUID of the thread
    """
    thread = db.query(db_models.Thread).filter(db_models.Thread.id == thread_id).first()

    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")

    messages = db.query(db_models.Message).filter(
        db_models.Message.thread_id == thread_id
    ).order_by(db_models.Message.timestamp.asc()).all()

    return [
        MessageResponse(
            id=msg.id,
            thread_id=msg.thread_id,
            role=msg.role,
            content=msg.content,
            timestamp=msg.timestamp,
            agent_id=msg.agent_id,
            metadata=msg.msg_metadata,
        )
        for msg in messages
    ]


@router.post("/{thread_id}/messages", response_model=MessageResponse, status_code=201)
async def create_message(
    thread_id: str,
    message_data: MessageCreate,
    db: Session = Depends(get_db),
):
    """
    Add a message to a thread.

    - **thread_id**: The UUID of the thread
    - **role**: Message role (user, assistant, system)
    - **content**: Message content
    """
    thread = db.query(db_models.Thread).filter(db_models.Thread.id == thread_id).first()

    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")

    if thread.deleted_at:
        raise HTTPException(status_code=410, detail="Thread has been deleted")

    message_id = str(uuid4())

    db_message = db_models.Message(
        id=message_id,
        thread_id=thread_id,
        role=message_data.role,
        content=message_data.content,
        timestamp=datetime.utcnow(),
        agent_id=message_data.agent_id,
        msg_metadata=message_data.metadata,
    )

    # Update thread's updated_at
    thread.updated_at = datetime.utcnow()

    db.add(db_message)
    db.commit()
    db.refresh(db_message)

    return MessageResponse(
        id=db_message.id,
        thread_id=db_message.thread_id,
        role=db_message.role,
        content=db_message.content,
        timestamp=db_message.timestamp,
        agent_id=db_message.agent_id,
        metadata=db_message.msg_metadata,
    )
