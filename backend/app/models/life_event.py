"""
Life Event Models

Database models for major life events that can impact financial planning:
- Job loss, disability, divorce, inheritance, etc.
- Event simulation and impact analysis
"""

from sqlalchemy import Column, String, Integer, Float, JSON, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum
from app.db.base_class import Base


class LifeEventType(str, Enum):
    """Types of life events that can be modeled"""
    JOB_LOSS = "job_loss"
    DISABILITY = "disability"
    DIVORCE = "divorce"
    INHERITANCE = "inheritance"
    MAJOR_MEDICAL = "major_medical"
    HOME_PURCHASE = "home_purchase"
    BUSINESS_START = "business_start"
    CAREER_CHANGE = "career_change"
    MARRIAGE = "marriage"
    CHILD_BIRTH = "child_birth"
    RELOCATION = "relocation"
    WINDFALL = "windfall"


class LifeEvent(Base):
    """
    Life Event Model

    Represents a major life event that can impact financial planning.
    Each event type has specific parameters stored in financial_impact JSON.
    """
    __tablename__ = "life_events"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    goal_id = Column(String, ForeignKey("goals.id"), nullable=True, index=True)

    event_type = Column(String, nullable=False)  # Stores LifeEventType enum value as string
    name = Column(String, nullable=False)  # User-friendly name
    description = Column(String, nullable=True)

    # Timing
    start_year = Column(Integer, nullable=False)  # Year event occurs (0 = current year)
    duration_years = Column(Integer, default=1)  # How long the event lasts

    # Probability and scenario analysis
    probability = Column(Float, default=1.0)  # 0.0-1.0, for probabilistic modeling
    enabled = Column(Integer, default=1)  # Whether to include in simulations

    # Event-specific financial parameters (JSON for flexibility)
    financial_impact = Column(JSON, nullable=False)
    """
    Event-specific parameters:

    JOB_LOSS:
        - income_loss_percentage: 1.0 (100% income loss)
        - severance_months: 3
        - job_search_months: 6
        - new_income_percentage: 0.9 (90% of previous)

    DISABILITY:
        - income_replacement_rate: 0.6 (60% income)
        - waiting_period_months: 6
        - duration: "short_term" | "long_term" | "permanent"
        - medical_expenses_annual: 50000

    DIVORCE:
        - asset_split_percentage: 0.5
        - alimony_monthly: 2000
        - alimony_duration_years: 10
        - child_support_monthly: 1500
        - child_support_duration_years: 18
        - legal_costs: 25000

    INHERITANCE:
        - amount: 500000
        - tax_rate: 0.0 (varies by state)
        - asset_type: "cash" | "property" | "securities"

    MAJOR_MEDICAL:
        - out_of_pocket_max: 10000
        - ongoing_expenses_annual: 5000
        - duration_years: 5
        - income_impact_percentage: 0.2 (20% reduction)

    HOME_PURCHASE:
        - home_price: 500000
        - down_payment: 100000
        - mortgage_rate: 0.065
        - mortgage_years: 30
        - closing_costs: 15000
        - property_tax_annual: 8000

    BUSINESS_START:
        - initial_investment: 100000
        - expected_annual_income: 50000
        - years_to_profitability: 3
        - failure_probability: 0.5

    CAREER_CHANGE:
        - income_change_percentage: -0.2 (20% pay cut)
        - education_costs: 20000
        - transition_months: 3
        - long_term_income_potential: 1.3 (30% increase eventually)

    MARRIAGE:
        - partner_income_annual: 60000
        - combined_expense_factor: 1.5 (expenses 50% higher)
        - wedding_costs: 30000

    CHILD_BIRTH:
        - delivery_costs: 10000
        - childcare_annual: 15000
        - childcare_duration_years: 5
        - education_529_contribution_monthly: 500

    RELOCATION:
        - moving_costs: 10000
        - income_change_percentage: 0.1 (10% increase)
        - cost_of_living_change: 1.2 (20% higher)

    WINDFALL:
        - amount: 100000
        - source: "bonus" | "lottery" | "sale" | "settlement"
        - tax_rate: 0.3
    """

    # Simulation results
    simulation_results = Column(JSON, nullable=True)
    """
    Results from event simulation:
        - success_probability_with_event: 0.75
        - success_probability_without_event: 0.85
        - impact_delta: -0.10
        - median_portfolio_value_with_event: 1200000
        - median_portfolio_value_without_event: 1500000
        - recovery_years: 5
        - recommended_actions: ["Increase emergency fund", "Purchase disability insurance"]
    """

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_simulated_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="life_events")
    goal = relationship("Goal", back_populates="life_events")


class EventTemplate(Base):
    """
    Pre-defined event templates for common scenarios

    Users can select from templates and customize parameters
    """
    __tablename__ = "event_templates"

    id = Column(String, primary_key=True, index=True)
    event_type = Column(String, nullable=False, index=True)  # Stores LifeEventType enum value as string
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)

    # Default parameters for this template
    default_parameters = Column(JSON, nullable=False)

    # Usage statistics
    usage_count = Column(Integer, default=0)
    average_rating = Column(Float, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# Default event templates
DEFAULT_EVENT_TEMPLATES = [
    {
        "id": "job_loss_standard",
        "event_type": "job_loss",  # String value matching LifeEventType.JOB_LOSS
        "name": "Standard Job Loss",
        "description": "Typical layoff with 3 months severance, 6-month job search",
        "default_parameters": {
            "income_loss_percentage": 1.0,
            "severance_months": 3,
            "job_search_months": 6,
            "new_income_percentage": 0.9,
        }
    },
    {
        "id": "disability_short_term",
        "event_type": "disability",  # String value matching LifeEventType.DISABILITY
        "name": "Short-Term Disability",
        "description": "6-month disability with 60% income replacement",
        "default_parameters": {
            "income_replacement_rate": 0.6,
            "waiting_period_months": 2,
            "duration": "short_term",
            "duration_months": 6,
            "medical_expenses_annual": 10000,
        }
    },
    {
        "id": "divorce_standard",
        "event_type": "divorce",  # String value matching LifeEventType.DIVORCE
        "name": "Standard Divorce",
        "description": "50/50 asset split with 10-year alimony",
        "default_parameters": {
            "asset_split_percentage": 0.5,
            "alimony_monthly": 2000,
            "alimony_duration_years": 10,
            "child_support_monthly": 0,
            "legal_costs": 25000,
        }
    },
    {
        "id": "inheritance_moderate",
        "event_type": "inheritance",  # String value matching LifeEventType.INHERITANCE
        "name": "Moderate Inheritance",
        "description": "$250,000 inheritance from family member",
        "default_parameters": {
            "amount": 250000,
            "tax_rate": 0.0,
            "asset_type": "cash",
        }
    },
    {
        "id": "home_purchase_median",
        "event_type": "home_purchase",  # String value matching LifeEventType.HOME_PURCHASE
        "name": "Median Home Purchase",
        "description": "$400,000 home with 20% down",
        "default_parameters": {
            "home_price": 400000,
            "down_payment": 80000,
            "mortgage_rate": 0.065,
            "mortgage_years": 30,
            "closing_costs": 12000,
            "property_tax_annual": 6000,
        }
    },
]
