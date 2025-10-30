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

app.include_router(threads_router, prefix=settings.API_V1_PREFIX)
app.include_router(chat_router, prefix=f"{settings.API_V1_PREFIX}/chat", tags=["chat"])
app.include_router(goals_router, prefix=f"{settings.API_V1_PREFIX}/goals", tags=["goals"])
app.include_router(portfolio_router, prefix=settings.API_V1_PREFIX, tags=["portfolio"])
app.include_router(budget_router, prefix=f"{settings.API_V1_PREFIX}/budget", tags=["budget"])
app.include_router(recurring_router, prefix=f"{settings.API_V1_PREFIX}/recurring", tags=["recurring-transactions"])
app.include_router(retirement_router, prefix=f"{settings.API_V1_PREFIX}/retirement", tags=["retirement"])


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
    )
