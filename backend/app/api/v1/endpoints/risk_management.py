"""
Risk Management API Endpoints
Comprehensive API for risk assessment, stress testing, and hedging strategies

REQ-RISK-007: Risk management API endpoints
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.portfolio_data_service import get_portfolio_value_and_allocation
from app.services.risk.risk_assessment import (
    RiskAssessmentService,
    RiskMetrics,
    RiskAssessmentResult
)
from app.services.risk.stress_testing import (
    StressTestingService,
    StressTestingSuite,
    StressTestResult
)
from app.services.risk.hedging_strategies import (
    HedgingService,
    HedgingRecommendation,
    HedgingObjectives
)
from app.services.risk.hedging_education import (
    HedgingEducationService,
    HedgingEducationContent,
    HedgingEducationTopic
)

router = APIRouter(tags=["Risk Management"])


# ==================== Request/Response Models ====================

class RiskAssessmentRequest(BaseModel):
    """Risk assessment request"""
    portfolio_value: float = Field(gt=0, description="Portfolio value")
    allocation: Dict[str, float] = Field(description="Asset allocation weights")
    expected_return: float = Field(description="Expected annual return")
    volatility: float = Field(gt=0, description="Annual volatility")
    returns_history: Optional[List[float]] = Field(None, description="Historical daily returns")
    benchmark_returns: Optional[List[float]] = Field(None, description="Benchmark returns")


class StressTestRequest(BaseModel):
    """Stress test request"""
    portfolio_value: float = Field(gt=0)
    allocation: Dict[str, float]
    scenarios: Optional[List[str]] = Field(None, description="Specific scenarios to test")
    include_all_presets: bool = Field(True, description="Include all preset scenarios")


class HedgingRequest(BaseModel):
    """Hedging recommendation request"""
    portfolio_value: float = Field(gt=0)
    allocation: Dict[str, float]
    risk_metrics: Dict
    market_conditions: Optional[Dict] = None
    objectives: Optional[HedgingObjectives] = None


class MonteCarloStressRequest(BaseModel):
    """Monte Carlo stress test request"""
    portfolio_value: float = Field(gt=0)
    allocation: Dict[str, float]
    asset_volatilities: Dict[str, float]
    n_simulations: int = Field(10000, ge=1000, le=50000)
    confidence_level: float = Field(0.05, ge=0.01, le=0.10)


# ==================== Endpoints ====================

@router.post(
    "/assess-risk",
    response_model=RiskAssessmentResult,
    summary="Comprehensive risk assessment",
    description="Calculate comprehensive risk metrics including VaR, CVaR, Sharpe, Sortino, and more",
    tags=["Risk Assessment"]
)
async def assess_risk(request: RiskAssessmentRequest):
    """
    Perform comprehensive portfolio risk assessment.

    **REQ-RISK-001:** Risk metrics calculation

    ## Metrics Calculated
    - **Value at Risk (VaR)**: 1-day and 1-month at 95% and 99% confidence
    - **Conditional VaR (CVaR)**: Expected shortfall beyond VaR
    - **Sharpe Ratio**: Risk-adjusted return
    - **Sortino Ratio**: Downside risk-adjusted return
    - **Calmar Ratio**: Return vs maximum drawdown
    - **Beta & Alpha**: Market risk and excess return
    - **Max Drawdown**: Peak-to-trough decline
    - **Skewness & Kurtosis**: Distribution characteristics
    - **Concentration Score**: Portfolio diversification

    ## Example Request
    ```json
    {
      "portfolio_value": 500000,
      "allocation": {
        "US_LC_BLEND": 0.40,
        "INTL_DEV_BLEND": 0.20,
        "US_TREASURY_INTER": 0.30,
        "GOLD": 0.10
      },
      "expected_return": 0.08,
      "volatility": 0.15
    }
    ```

    ## Example Response
    ```json
    {
      "portfolio_value": 500000,
      "metrics": {
        "var_95_1day": 9712,
        "var_99_1month": 59823,
        "sharpe_ratio": 0.267,
        "max_drawdown": 0.30,
        "beta": 0.88,
        "risk_score": 45.2,
        "risk_level": "moderate"
      },
      "recommendations": [
        "✅ Portfolio risk profile is well-balanced."
      ],
      "warnings": []
    }
    ```
    """
    try:
        service = RiskAssessmentService()

        result = service.assess_risk(
            portfolio_value=request.portfolio_value,
            allocation=request.allocation,
            expected_return=request.expected_return,
            volatility=request.volatility,
            returns_history=request.returns_history,
            benchmark_returns=request.benchmark_returns
        )

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/assess-risk-auto",
    response_model=RiskAssessmentResult,
    summary="Auto risk assessment from database",
    description="Automatically fetch portfolio from database and perform risk assessment",
    tags=["Risk Assessment"]
)
async def assess_risk_auto(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    expected_return: float = 0.08,
    volatility: float = 0.15
):
    """
    Perform risk assessment using real portfolio data from database.

    Automatically fetches:
    - Portfolio value from holdings
    - Asset allocation from holdings by asset class
    - Then performs comprehensive risk analysis

    **Advantages over POST endpoint:**
    - No manual data entry needed
    - Always uses current portfolio state
    - Consistent with database values

    **Parameters:**
    - `expected_return`: Expected annual return (default 8%)
    - `volatility`: Expected annual volatility (default 15%)
    """
    try:
        # Fetch real portfolio data from database
        portfolio_value, allocation = await get_portfolio_value_and_allocation(
            user_id=current_user.id,
            db=db
        )

        if portfolio_value == 0 or not allocation:
            raise HTTPException(
                status_code=404,
                detail="No portfolio data found. Please add holdings first."
            )

        # Perform risk assessment with real data
        service = RiskAssessmentService()
        result = service.assess_risk(
            portfolio_value=portfolio_value,
            allocation=allocation,
            expected_return=expected_return,
            volatility=volatility,
            returns_history=None,
            benchmark_returns=None
        )

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Risk assessment failed: {str(e)}")


@router.post(
    "/stress-test",
    response_model=StressTestingSuite,
    summary="Portfolio stress testing",
    description="Run stress tests with historical and hypothetical scenarios",
    tags=["Stress Testing"]
)
async def run_stress_test(request: StressTestRequest):
    """
    Run comprehensive stress test suite on portfolio.

    **REQ-RISK-003:** Stress testing with scenarios

    ## Available Scenarios
    - **2008_financial_crisis**: Global financial crisis
    - **2020_covid_crash**: COVID-19 pandemic shock
    - **2000_dot_com_bubble**: Tech bubble collapse
    - **1987_black_monday**: Largest single-day crash
    - **rising_rates**: Rapid interest rate rise
    - **recession**: Standard recession
    - **stagflation**: High inflation + low growth

    ## Example Request
    ```json
    {
      "portfolio_value": 500000,
      "allocation": {
        "US_LC_BLEND": 0.60,
        "US_TREASURY_INTER": 0.30,
        "GOLD": 0.10
      },
      "scenarios": ["2008_financial_crisis", "2020_covid_crash", "recession"]
    }
    ```

    ## Example Response
    ```json
    {
      "portfolio_value": 500000,
      "scenarios_tested": 3,
      "worst_case_scenario": {
        "scenario_name": "2008 Financial Crisis",
        "value_change": -185000,
        "pct_change": -0.37,
        "severity": "catastrophic"
      },
      "average_impact": -128000,
      "value_at_risk_stress": 175000
    }
    ```
    """
    try:
        service = StressTestingService()

        result = service.run_stress_test_suite(
            portfolio_value=request.portfolio_value,
            allocation=request.allocation,
            scenarios=request.scenarios,
            include_all_presets=request.include_all_presets
        )

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/stress-test-auto",
    response_model=StressTestingSuite,
    summary="Auto stress test from database",
    description="Automatically fetch portfolio and run stress tests",
    tags=["Stress Testing"]
)
async def stress_test_auto(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    scenarios: Optional[List[str]] = None,
    include_all_presets: bool = True
):
    """
    Run stress tests using real portfolio data from database.

    Automatically fetches portfolio value and allocation from holdings,
    then runs comprehensive stress test suite.
    """
    try:
        # Fetch real portfolio data
        portfolio_value, allocation = await get_portfolio_value_and_allocation(
            user_id=current_user.id,
            db=db
        )

        if portfolio_value == 0 or not allocation:
            raise HTTPException(
                status_code=404,
                detail="No portfolio data found. Please add holdings first."
            )

        # Run stress test
        service = StressTestingService()
        result = service.run_stress_test_suite(
            portfolio_value=portfolio_value,
            allocation=allocation,
            scenarios=scenarios,
            include_all_presets=include_all_presets
        )

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stress test failed: {str(e)}")


@router.post(
    "/hedging-strategies",
    response_model=HedgingRecommendation,
    summary="Hedging strategy recommendations",
    description="Get comprehensive hedging strategy recommendations",
    tags=["Hedging"]
)
async def recommend_hedging(request: HedgingRequest):
    """
    Generate hedging strategy recommendations.

    **REQ-RISK-005:** Hedging strategy recommendations

    ## Strategy Types
    - **Protective Put**: Buy puts to protect downside
    - **Collar**: Buy puts + sell calls (low/zero cost)
    - **Put Spread**: Buy put + sell lower put (reduced cost)
    - **Tail Risk Hedge**: Deep OTM puts for crashes
    - **Diversification**: Add uncorrelated assets
    - **Volatility Hedge**: VIX products
    - **Inverse ETF**: Short exposure

    ## Example Request
    ```json
    {
      "portfolio_value": 500000,
      "allocation": {
        "US_LC_BLEND": 0.70,
        "US_TREASURY_INTER": 0.30
      },
      "risk_metrics": {
        "annual_volatility": 0.18,
        "beta": 1.15,
        "max_drawdown": 0.28,
        "risk_level": "aggressive"
      }
    }
    ```

    ## Example Response
    ```json
    {
      "portfolio_value": 500000,
      "current_risk_level": "aggressive",
      "optimal_strategy": {
        "strategy_type": "collar",
        "name": "Collar Strategy",
        "cost_estimate": 2500,
        "cost_pct": 0.005,
        "protection_level": 0.90,
        "suitability_score": 85
      },
      "recommended_strategies": [...]
    }
    ```
    """
    try:
        service = HedgingService()

        result = service.recommend_hedging_strategies(
            portfolio_value=request.portfolio_value,
            allocation=request.allocation,
            risk_metrics=request.risk_metrics,
            market_conditions=request.market_conditions,
            objectives=request.objectives
        )

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/hedging-strategies-auto",
    response_model=HedgingRecommendation,
    summary="Auto hedging recommendations from database",
    description="Automatically fetch portfolio and generate hedging strategies",
    tags=["Hedging"]
)
async def hedging_strategies_auto(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate hedging recommendations using real portfolio data from database.

    Automatically:
    1. Fetches portfolio value and allocation from holdings
    2. Calculates risk metrics
    3. Recommends appropriate hedging strategies
    """
    try:
        # Fetch real portfolio data
        portfolio_value, allocation = await get_portfolio_value_and_allocation(
            user_id=current_user.id,
            db=db
        )

        if portfolio_value == 0 or not allocation:
            raise HTTPException(
                status_code=404,
                detail="No portfolio data found. Please add holdings first."
            )

        # First assess risk to get metrics
        risk_service = RiskAssessmentService()
        risk_result = risk_service.assess_risk(
            portfolio_value=portfolio_value,
            allocation=allocation,
            expected_return=0.08,
            volatility=0.15
        )

        # Convert risk result to dict format for hedging service
        risk_metrics = {
            "annual_volatility": risk_result.metrics.annual_volatility,
            "beta": risk_result.metrics.beta,
            "max_drawdown": risk_result.metrics.max_drawdown,
            "risk_level": risk_result.metrics.risk_level,
            "var_95_1day": risk_result.metrics.var_95_1day,
        }

        # Generate hedging recommendations
        hedging_service = HedgingService()
        result = hedging_service.recommend_hedging_strategies(
            portfolio_value=portfolio_value,
            allocation=allocation,
            risk_metrics=risk_metrics,
            market_conditions=None,
            objectives=None
        )

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hedging recommendations failed: {str(e)}")


@router.post(
    "/monte-carlo-stress",
    summary="Monte Carlo stress testing",
    description="Run Monte Carlo simulation for stress testing",
    tags=["Stress Testing"]
)
async def monte_carlo_stress_test(request: MonteCarloStressRequest):
    """
    Run Monte Carlo simulation for portfolio stress testing.

    **REQ-RISK-004:** Monte Carlo simulation integration

    ## Parameters
    - **n_simulations**: Number of simulations (1,000 - 50,000)
    - **confidence_level**: VaR confidence (default 5% = 95% VaR)

    ## Example Request
    ```json
    {
      "portfolio_value": 500000,
      "allocation": {
        "US_LC_BLEND": 0.60,
        "US_TREASURY_INTER": 0.40
      },
      "asset_volatilities": {
        "US_LC_BLEND": 0.18,
        "US_TREASURY_INTER": 0.05
      },
      "n_simulations": 10000,
      "confidence_level": 0.05
    }
    ```

    ## Example Response
    ```json
    {
      "simulations": 10000,
      "mean_value": 500250,
      "var_loss": 18500,
      "cvar_loss": 23750,
      "worst_loss": 47200,
      "confidence_level": 0.05
    }
    ```
    """
    try:
        service = StressTestingService()

        result = service.run_monte_carlo_stress(
            portfolio_value=request.portfolio_value,
            allocation=request.allocation,
            asset_volatilities=request.asset_volatilities,
            n_simulations=request.n_simulations,
            confidence_level=request.confidence_level
        )

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/stress-scenarios",
    summary="Get available stress test scenarios",
    description="List all available preset stress test scenarios",
    tags=["Stress Testing"]
)
async def get_stress_scenarios():
    """
    Get list of available stress test scenarios.

    ## Returns
    List of scenario names, descriptions, and shock parameters.
    """
    service = StressTestingService()

    scenarios = []
    for name, scenario in service.HISTORICAL_SCENARIOS.items():
        scenarios.append({
            "name": scenario.name,
            "description": scenario.description,
            "type": scenario.type,
            "probability": scenario.probability,
            "key": name
        })

    return {"scenarios": scenarios, "total": len(scenarios)}


@router.get(
    "/health",
    summary="Health check",
    description="Check risk management service health"
)
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Risk Management API",
        "endpoints": 6
    }


@router.get(
    "/hedging-education",
    response_model=HedgingEducationContent,
    summary="Get hedging education content",
    description="Get comprehensive educational content about hedging strategies",
    tags=["Hedging", "Education"]
)
async def get_hedging_education():
    """
    Get comprehensive hedging education content.

    **REQ-RISK-007:** Hedging education

    ## Topics Covered
    - When to use hedging strategies
    - Costs and trade-offs
    - Hedging vs insurance
    - Long-term impact on returns
    - Alternatives to hedging

    ## Returns
    Complete educational content with examples, key points, and common mistakes.
    """
    try:
        service = HedgingEducationService()
        return service.get_all_education_content()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/hedging-education/{topic_name}",
    response_model=HedgingEducationTopic,
    summary="Get specific hedging education topic",
    description="Get detailed education content for a specific hedging topic",
    tags=["Hedging", "Education"]
)
async def get_hedging_education_topic(topic_name: str):
    """
    Get specific hedging education topic.

    **Available Topics:**
    - `when_to_hedge`: When hedging is appropriate vs inappropriate
    - `costs_and_tradeoffs`: Costs and trade-offs of hedging
    - `hedging_vs_insurance`: Difference between hedging and insurance
    - `long_term_impact`: Long-term impact on portfolio returns
    - `alternatives`: Alternatives to hedging (cash reserves, diversification)
    """
    try:
        service = HedgingEducationService()
        return service.get_topic(topic_name)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/summary",
    summary="Service summary",
    description="Get service capabilities summary"
)
async def service_summary():
    """Service summary endpoint"""
    return {
        "name": "Risk Management Service",
        "version": "1.0.0",
        "features": [
            "Comprehensive risk assessment (20+ metrics)",
            "Stress testing with 7 historical scenarios",
            "Hedging strategy recommendations (8 types)",
            "User-specified hedging objectives",
            "Hedging education content",
            "Monte Carlo simulation",
            "Real-time risk monitoring"
        ],
        "api_endpoints": 8,
        "hedging_strategies": [
            "Protective Put",
            "Covered Call",
            "Collar",
            "Put Spread",
            "Tail Risk Hedge",
            "Diversification",
            "Volatility Hedge (VIX)",
            "Inverse ETF"
        ],
        "metrics_available": [
            "VaR (95%, 99%)",
            "CVaR (Expected Shortfall)",
            "Sharpe Ratio",
            "Sortino Ratio",
            "Calmar Ratio",
            "Max Drawdown",
            "Beta & Alpha",
            "Skewness & Kurtosis"
        ]
    }
