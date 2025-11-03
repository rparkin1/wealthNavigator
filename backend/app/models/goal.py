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


class GoalDependencyType(str, enum.Enum):
    """Goal dependency relationship types"""
    SEQUENTIAL = "sequential"  # Goal A must complete before Goal B
    CONDITIONAL = "conditional"  # If Goal A succeeds, fund Goal B
    SHARED_RESOURCE = "shared_resource"  # Goals share funding sources
    MUTUALLY_EXCLUSIVE = "mutually_exclusive"  # Can only achieve one goal


class GoalStatus(str, enum.Enum):
    """Goal lifecycle status"""
    PLANNING = "planning"  # Not yet active
    ACTIVE = "active"  # Currently funding
    ON_HOLD = "on_hold"  # Temporarily paused
    ACHIEVED = "achieved"  # Target reached
    ABANDONED = "abandoned"  # User gave up
    BLOCKED = "blocked"  # Waiting on dependency


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
    title: Mapped[str] = mapped_column(String(255), nullable=False)

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
    current_amount: Mapped[float] = mapped_column(Float, default=0.0)
    target_date: Mapped[str] = mapped_column(String(10), nullable=False)  # ISO date string
    monthly_contribution: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

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

    # Goal lifecycle status (REQ-GOAL-003: Goal dependencies)
    status: Mapped[str] = mapped_column(
        String(20),
        default="active",
        nullable=False
    )

    # Dependency tracking (REQ-GOAL-003: Goal dependencies and relationships)
    depends_on_goal_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("goals.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    dependency_type: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)

    # Shared resource allocation (REQ-GOAL-008: Asset allocation across goals)
    allocated_accounts: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)  # JSON list of account IDs
    funding_percentage: Mapped[float] = mapped_column(Float, default=100.0)  # % of available funds allocated

    # Education-specific fields (REQ-GOAL-013: Education funding module)
    child_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    child_age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    education_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # "public", "private", "in_state", "out_state"
    years_of_support: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 4, 5, or 6 years

    # Milestones (goal progress tracking)
    milestones: Mapped[Optional[str]] = mapped_column(String(2000), nullable=True)  # JSON array of milestones

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="goals")

    # Self-referential relationship for dependencies
    depends_on: Mapped[Optional["Goal"]] = relationship(
        "Goal",
        remote_side=[id],
        foreign_keys=[depends_on_goal_id],
        backref="dependent_goals"
    )

    simulations: Mapped[list["MonteCarloSimulation"]] = relationship(
        "MonteCarloSimulation",
        back_populates="goal",
        cascade="all, delete-orphan"
    )

    life_events: Mapped[list["LifeEvent"]] = relationship(
        "LifeEvent",
        back_populates="goal",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Goal(id={self.id}, title={self.title}, category={self.category})>"

    @property
    def progress_percentage(self) -> float:
        """Calculate current progress percentage"""
        if self.target_amount <= 0:
            return 0.0
        return (self.current_amount / self.target_amount) * 100

    @property
    def status(self) -> str:
        """Calculate goal status based on progress and success probability"""
        if self.progress_percentage >= 100:
            return "achieved"

        if self.success_probability is None:
            # Fallback to simple progress-based status
            if self.progress_percentage >= 75:
                return "on_track"
            elif self.progress_percentage >= 50:
                return "behind"
            else:
                return "at_risk"

        # Use success probability if available
        if self.success_probability >= 0.7:
            return "on_track"
        elif self.success_probability >= 0.4:
            return "behind"
        else:
            return "at_risk"

    @property
    def is_on_track(self) -> bool:
        """Check if goal is on track based on success probability"""
        if self.success_probability is None:
            return self.progress_percentage >= 75
        return self.success_probability >= self.success_threshold
