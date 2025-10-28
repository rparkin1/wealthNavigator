"""
Thread (Conversation) Models
Pydantic models for thread-based conversations
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class GoalCategory(str, Enum):
    """Financial goal categories"""
    RETIREMENT = "retirement"
    EDUCATION = "education"
    HOME = "home"
    MAJOR_EXPENSE = "major_expense"
    EMERGENCY = "emergency"
    LEGACY = "legacy"


class MessageRole(str, Enum):
    """Message role types"""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class MessageMetadata(BaseModel):
    """Message metadata"""
    agent_name: Optional[str] = None
    status: Optional[str] = None
    progress: Optional[int] = None


class MessageBase(BaseModel):
    """Base message model"""
    role: MessageRole
    content: str
    agent_id: Optional[str] = None
    metadata: Optional[MessageMetadata] = None


class MessageCreate(BaseModel):
    """Message creation model"""
    role: MessageRole
    content: str
    agent_id: Optional[str] = None
    metadata: Optional[MessageMetadata] = None


class MessageResponse(MessageBase):
    """Message response model"""
    id: str
    thread_id: str
    timestamp: datetime

    class Config:
        from_attributes = True


class ThreadBase(BaseModel):
    """Base thread model"""
    title: str


class ThreadCreate(ThreadBase):
    """Thread creation model"""
    pass


class ThreadUpdate(BaseModel):
    """Thread update model"""
    title: Optional[str] = None


class ThreadResponse(ThreadBase):
    """Thread response model"""
    id: str
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
    goal_types: List[GoalCategory] = []
    message_count: int = 0
    analysis_count: int = 0

    class Config:
        from_attributes = True


class ThreadDetail(ThreadResponse):
    """Detailed thread with messages"""
    messages: List[MessageResponse] = []


class ThreadListResponse(BaseModel):
    """Thread list response"""
    threads: List[ThreadResponse]
    total: int
    limit: int
    offset: int
    has_more: bool
