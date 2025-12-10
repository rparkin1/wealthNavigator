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
from app.services.portfolio.ai_explanations import (
    AIExplanationsService,
    PortfolioExplanation,
    ExplanationType
)
from app.services.portfolio.factor_attribution_service import (
    FamaFrenchFactorService,
    FactorModel,
    FamaFrenchResult
)
from app.services.portfolio.capm_service import (
    CAPMService,
    CAPMMetrics,
    CAPMPortfolioAnalysis,
    SecurityMarketLine
)
from app.models.portfolio_api import (
    FactorAnalysisRequest,
    FactorAnalysisResponse,
    CAPMAnalysisRequest,
    CAPMMetricsResponse,
    CAPMPortfolioRequest,
    CAPMPortfolioResponse,
    SecurityMarketLineResponse
)

router = APIRouter(tags=["Portfolio Optimization"])


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


# ==================== AI Explanations Endpoints (REQ-PORT-010) ====================

@router.post("/explain-allocation", response_model=PortfolioExplanation)
async def explain_portfolio_allocation(
    allocation: Dict[str, float],
    user_profile: Dict
):
    """
    Get AI-powered explanation of portfolio allocation.

    REQ-PORT-010: Explaining allocations in plain language

    Request Body:
    - allocation: Portfolio allocation {asset_code: weight}
    - user_profile: User profile with risk_tolerance, time_horizon_years, primary_goal

    Returns:
    - Plain language explanation with educational notes
    """
    ai_service = AIExplanationsService()

    explanation = ai_service.explain_allocation(
        allocation=allocation,
        user_profile=user_profile
    )

    return explanation


@router.get("/explain-concept/{concept}", response_model=PortfolioExplanation)
async def explain_investment_concept(concept: str):
    """
    Explain investment concepts in plain language.

    REQ-PORT-010: Investment education

    Supported concepts:
    - diversification
    - risk_tolerance
    - rebalancing
    - expected_return
    - volatility
    - asset_allocation
    - time_horizon
    - tax_efficiency

    Returns:
    - Plain language explanation with examples
    """
    ai_service = AIExplanationsService()

    explanation = ai_service.explain_investment_concept(concept)

    return explanation


@router.post("/translate-goal", response_model=PortfolioExplanation)
async def translate_goal_to_allocation(
    goal_description: str,
    goal_amount: float,
    years_to_goal: int,
    current_savings: float = 0
):
    """
    Translate financial goal into recommended allocation.

    REQ-PORT-010: Translating goals into allocations

    Request Body:
    - goal_description: Natural language goal description
    - goal_amount: Target amount
    - years_to_goal: Years until goal
    - current_savings: Current amount saved

    Returns:
    - Recommended allocation with explanation
    """
    ai_service = AIExplanationsService()

    explanation = ai_service.translate_goal_to_allocation(
        goal_description=goal_description,
        goal_amount=goal_amount,
        years_to_goal=years_to_goal,
        current_savings=current_savings
    )

    return explanation


@router.post("/explain-design", response_model=PortfolioExplanation)
async def explain_portfolio_design(
    allocation: Dict[str, float],
    goals: List[Dict]
):
    """
    Explain how portfolio is designed to meet goals.

    REQ-PORT-010: Describing portfolio design

    Request Body:
    - allocation: Portfolio allocation
    - goals: User's financial goals

    Returns:
    - Explanation of portfolio design rationale
    """
    ai_service = AIExplanationsService()

    explanation = ai_service.explain_portfolio_design(
        allocation=allocation,
        goals=goals
    )

    return explanation


@router.post("/ask-question", response_model=PortfolioExplanation)
async def answer_portfolio_question(
    question: str,
    portfolio_context: Dict
):
    """
    Answer user questions about their portfolio.

    REQ-PORT-012: Answering portfolio questions

    Request Body:
    - question: User's question
    - portfolio_context: Portfolio data for context

    Returns:
    - AI-generated answer with educational notes
    """
    ai_service = AIExplanationsService()

    explanation = ai_service.answer_portfolio_question(
        question=question,
        portfolio_context=portfolio_context
    )

    return explanation


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
            "ai_guidance": {
                "plain_language_explanations": True,
                "investment_education": True,
                "goal_translation": True,
                "portfolio_design_explanation": True,
                "qa_capability": True
            },
            "esg_screening": {
                "presets": 4,
                "exclusion_criteria": len(ExclusionCriteria),
                "trade_off_analysis": True,
                "alternative_suggestions": True,
                "esg_criteria": len(ESGCriteria)
            },
            "insights_alerts": {
                "insight_categories": ["diversification", "risk", "performance", "tax", "esg", "goals"],
                "alert_types": 9
            },
            "advanced_analysis": {
                "fama_french_factor_attribution": True,
                "capm_integration": True,
                "factor_models": ["three_factor", "five_factor"],
                "security_market_line": True
            }
        },
        "api_endpoints": 11,
        "documentation": "/docs"
    }


# ==================== Factor Attribution Endpoints (Fama-French) ====================

@router.post(
    "/factor-attribution",
    response_model=FactorAnalysisResponse,
    summary="Fama-French Factor Attribution Analysis",
    description="Perform factor-based performance attribution using Fama-French 3-factor or 5-factor models.",
    response_description="Complete factor analysis with exposures, attribution, and recommendations",
    tags=["Advanced Analysis"]
)
async def analyze_factor_attribution(request: FactorAnalysisRequest):
    """
    Perform Fama-French factor attribution analysis.

    **REQ-PORT-013:** Factor-based attribution (Fama-French factors)
    **PRD Section 4:** Portfolio Optimization Engine

    ## Factor Models
    - **3-Factor Model**: Market (MKT-RF), Size (SMB), Value (HML)
    - **5-Factor Model**: + Profitability (RMW), Investment (CMA)

    ## Request Body
    - **portfolio_returns** (required): Historical returns (daily or monthly)
    - **market_returns** (required): Market benchmark returns (same frequency)
    - **factor_returns** (optional): Custom factor returns. If not provided, uses historical averages
    - **model_type** (optional): "three_factor" or "five_factor" (default: three_factor)
    - **frequency** (optional): "daily" or "monthly" (default: daily)

    ## Returns
    - **alpha**: Excess return not explained by factors (annualized)
    - **exposures**: Factor loadings (betas) with statistical significance
    - **attributions**: Performance contribution by each factor
    - **r_squared**: How much variance is explained by the model
    - **interpretation**: Plain language explanation
    - **recommendations**: Actionable portfolio recommendations

    ## Example Request
    ```json
    {
      "portfolio_returns": [0.001, 0.002, -0.001, 0.003, 0.0015],
      "market_returns": [0.0008, 0.0015, -0.0012, 0.0025, 0.0012],
      "model_type": "three_factor",
      "frequency": "daily"
    }
    ```

    ## Interpretation
    - **Positive Alpha**: Portfolio outperforming after accounting for factor exposures
    - **High R²**: Returns well-explained by factors
    - **Significant Factor Betas**: Identifiable factor tilts (size, value, etc.)
    """
    service = FamaFrenchFactorService()

    # Convert model type to enum
    model = FactorModel.THREE_FACTOR if request.model_type == "three_factor" else FactorModel.FIVE_FACTOR

    result = service.analyze_portfolio(
        portfolio_returns=request.portfolio_returns,
        market_returns=request.market_returns,
        factor_returns=request.factor_returns,
        model_type=model,
        frequency=request.frequency
    )

    # Convert to response model
    exposures = [
        {"factor_name": e.factor_name, "beta": e.beta, "t_statistic": e.t_statistic,
         "p_value": e.p_value, "is_significant": e.is_significant}
        for e in result.exposures
    ]

    attributions = [
        {"factor_name": a.factor_name, "beta": a.beta, "factor_return": a.factor_return,
         "contribution": a.contribution, "contribution_pct": a.contribution_pct}
        for a in result.attributions
    ]

    return FactorAnalysisResponse(
        model_type=result.model_type.value,
        alpha=result.alpha,
        alpha_annual=result.alpha_annual,
        alpha_t_stat=result.alpha_t_stat,
        alpha_p_value=result.alpha_p_value,
        r_squared=result.r_squared,
        adjusted_r_squared=result.adjusted_r_squared,
        exposures=exposures,
        attributions=attributions,
        total_return=result.total_return,
        explained_return=result.explained_return,
        residual_return=result.residual_return,
        interpretation=result.interpretation,
        recommendations=result.recommendations
    )


# ==================== CAPM Analysis Endpoints ====================

@router.post(
    "/capm-analysis",
    response_model=CAPMMetricsResponse,
    summary="CAPM Analysis for Security or Portfolio",
    description="Analyze security or portfolio using Capital Asset Pricing Model (CAPM).",
    response_description="Complete CAPM metrics with alpha, beta, and investment recommendation",
    tags=["Advanced Analysis"]
)
async def analyze_capm(request: CAPMAnalysisRequest):
    """
    Perform CAPM (Capital Asset Pricing Model) analysis.

    **REQ-PORT-014:** Capital Asset Pricing Model (CAPM) integration
    **PRD Section 4:** Portfolio Optimization Engine

    ## CAPM Formula
    E(R) = Rf + β(Rm - Rf)

    Where:
    - E(R) = Expected return
    - Rf = Risk-free rate
    - β = Beta (systematic risk)
    - Rm = Market return

    ## Request Body
    - **security_returns** (required): Historical returns for security/portfolio
    - **market_returns** (required): Market benchmark returns
    - **frequency** (optional): "daily" or "monthly" (default: daily)
    - **security_name** (optional): Name for reporting (default: "Security")

    ## Returns
    - **beta**: Systematic risk measure with 95% confidence interval
    - **alpha**: Jensen's alpha (actual return - expected return)
    - **expected_return**: CAPM expected return
    - **actual_return**: Historical actual return
    - **position**: Over/under/fair valued relative to Security Market Line
    - **information_ratio**: Alpha / Tracking Error
    - **treynor_ratio**: Risk-adjusted return per unit of systematic risk
    - **investment_recommendation**: BUY/SELL/HOLD recommendation

    ## Example Request
    ```json
    {
      "security_returns": [0.001, 0.002, -0.001, 0.003],
      "market_returns": [0.0008, 0.0015, -0.0012, 0.0025],
      "frequency": "daily",
      "security_name": "My Portfolio"
    }
    ```

    ## Interpretation
    - **Beta > 1**: More volatile than market
    - **Beta < 1**: Less volatile than market
    - **Positive Alpha**: Outperforming CAPM expectations
    - **Undervalued**: Trades above Security Market Line
    """
    service = CAPMService()

    result = service.analyze_security(
        security_returns=request.security_returns,
        market_returns=request.market_returns,
        frequency=request.frequency,
        security_name=request.security_name
    )

    return CAPMMetricsResponse(
        risk_free_rate=result.risk_free_rate,
        market_return=result.market_return,
        market_premium=result.market_premium,
        beta=result.beta,
        beta_confidence_interval=result.beta_confidence_interval,
        expected_return=result.expected_return,
        actual_return=result.actual_return,
        alpha=result.alpha,
        r_squared=result.r_squared,
        correlation=result.correlation,
        tracking_error=result.tracking_error,
        information_ratio=result.information_ratio,
        treynor_ratio=result.treynor_ratio,
        position=result.position.value,
        distance_from_sml=result.distance_from_sml,
        interpretation=result.interpretation,
        investment_recommendation=result.investment_recommendation
    )


@router.post(
    "/capm-portfolio",
    response_model=CAPMPortfolioResponse,
    summary="CAPM Portfolio Analysis",
    description="Comprehensive CAPM analysis for portfolio with individual holdings breakdown.",
    response_description="Portfolio CAPM metrics with holdings analysis and recommendations",
    tags=["Advanced Analysis"]
)
async def analyze_capm_portfolio(request: CAPMPortfolioRequest):
    """
    Perform comprehensive CAPM analysis for portfolio.

    **REQ-PORT-014:** Capital Asset Pricing Model (CAPM) integration

    ## Request Body
    - **portfolio_returns** (required): Portfolio returns
    - **market_returns** (required): Market returns
    - **holdings** (optional): Individual holdings with returns for detailed analysis
    - **frequency** (optional): "daily" or "monthly"

    ## Returns
    - **portfolio_metrics**: Complete CAPM analysis for portfolio
    - **holdings_analysis**: Individual holding CAPM metrics (if provided)
    - **systematic_risk_pct**: Percent of risk from market (R²)
    - **idiosyncratic_risk_pct**: Percent of risk from specific factors (1 - R²)
    - **recommendations**: Actionable portfolio recommendations
    - **risk_warnings**: Critical risk alerts

    ## Example Request
    ```json
    {
      "portfolio_returns": [0.001, 0.002, -0.001, 0.003],
      "market_returns": [0.0008, 0.0015, -0.0012, 0.0025],
      "holdings": [
        {
          "name": "SPY",
          "weight": 0.60,
          "returns": [0.0008, 0.0015, -0.0012, 0.0025]
        },
        {
          "name": "BND",
          "weight": 0.40,
          "returns": [0.0002, 0.0003, -0.0001, 0.0004]
        }
      ],
      "frequency": "daily"
    }
    ```

    ## Use Cases
    - Portfolio evaluation vs. market expectations
    - Security selection analysis (over/undervalued holdings)
    - Risk decomposition (systematic vs. idiosyncratic)
    - Performance attribution
    """
    service = CAPMService()

    result = service.analyze_portfolio(
        portfolio_returns=request.portfolio_returns,
        market_returns=request.market_returns,
        holdings=request.holdings,
        frequency=request.frequency
    )

    # Convert portfolio metrics to response model
    pm = result.portfolio_metrics
    portfolio_metrics = CAPMMetricsResponse(
        risk_free_rate=pm.risk_free_rate,
        market_return=pm.market_return,
        market_premium=pm.market_premium,
        beta=pm.beta,
        beta_confidence_interval=pm.beta_confidence_interval,
        expected_return=pm.expected_return,
        actual_return=pm.actual_return,
        alpha=pm.alpha,
        r_squared=pm.r_squared,
        correlation=pm.correlation,
        tracking_error=pm.tracking_error,
        information_ratio=pm.information_ratio,
        treynor_ratio=pm.treynor_ratio,
        position=pm.position.value,
        distance_from_sml=pm.distance_from_sml,
        interpretation=pm.interpretation,
        investment_recommendation=pm.investment_recommendation
    )

    return CAPMPortfolioResponse(
        portfolio_metrics=portfolio_metrics,
        holdings_analysis=result.holdings_analysis,
        systematic_risk_pct=result.systematic_risk_pct,
        idiosyncratic_risk_pct=result.idiosyncratic_risk_pct,
        recommendations=result.recommendations,
        risk_warnings=result.risk_warnings
    )


@router.get(
    "/security-market-line",
    response_model=SecurityMarketLineResponse,
    summary="Security Market Line (SML) Data",
    description="Generate Security Market Line data for visualization.",
    response_description="SML points and sample efficient portfolios",
    tags=["Advanced Analysis"]
)
async def get_security_market_line(
    beta_min: float = 0.0,
    beta_max: float = 2.0,
    num_points: int = 50
):
    """
    Generate Security Market Line for visualization.

    **REQ-PORT-014:** CAPM integration - Security Market Line

    ## Query Parameters
    - **beta_min** (optional): Minimum beta for SML (default: 0.0)
    - **beta_max** (optional): Maximum beta for SML (default: 2.0)
    - **num_points** (optional): Number of points on line (default: 50)

    ## Returns
    - **points**: Array of {beta, expected_return} coordinates for plotting
    - **portfolio_point**: Current portfolio position on SML
    - **efficient_portfolios**: Sample efficient portfolios at different risk levels

    ## Use Cases
    - Visualize risk-return tradeoff
    - Identify over/undervalued securities
    - Compare portfolio to market expectations
    - Portfolio construction guidance

    ## Example Response
    ```json
    {
      "points": [
        {"beta": 0.0, "expected_return": 0.04},
        {"beta": 0.5, "expected_return": 0.07},
        {"beta": 1.0, "expected_return": 0.10},
        {"beta": 1.5, "expected_return": 0.13}
      ],
      "portfolio_point": {"beta": 1.0, "expected_return": 0.10},
      "efficient_portfolios": [
        {"name": "Conservative", "beta": 0.5, "expected_return": 0.07},
        {"name": "Moderate", "beta": 0.8, "expected_return": 0.088},
        {"name": "Balanced", "beta": 1.0, "expected_return": 0.10},
        {"name": "Growth", "beta": 1.2, "expected_return": 0.112},
        {"name": "Aggressive", "beta": 1.5, "expected_return": 0.13}
      ]
    }
    ```
    """
    service = CAPMService()

    result = service.generate_security_market_line(
        beta_range=(beta_min, beta_max),
        num_points=num_points
    )

    return SecurityMarketLineResponse(
        points=result.points,
        portfolio_point=result.portfolio_point,
        efficient_portfolios=result.efficient_portfolios
    )
