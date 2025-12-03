"""
Main FastAPI Application
Entry point for the WealthNavigator AI backend
"""

from fastapi import FastAPI, APIRouter, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.middleware import (
    limiter,
    rate_limit_exceeded_handler,
    SecurityHeadersMiddleware,
    InputValidationMiddleware,
    CSRFProtectionMiddleware,
)
from app.core.monitoring import init_sentry
from app.core.cache import cache
import logging

logger = logging.getLogger(__name__)

# Initialize error tracking
init_sentry()

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered financial planning and portfolio management platform",
)

# Configure rate limiting
if settings.RATE_LIMIT_ENABLED:
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)
    logger.info("Rate limiting enabled")

# Configure CORS (MUST be added first so it executes before security middleware)
# Use explicit origins from settings with credentials support
cors_config = {
    "allow_origins": settings.CORS_ORIGINS,
    "allow_credentials": True,
    "allow_methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    "allow_headers": ["*"],
}

app.add_middleware(CORSMiddleware, **cors_config)
logger.info(f"CORS middleware enabled with origins: {settings.CORS_ORIGINS}")

# Add security middleware (order matters!)
# 1. Input validation (first line of defense)
app.add_middleware(InputValidationMiddleware)
logger.info("Input validation middleware enabled")

# 2. CSRF protection
app.add_middleware(CSRFProtectionMiddleware)
logger.info("CSRF protection middleware enabled")

# 3. Security headers (production hardening)
app.add_middleware(SecurityHeadersMiddleware)
logger.info("Security headers middleware enabled")


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting WealthNavigator AI backend...")
    await cache.connect()
    logger.info("Startup complete")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down WealthNavigator AI backend...")
    await cache.disconnect()
    logger.info("Shutdown complete")


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
from app.api.net_worth import router as net_worth_router

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
from app.api.v1.endpoints.portfolio_data import router as portfolio_data_router
from app.api.v1.endpoints.risk_management import router as risk_management_router
from app.api.v1.endpoints.diversification import router as diversification_router
from app.api.v1.endpoints.reserve_monitoring import router as reserve_monitoring_router
from app.api.v1.endpoints.tax_management import router as tax_management_router
from app.api.v1.endpoints.estate_planning import router as estate_planning_router
from app.api.v1.endpoints.insurance_optimization import router as insurance_optimization_router
from app.api.v1.endpoints.sensitivity_analysis import router as sensitivity_analysis_router
from app.api.v1.endpoints.enhanced_performance import router as enhanced_performance_router
from app.api.v1.endpoints.custom_reports import router as custom_reports_router
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.privacy import router as privacy_router
# from app.api.v1.endpoints.mfa import router as mfa_router  # Temporarily disabled - missing pyotp dependency
from app.api.v1.endpoints.performance_metrics import router as performance_metrics_router

# Authentication endpoints (no prefix, auth handles its own /auth prefix)
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)

# Privacy & Compliance endpoints (GDPR/CCPA)
app.include_router(privacy_router, prefix=settings.API_V1_PREFIX)

# Multi-Factor Authentication endpoints
# app.include_router(mfa_router, prefix=settings.API_V1_PREFIX)  # Temporarily disabled

# Core endpoints
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
app.include_router(net_worth_router, prefix=settings.API_V1_PREFIX, tags=["net-worth"])

# Goal Planning v1 endpoints
app.include_router(goal_dependencies_router, prefix=f"{settings.API_V1_PREFIX}/goal-planning/dependencies", tags=["goal-planning"])
app.include_router(education_funding_router, prefix=f"{settings.API_V1_PREFIX}/education-funding", tags=["goal-planning"])
app.include_router(goal_milestones_router, prefix=f"{settings.API_V1_PREFIX}/goal-planning/milestones", tags=["goal-planning"])
app.include_router(multi_goal_optimization_router, prefix=f"{settings.API_V1_PREFIX}/goal-planning/multi-goal", tags=["goal-planning"])
app.include_router(goal_scenarios_router, prefix=f"{settings.API_V1_PREFIX}/goal-scenarios", tags=["goal-planning"])
goal_scenarios_alias = APIRouter(prefix="/goal-planning/scenarios", include_in_schema=False)
goal_scenarios_alias.include_router(goal_scenarios_router)
app.include_router(goal_scenarios_alias, prefix=settings.API_V1_PREFIX, tags=["goal-planning"])
app.include_router(ai_goal_assistance_router, prefix=f"{settings.API_V1_PREFIX}/goal-planning/ai", tags=["goal-planning", "ai"])
app.include_router(goal_funding_router, prefix=f"{settings.API_V1_PREFIX}/goal-planning/funding", tags=["goal-planning"])
app.include_router(mental_accounting_router, prefix=f"{settings.API_V1_PREFIX}/goal-planning/mental-accounting", tags=["goal-planning", "mental-accounting"])

# Portfolio Optimization v1 endpoints
app.include_router(portfolio_optimization_router, prefix=f"{settings.API_V1_PREFIX}/portfolio-optimization", tags=["portfolio-optimization"])

# Portfolio Data Management v1 endpoints (accounts and holdings)
app.include_router(portfolio_data_router, prefix=settings.API_V1_PREFIX, tags=["portfolio-data"])

# Risk Management v1 endpoints
app.include_router(risk_management_router, prefix=f"{settings.API_V1_PREFIX}/risk-management", tags=["risk-management"])

# Temporary alias to support legacy double-prefixed risk management routes used by tests
risk_management_alias = APIRouter(prefix="/risk-management", include_in_schema=False)
risk_management_alias.include_router(risk_management_router)
app.include_router(
    risk_management_alias,
    prefix=f"{settings.API_V1_PREFIX}/risk-management",
    tags=["risk-management"],
)

# Diversification Analysis v1 endpoints
app.include_router(diversification_router, prefix=f"{settings.API_V1_PREFIX}/diversification", tags=["risk-management", "diversification"])

# Reserve Monitoring v1 endpoints
app.include_router(reserve_monitoring_router, prefix=settings.API_V1_PREFIX, tags=["reserve-monitoring"])

# Tax Management v1 endpoints
app.include_router(tax_management_router, prefix=settings.API_V1_PREFIX, tags=["tax-management"])

# Estate Planning v1 endpoints
app.include_router(estate_planning_router, prefix=settings.API_V1_PREFIX, tags=["estate-planning"])

# Insurance Optimization v1 endpoints
app.include_router(insurance_optimization_router, prefix=settings.API_V1_PREFIX, tags=["insurance-optimization"])

# Enhanced Performance Reporting v1 endpoints
app.include_router(enhanced_performance_router, prefix=settings.API_V1_PREFIX, tags=["performance-reporting"])

# Custom Reports v1 endpoints (REQ-REPORT-012)
app.include_router(custom_reports_router, prefix=settings.API_V1_PREFIX, tags=["custom-reports"])

# Sensitivity Analysis v1 endpoints
app.include_router(sensitivity_analysis_router, prefix=settings.API_V1_PREFIX, tags=["sensitivity-analysis"])

# Performance Metrics endpoints
app.include_router(performance_metrics_router, prefix=settings.API_V1_PREFIX, tags=["performance"])

# Section 6: What-If Analysis & Scenario Planning - NEW!
from app.api.v1 import life_events, historical_scenarios, simulations
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

app.include_router(
    simulations.router,
    prefix=f"{settings.API_V1_PREFIX}/simulations",
    tags=["simulations", "what-if-analysis"],
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
