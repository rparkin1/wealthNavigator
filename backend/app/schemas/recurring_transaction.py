"""
Recurring Transaction Schemas

Pydantic schemas for recurring transaction API.
"""

from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class RecurringTransactionBase(BaseModel):
    """Base recurring transaction schema."""
    category: str = Field(..., description="Budget category")
    name: str = Field(..., min_length=1, max_length=200, description="Entry name")
    amount: float = Field(..., gt=0, description="Amount per period")
    frequency: str = Field(..., description="Frequency: weekly, biweekly, monthly, quarterly, annual")
    type: str = Field(..., description="Type: income, expense, savings")
    is_fixed: bool = Field(False, description="Is this a fixed amount?")
    notes: Optional[str] = Field(None, max_length=1000, description="Optional notes")

    start_date: datetime = Field(..., description="When to start generating")
    end_date: Optional[datetime] = Field(None, description="When to stop (optional)")

    max_occurrences: Optional[int] = Field(None, ge=1, description="Max number of occurrences")
    auto_generate: bool = Field(True, description="Automatically create entries")
    days_ahead: int = Field(7, ge=0, le=90, description="Generate X days ahead")

    reminder_enabled: bool = Field(False, description="Enable reminders")
    reminder_days_before: Optional[int] = Field(None, ge=1, le=30, description="Remind X days before")

    @field_validator('type')
    @classmethod
    def validate_type(cls, v: str) -> str:
        """Validate budget type."""
        valid_types = ['income', 'expense', 'savings']
        if v not in valid_types:
            raise ValueError(f"Type must be one of: {', '.join(valid_types)}")
        return v

    @field_validator('frequency')
    @classmethod
    def validate_frequency(cls, v: str) -> str:
        """Validate frequency."""
        valid_frequencies = ['weekly', 'biweekly', 'monthly', 'quarterly', 'annual']
        if v not in valid_frequencies:
            raise ValueError(f"Frequency must be one of: {', '.join(valid_frequencies)}")
        return v


class RecurringTransactionCreate(RecurringTransactionBase):
    """Schema for creating a recurring transaction."""
    pass


class RecurringTransactionUpdate(BaseModel):
    """Schema for updating a recurring transaction."""
    category: Optional[str] = None
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    amount: Optional[float] = Field(None, gt=0)
    frequency: Optional[str] = None
    type: Optional[str] = None
    is_fixed: Optional[bool] = None
    notes: Optional[str] = Field(None, max_length=1000)

    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    max_occurrences: Optional[int] = Field(None, ge=1)
    auto_generate: Optional[bool] = None
    days_ahead: Optional[int] = Field(None, ge=0, le=90)

    reminder_enabled: Optional[bool] = None
    reminder_days_before: Optional[int] = Field(None, ge=1, le=30)


class RecurringTransactionResponse(RecurringTransactionBase):
    """Schema for recurring transaction response."""
    id: UUID
    user_id: UUID
    status: str  # active, paused, completed, cancelled
    last_generated_date: Optional[datetime] = None
    next_generation_date: datetime
    total_generated: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RecurringTransactionsList(BaseModel):
    """Schema for list of recurring transactions."""
    transactions: List[RecurringTransactionResponse]
    total: int
    active_count: int
    paused_count: int


class GenerateOccurrencesRequest(BaseModel):
    """Schema for generating occurrences."""
    n: int = Field(1, ge=1, le=12, description="Number of occurrences to generate")


class UpcomingTransaction(BaseModel):
    """Schema for upcoming transaction."""
    id: UUID
    name: str
    amount: float
    frequency: str
    type: str
    category: str
    next_date: datetime
    days_until: int
    auto_generate: bool


class RecurringTransactionHistoryResponse(BaseModel):
    """Schema for generation history."""
    id: UUID
    recurring_transaction_id: UUID
    budget_entry_id: UUID
    generated_at: datetime
    generation_date: datetime
    was_manual: bool
    created_at: datetime

    class Config:
        from_attributes = True
