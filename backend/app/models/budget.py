"""
Budget Entry Models

Database models for budget tracking (income, expenses, savings).
"""

from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import Column, String, Float, DateTime, Boolean, Enum, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID as PostgreSQL_UUID
from sqlalchemy.orm import relationship
import enum

from app.db.base_class import Base


class BudgetType(str, enum.Enum):
    """Budget entry type."""
    INCOME = "income"
    EXPENSE = "expense"
    SAVINGS = "savings"


class Frequency(str, enum.Enum):
    """Budget entry frequency."""
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUAL = "annual"
    ONE_TIME = "one_time"


class BudgetCategory(str, enum.Enum):
    """Budget categories."""
    # Income categories (21)
    SALARY = "salary"
    WAGES = "wages"
    BONUS = "bonus"
    COMMISSION = "commission"
    SELF_EMPLOYMENT = "self_employment"
    BUSINESS_INCOME = "business_income"
    FREELANCE = "freelance"
    RENTAL_INCOME = "rental_income"
    INVESTMENT_INCOME = "investment_income"
    DIVIDENDS = "dividends"
    INTEREST = "interest"
    CAPITAL_GAINS = "capital_gains"
    SOCIAL_SECURITY = "social_security"
    PENSION = "pension"
    ANNUITY = "annuity"
    GOVERNMENT_BENEFITS = "government_benefits"
    CHILD_SUPPORT = "child_support"
    ALIMONY = "alimony"
    TAX_REFUND = "tax_refund"
    GIFTS = "gifts"
    OTHER_INCOME = "other_income"

    # Expense categories (20)
    HOUSING = "housing"
    TRANSPORTATION = "transportation"
    FOOD_GROCERIES = "food_groceries"
    FOOD_DINING = "food_dining"
    UTILITIES = "utilities"
    INSURANCE = "insurance"
    HEALTHCARE = "healthcare"
    PERSONAL_CARE = "personal_care"
    ENTERTAINMENT = "entertainment"
    SHOPPING = "shopping"
    SUBSCRIPTIONS = "subscriptions"
    EDUCATION = "education"
    CHILDCARE = "childcare"
    PET_CARE = "pet_care"
    GIFTS_DONATIONS = "gifts_donations"
    TAXES = "taxes"
    DEBT_PAYMENT = "debt_payment"
    MAINTENANCE_REPAIRS = "maintenance_repairs"
    TRAVEL = "travel"
    MISCELLANEOUS = "miscellaneous"

    # Savings categories (6)
    RETIREMENT_CONTRIBUTION = "retirement_contribution"
    EMERGENCY_FUND = "emergency_fund"
    INVESTMENT_CONTRIBUTION = "investment_contribution"
    HSA_FSA = "hsa_fsa"
    EDUCATION_SAVINGS = "education_savings"
    GENERAL_SAVINGS = "general_savings"


class ExtractionMethod(str, enum.Enum):
    """How the budget entry was created."""
    MANUAL = "manual"
    AI_CONVERSATION = "ai_conversation"
    AI_CATEGORIZATION = "ai_categorization"
    IMPORT = "import"


class BudgetEntry(Base):
    """Budget entry model (income, expense, or savings)."""

    __tablename__ = "budget_entries"

    # Primary key
    id = Column(PostgreSQL_UUID(as_uuid=True), primary_key=True, default=uuid4, index=True)

    # User relationship
    user_id = Column(PostgreSQL_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    # Budget entry details
    category = Column(Enum(BudgetCategory), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    amount = Column(Float, nullable=False)  # Amount per period
    frequency = Column(Enum(Frequency), nullable=False)
    type = Column(Enum(BudgetType), nullable=False, index=True)
    is_fixed = Column(Boolean, default=False, nullable=False)  # Fixed vs variable

    # Optional details
    notes = Column(String(1000), nullable=True)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)

    # AI extraction metadata
    extraction_method = Column(Enum(ExtractionMethod), default=ExtractionMethod.MANUAL, nullable=False)
    extraction_confidence = Column(Float, nullable=True)  # 0.0-1.0 for AI extractions
    extracted_at = Column(DateTime, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)  # Soft delete

    # Recurring transaction tracking
    recurring_transaction_id = Column(PostgreSQL_UUID(as_uuid=True), ForeignKey("recurring_transactions.id"), nullable=True, index=True)

    # Relationships
    user = relationship("User", back_populates="budget_entries")
    recurring_source = relationship("RecurringTransaction", back_populates="generated_entries")

    # Indexes for common queries
    __table_args__ = (
        Index('idx_budget_user_type', 'user_id', 'type'),
        Index('idx_budget_user_category', 'user_id', 'category'),
        Index('idx_budget_created_at', 'created_at'),
        Index('idx_budget_deleted_at', 'deleted_at'),
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
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "extraction_method": self.extraction_method.value,
            "extraction_confidence": self.extraction_confidence,
            "extracted_at": self.extracted_at.isoformat() if self.extracted_at else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def calculate_annual_amount(self) -> float:
        """Calculate annual amount based on frequency."""
        multipliers = {
            Frequency.WEEKLY: 52,
            Frequency.BIWEEKLY: 26,
            Frequency.MONTHLY: 12,
            Frequency.QUARTERLY: 4,
            Frequency.ANNUAL: 1,
            Frequency.ONE_TIME: 0,
        }
        return self.amount * multipliers.get(self.frequency, 0)

    def calculate_monthly_amount(self) -> float:
        """Calculate monthly amount."""
        return self.calculate_annual_amount() / 12

    @property
    def is_active(self) -> bool:
        """Check if entry is currently active."""
        now = datetime.utcnow()

        # Check if deleted
        if self.deleted_at:
            return False

        # Check start date
        if self.start_date and self.start_date > now:
            return False

        # Check end date
        if self.end_date and self.end_date < now:
            return False

        return True


class BudgetAnalysis(Base):
    """Budget analysis results from AI."""

    __tablename__ = "budget_analyses"

    # Primary key
    id = Column(PostgreSQL_UUID(as_uuid=True), primary_key=True, default=uuid4, index=True)

    # User relationship
    user_id = Column(PostgreSQL_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    # Analysis details
    analysis_type = Column(String(50), nullable=False)  # "suggestions", "patterns", "health"
    health_score = Column(Float, nullable=True)  # 0-100
    health_category = Column(String(50), nullable=True)  # "excellent", "good", "needs_work"
    savings_rate = Column(Float, nullable=True)  # Percentage

    # JSON fields for complex data
    concerns = Column(String(5000), nullable=True)  # JSON array
    opportunities = Column(String(5000), nullable=True)  # JSON array
    recommendations = Column(String(5000), nullable=True)  # JSON array

    # Metadata
    total_income = Column(Float, nullable=True)
    total_expenses = Column(Float, nullable=True)
    total_savings = Column(Float, nullable=True)
    net_cash_flow = Column(Float, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    user = relationship("User", back_populates="budget_analyses")

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        import json

        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "analysis_type": self.analysis_type,
            "health_score": self.health_score,
            "health_category": self.health_category,
            "savings_rate": self.savings_rate,
            "concerns": json.loads(self.concerns) if self.concerns else [],
            "opportunities": json.loads(self.opportunities) if self.opportunities else [],
            "recommendations": json.loads(self.recommendations) if self.recommendations else [],
            "total_income": self.total_income,
            "total_expenses": self.total_expenses,
            "total_savings": self.total_savings,
            "net_cash_flow": self.net_cash_flow,
            "created_at": self.created_at.isoformat(),
        }
