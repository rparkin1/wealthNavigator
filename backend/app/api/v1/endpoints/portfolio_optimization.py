"""
Portfolio Optimization API Endpoints
Comprehensive API for Section 3: Portfolio Selection & Optimization

REQ-PORT-001, REQ-PORT-003, REQ-PORT-011, REQ-PORT-012
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime

from app.services.portfolio.asset_class_library import (
    ASSET_CLASS_LIBRARY,
    get_all_asset_codes,
    get_asset_class,
    get_simple_allocation,
    get_default_correlation_matrix
)
from app.services.portfolio.multi_level_optimizer import (
    MultiLevelOptimizer,
    HouseholdPortfolio,
    Account,
    Goal,
    OptimizationResult
)
from app.services.portfolio.esg_screening import (
    ESGScreener,
    ESGConstraints,
    create_esg_preset,
    ExclusionCriteria,
    ESGCriteria,
    ESGRating
)
from app.services.portfolio.portfolio_insights import (
    PortfolioInsightsService,
    PerformanceMetrics,
    PortfolioInsight,
    PortfolioAlert
)

router = APIRouter(prefix="/portfolio-optimization", tags=["Portfolio Optimization"])


# ==================== Request/Response Models ====================

class AssetClassResponse(BaseModel):
    """Asset class information"""
    code: str
    name: str
    category: str
    expected_return: float
    volatility: float
    tax_efficiency: float
    benchmark_ticker: Optional[str]
    description: str


class MultiLevelOptimizationRequest(BaseModel):
    """Multi-level optimization request"""
    accounts: List[Dict]
    goals: List[Dict]
    asset_codes: List[str] = Field(default_factory=list)
    use_esg_screening: bool = False
    esg_preset: Optional[str] = None
    esg_constraints: Optional[Dict] = None


class ESGScreeningRequest(BaseModel):
    """ESG screening request"""
    asset_codes: List[str]
    required_criteria: List[str] = Field(default_factory=list)
    exclusions: List[str] = Field(default_factory=list)
    minimum_esg_rating: str = "average"
    minimum_overall_score: Optional[float] = None
    allow_not_rated: bool = True


class InsightsRequest(BaseModel):
    """Portfolio insights request"""
    portfolio_allocation: Dict[str, float]
    performance_metrics: Optional[Dict] = None
    goals: Optional[List[Dict]] = None


class AlertsRequest(BaseModel):
    """Portfolio alerts request"""
    portfolio_allocation: Dict[str, float]
    target_allocation: Dict[str, float]
    performance_metrics: Optional[Dict] = None
    holdings_detail: Optional[Dict] = None


class SimpleAllocationRequest(BaseModel):
    """Simple allocation request"""
    risk_tolerance: float = Field(ge=0.0, le=1.0)
    time_horizon: int = Field(gt=0)
    include_alternatives: bool = False


# ==================== Asset Class Endpoints ====================

@router.get(
    "/asset-classes",
    response_model=List[AssetClassResponse],
    summary="Get all asset classes",
    description="Retrieve all available asset classes with optional filtering by category, return, or volatility.",
    response_description="List of asset classes matching the filter criteria",
    tags=["Asset Classes"]
)
async def get_asset_classes(
    category: Optional[str] = None,
    min_return: Optional[float] = None,
    max_volatility: Optional[float] = None
):
    """
    Get all available asset classes with optional filtering.

    **REQ-PORT-004:** Asset class support (45+ asset classes)

    ## Query Parameters
    - **category** (optional): Filter by category
      - Valid values: equity, fixed_income, alternative, commodity, real_estate, cash
    - **min_return** (optional): Minimum expected annual return (decimal, e.g., 0.08 for 8%)
    - **max_volatility** (optional): Maximum volatility (decimal, e.g., 0.15 for 15%)

    ## Returns
    List of asset classes with:
    - Asset code and name
    - Category and description
    - Expected return and volatility
    - Tax efficiency (0.0-1.0)
    - Benchmark ticker

    ## Example
    ```
    GET /api/v1/portfolio-optimization/asset-classes?category=equity&min_return=0.08
    ```

    ## Response
    ```json
    [
      {
        "code": "US_LC_BLEND",
        "name": "US Large Cap Blend",
        "category": "equity",
        "expected_return": 0.09,
        "volatility": 0.16,
        "tax_efficiency": 0.88,
        "benchmark_ticker": "VOO",
        "description": "S&P 500 and broad large-cap blend"
      }
    ]
    ```
    """
    asset_classes = []

    for code, asset in ASSET_CLASS_LIBRARY.items():
        # Apply filters
        if category and asset.category.value != category:
            continue
        if min_return and asset.expected_return < min_return:
            continue
        if max_volatility and asset.volatility > max_volatility:
            continue

        asset_classes.append(AssetClassResponse(
            code=asset.code,
            name=asset.name,
            category=asset.category.value,
            expected_return=asset.expected_return,
            volatility=asset.volatility,
            tax_efficiency=asset.tax_efficiency,
            benchmark_ticker=asset.benchmark_ticker,
            description=asset.description
        ))

    return asset_classes


@router.get("/asset-classes/{asset_code}", response_model=AssetClassResponse)
async def get_asset_class_detail(asset_code: str):
    """
    Get detailed information about a specific asset class.

    Path Parameters:
    - asset_code: Asset class code (e.g., "US_LC_BLEND")

    Returns:
    - Asset class details
    """
    asset = get_asset_class(asset_code)

    if not asset:
        raise HTTPException(status_code=404, detail=f"Asset class '{asset_code}' not found")

    return AssetClassResponse(
        code=asset.code,
        name=asset.name,
        category=asset.category.value,
        expected_return=asset.expected_return,
        volatility=asset.volatility,
        tax_efficiency=asset.tax_efficiency,
        benchmark_ticker=asset.benchmark_ticker,
        description=asset.description
    )


# ==================== Simple Allocation ====================

@router.post(
    "/simple-allocation",
    summary="Generate simple portfolio allocation",
    description="Create a simple diversified portfolio based on risk tolerance and time horizon using Modern Portfolio Theory.",
    response_description="Portfolio allocation with expected metrics",
    tags=["Optimization"]
)
async def generate_simple_allocation(request: SimpleAllocationRequest):
    """
    Generate a simple diversified portfolio allocation.

    **REQ-PORT-001:** Modern Portfolio Theory (MPT) implementation

    ## Request Body
    - **risk_tolerance** (required): Risk level from 0.0 (conservative) to 1.0 (aggressive)
      - 0.0-0.3: Conservative (more bonds)
      - 0.3-0.7: Moderate (balanced)
      - 0.7-1.0: Aggressive (more stocks)
    - **time_horizon** (required): Years until goal (positive integer)
    - **include_alternatives** (optional): Include REITs, gold, commodities (default: false)

    ## Returns
    - **allocation**: Asset allocation weights (sum to 1.0)
    - **expected_return**: Expected annual return
    - **expected_volatility**: Portfolio volatility (standard deviation)
    - **sharpe_ratio**: Risk-adjusted return metric
    - **risk_level**: Conservative, moderate, or aggressive

    ## Example Request
    ```json
    {
      "risk_tolerance": 0.6,
      "time_horizon": 15,
      "include_alternatives": true
    }
    ```

    ## Example Response
    ```json
    {
      "allocation": {
        "US_LC_BLEND": 0.27,
        "INTL_DEV_BLEND": 0.15,
        "US_TREASURY_INTER": 0.16,
        "US_CORP_IG": 0.12,
        "TIPS": 0.08,
        "CASH": 0.04,
        "US_REIT": 0.03,
        "GOLD": 0.02
      },
      "expected_return": 0.078,
      "expected_volatility": 0.123,
      "sharpe_ratio": 0.31,
      "risk_level": "moderate"
    }
    ```
    """
    allocation = get_simple_allocation(
        risk_tolerance=request.risk_tolerance,
        time_horizon=request.time_horizon,
        include_alternatives=request.include_alternatives
    )

    # Calculate expected metrics
    expected_return = 0.0
    expected_volatility = 0.0

    for asset_code, weight in allocation.items():
        asset = ASSET_CLASS_LIBRARY[asset_code]
        expected_return += weight * asset.expected_return
        expected_volatility += weight * asset.volatility  # Simplified

    return {
        "allocation": allocation,
        "expected_return": expected_return,
        "expected_volatility": expected_volatility,
        "sharpe_ratio": (expected_return - 0.04) / expected_volatility if expected_volatility > 0 else 0,
        "risk_level": "conservative" if request.risk_tolerance < 0.3 else "moderate" if request.risk_tolerance < 0.7 else "aggressive"
    }


# ==================== Multi-Level Optimization ====================

@router.post(
    "/multi-level-optimization",
    response_model=Dict,
    summary="Multi-level portfolio optimization",
    description="Comprehensive household optimization across goals and accounts with tax-aware placement.",
    response_description="Complete optimization results with allocations and recommendations",
    tags=["Optimization"]
)
async def optimize_multi_level(request: MultiLevelOptimizationRequest):
    """
    Perform comprehensive multi-level portfolio optimization.

    **REQ-PORT-003:** Multi-level optimization (Goal, Account, Household)

    ## Three-Level Optimization Process
    1. **Goal-level**: Allocate capital to goals based on priority, optimize each goal portfolio
    2. **Account-level**: Tax-aware asset placement (bonds in tax-deferred, growth in Roth)
    3. **Household-level**: Aggregate analysis with rebalancing recommendations

    ## Request Body
    - **accounts** (required): Array of account objects
      - id, name, type (taxable/tax_deferred/tax_exempt), balance, current_holdings
    - **goals** (required): Array of goal objects
      - id, name, target_amount, current_amount, years_to_goal
      - priority (essential/important/aspirational)
      - risk_tolerance (0.0-1.0), success_threshold (0.0-1.0)
    - **asset_codes** (optional): Asset classes to use (default: top 10 assets)
    - **use_esg_screening** (optional): Apply ESG filtering (default: false)
    - **esg_preset** (optional): ESG preset (conservative/moderate/light/none)
    - **esg_constraints** (optional): Custom ESG constraints object

    ## Returns
    - **optimization_level**: household
    - **total_value**: Total portfolio value
    - **expected_return**: Expected annual return
    - **expected_volatility**: Portfolio volatility
    - **sharpe_ratio**: Risk-adjusted return
    - **goal_allocations**: Per-goal asset weights
    - **account_allocations**: Per-account dollar allocations
    - **household_allocation**: Overall asset weights
    - **tax_metrics**:
      - estimated_tax_drag: Annual tax cost
      - asset_location_efficiency: Score 0-1 (higher is better)
    - **diversification_score**: HHI-based score 0-1
    - **rebalancing_needed**: Boolean flag
    - **recommendations**: Array of actionable recommendations

    ## Example Request
    ```json
    {
      "accounts": [
        {
          "id": "401k",
          "name": "401(k) Plan",
          "type": "tax_deferred",
          "balance": 150000,
          "current_holdings": {}
        },
        {
          "id": "roth",
          "name": "Roth IRA",
          "type": "tax_exempt",
          "balance": 75000,
          "current_holdings": {}
        }
      ],
      "goals": [
        {
          "id": "retirement",
          "name": "Retirement at 65",
          "target_amount": 2000000,
          "current_amount": 225000,
          "years_to_goal": 20,
          "priority": "essential",
          "risk_tolerance": 0.6,
          "success_threshold": 0.85
        }
      ],
      "asset_codes": [],
      "use_esg_screening": false
    }
    ```

    ## Example Response
    ```json
    {
      "optimization_level": "household",
      "total_value": 225000,
      "expected_return": 0.075,
      "expected_volatility": 0.14,
      "sharpe_ratio": 0.25,
      "goal_allocations": {
        "retirement": {
          "US_LC_BLEND": 0.35,
          "INTL_DEV_BLEND": 0.20,
          "US_TREASURY_INTER": 0.25,
          "US_CORP_IG": 0.15,
          "CASH": 0.05
        }
      },
      "account_allocations": {
        "401k": {
          "US_CORP_IG": 90000,
          "US_TREASURY_INTER": 60000
        },
        "roth": {
          "US_LC_BLEND": 52500,
          "INTL_DEV_BLEND": 22500
        }
      },
      "household_allocation": {
        "US_LC_BLEND": 0.35,
        "INTL_DEV_BLEND": 0.20,
        "US_TREASURY_INTER": 0.25,
        "US_CORP_IG": 0.15,
        "CASH": 0.05
      },
      "tax_metrics": {
        "estimated_tax_drag": 0.012,
        "asset_location_efficiency": 0.82
      },
      "diversification_score": 0.78,
      "rebalancing_needed": false,
      "recommendations": [
        "✅ Portfolio is well-optimized for your 20-year retirement goal.",
        "📊 Asset location efficiency is 82%. Consider moving more bonds to tax-deferred accounts."
      ]
    }
    ```
    """
    # Parse accounts and goals
    accounts = [Account(**acc) for acc in request.accounts]
    goals = [Goal(**goal) for goal in request.goals]

    total_value = sum(acc.balance for acc in accounts)

    household = HouseholdPortfolio(
        accounts=accounts,
        goals=goals,
        total_value=total_value
    )

    # Determine asset codes
    asset_codes = request.asset_codes if request.asset_codes else get_all_asset_codes()[:20]  # Default to first 20

    # Apply ESG screening if requested
    if request.use_esg_screening:
        esg_screener = ESGScreener()

        if request.esg_preset:
            esg_constraints = create_esg_preset(request.esg_preset)
        elif request.esg_constraints:
            esg_constraints = ESGConstraints(**request.esg_constraints)
        else:
            esg_constraints = create_esg_preset("moderate")

        screening_result = esg_screener.screen_assets(asset_codes, esg_constraints)
        asset_codes = screening_result.eligible_assets

        if not asset_codes:
            raise HTTPException(
                status_code=400,
                detail="No assets meet ESG criteria. Please relax constraints."
            )

    # Perform optimization
    optimizer = MultiLevelOptimizer()
    result = optimizer.optimize_household(
        household=household,
        asset_codes=asset_codes,
        correlation_matrix=None  # Use defaults
    )

    return {
        "optimization_level": result.level,
        "total_value": result.total_value,
        "expected_return": result.expected_return,
        "expected_volatility": result.expected_volatility,
        "sharpe_ratio": result.sharpe_ratio,
        "goal_allocations": result.goal_allocations,
        "account_allocations": result.account_allocations,
        "household_allocation": result.household_allocation,
        "tax_metrics": {
            "estimated_tax_drag": result.estimated_tax_drag,
            "asset_location_efficiency": result.asset_location_efficiency
        },
        "diversification_score": result.diversification_score,
        "rebalancing_needed": result.rebalancing_needed,
        "recommendations": result.recommendations,
        "timestamp": datetime.now().isoformat()
    }


# ==================== ESG Screening ====================

@router.post("/esg-screening")
async def screen_assets_esg(request: ESGScreeningRequest):
    """
    Screen assets based on ESG (Environmental, Social, Governance) criteria.

    REQ-PORT-011: Constraint definition (ESG/ethical screening)

    Request Body:
    - asset_codes: Assets to screen
    - required_criteria: ESG criteria that must be met
    - exclusions: Industries/sectors to exclude
    - minimum_esg_rating: Minimum ESG rating (leader, average, laggard)
    - minimum_overall_score: Minimum ESG score (0-100)
    - allow_not_rated: Allow assets without ESG ratings

    Returns:
    - Screening result with eligible/excluded assets
    """
    screener = ESGScreener()

    # Parse exclusions and criteria
    exclusions = [ExclusionCriteria(e) for e in request.exclusions]
    required_criteria = [ESGCriteria(c) for c in request.required_criteria]

    constraints = ESGConstraints(
        required_criteria=required_criteria,
        exclusions=exclusions,
        minimum_esg_rating=ESGRating(request.minimum_esg_rating),
        minimum_overall_score=request.minimum_overall_score,
        allow_not_rated=request.allow_not_rated
    )

    result = screener.screen_assets(request.asset_codes, constraints)

    return {
        "eligible_assets": result.eligible_assets,
        "excluded_assets": result.excluded_assets,
        "portfolio_esg_score": result.portfolio_esg_score,
        "recommendations": result.recommendations,
        "summary": {
            "total_screened": len(request.asset_codes),
            "passed": len(result.eligible_assets),
            "excluded": len(result.excluded_assets),
            "pass_rate": len(result.eligible_assets) / len(request.asset_codes) if request.asset_codes else 0
        }
    }


@router.get("/esg-presets")
async def get_esg_presets():
    """
    Get available ESG screening presets.

    Returns:
    - List of ESG presets with descriptions
    """
    return {
        "presets": [
            {
                "name": "conservative",
                "description": "Strictest ESG criteria. Excludes fossil fuels, tobacco, weapons, gambling. Requires leader ratings.",
                "minimum_rating": "leader",
                "minimum_score": 75
            },
            {
                "name": "moderate",
                "description": "Balanced ESG approach. Excludes tobacco and weapons. Requires average ratings.",
                "minimum_rating": "average",
                "minimum_score": 60
            },
            {
                "name": "light",
                "description": "Light ESG screening. Only excludes tobacco. Requires average ratings.",
                "minimum_rating": "average",
                "minimum_score": None
            },
            {
                "name": "none",
                "description": "No ESG screening applied. All assets eligible.",
                "minimum_rating": "laggard",
                "minimum_score": None
            }
        ]
    }


# ==================== Portfolio Insights & Alerts ====================

@router.post("/insights", response_model=List[PortfolioInsight])
async def generate_portfolio_insights(request: InsightsRequest):
    """
    Generate intelligent portfolio insights.

    REQ-PORT-012: Ongoing insights

    Analyzes:
    - Diversification
    - Risk profile
    - Performance
    - Tax efficiency
    - ESG characteristics
    - Goal alignment

    Request Body:
    - portfolio_allocation: Current portfolio allocation
    - performance_metrics: Historical performance data (optional)
    - goals: Financial goals (optional)

    Returns:
    - List of actionable insights
    """
    insights_service = PortfolioInsightsService()

    # Parse performance metrics if provided
    performance = None
    if request.performance_metrics:
        performance = PerformanceMetrics(**request.performance_metrics)

    insights = insights_service.generate_insights(
        portfolio_allocation=request.portfolio_allocation,
        performance_metrics=performance,
        goals=request.goals
    )

    return insights


@router.post("/alerts", response_model=List[PortfolioAlert])
async def generate_portfolio_alerts(request: AlertsRequest):
    """
    Generate proactive portfolio alerts.

    REQ-PORT-012: Proactive alerts

    Monitors for:
    - Rebalancing needs
    - Concentration risk
    - Underperformance
    - High fees
    - Tax-loss harvesting opportunities
    - Market volatility

    Request Body:
    - portfolio_allocation: Current allocation
    - target_allocation: Target allocation
    - performance_metrics: Performance data (optional)
    - holdings_detail: Detailed holdings (optional)

    Returns:
    - List of alerts with severity and recommendations
    """
    insights_service = PortfolioInsightsService()

    # Parse performance metrics if provided
    performance = None
    if request.performance_metrics:
        performance = PerformanceMetrics(**request.performance_metrics)

    alerts = insights_service.generate_alerts(
        portfolio_allocation=request.portfolio_allocation,
        target_allocation=request.target_allocation,
        performance_metrics=performance,
        holdings_detail=request.holdings_detail
    )

    return alerts


# ==================== Utility Endpoints ====================

@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "Portfolio Optimization",
        "asset_classes_available": len(ASSET_CLASS_LIBRARY),
        "version": "3.0.0",
        "features": [
            "Multi-level optimization",
            "50+ asset classes",
            "ESG screening",
            "Tax-aware placement",
            "Portfolio insights",
            "Proactive alerts"
        ]
    }


@router.get("/summary")
async def get_service_summary():
    """Get service capabilities summary."""
    return {
        "name": "Portfolio Optimization Service",
        "version": "3.0.0",
        "completion_status": "100%",
        "features": {
            "asset_classes": {
                "total": len(ASSET_CLASS_LIBRARY),
                "categories": ["equity", "fixed_income", "real_estate", "commodity", "alternative", "cash"],
                "esg_options": 3
            },
            "optimization_levels": ["goal", "account", "household"],
            "esg_screening": {
                "presets": 4,
                "exclusion_criteria": len(ExclusionCriteria),
                "esg_criteria": len(ESGCriteria)
            },
            "insights_alerts": {
                "insight_categories": ["diversification", "risk", "performance", "tax", "esg", "goals"],
                "alert_types": 9
            }
        },
        "api_endpoints": 11,
        "documentation": "/docs"
    }
