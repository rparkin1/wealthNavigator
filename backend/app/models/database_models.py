"""SQLAlchemy database models."""
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, JSON, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.thread import GoalCategory, MessageRole
import enum


class Thread(Base):
    """Thread database model."""
    __tablename__ = "threads"

    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    goal_types = Column(JSON, default=list)

    # Relationships
    messages = relationship("Message", back_populates="thread", cascade="all, delete-orphan")
    goals = relationship("Goal", back_populates="thread", cascade="all, delete-orphan")


class Message(Base):
    """Message database model."""
    __tablename__ = "messages"

    id = Column(String, primary_key=True)
    thread_id = Column(String, ForeignKey("threads.id"), nullable=False)
    role = Column(SQLEnum(MessageRole), nullable=False)
    content = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    agent_id = Column(String, nullable=True)
    msg_metadata = Column(JSON, nullable=True)

    # Relationships
    thread = relationship("Thread", back_populates="messages")


class Goal(Base):
    """Goal database model."""
    __tablename__ = "goals"

    id = Column(String, primary_key=True)
    thread_id = Column(String, ForeignKey("threads.id"), nullable=False)
    category = Column(SQLEnum(GoalCategory), nullable=False)
    target_amount = Column(Float, nullable=False)
    target_date = Column(String, nullable=False)
    priority = Column(String, nullable=False)
    success_threshold = Column(Float, nullable=False)
    success_probability = Column(Float, default=0.0)
    required_monthly_savings = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    thread = relationship("Thread", back_populates="goals")


class Portfolio(Base):
    """Portfolio database model."""
    __tablename__ = "portfolios"

    id = Column(String, primary_key=True)
    thread_id = Column(String, ForeignKey("threads.id"), nullable=True)
    total_value = Column(Float, default=0.0)
    allocation = Column(JSON, nullable=False)
    performance = Column(JSON, nullable=True)
    risk_metrics = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class Account(Base):
    """Account database model."""
    __tablename__ = "accounts"

    id = Column(String, primary_key=True)
    portfolio_id = Column(String, ForeignKey("portfolios.id"), nullable=False)
    name = Column(String, nullable=False)
    account_type = Column(String, nullable=False)
    balance = Column(Float, nullable=False)
    allocation = Column(JSON, nullable=False)
    tax_treatment = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Simulation(Base):
    """Monte Carlo simulation database model."""
    __tablename__ = "simulations"

    id = Column(String, primary_key=True)
    thread_id = Column(String, ForeignKey("threads.id"), nullable=True)
    goal_id = Column(String, ForeignKey("goals.id"), nullable=True)
    iterations = Column(Integer, nullable=False)
    success_probability = Column(Float, nullable=True)
    status = Column(String, nullable=False)
    progress = Column(Float, default=0.0)
    parameters = Column(JSON, nullable=False)
    results = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
