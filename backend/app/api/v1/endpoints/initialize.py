"""
Initialization Endpoints (No Auth Required for Testing)

These endpoints are for seeding the database with default data.
In production, these should be admin-only or run via migration scripts.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.models.life_event import EventTemplate, DEFAULT_EVENT_TEMPLATES
from app.services.historical_scenario_service import HistoricalScenarioService

router = APIRouter()


@router.post("/life-events/templates")
async def initialize_life_event_templates(db: AsyncSession = Depends(get_db)):
    """
    Initialize database with default life event templates.

    **No authentication required** - for initial setup only.
    """
    created_count = 0

    for template_data in DEFAULT_EVENT_TEMPLATES:
        # Check if template already exists
        result = await db.execute(
            select(EventTemplate).filter(EventTemplate.id == template_data["id"])
        )
        existing = result.scalar_one_or_none()

        if not existing:
            template = EventTemplate(**template_data)
            db.add(template)
            created_count += 1

    await db.commit()

    return {
        "message": f"Successfully initialized {created_count} event templates",
        "created_count": created_count,
        "total_templates": len(DEFAULT_EVENT_TEMPLATES),
    }


@router.post("/historical-scenarios")
async def initialize_historical_scenarios(db: AsyncSession = Depends(get_db)):
    """
    Initialize database with default historical market scenarios.

    **No authentication required** - for initial setup only.
    """
    service = HistoricalScenarioService(db)

    try:
        count = await service.initialize_default_scenarios()
        return {
            "message": f"Successfully initialized {count} historical scenarios",
            "created_count": count,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error initializing scenarios: {str(e)}"
        )


@router.get("/status")
async def check_initialization_status(db: AsyncSession = Depends(get_db)):
    """
    Check status of database initialization.

    Returns counts of templates and scenarios in the database.
    """
    # Count event templates
    result = await db.execute(select(func.count()).select_from(EventTemplate))
    template_count = result.scalar()

    # Try to get scenario count
    try:
        from app.models.historical_scenario import HistoricalScenario
        result = await db.execute(select(func.count()).select_from(HistoricalScenario))
        scenario_count = result.scalar()
    except Exception:
        scenario_count = 0

    return {
        "life_event_templates": template_count,
        "historical_scenarios": scenario_count,
        "status": "ready" if template_count > 0 and scenario_count > 0 else "needs_initialization",
    }
