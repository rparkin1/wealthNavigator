"""
Main FastAPI Application
Entry point for the WealthNavigator AI backend
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered financial planning and portfolio management platform",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https?://localhost(?::\d+)?$",  # dev convenience
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
    }


# Import and include routers
from app.api.threads import router as threads_router
from app.api.chat import router as chat_router
from app.api.goals import router as goals_router
from app.api.portfolio import router as portfolio_router
from app.api.budget import router as budget_router
from app.api.recurring_transactions import router as recurring_router
from app.api.retirement import router as retirement_router
from app.api.plaid import router as plaid_router

# Goal Planning API v1 endpoints
from app.api.v1.endpoints.goal_dependencies import router as goal_dependencies_router
from app.api.v1.endpoints.education_funding import router as education_funding_router
from app.api.v1.endpoints.goal_milestones import router as goal_milestones_router
from app.api.v1.endpoints.multi_goal_optimization import router as multi_goal_optimization_router
from app.api.v1.endpoints.goal_scenarios import router as goal_scenarios_router
from app.api.v1.endpoints.ai_goal_assistance import router as ai_goal_assistance_router
from app.api.v1.endpoints.goal_funding import router as goal_funding_router
from app.api.v1.endpoints.mental_accounting import router as mental_accounting_router
from app.api.v1.endpoints.portfolio_optimization import router as portfolio_optimization_router
from app.api.v1.endpoints.risk_management import router as risk_management_router
from app.api.v1.endpoints.reserve_monitoring import router as reserve_monitoring_router
from app.api.v1.endpoints.tax_management import router as tax_management_router
from app.api.v1.endpoints.estate_planning import router as estate_planning_router
from app.api.v1.endpoints.insurance_optimization import router as insurance_optimization_router

app.include_router(threads_router, prefix=settings.API_V1_PREFIX)
app.include_router(chat_router, prefix=f"{settings.API_V1_PREFIX}/chat", tags=["chat"])
app.include_router(goals_router, prefix=f"{settings.API_V1_PREFIX}/goals", tags=["goals"])
app.include_router(portfolio_router, prefix=settings.API_V1_PREFIX, tags=["portfolio"])
# Routers define their own path segments (e.g., "/budget", "/recurring")
# so we include them under the API v1 prefix only to avoid double-segmentation.
app.include_router(budget_router, prefix=settings.API_V1_PREFIX, tags=["budget"])
app.include_router(recurring_router, prefix=settings.API_V1_PREFIX, tags=["recurring-transactions"])
app.include_router(retirement_router, prefix=f"{settings.API_V1_PREFIX}/retirement", tags=["retirement"])
app.include_router(plaid_router, prefix=settings.API_V1_PREFIX, tags=["plaid"])

# Goal Planning v1 endpoints
app.include_router(goal_dependencies_router, prefix=f"{settings.API_V1_PREFIX}/goal-planning/dependencies", tags=["goal-planning"])
app.include_router(education_funding_router, prefix=f"{settings.API_V1_PREFIX}/goal-planning/education", tags=["goal-planning"])
app.include_router(goal_milestones_router, prefix=f"{settings.API_V1_PREFIX}/goal-planning/milestones", tags=["goal-planning"])
app.include_router(multi_goal_optimization_router, prefix=f"{settings.API_V1_PREFIX}/goal-planning/multi-goal", tags=["goal-planning"])
app.include_router(goal_scenarios_router, prefix=f"{settings.API_V1_PREFIX}/goal-planning/scenarios", tags=["goal-planning"])
app.include_router(ai_goal_assistance_router, prefix=f"{settings.API_V1_PREFIX}/goal-planning/ai", tags=["goal-planning", "ai"])
app.include_router(goal_funding_router, prefix=f"{settings.API_V1_PREFIX}/goal-planning/funding", tags=["goal-planning"])
app.include_router(mental_accounting_router, prefix=f"{settings.API_V1_PREFIX}/goal-planning/mental-accounting", tags=["goal-planning", "mental-accounting"])

# Portfolio Optimization v1 endpoints
app.include_router(portfolio_optimization_router, prefix=f"{settings.API_V1_PREFIX}/portfolio-optimization", tags=["portfolio-optimization"])

# Risk Management v1 endpoints
app.include_router(risk_management_router, prefix=f"{settings.API_V1_PREFIX}/risk-management", tags=["risk-management"])

# Reserve Monitoring v1 endpoints
app.include_router(reserve_monitoring_router, prefix=settings.API_V1_PREFIX, tags=["reserve-monitoring"])

# Tax Management v1 endpoints
app.include_router(tax_management_router, prefix=settings.API_V1_PREFIX, tags=["tax-management"])

# Estate Planning v1 endpoints
app.include_router(estate_planning_router, prefix=settings.API_V1_PREFIX, tags=["estate-planning"])

# Insurance Optimization v1 endpoints
app.include_router(insurance_optimization_router, prefix=settings.API_V1_PREFIX, tags=["insurance-optimization"])

# Section 6: What-If Analysis & Scenario Planning - NEW!
from app.api.v1 import life_events, historical_scenarios
from app.api.v1.endpoints import initialize

app.include_router(
    life_events.router,
    prefix=f"{settings.API_V1_PREFIX}/life-events",
    tags=["life-events", "what-if-analysis"]
)

app.include_router(
    historical_scenarios.router,
    prefix=f"{settings.API_V1_PREFIX}/historical-scenarios",
    tags=["historical-scenarios", "what-if-analysis"]
)

# Initialization endpoints (no auth required for testing)
app.include_router(
    initialize.router,
    prefix=f"{settings.API_V1_PREFIX}/initialize",
    tags=["initialization", "setup"]
)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
    )
