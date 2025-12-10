"""
Plaid integration database models for accounts, transactions, and holdings
"""

from sqlalchemy import String, Float, Integer, Boolean, JSON, Text, ForeignKey, Index, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional, List
from datetime import date as date_type
import uuid

from .base import Base, TimestampMixin


class PlaidItem(Base, TimestampMixin):
    """Represents a Plaid Item (connection to a financial institution)"""

    __tablename__ = "plaid_items"

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

    # Plaid identifiers
    item_id: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    access_token: Mapped[str] = mapped_column(Text, nullable=False)  # Encrypted in production

    # Institution details
    institution_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    institution_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Connection status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    consent_expiration_time: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Sync tracking
    last_successful_sync: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    cursor: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # For transactions pagination

    # Error tracking
    error_code: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Products enabled
    available_products: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    billed_products: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="plaid_items")
    accounts: Mapped[List["PlaidAccount"]] = relationship(
        "PlaidAccount",
        back_populates="item",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<PlaidItem(id={self.id}, institution={self.institution_name})>"


class PlaidAccount(Base, TimestampMixin):
    """Represents a financial account from Plaid"""

    __tablename__ = "plaid_accounts"

    # Primary key
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    # Foreign keys
    item_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("plaid_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Plaid identifiers
    account_id: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    persistent_account_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)

    # Account details
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    official_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    type: Mapped[str] = mapped_column(String(50), nullable=False)  # depository, credit, loan, investment
    subtype: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # checking, savings, credit card, etc.

    # Account numbers (encrypted in production)
    mask: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)  # Last 4 digits

    # Balances
    current_balance: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    available_balance: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    limit: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    iso_currency_code: Mapped[Optional[str]] = mapped_column(String(3), nullable=True, default="USD")

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Sync tracking
    last_balance_update: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Relationships
    item: Mapped["PlaidItem"] = relationship("PlaidItem", back_populates="accounts")
    user: Mapped["User"] = relationship("User", back_populates="plaid_accounts")
    transactions: Mapped[List["PlaidTransaction"]] = relationship(
        "PlaidTransaction",
        back_populates="account",
        cascade="all, delete-orphan"
    )
    holdings: Mapped[List["PlaidHolding"]] = relationship(
        "PlaidHolding",
        back_populates="account",
        cascade="all, delete-orphan"
    )

    # Indexes for common queries
    __table_args__ = (
        Index("ix_plaid_accounts_user_type", "user_id", "type"),
        Index("ix_plaid_accounts_user_active", "user_id", "is_active"),
    )

    def __repr__(self) -> str:
        return f"<PlaidAccount(id={self.id}, name={self.name}, type={self.type})>"


class PlaidTransaction(Base, TimestampMixin):
    """Represents a financial transaction from Plaid"""

    __tablename__ = "plaid_transactions"

    # Primary key
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    # Foreign keys
    account_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("plaid_accounts.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Plaid identifiers
    transaction_id: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)

    # Transaction details
    amount: Mapped[float] = mapped_column(Float, nullable=False)  # Positive = money out, Negative = money in
    iso_currency_code: Mapped[Optional[str]] = mapped_column(String(3), nullable=True, default="USD")

    # Dates
    date: Mapped[date_type] = mapped_column(Date, nullable=False, index=True)
    authorized_date: Mapped[Optional[date_type]] = mapped_column(Date, nullable=True)

    # Description
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    merchant_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Categorization
    category: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    category_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    personal_finance_category: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Status
    pending: Mapped[bool] = mapped_column(Boolean, default=False)

    # Location
    location: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Payment metadata
    payment_meta: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    payment_channel: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # User modifications
    user_category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    user_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_excluded: Mapped[bool] = mapped_column(Boolean, default=False)  # Exclude from budgets

    # Relationships
    account: Mapped["PlaidAccount"] = relationship("PlaidAccount", back_populates="transactions")
    user: Mapped["User"] = relationship("User", back_populates="plaid_transactions")

    # Indexes for common queries
    __table_args__ = (
        Index("ix_plaid_transactions_user_date", "user_id", "date"),
        Index("ix_plaid_transactions_account_date", "account_id", "date"),
        Index("ix_plaid_transactions_user_category", "user_id", "user_category"),
    )

    def __repr__(self) -> str:
        return f"<PlaidTransaction(id={self.id}, name={self.name}, amount=${self.amount})>"


class PlaidHolding(Base, TimestampMixin):
    """Represents an investment holding from Plaid"""

    __tablename__ = "plaid_holdings"

    # Primary key
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    # Foreign keys
    account_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("plaid_accounts.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Security identifiers
    security_id: Mapped[str] = mapped_column(String(255), nullable=False)  # Plaid security ID
    ticker_symbol: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, index=True)
    cusip: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    isin: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    sedol: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # Security details
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # equity, debt, mutual fund, etc.

    # Holding details
    quantity: Mapped[float] = mapped_column(Float, nullable=False)
    institution_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    institution_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    cost_basis: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Currency
    iso_currency_code: Mapped[Optional[str]] = mapped_column(String(3), nullable=True, default="USD")

    # Metadata
    unofficial_currency_code: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)

    # Relationships
    account: Mapped["PlaidAccount"] = relationship("PlaidAccount", back_populates="holdings")
    user: Mapped["User"] = relationship("User", back_populates="plaid_holdings")

    # Indexes for common queries
    __table_args__ = (
        Index("ix_plaid_holdings_user_ticker", "user_id", "ticker_symbol"),
        Index("ix_plaid_holdings_account", "account_id"),
    )

    def __repr__(self) -> str:
        return f"<PlaidHolding(id={self.id}, ticker={self.ticker_symbol}, quantity={self.quantity})>"
