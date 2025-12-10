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
from app.models.plaid import PlaidHolding

from app.api.deps import get_current_user
from app.models.user import User
from datetime import datetime
import uuid

router = APIRouter(dependencies=[Depends(get_current_user)])


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


@router.post("/test-holdings")
async def initialize_test_holdings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Initialize test holdings for the current user.

    Creates sample investment holdings for testing diversification analysis
    and portfolio features. **Development/testing only.**
    """
    # Delete existing holdings for this user
    result = await db.execute(
        select(PlaidHolding).where(PlaidHolding.user_id == current_user.id)
    )
    existing = result.scalars().all()
    for holding in existing:
        await db.delete(holding)
    if existing:
        await db.commit()

    # Sample holdings data
    test_holdings = [
        {
            "security_id": "AAPL-US",
            "ticker_symbol": "AAPL",
            "name": "Apple Inc.",
            "type": "equity",
            "institution_value": 50000.0,
            "quantity": 200.0,
            "institution_price": 250.0,
            "iso_currency_code": "USD",
        },
        {
            "security_id": "MSFT-US",
            "ticker_symbol": "MSFT",
            "name": "Microsoft Corporation",
            "type": "equity",
            "institution_value": 40000.0,
            "quantity": 100.0,
            "institution_price": 400.0,
            "iso_currency_code": "USD",
        },
        {
            "security_id": "GOOGL-US",
            "ticker_symbol": "GOOGL",
            "name": "Alphabet Inc.",
            "type": "equity",
            "institution_value": 30000.0,
            "quantity": 200.0,
            "institution_price": 150.0,
            "iso_currency_code": "USD",
        },
        {
            "security_id": "VTI-US",
            "ticker_symbol": "VTI",
            "name": "Vanguard Total Stock Market ETF",
            "type": "etf",
            "institution_value": 25000.0,
            "quantity": 100.0,
            "institution_price": 250.0,
            "iso_currency_code": "USD",
        },
        {
            "security_id": "BND-US",
            "ticker_symbol": "BND",
            "name": "Vanguard Total Bond Market ETF",
            "type": "etf",
            "institution_value": 15000.0,
            "quantity": 200.0,
            "institution_price": 75.0,
            "iso_currency_code": "USD",
        },
        {
            "security_id": "VEA-US",
            "ticker_symbol": "VEA",
            "name": "Vanguard FTSE Developed Markets ETF",
            "type": "etf",
            "institution_value": 10000.0,
            "quantity": 200.0,
            "institution_price": 50.0,
            "iso_currency_code": "USD",
        },
    ]

    created_holdings = []
    for holding_data in test_holdings:
        holding = PlaidHolding(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            account_id="test-account-" + str(uuid.uuid4())[:8],
            institution_name="Test Brokerage",
            **holding_data
        )
        db.add(holding)
        created_holdings.append(holding_data["ticker_symbol"])

    await db.commit()

    return {
        "message": f"Successfully created {len(test_holdings)} test holdings",
        "holdings": created_holdings,
        "total_value": sum(h["institution_value"] for h in test_holdings),
    }


@router.get("/status")
async def check_initialization_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Check status of database initialization.

    Returns counts of templates, scenarios, and user holdings.
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

    # Count user holdings
    result = await db.execute(
        select(func.count()).select_from(PlaidHolding).where(PlaidHolding.user_id == current_user.id)
    )
    holdings_count = result.scalar()

    return {
        "life_event_templates": template_count,
        "historical_scenarios": scenario_count,
        "user_holdings": holdings_count,
        "status": "ready" if template_count > 0 and scenario_count > 0 else "needs_initialization",
    }
