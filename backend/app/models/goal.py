"""
Financial goal database models
"""

from sqlalchemy import String, Float, Date, ForeignKey, Enum as SQLEnum, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional
import uuid
import enum

from .base import Base, TimestampMixin


class GoalCategory(str, enum.Enum):
    """Goal category types"""
    RETIREMENT = "retirement"
    EDUCATION = "education"
    HOME = "home"
    MAJOR_EXPENSE = "major_expense"
    EMERGENCY = "emergency"
    LEGACY = "legacy"


class GoalPriority(str, enum.Enum):
    """Goal priority levels"""
    ESSENTIAL = "essential"
    IMPORTANT = "important"
    ASPIRATIONAL = "aspirational"


class Goal(Base, TimestampMixin):
    """Financial goal"""

    __tablename__ = "goals"

    # Primary key
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    # Foreign keys
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Goal details
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    category: Mapped[GoalCategory] = mapped_column(
        SQLEnum(GoalCategory),
        nullable=False,
        index=True
    )

    priority: Mapped[GoalPriority] = mapped_column(
        SQLEnum(GoalPriority),
        nullable=False,
        default=GoalPriority.IMPORTANT
    )

    # Financial parameters
    target_amount: Mapped[float] = mapped_column(Float, nullable=False)
    current_funding: Mapped[float] = mapped_column(Float, default=0.0)
    target_date: Mapped[Date] = mapped_column(Date, nullable=False)

    # Success criteria
    success_threshold: Mapped[float] = mapped_column(
        Float,
        default=0.9,
        nullable=False
    )  # 0.0 - 1.0 (e.g., 0.9 = 90% confidence)

    # Calculated metrics (updated periodically)
    success_probability: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    required_monthly_savings: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    months_to_goal: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Description
    description: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="goals")

    simulations: Mapped[list["MonteCarloSimulation"]] = relationship(
        "MonteCarloSimulation",
        back_populates="goal",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Goal(id={self.id}, name={self.name}, category={self.category})>"

    @property
    def progress_percentage(self) -> float:
        """Calculate current progress percentage"""
        if self.target_amount <= 0:
            return 0.0
        return (self.current_funding / self.target_amount) * 100

    @property
    def is_on_track(self) -> bool:
        """Check if goal is on track based on success probability"""
        if self.success_probability is None:
            return False
        return self.success_probability >= self.success_threshold
