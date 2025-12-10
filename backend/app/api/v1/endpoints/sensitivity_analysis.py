"""
Sensitivity Analysis API Endpoints
Comprehensive API for tornado diagrams, heat maps, threshold analysis, and break-even calculations

REQ-SENSITIVITY-001: Advanced sensitivity analysis endpoints
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.goal import Goal
from app.services.portfolio.sensitivity_analyzer import SensitivityAnalyzer
from app.tools.monte_carlo_engine import MonteCarloEngine

router = APIRouter(prefix="/sensitivity-analysis", tags=["Sensitivity Analysis"])


# ==================== Request/Response Models ====================

class OneWaySensitivityRequest(BaseModel):
    """One-way sensitivity analysis (tornado diagram) request"""
    goal_id: str = Field(description="Goal ID")
    variables: List[str] = Field(description="Variables to analyze")
    variation_percentage: float = Field(default=0.20, ge=0.05, le=0.50, description="Variation range (±%)")
    num_points: int = Field(default=5, ge=3, le=11, description="Number of test points per variable")
    iterations_per_point: int = Field(default=1000, ge=500, le=5000, description="Monte Carlo iterations")


class TwoWaySensitivityRequest(BaseModel):
    """Two-way sensitivity analysis (heat map) request"""
    goal_id: str = Field(description="Goal ID")
    variable1: str = Field(description="First variable")
    variable2: str = Field(description="Second variable")
    variation_percentage: float = Field(default=0.20, ge=0.05, le=0.50, description="Variation range (±%)")
    grid_size: int = Field(default=10, ge=5, le=20, description="Grid resolution")
    iterations_per_point: int = Field(default=500, ge=250, le=2000, description="Monte Carlo iterations")


class ThresholdAnalysisRequest(BaseModel):
    """Threshold analysis request"""
    goal_id: str = Field(description="Goal ID")
    variable: str = Field(description="Variable to analyze")
    target_probability: float = Field(default=0.90, ge=0.50, le=0.99, description="Target success probability")
    min_value: Optional[float] = Field(None, description="Minimum value to test")
    max_value: Optional[float] = Field(None, description="Maximum value to test")
    tolerance: float = Field(default=0.01, ge=0.001, le=0.05, description="Convergence tolerance")


class BreakEvenAnalysisRequest(BaseModel):
    """Break-even analysis request"""
    goal_id: str = Field(description="Goal ID")
    variable1: str = Field(description="First variable (e.g., inflation, expenses)")
    variable2: str = Field(description="Second variable (e.g., returns, contributions)")
    target_probability: float = Field(default=0.90, ge=0.50, le=0.99, description="Target success probability")
    grid_size: int = Field(default=20, ge=10, le=30, description="Analysis resolution")
    iterations_per_point: int = Field(default=500, ge=250, le=2000, description="Monte Carlo iterations")


# ==================== Helper Functions ====================

def get_sensitivity_analyzer(db: Session = Depends(get_db)) -> SensitivityAnalyzer:
    """Create sensitivity analyzer instance"""
    mc_engine = MonteCarloEngine()
    return SensitivityAnalyzer(monte_carlo_engine=mc_engine)


async def get_goal_by_id(goal_id: str, db: Session) -> Goal:
    """Fetch goal by ID"""
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail=f"Goal {goal_id} not found")
    return goal


# ==================== Endpoints ====================

@router.post(
    "/one-way",
    summary="One-Way Sensitivity Analysis (Tornado Diagram)",
    description="""
    Perform one-way sensitivity analysis to identify which variables have the
    greatest impact on goal success probability.

    **Use Cases:**
    - Identify key drivers of goal success
    - Prioritize which assumptions to refine
    - Understand relative importance of variables

    **Visualization:** Tornado diagram showing impact ranges sorted by magnitude
    """,
    tags=["One-Way Analysis"]
)
async def one_way_sensitivity(
    request: OneWaySensitivityRequest,
    db: Session = Depends(get_db)
):
    """
    One-way sensitivity analysis (tornado diagram).

    **REQ-SENSITIVITY-001:** Tornado diagram generation

    ## Variables Supported
    - `monthly_contribution`: Monthly savings amount
    - `expected_return_stocks`: Stock market return assumption
    - `expected_return_bonds`: Bond market return assumption
    - `inflation_rate`: Annual inflation rate
    - `retirement_age`: Target retirement age
    - `life_expectancy`: Life expectancy
    - `target_amount`: Goal target amount

    ## Returns
    - Variable impacts sorted by magnitude
    - Min/max success probabilities for each variable
    - Base case success probability
    - Impact ranges for visualization

    ## Example Request
    ```json
    {
      "goal_id": "goal-123",
      "variables": ["monthly_contribution", "expected_return_stocks", "inflation_rate"],
      "variation_percentage": 0.20,
      "num_points": 5,
      "iterations_per_point": 1000
    }
    ```
    """
    try:
        # Fetch goal
        goal = await get_goal_by_id(request.goal_id, db)

        # Create analyzer
        analyzer = get_sensitivity_analyzer(db)

        # Run analysis
        result = await analyzer.one_way_sensitivity(
            goal=goal,
            variables=request.variables,
            variation_percentage=request.variation_percentage,
            num_points=request.num_points,
            iterations_per_point=request.iterations_per_point,
        )

        return {
            "success": True,
            "goal_id": request.goal_id,
            "analysis": result,
            "message": f"Analyzed {len(request.variables)} variables"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sensitivity analysis failed: {str(e)}")


@router.post(
    "/two-way",
    summary="Two-Way Sensitivity Analysis (Heat Map)",
    description="""
    Perform two-way sensitivity analysis to understand interaction effects
    between two variables on goal success probability.

    **Use Cases:**
    - Understand variable interactions
    - Identify safe and risky regions
    - Explore trade-offs between variables

    **Visualization:** Heat map showing success probability across variable combinations
    """,
    tags=["Two-Way Analysis"]
)
async def two_way_sensitivity(
    request: TwoWaySensitivityRequest,
    db: Session = Depends(get_db)
):
    """
    Two-way sensitivity analysis (heat map).

    **REQ-SENSITIVITY-002:** Two-way sensitivity heat maps

    ## Common Variable Combinations
    - `monthly_contribution` × `expected_return_stocks`: Savings vs. returns trade-off
    - `inflation_rate` × `expected_return_bonds`: Inflation vs. fixed income
    - `retirement_age` × `life_expectancy`: Timing and longevity risk

    ## Returns
    - 2D grid of success probabilities
    - Test values for both variables
    - Min/max probabilities across grid
    - Grid data for heat map visualization

    ## Example Request
    ```json
    {
      "goal_id": "goal-123",
      "variable1": "monthly_contribution",
      "variable2": "expected_return_stocks",
      "variation_percentage": 0.20,
      "grid_size": 10,
      "iterations_per_point": 500
    }
    ```
    """
    try:
        # Fetch goal
        goal = await get_goal_by_id(request.goal_id, db)

        # Create analyzer
        analyzer = get_sensitivity_analyzer(db)

        # Run analysis
        result = await analyzer.two_way_sensitivity(
            goal=goal,
            variable1=request.variable1,
            variable2=request.variable2,
            variation_percentage=request.variation_percentage,
            grid_size=request.grid_size,
            iterations_per_point=request.iterations_per_point,
        )

        return {
            "success": True,
            "goal_id": request.goal_id,
            "analysis": result,
            "message": f"Generated {request.grid_size}×{request.grid_size} heat map"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Two-way analysis failed: {str(e)}")


@router.post(
    "/threshold",
    summary="Threshold Analysis",
    description="""
    Find the threshold value of a variable needed to achieve a target
    success probability.

    **Use Cases:**
    - Determine required savings rate for retirement
    - Calculate minimum return needed for goal success
    - Set realistic target values

    **Algorithm:** Binary search to find exact threshold value
    """,
    tags=["Threshold Analysis"]
)
async def threshold_analysis(
    request: ThresholdAnalysisRequest,
    db: Session = Depends(get_db)
):
    """
    Threshold analysis to find required variable value.

    **REQ-SENSITIVITY-003:** Threshold analysis

    ## Common Use Cases
    - **Required Savings:** What monthly contribution achieves 90% success?
    - **Minimum Return:** What return is needed for retirement?
    - **Maximum Inflation:** What inflation rate can be tolerated?

    ## Returns
    - Threshold value for target probability
    - Delta from current value (absolute and %)
    - Achieved vs. target probability
    - Recommendations for goal adjustment

    ## Example Request
    ```json
    {
      "goal_id": "goal-123",
      "variable": "monthly_contribution",
      "target_probability": 0.90,
      "min_value": 500,
      "max_value": 5000,
      "tolerance": 0.01
    }
    ```
    """
    try:
        # Fetch goal
        goal = await get_goal_by_id(request.goal_id, db)

        # Create analyzer
        analyzer = get_sensitivity_analyzer(db)

        # Run analysis
        result = await analyzer.threshold_analysis(
            goal=goal,
            variable=request.variable,
            target_probability=request.target_probability,
            min_value=request.min_value,
            max_value=request.max_value,
            tolerance=request.tolerance,
        )

        return {
            "success": True,
            "goal_id": request.goal_id,
            "analysis": result,
            "message": f"Found threshold for {request.target_probability:.0%} success probability"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Threshold analysis failed: {str(e)}")


@router.post(
    "/break-even",
    summary="Break-Even Analysis",
    description="""
    Calculate break-even frontier between two variables showing combinations
    that achieve target success probability.

    **Use Cases:**
    - Trade-off analysis (e.g., savings vs. returns)
    - Risk-return frontier exploration
    - Scenario planning for goal adjustments

    **Visualization:** Break-even curve showing required values
    """,
    tags=["Break-Even Analysis"]
)
async def break_even_analysis(
    request: BreakEvenAnalysisRequest,
    db: Session = Depends(get_db)
):
    """
    Break-even analysis showing required variable combinations.

    **REQ-SENSITIVITY-004:** Break-even calculations

    ## Common Variable Pairs
    - `inflation_rate` × `monthly_contribution`: How inflation affects savings needs
    - `expected_return_stocks` × `target_amount`: Return vs. goal size trade-off
    - `retirement_age` × `monthly_contribution`: Early retirement cost

    ## Returns
    - Break-even curve showing required combinations
    - Current position relative to curve
    - Distance from break-even (safe vs. at risk)
    - Actionable recommendations

    ## Example Request
    ```json
    {
      "goal_id": "goal-123",
      "variable1": "inflation_rate",
      "variable2": "monthly_contribution",
      "target_probability": 0.90,
      "grid_size": 20,
      "iterations_per_point": 500
    }
    ```
    """
    try:
        # Fetch goal
        goal = await get_goal_by_id(request.goal_id, db)

        # Create analyzer
        analyzer = get_sensitivity_analyzer(db)

        # Run analysis
        result = await analyzer.break_even_analysis(
            goal=goal,
            variable1=request.variable1,
            variable2=request.variable2,
            target_probability=request.target_probability,
            grid_size=request.grid_size,
            iterations_per_point=request.iterations_per_point,
        )

        return {
            "success": True,
            "goal_id": request.goal_id,
            "analysis": result,
            "message": f"Calculated break-even frontier for {request.target_probability:.0%} success"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Break-even analysis failed: {str(e)}")


@router.get(
    "/supported-variables",
    summary="Get Supported Variables",
    description="List all variables that can be used in sensitivity analysis",
    tags=["Configuration"]
)
async def get_supported_variables():
    """
    Get list of supported variables for sensitivity analysis.

    Returns variable names, descriptions, typical ranges, and units.
    """
    return {
        "variables": [
            {
                "name": "monthly_contribution",
                "description": "Monthly savings/contribution amount",
                "typical_range": [100, 10000],
                "unit": "USD",
                "category": "contributions"
            },
            {
                "name": "expected_return_stocks",
                "description": "Expected annual stock market return",
                "typical_range": [0.04, 0.12],
                "unit": "decimal (0.08 = 8%)",
                "category": "returns"
            },
            {
                "name": "expected_return_bonds",
                "description": "Expected annual bond market return",
                "typical_range": [0.02, 0.06],
                "unit": "decimal (0.04 = 4%)",
                "category": "returns"
            },
            {
                "name": "inflation_rate",
                "description": "Annual inflation rate",
                "typical_range": [0.015, 0.04],
                "unit": "decimal (0.03 = 3%)",
                "category": "economics"
            },
            {
                "name": "retirement_age",
                "description": "Target retirement age",
                "typical_range": [55, 75],
                "unit": "years",
                "category": "timing"
            },
            {
                "name": "life_expectancy",
                "description": "Expected life expectancy",
                "typical_range": [75, 100],
                "unit": "years",
                "category": "timing"
            },
            {
                "name": "target_amount",
                "description": "Goal target amount",
                "typical_range": [50000, 5000000],
                "unit": "USD",
                "category": "goals"
            }
        ]
    }


@router.get(
    "/health",
    summary="Health Check",
    description="Check sensitivity analysis service health"
)
async def health_check():
    """Health check endpoint"""
    return {
        "service": "sensitivity_analysis",
        "status": "healthy",
        "features": [
            "one_way_sensitivity",
            "two_way_sensitivity",
            "threshold_analysis",
            "break_even_analysis"
        ]
    }
