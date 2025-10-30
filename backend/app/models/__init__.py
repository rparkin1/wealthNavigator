"""
Database models

All SQLAlchemy models for the WealthNavigator AI platform.
"""

from .base import Base, TimestampMixin, SoftDeleteMixin
from .user import User
from .thread_db import Thread, Message, MessageRole
from .goal import Goal, GoalCategory, GoalPriority
from .portfolio_db import Portfolio, Account, AccountType, ConnectionStatus
from .analysis import Analysis, MonteCarloSimulation, AnalysisType, SimulationStatus

__all__ = [
    # Base classes
    "Base",
    "TimestampMixin",
    "SoftDeleteMixin",

    # User
    "User",

    # Threads
    "Thread",
    "Message",
    "MessageRole",

    # Goals
    "Goal",
    "GoalCategory",
    "GoalPriority",

    # Portfolio
    "Portfolio",
    "Account",
    "AccountType",
    "ConnectionStatus",

    # Analysis
    "Analysis",
    "MonteCarloSimulation",
    "AnalysisType",
    "SimulationStatus",
]
