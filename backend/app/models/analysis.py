"""
Analysis and simulation database models
"""

from sqlalchemy import String, Float, Integer, ForeignKey, JSON, Text, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional, List
import uuid
import enum

from .base import Base, TimestampMixin


class AnalysisType(str, enum.Enum):
    """Analysis type categories"""
    PORTFOLIO_OPTIMIZATION = "portfolio_optimization"
    GOAL_PLANNING = "goal_planning"
    TAX_STRATEGY = "tax_strategy"
    RISK_ASSESSMENT = "risk_assessment"
    MONTE_CARLO = "monte_carlo"


class SimulationStatus(str, enum.Enum):
    """Monte Carlo simulation status"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETE = "complete"
    FAILED = "failed"


class Analysis(Base, TimestampMixin):
    """Analysis result from AI agents"""

    __tablename__ = "analyses"

    # Primary key
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    # Foreign keys
    thread_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("threads.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Query ID for linking to specific user questions
    query_id: Mapped[str] = mapped_column(
        String(36),
        nullable=False,
        index=True,
        default=lambda: str(uuid.uuid4())
    )

    # Analysis metadata
    query: Mapped[str] = mapped_column(Text, nullable=False)

    analysis_type: Mapped[AnalysisType] = mapped_column(
        SQLEnum(AnalysisType),
        nullable=False,
        index=True
    )

    # Agents that contributed (stored as JSON array)
    agents: Mapped[List[str]] = mapped_column(JSON, nullable=False)

    # Analysis results (stored as JSON)
    results: Mapped[dict] = mapped_column(JSON, nullable=False)

    # Visualizations (stored as JSON array)
    visualizations: Mapped[Optional[List[dict]]] = mapped_column(JSON, nullable=True)

    # Summary text
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    thread: Mapped["Thread"] = relationship("Thread", back_populates="analyses")

    def __repr__(self) -> str:
        return f"<Analysis(id={self.id}, type={self.analysis_type}, query_id={self.query_id})>"


class MonteCarloSimulation(Base, TimestampMixin):
    """Monte Carlo simulation result"""

    __tablename__ = "monte_carlo_simulations"

    # Primary key
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    # Foreign keys
    goal_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("goals.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    analysis_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("analyses.id", ondelete="SET NULL"),
        nullable=True
    )

    # Simulation parameters
    iterations: Mapped[int] = mapped_column(Integer, nullable=False, default=5000)
    time_horizon: Mapped[int] = mapped_column(Integer, nullable=False)  # years

    # Input parameters (stored as JSON)
    parameters: Mapped[dict] = mapped_column(JSON, nullable=False)

    # Simulation status
    status: Mapped[SimulationStatus] = mapped_column(
        SQLEnum(SimulationStatus),
        default=SimulationStatus.PENDING,
        nullable=False,
        index=True
    )

    progress: Mapped[float] = mapped_column(Float, default=0.0)  # 0.0 - 1.0

    # Results
    success_probability: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Portfolio projections (stored as JSON)
    portfolio_projections: Mapped[Optional[List[dict]]] = mapped_column(JSON, nullable=True)

    # Statistics (stored as JSON)
    statistics: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Final portfolio distribution (stored as JSON array)
    final_portfolio_distribution: Mapped[Optional[List[float]]] = mapped_column(
        JSON,
        nullable=True
    )

    # Error message if failed
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    goal: Mapped["Goal"] = relationship("Goal", back_populates="simulations")

    def __repr__(self) -> str:
        return f"<MonteCarloSimulation(id={self.id}, status={self.status}, iterations={self.iterations})>"
