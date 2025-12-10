"""
Budget Entry Schemas

Pydantic schemas for budget API requests and responses.
"""

from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class BudgetEntryBase(BaseModel):
    """Base budget entry schema."""
    category: str = Field(..., description="Budget category")
    name: str = Field(..., min_length=1, max_length=200, description="Entry name")
    amount: float = Field(..., gt=0, description="Amount per period")
    frequency: str = Field(..., description="Frequency: weekly, biweekly, monthly, quarterly, annual, one_time")
    type: str = Field(..., description="Type: income, expense, savings")
    is_fixed: bool = Field(False, description="Is this a fixed amount?")
    notes: Optional[str] = Field(None, max_length=1000, description="Optional notes")
    start_date: Optional[datetime] = Field(None, description="Start date")
    end_date: Optional[datetime] = Field(None, description="End date")

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
        valid_frequencies = ['weekly', 'biweekly', 'monthly', 'quarterly', 'annual', 'one_time']
        if v not in valid_frequencies:
            raise ValueError(f"Frequency must be one of: {', '.join(valid_frequencies)}")
        return v


class BudgetEntryCreate(BudgetEntryBase):
    """Schema for creating a budget entry."""
    pass


class BudgetEntryUpdate(BaseModel):
    """Schema for updating a budget entry."""
    category: Optional[str] = None
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    amount: Optional[float] = Field(None, gt=0)
    frequency: Optional[str] = None
    type: Optional[str] = None
    is_fixed: Optional[bool] = None
    notes: Optional[str] = Field(None, max_length=1000)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class BudgetEntryResponse(BudgetEntryBase):
    """Schema for budget entry response."""
    id: UUID
    user_id: UUID
    extraction_method: str
    extraction_confidence: Optional[float] = None
    extracted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    # Calculated fields
    annual_amount: Optional[float] = None
    monthly_amount: Optional[float] = None

    class Config:
        from_attributes = True


class BudgetEntriesList(BaseModel):
    """Schema for list of budget entries."""
    entries: List[BudgetEntryResponse]
    total: int
    income_count: int
    expense_count: int
    savings_count: int


class BudgetExtractionRequest(BaseModel):
    """Schema for extracting budget from conversation."""
    conversation_text: str = Field(..., min_length=1, description="Conversation text to analyze")
    auto_save: bool = Field(False, description="Automatically save extracted entries")


class BudgetCategorizationRequest(BaseModel):
    """Schema for categorizing a budget entry."""
    entry_description: str = Field(..., min_length=1, description="Description of the entry")
    amount: Optional[float] = Field(None, gt=0, description="Optional amount for context")
    context: Optional[str] = Field(None, description="Optional additional context")


class BudgetCategorizationResponse(BaseModel):
    """Schema for categorization response."""
    category: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    note: Optional[str] = None


class BudgetPatternRequest(BaseModel):
    """Schema for pattern analysis request."""
    entry_name: str
    amount: float
    frequency: str
    category: str


class BudgetPatternResponse(BaseModel):
    """Schema for pattern analysis response."""
    is_recurring: bool
    typical_frequency: Optional[str] = None
    is_fixed: bool
    variability: str  # "low", "medium", "high"
    category_confidence: float
    is_anomalous: bool
    suggestions: List[str]


class BudgetSuggestionsRequest(BaseModel):
    """Schema for smart suggestions request."""
    entry_ids: Optional[List[UUID]] = Field(None, description="Specific entry IDs to analyze (or all if None)")


class BudgetOpportunity(BaseModel):
    """Schema for a savings opportunity."""
    category: str
    current: float
    suggested: float
    savings: float
    action: str
    difficulty: str  # "easy", "medium", "hard"


class BudgetRecommendation(BaseModel):
    """Schema for a budget recommendation."""
    priority: str  # "high", "medium", "low"
    action: str
    impact: str
    difficulty: str
    timeline: Optional[str] = None


class BudgetSuggestionsResponse(BaseModel):
    """Schema for smart suggestions response."""
    health_score: float = Field(..., ge=0, le=100)
    health_category: str  # "excellent", "good", "needs_work"
    savings_rate: float
    concerns: List[str]
    opportunities: List[BudgetOpportunity]
    recommendations: List[BudgetRecommendation]


class BudgetSummary(BaseModel):
    """Schema for budget summary."""
    total_income: float
    total_expenses: float
    total_savings: float
    net_cash_flow: float
    savings_rate: float
    monthly_income: float
    monthly_expenses: float
    monthly_savings: float
    monthly_net: float

    # Breakdowns
    income_by_category: dict
    expenses_by_category: dict
    savings_by_category: dict

    # Counts
    total_entries: int
    income_entries: int
    expense_entries: int
    savings_entries: int

    # Status
    health_category: str
    health_score: Optional[float] = None


class BulkBudgetEntryCreate(BaseModel):
    """Schema for bulk creating budget entries."""
    entries: List[BudgetEntryCreate] = Field(..., min_length=1, max_length=100)


class BulkBudgetEntryResponse(BaseModel):
    """Schema for bulk create response."""
    created: int
    failed: int
    entries: List[BudgetEntryResponse]
    errors: List[dict]
