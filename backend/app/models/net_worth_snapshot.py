"""
Net Worth Snapshot database model for historical tracking

Stores daily snapshots of net worth data from Plaid accounts.
"""

from sqlalchemy import String, Float, JSON, ForeignKey, Index, Date, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional, Dict, Any
from datetime import date as date_type
import uuid

from .base import Base, TimestampMixin


class NetWorthSnapshot(Base, TimestampMixin):
    """
    Stores historical net worth snapshots.

    One snapshot per user per day, capturing total assets, liabilities,
    and asset class breakdown from Plaid accounts.
    """

    __tablename__ = "net_worth_snapshots"

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

    # Snapshot date (one per day)
    snapshot_date: Mapped[date_type] = mapped_column(
        Date,
        nullable=False,
        index=True
    )

    # Net worth components
    total_assets: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    total_liabilities: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    total_net_worth: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    liquid_net_worth: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # Asset breakdown by class (stored as JSON)
    # Example: {"cash": 10000, "stocks": 50000, "bonds": 20000, "realEstate": 300000, "other": 5000}
    assets_by_class: Mapped[Dict[str, Any]] = mapped_column(
        JSON,
        nullable=False,
        default=dict
    )

    # Account counts for tracking
    num_accounts: Mapped[int] = mapped_column(Float, nullable=False, default=0)
    num_investment_accounts: Mapped[int] = mapped_column(Float, nullable=False, default=0)
    num_depository_accounts: Mapped[int] = mapped_column(Float, nullable=False, default=0)
    num_credit_accounts: Mapped[int] = mapped_column(Float, nullable=False, default=0)

    # Data source tracking
    source: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="plaid"
    )  # "plaid", "manual", "backfill"

    # Additional metadata (renamed from 'metadata' to avoid SQLAlchemy reserved word)
    snapshot_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON,
        nullable=True,
        default=None
    )

    # Relationships
    # user = relationship("User", back_populates="net_worth_snapshots")

    # Indexes
    __table_args__ = (
        # Unique constraint: one snapshot per user per day
        UniqueConstraint("user_id", "snapshot_date", name="uq_user_snapshot_date"),
        # Composite index for efficient date range queries
        Index("idx_user_date", "user_id", "snapshot_date"),
    )

    def __repr__(self) -> str:
        return (
            f"<NetWorthSnapshot(id={self.id}, user_id={self.user_id}, "
            f"date={self.snapshot_date}, net_worth={self.total_net_worth})>"
        )

    def to_dict(self) -> Dict[str, Any]:
        """Convert snapshot to dictionary matching API schema"""
        return {
            "date": self.snapshot_date.isoformat(),
            "totalNetWorth": self.total_net_worth,
            "totalAssets": self.total_assets,
            "totalLiabilities": self.total_liabilities,
            "liquidNetWorth": self.liquid_net_worth,
            "assetsByClass": self.assets_by_class or {},
        }
