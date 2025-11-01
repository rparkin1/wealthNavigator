"""
Database models

All SQLAlchemy models for the WealthNavigator AI platform.
"""

from .base import Base, TimestampMixin, SoftDeleteMixin
from .budget import BudgetEntry, BudgetAnalysis, BudgetType, BudgetCategory, Frequency, ExtractionMethod
from .recurring_transaction import RecurringTransaction, RecurrenceStatus
from .user import User
from .thread_db import Thread, Message, MessageRole
from .goal import Goal, GoalCategory, GoalPriority
from .portfolio_db import Portfolio, Account, AccountType, ConnectionStatus
from .analysis import Analysis, MonteCarloSimulation, AnalysisType, SimulationStatus
from .plaid import PlaidItem, PlaidAccount, PlaidTransaction, PlaidHolding

__all__ = [
    # Base classes
    "Base",
    "TimestampMixin",
    "SoftDeleteMixin",

    # User
    "User",

    # Budget
    "BudgetEntry",
    "BudgetAnalysis",
    "BudgetType",
    "BudgetCategory",
    "Frequency",
    "ExtractionMethod",

    # Recurring Transactions
    "RecurringTransaction",
    "RecurrenceStatus",

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

    # Plaid Integration
    "PlaidItem",
    "PlaidAccount",
    "PlaidTransaction",
    "PlaidHolding",
]
