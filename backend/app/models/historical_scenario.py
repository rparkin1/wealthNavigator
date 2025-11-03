"""
Historical Market Scenario Models

Database models for pre-defined historical market scenarios:
- 2008 Financial Crisis, Dot-com Bust, COVID-19 Crash, etc.
- Year-by-year return sequences for stress testing
- Metadata: start date, end date, description, asset class returns
"""

from sqlalchemy import Column, String, Integer, Float, JSON, DateTime, Boolean
from datetime import datetime
from enum import Enum
from app.db.base_class import Base


class ScenarioPeriod(str, Enum):
    """Historical period categories"""
    FINANCIAL_CRISIS = "financial_crisis"
    DOT_COM_BUST = "dot_com_bust"
    COVID_CRASH = "covid_crash"
    GREAT_DEPRESSION = "great_depression"
    STAGFLATION_70S = "stagflation_70s"
    BLACK_MONDAY_1987 = "black_monday_1987"
    ASIAN_CRISIS_1997 = "asian_crisis_1997"
    BULL_MARKET = "bull_market"
    LOST_DECADE = "lost_decade"
    RECOVERY_PERIOD = "recovery_period"


class HistoricalScenario(Base):
    """
    Historical Market Scenario Model

    Represents a historical market period with actual return data
    for stress testing and scenario analysis.
    """
    __tablename__ = "historical_scenarios"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)  # e.g., "2008 Financial Crisis"
    period = Column(String, nullable=False)  # e.g., "financial_crisis"
    description = Column(String, nullable=True)

    # Time period
    start_date = Column(String, nullable=False)  # ISO date: "2007-10-01"
    end_date = Column(String, nullable=False)    # ISO date: "2009-03-31"
    duration_months = Column(Integer, nullable=False)

    # Return sequences (year-by-year or month-by-month)
    returns_data = Column(JSON, nullable=False)
    """
    Format:
    {
        "frequency": "monthly" | "annual",
        "returns": [
            {
                "period": "2007-10",
                "stocks": -0.05,
                "bonds": 0.02,
                "cash": 0.004,
                "real_estate": -0.08,
                "commodities": 0.15
            },
            ...
        ]
    }
    """

    # Scenario characteristics
    max_drawdown_stocks = Column(Float, nullable=True)  # e.g., -0.56 (56% drop)
    max_drawdown_bonds = Column(Float, nullable=True)
    recovery_months = Column(Integer, nullable=True)  # Time to recover from drawdown

    # Volatility metrics
    volatility_stocks = Column(Float, nullable=True)  # Standard deviation
    volatility_bonds = Column(Float, nullable=True)

    # Additional context
    key_events = Column(JSON, nullable=True)
    """
    Key events during the period:
    [
        {
            "date": "2008-09-15",
            "event": "Lehman Brothers bankruptcy",
            "impact": "Market panic, -5% intraday"
        },
        ...
    ]
    """

    # Usage tracking
    is_active = Column(Boolean, default=True)  # Available for selection
    is_featured = Column(Boolean, default=False)  # Show in featured scenarios
    usage_count = Column(Integer, default=0)  # How many times used

    # Metadata
    source = Column(String, nullable=True)  # e.g., "Yahoo Finance", "Federal Reserve"
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# Pre-defined historical scenarios
DEFAULT_HISTORICAL_SCENARIOS = [
    {
        "id": "2008_financial_crisis",
        "name": "2008 Financial Crisis",
        "period": "financial_crisis",
        "description": "The worst financial crisis since the Great Depression. S&P 500 fell 56% from peak to trough.",
        "start_date": "2007-10-01",
        "end_date": "2009-03-31",
        "duration_months": 18,
        "max_drawdown_stocks": -0.56,
        "max_drawdown_bonds": -0.05,
        "recovery_months": 49,
        "volatility_stocks": 0.35,
        "volatility_bonds": 0.08,
        "is_featured": True,
        "returns_data": {
            "frequency": "monthly",
            "returns": [
                {"period": "2007-10", "stocks": -0.017, "bonds": 0.015, "cash": 0.004},
                {"period": "2007-11", "stocks": -0.043, "bonds": 0.025, "cash": 0.004},
                {"period": "2007-12", "stocks": -0.008, "bonds": 0.018, "cash": 0.004},
                {"period": "2008-01", "stocks": -0.061, "bonds": 0.020, "cash": 0.003},
                {"period": "2008-02", "stocks": -0.035, "bonds": 0.008, "cash": 0.002},
                {"period": "2008-03", "stocks": -0.006, "bonds": 0.012, "cash": 0.002},
                {"period": "2008-04", "stocks": 0.048, "bonds": 0.005, "cash": 0.002},
                {"period": "2008-05", "stocks": 0.011, "bonds": -0.003, "cash": 0.002},
                {"period": "2008-06", "stocks": -0.086, "bonds": 0.008, "cash": 0.002},
                {"period": "2008-07", "stocks": -0.009, "bonds": 0.010, "cash": 0.002},
                {"period": "2008-08", "stocks": 0.012, "bonds": 0.012, "cash": 0.002},
                {"period": "2008-09", "stocks": -0.091, "bonds": 0.020, "cash": 0.002},
                {"period": "2008-10", "stocks": -0.169, "bonds": -0.018, "cash": 0.001},
                {"period": "2008-11", "stocks": -0.073, "bonds": 0.045, "cash": 0.001},
                {"period": "2008-12", "stocks": 0.008, "bonds": 0.022, "cash": 0.000},
                {"period": "2009-01", "stocks": -0.083, "bonds": -0.025, "cash": 0.000},
                {"period": "2009-02", "stocks": -0.109, "bonds": 0.008, "cash": 0.000},
                {"period": "2009-03", "stocks": 0.087, "bonds": 0.010, "cash": 0.000},
            ]
        },
        "key_events": [
            {"date": "2008-09-15", "event": "Lehman Brothers bankruptcy", "impact": "Market panic"},
            {"date": "2008-10-10", "event": "S&P 500 hits lowest intraday level", "impact": "-5% single day"},
            {"date": "2009-03-09", "event": "Market bottom", "impact": "Beginning of recovery"},
        ]
    },
    {
        "id": "dot_com_bust_2000",
        "name": "Dot-Com Bust (2000-2002)",
        "period": "dot_com_bust",
        "description": "Tech bubble burst. NASDAQ fell 78% from peak. S&P 500 declined 49%.",
        "start_date": "2000-03-01",
        "end_date": "2002-10-31",
        "duration_months": 32,
        "max_drawdown_stocks": -0.49,
        "max_drawdown_bonds": 0.10,
        "recovery_months": 60,
        "volatility_stocks": 0.28,
        "volatility_bonds": 0.06,
        "is_featured": True,
        "returns_data": {
            "frequency": "annual",
            "returns": [
                {"period": "2000", "stocks": -0.091, "bonds": 0.117, "cash": 0.059},
                {"period": "2001", "stocks": -0.119, "bonds": 0.055, "cash": 0.035},
                {"period": "2002", "stocks": -0.221, "bonds": 0.084, "cash": 0.016},
            ]
        },
        "key_events": [
            {"date": "2000-03-10", "event": "NASDAQ peak at 5,048", "impact": "Tech bubble peak"},
            {"date": "2001-09-11", "event": "9/11 terrorist attacks", "impact": "Market closed for 4 days"},
            {"date": "2002-10-09", "event": "Market bottom", "impact": "S&P 500 at 776.76"},
        ]
    },
    {
        "id": "covid_crash_2020",
        "name": "COVID-19 Market Crash",
        "period": "covid_crash",
        "description": "Fastest bear market in history. S&P 500 fell 34% in 33 days, then V-shaped recovery.",
        "start_date": "2020-02-01",
        "end_date": "2020-08-31",
        "duration_months": 7,
        "max_drawdown_stocks": -0.34,
        "max_drawdown_bonds": -0.02,
        "recovery_months": 5,
        "volatility_stocks": 0.40,
        "volatility_bonds": 0.10,
        "is_featured": True,
        "returns_data": {
            "frequency": "monthly",
            "returns": [
                {"period": "2020-02", "stocks": -0.081, "bonds": 0.018, "cash": 0.001},
                {"period": "2020-03", "stocks": -0.127, "bonds": 0.008, "cash": 0.001},
                {"period": "2020-04", "stocks": 0.128, "bonds": 0.005, "cash": 0.000},
                {"period": "2020-05", "stocks": 0.047, "bonds": 0.006, "cash": 0.000},
                {"period": "2020-06", "stocks": 0.019, "bonds": 0.006, "cash": 0.000},
                {"period": "2020-07", "stocks": 0.056, "bonds": 0.012, "cash": 0.000},
                {"period": "2020-08", "stocks": 0.071, "bonds": -0.001, "cash": 0.000},
            ]
        },
        "key_events": [
            {"date": "2020-02-19", "event": "S&P 500 all-time high", "impact": "Pre-crash peak"},
            {"date": "2020-03-23", "event": "Market bottom", "impact": "S&P 500 at 2,237"},
            {"date": "2020-08-18", "event": "Full recovery", "impact": "S&P 500 exceeds Feb high"},
        ]
    },
    {
        "id": "stagflation_1970s",
        "name": "1970s Stagflation",
        "period": "stagflation_70s",
        "description": "High inflation (11% peak) and stagnant growth. Bonds performed poorly.",
        "start_date": "1973-01-01",
        "end_date": "1974-12-31",
        "duration_months": 24,
        "max_drawdown_stocks": -0.48,
        "max_drawdown_bonds": -0.15,
        "recovery_months": 84,
        "volatility_stocks": 0.25,
        "volatility_bonds": 0.12,
        "is_featured": False,
        "returns_data": {
            "frequency": "annual",
            "returns": [
                {"period": "1973", "stocks": -0.146, "bonds": -0.011, "cash": 0.069},
                {"period": "1974", "stocks": -0.263, "bonds": -0.030, "cash": 0.080},
            ]
        },
        "key_events": [
            {"date": "1973-10-01", "event": "Oil embargo begins", "impact": "Gas prices triple"},
            {"date": "1974-08-01", "event": "Nixon resigns", "impact": "Political uncertainty"},
        ]
    },
    {
        "id": "black_monday_1987",
        "name": "Black Monday 1987",
        "period": "black_monday_1987",
        "description": "Largest single-day percentage decline in stock market history. Dow fell 22.6%.",
        "start_date": "1987-10-01",
        "end_date": "1987-12-31",
        "duration_months": 3,
        "max_drawdown_stocks": -0.33,
        "max_drawdown_bonds": 0.02,
        "recovery_months": 21,
        "volatility_stocks": 0.45,
        "volatility_bonds": 0.06,
        "is_featured": True,
        "returns_data": {
            "frequency": "monthly",
            "returns": [
                {"period": "1987-10", "stocks": -0.216, "bonds": 0.025, "cash": 0.006},
                {"period": "1987-11", "stocks": -0.083, "bonds": 0.015, "cash": 0.005},
                {"period": "1987-12", "stocks": 0.073, "bonds": 0.018, "cash": 0.005},
            ]
        },
        "key_events": [
            {"date": "1987-10-19", "event": "Black Monday", "impact": "Dow drops 22.6% in one day"},
        ]
    },
    {
        "id": "bull_market_1990s",
        "name": "1990s Bull Market",
        "period": "bull_market",
        "description": "One of the longest bull markets in history. S&P 500 gained 417% from 1990-1999.",
        "start_date": "1990-01-01",
        "end_date": "1999-12-31",
        "duration_months": 120,
        "max_drawdown_stocks": -0.03,
        "max_drawdown_bonds": -0.02,
        "recovery_months": 0,
        "volatility_stocks": 0.14,
        "volatility_bonds": 0.05,
        "is_featured": True,
        "returns_data": {
            "frequency": "annual",
            "returns": [
                {"period": "1990", "stocks": -0.031, "bonds": 0.089, "cash": 0.078},
                {"period": "1991", "stocks": 0.304, "bonds": 0.161, "cash": 0.056},
                {"period": "1992", "stocks": 0.076, "bonds": 0.071, "cash": 0.035},
                {"period": "1993", "stocks": 0.100, "bonds": 0.098, "cash": 0.029},
                {"period": "1994", "stocks": 0.013, "bonds": -0.027, "cash": 0.039},
                {"period": "1995", "stocks": 0.376, "bonds": 0.186, "cash": 0.056},
                {"period": "1996", "stocks": 0.230, "bonds": 0.036, "cash": 0.052},
                {"period": "1997", "stocks": 0.333, "bonds": 0.096, "cash": 0.052},
                {"period": "1998", "stocks": 0.285, "bonds": 0.087, "cash": 0.049},
                {"period": "1999", "stocks": 0.210, "bonds": -0.008, "cash": 0.048},
            ]
        },
        "key_events": [
            {"date": "1995-12-05", "event": "Dow closes above 5,000", "impact": "Psychological milestone"},
            {"date": "1999-03-29", "event": "Dow closes above 10,000", "impact": "Tech bubble peak approaching"},
        ]
    },
]
