"""
Portfolio and account database models
"""

from sqlalchemy import String, Float, ForeignKey, JSON, Enum as SQLEnum, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional, List
from datetime import datetime
import uuid
import enum

from .base import Base, TimestampMixin


class AccountType(str, enum.Enum):
    """Account type categories"""
    TAXABLE = "taxable"
    TAX_DEFERRED = "tax_deferred"  # Traditional IRA, 401(k)
    TAX_EXEMPT = "tax_exempt"  # Roth IRA, Roth 401(k)
    DEPOSITORY = "depository"  # Checking, savings
    CREDIT = "credit"  # Credit cards


class ConnectionStatus(str, enum.Enum):
    """Account connection status"""
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    ERROR = "error"
    PENDING = "pending"


class Portfolio(Base, TimestampMixin):
    """User's investment portfolio"""

    __tablename__ = "portfolios"

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

    # Portfolio metadata
    name: Mapped[str] = mapped_column(String(255), nullable=False, default="Primary Portfolio")

    # Portfolio metrics
    total_value: Mapped[float] = mapped_column(Float, default=0.0)

    # Asset allocation (stored as JSON: {asset_class: percentage})
    allocation: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Performance metrics (stored as JSON)
    performance_metrics: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Risk metrics (stored as JSON)
    risk_metrics: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Last rebalance date
    last_rebalanced: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="portfolios")

    accounts: Mapped[List["Account"]] = relationship(
        "Account",
        back_populates="portfolio",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Portfolio(id={self.id}, name={self.name}, value=${self.total_value:,.2f})>"


class Account(Base, TimestampMixin):
    """Financial account (bank, brokerage, etc.)"""

    __tablename__ = "accounts"

    # Primary key
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    # Foreign keys
    portfolio_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("portfolios.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Account details
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    account_type: Mapped[AccountType] = mapped_column(
        SQLEnum(AccountType),
        nullable=False,
        index=True
    )

    institution: Mapped[str] = mapped_column(String(255), nullable=False)

    # Account value
    current_value: Mapped[float] = mapped_column(Float, default=0.0)

    # Connection details (for Plaid integration)
    connection_status: Mapped[ConnectionStatus] = mapped_column(
        SQLEnum(ConnectionStatus),
        default=ConnectionStatus.DISCONNECTED
    )

    plaid_item_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    plaid_account_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Last sync timestamp
    last_synced: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    # Holdings (stored as JSON array)
    holdings: Mapped[Optional[List[dict]]] = mapped_column(JSON, nullable=True)

    # Relationships
    portfolio: Mapped["Portfolio"] = relationship("Portfolio", back_populates="accounts")

    def __repr__(self) -> str:
        return f"<Account(id={self.id}, name={self.name}, type={self.account_type})>"
