"""
User database model
"""

from sqlalchemy import String, Integer, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional, List
import uuid

from .base import Base, TimestampMixin


class User(Base, TimestampMixin):
    """User account"""

    __tablename__ = "users"

    # Primary key
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    # Authentication
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)

    # Profile
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Financial Profile
    risk_tolerance: Mapped[Optional[float]] = mapped_column(nullable=True)  # 0.0 - 1.0
    tax_rate: Mapped[Optional[float]] = mapped_column(nullable=True)  # Marginal tax rate

    # Preferences (stored as JSON)
    preferences: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Relationships
    threads: Mapped[List["Thread"]] = relationship(
        "Thread",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    goals: Mapped[List["Goal"]] = relationship(
        "Goal",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    portfolios: Mapped[List["Portfolio"]] = relationship(
        "Portfolio",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    budget_entries: Mapped[List["BudgetEntry"]] = relationship(
        "BudgetEntry",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    budget_analyses: Mapped[List["BudgetAnalysis"]] = relationship(
        "BudgetAnalysis",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    recurring_transactions: Mapped[List["RecurringTransaction"]] = relationship(
        "RecurringTransaction",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email})>"
