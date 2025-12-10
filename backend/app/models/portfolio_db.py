"""
Portfolio and account database models
"""

from sqlalchemy import String, Float, ForeignKey, JSON, Enum as SQLEnum, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship, validates
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

    # Additional account fields
    account_number: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    balance: Mapped[float] = mapped_column(Float, default=0.0)
    opened: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

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

    # Relationships
    portfolio: Mapped["Portfolio"] = relationship("Portfolio", back_populates="accounts")
    holdings: Mapped[List["Holding"]] = relationship(
        "Holding",
        back_populates="account",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Account(id={self.id}, name={self.name}, type={self.account_type})>"


class SecurityType(str, enum.Enum):
    """Security type categories"""
    STOCK = "stock"
    ETF = "etf"
    MUTUAL_FUND = "mutual_fund"
    BOND = "bond"
    CASH = "cash"
    OPTION = "option"
    FUTURE = "future"
    OTHER = "other"


class Holding(Base, TimestampMixin):
    """Individual security holding within an account"""

    __tablename__ = "holdings"

    # Primary key
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    # Foreign keys
    account_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("accounts.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Security details
    ticker: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    security_type: Mapped[SecurityType] = mapped_column(
        SQLEnum(SecurityType),
        nullable=False,
        index=True
    )

    # Quantity and value
    shares: Mapped[float] = mapped_column(Float, nullable=False)
    cost_basis: Mapped[float] = mapped_column(Float, nullable=False)
    current_value: Mapped[float] = mapped_column(Float, nullable=False)

    # Additional details
    purchase_date: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    asset_class: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    expense_ratio: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Relationships
    account: Mapped["Account"] = relationship("Account", back_populates="holdings")

    @validates("security_type")
    def validate_security_type(self, key, value):
        """Normalize and validate security type inputs."""
        if isinstance(value, SecurityType):
            return value

        normalized = str(value).lower()
        try:
            return SecurityType(normalized)
        except ValueError as exc:
            valid_types = ", ".join([st.value for st in SecurityType])
            raise ValueError(
                f"Invalid security_type '{value}'. Must be one of: {valid_types}"
            ) from exc

    def __repr__(self) -> str:
        return f"<Holding(id={self.id}, ticker={self.ticker}, shares={self.shares})>"
