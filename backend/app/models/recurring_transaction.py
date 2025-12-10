"""
Recurring Transaction Models

Models for handling recurring budget entries with automatic generation.
"""

from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID, uuid4
import enum

from sqlalchemy import Column, String, Float, DateTime, Boolean, Integer, Enum, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID as PostgreSQL_UUID
from sqlalchemy.orm import relationship

from app.db.base_class import Base
from app.models.budget import BudgetCategory, BudgetType, Frequency


class RecurrenceStatus(str, enum.Enum):
    """Status of recurring transaction."""
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class RecurringTransaction(Base):
    """Template for recurring budget entries."""

    __tablename__ = "recurring_transactions"

    # Primary key
    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()), index=True)

    # User relationship
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)

    # Template details (same as BudgetEntry)
    category = Column(Enum(BudgetCategory), nullable=False)
    name = Column(String(200), nullable=False)
    amount = Column(Float, nullable=False)
    frequency = Column(Enum(Frequency), nullable=False)
    type = Column(Enum(BudgetType), nullable=False)
    is_fixed = Column(Boolean, default=False, nullable=False)
    notes = Column(String(1000), nullable=True)

    # Recurrence settings
    status = Column(Enum(RecurrenceStatus), default=RecurrenceStatus.ACTIVE, nullable=False)
    start_date = Column(DateTime, nullable=False)  # When to start generating
    end_date = Column(DateTime, nullable=True)  # When to stop (optional)

    # Generation tracking
    last_generated_date = Column(DateTime, nullable=True)  # Last time an entry was generated
    next_generation_date = Column(DateTime, nullable=False)  # Next scheduled generation
    total_generated = Column(Integer, default=0, nullable=False)  # Count of generated entries
    max_occurrences = Column(Integer, nullable=True)  # Optional limit on occurrences

    # Auto-generation settings
    auto_generate = Column(Boolean, default=True, nullable=False)  # Automatically create entries
    days_ahead = Column(Integer, default=7, nullable=False)  # Generate X days ahead

    # Reminders
    reminder_enabled = Column(Boolean, default=False, nullable=False)
    reminder_days_before = Column(Integer, default=3, nullable=True)  # Remind X days before

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="recurring_transactions")
    generated_entries = relationship(
        "BudgetEntry",
        back_populates="recurring_source",
        cascade="all, delete-orphan"
    )

    # Indexes
    __table_args__ = (
        Index('idx_recurring_user_status', 'user_id', 'status'),
        Index('idx_recurring_next_generation', 'next_generation_date', 'status'),
        Index('idx_recurring_auto_generate', 'auto_generate', 'status'),
    )

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "category": self.category.value,
            "name": self.name,
            "amount": self.amount,
            "frequency": self.frequency.value,
            "type": self.type.value,
            "is_fixed": self.is_fixed,
            "notes": self.notes,
            "status": self.status.value,
            "start_date": self.start_date.isoformat(),
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "last_generated_date": self.last_generated_date.isoformat() if self.last_generated_date else None,
            "next_generation_date": self.next_generation_date.isoformat(),
            "total_generated": self.total_generated,
            "max_occurrences": self.max_occurrences,
            "auto_generate": self.auto_generate,
            "days_ahead": self.days_ahead,
            "reminder_enabled": self.reminder_enabled,
            "reminder_days_before": self.reminder_days_before,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def calculate_next_generation_date(self, from_date: Optional[datetime] = None) -> datetime:
        """Calculate the next generation date based on frequency.

        Args:
            from_date: Calculate from this date. If None, uses last_generated_date or start_date.

        Returns:
            Next generation date
        """
        if from_date is None:
            from_date = self.last_generated_date or self.start_date

        if self.frequency == Frequency.WEEKLY:
            return from_date + timedelta(weeks=1)
        elif self.frequency == Frequency.BIWEEKLY:
            return from_date + timedelta(weeks=2)
        elif self.frequency == Frequency.MONTHLY:
            # Add one month (handle month boundaries)
            month = from_date.month
            year = from_date.year
            month += 1
            if month > 12:
                month = 1
                year += 1
            return from_date.replace(year=year, month=month)
        elif self.frequency == Frequency.QUARTERLY:
            # Add 3 months
            month = from_date.month
            year = from_date.year
            month += 3
            while month > 12:
                month -= 12
                year += 1
            return from_date.replace(year=year, month=month)
        elif self.frequency == Frequency.ANNUAL:
            return from_date.replace(year=from_date.year + 1)
        else:
            # ONE_TIME shouldn't be recurring
            return from_date

    def should_generate_now(self, current_date: Optional[datetime] = None) -> bool:
        """Check if an entry should be generated now.

        Args:
            current_date: Check against this date. If None, uses now.

        Returns:
            True if should generate
        """
        if current_date is None:
            current_date = datetime.utcnow()

        # Check status
        if self.status != RecurrenceStatus.ACTIVE:
            return False

        # Check if auto-generate is enabled
        if not self.auto_generate:
            return False

        # Check if we've reached max occurrences
        if self.max_occurrences and self.total_generated >= self.max_occurrences:
            return False

        # Check if we've passed end date
        if self.end_date and current_date > self.end_date:
            return False

        # Check if next generation date is within days_ahead window
        days_until_generation = (self.next_generation_date - current_date).days
        return days_until_generation <= self.days_ahead

    def is_active(self) -> bool:
        """Check if recurring transaction is active."""
        now = datetime.utcnow()

        if self.status != RecurrenceStatus.ACTIVE:
            return False

        if self.end_date and now > self.end_date:
            return False

        if self.max_occurrences and self.total_generated >= self.max_occurrences:
            return False

        return True


class RecurringTransactionHistory(Base):
    """History of generated entries from recurring transactions."""

    __tablename__ = "recurring_transaction_history"

    # Primary key
    id = Column(PostgreSQL_UUID(as_uuid=True), primary_key=True, default=uuid4, index=True)

    # Relationships
    recurring_transaction_id = Column(
        PostgreSQL_UUID(as_uuid=True),
        ForeignKey("recurring_transactions.id"),
        nullable=False,
        index=True
    )
    budget_entry_id = Column(
        PostgreSQL_UUID(as_uuid=True),
        ForeignKey("budget_entries.id"),
        nullable=False,
        index=True
    )

    # Generation details
    generated_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    generation_date = Column(DateTime, nullable=False)  # The date for which this entry was generated
    was_manual = Column(Boolean, default=False, nullable=False)  # Was this manually triggered?

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    recurring_transaction = relationship("RecurringTransaction")
    budget_entry = relationship("BudgetEntry")

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "id": str(self.id),
            "recurring_transaction_id": str(self.recurring_transaction_id),
            "budget_entry_id": str(self.budget_entry_id),
            "generated_at": self.generated_at.isoformat(),
            "generation_date": self.generation_date.isoformat(),
            "was_manual": self.was_manual,
            "created_at": self.created_at.isoformat(),
        }
