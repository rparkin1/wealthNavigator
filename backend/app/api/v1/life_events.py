"""
Life Events API Endpoints

Provides REST API for managing life events and running simulations
to analyze their financial impact on goals.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

from app.core.database import get_db
from app.services.life_event_simulator import LifeEventSimulator
from app.models.life_event import LifeEvent, LifeEventType, EventTemplate, DEFAULT_EVENT_TEMPLATES
from app.models.goal import Goal
from app.api.deps import get_current_user

router = APIRouter()


# Request/Response Models
class LifeEventCreate(BaseModel):
    """Request to create a life event"""
    goal_id: Optional[str] = Field(None, description="Goal to associate with (optional)")
    event_type: LifeEventType = Field(..., description="Type of life event")
    name: str = Field(..., description="User-friendly name")
    description: Optional[str] = Field(None, description="Additional details")
    start_year: int = Field(..., ge=0, description="Year event occurs (0 = current year)")
    duration_years: int = Field(default=1, ge=1, description="How long event lasts")
    probability: float = Field(default=1.0, ge=0.0, le=1.0, description="Probability of occurrence")
    enabled: bool = Field(default=True, description="Include in simulations")
    financial_impact: dict = Field(..., description="Event-specific parameters")


class LifeEventUpdate(BaseModel):
    """Request to update a life event"""
    name: Optional[str] = None
    description: Optional[str] = None
    start_year: Optional[int] = None
    duration_years: Optional[int] = None
    probability: Optional[float] = None
    enabled: Optional[bool] = None
    financial_impact: Optional[dict] = None


class LifeEventResponse(BaseModel):
    """Life event response"""
    id: str
    user_id: str
    goal_id: Optional[str]
    event_type: str
    name: str
    description: Optional[str]
    start_year: int
    duration_years: int
    probability: float
    enabled: bool
    financial_impact: dict
    simulation_results: Optional[dict]
    created_at: datetime
    updated_at: datetime
    last_simulated_at: Optional[datetime]


class SimulateEventRequest(BaseModel):
    """Request to simulate event impact"""
    goal_id: str = Field(..., description="Goal to test")
    iterations: int = Field(default=5000, ge=1000, le=10000, description="Monte Carlo iterations")


class EventTemplateResponse(BaseModel):
    """Event template response"""
    id: str
    event_type: str
    name: str
    description: Optional[str]
    default_parameters: dict
    usage_count: int
    average_rating: Optional[float]


# API Endpoints

@router.get("/events", response_model=List[LifeEventResponse])
async def get_all_life_events(
    goal_id: Optional[str] = Query(None, description="Filter by goal"),
    event_type: Optional[LifeEventType] = Query(None, description="Filter by event type"),
    enabled_only: bool = Query(True, description="Only return enabled events"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """
    Get all life events for the current user.

    Can filter by goal, event type, or enabled status.
    """
    query = select(LifeEvent).where(LifeEvent.user_id == current_user.id)

    if goal_id:
        query = query.where(LifeEvent.goal_id == goal_id)

    if event_type:
        # DB stores event_type as string
        query = query.where(LifeEvent.event_type == event_type.value)

    if enabled_only:
        # Column is Integer; compare to 1 instead of boolean True
        query = query.where(LifeEvent.enabled == 1)

    result = await db.execute(query.order_by(LifeEvent.start_year.asc()))
    events = result.scalars().all()

    return [
        LifeEventResponse(
            id=e.id,
            user_id=e.user_id,
            goal_id=e.goal_id,
            event_type=e.event_type,
            name=e.name,
            description=e.description,
            start_year=e.start_year,
            duration_years=e.duration_years,
            probability=e.probability,
            enabled=bool(e.enabled),
            financial_impact=e.financial_impact,
            simulation_results=e.simulation_results,
            created_at=e.created_at,
            updated_at=e.updated_at,
            last_simulated_at=e.last_simulated_at,
        )
        for e in events
    ]


@router.get("/events/{event_id}", response_model=LifeEventResponse)
async def get_life_event(
    event_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Get a specific life event by ID."""
    result = await db.execute(
        select(LifeEvent).where(
            LifeEvent.id == event_id,
            LifeEvent.user_id == current_user.id,
        )
    )
    event = result.scalars().first()

    if not event:
        raise HTTPException(status_code=404, detail=f"Life event {event_id} not found")

    return LifeEventResponse(
        id=event.id,
        user_id=event.user_id,
        goal_id=event.goal_id,
        event_type=event.event_type,
        name=event.name,
        description=event.description,
        start_year=event.start_year,
        duration_years=event.duration_years,
        probability=event.probability,
        enabled=bool(event.enabled),
        financial_impact=event.financial_impact,
        simulation_results=event.simulation_results,
        created_at=event.created_at,
        updated_at=event.updated_at,
        last_simulated_at=event.last_simulated_at,
    )


@router.post("/events", response_model=LifeEventResponse, status_code=201)
async def create_life_event(
    request: LifeEventCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """
    Create a new life event.

    Validates that the goal exists if goal_id is provided.
    """
    # Validate goal if provided
    if request.goal_id:
        result = await db.execute(
            select(Goal).where(Goal.id == request.goal_id, Goal.user_id == current_user.id)
        )
        goal = result.scalars().first()

        if not goal:
            raise HTTPException(status_code=404, detail=f"Goal {request.goal_id} not found")

    # Generate unique ID
    import uuid
    event_id = str(uuid.uuid4())

    # Create event
    event = LifeEvent(
        id=event_id,
        user_id=current_user.id,
        goal_id=request.goal_id,
        event_type=request.event_type.value,
        name=request.name,
        description=request.description,
        start_year=request.start_year,
        duration_years=request.duration_years,
        probability=request.probability,
        enabled=1 if request.enabled else 0,
        financial_impact=request.financial_impact,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    db.add(event)
    await db.commit()
    await db.refresh(event)

    return LifeEventResponse(
        id=event.id,
        user_id=event.user_id,
        goal_id=event.goal_id,
        event_type=event.event_type,
        name=event.name,
        description=event.description,
        start_year=event.start_year,
        duration_years=event.duration_years,
        probability=event.probability,
        enabled=bool(event.enabled),
        financial_impact=event.financial_impact,
        simulation_results=event.simulation_results,
        created_at=event.created_at,
        updated_at=event.updated_at,
        last_simulated_at=event.last_simulated_at,
    )


@router.patch("/events/{event_id}", response_model=LifeEventResponse)
async def update_life_event(
    event_id: str,
    request: LifeEventUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Update an existing life event."""
    result = await db.execute(
        select(LifeEvent).where(LifeEvent.id == event_id, LifeEvent.user_id == current_user.id)
    )
    event = result.scalars().first()

    if not event:
        raise HTTPException(status_code=404, detail=f"Life event {event_id} not found")

    # Update fields
    update_data = request.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field == "enabled" and value is not None:
            setattr(event, field, 1 if bool(value) else 0)
        else:
            setattr(event, field, value)

    event.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(event)

    return LifeEventResponse(
        id=event.id,
        user_id=event.user_id,
        goal_id=event.goal_id,
        event_type=event.event_type,
        name=event.name,
        description=event.description,
        start_year=event.start_year,
        duration_years=event.duration_years,
        probability=event.probability,
        enabled=bool(event.enabled),
        financial_impact=event.financial_impact,
        simulation_results=event.simulation_results,
        created_at=event.created_at,
        updated_at=event.updated_at,
        last_simulated_at=event.last_simulated_at,
    )


@router.delete("/events/{event_id}", status_code=204)
async def delete_life_event(
    event_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Delete a life event."""
    result = await db.execute(
        select(LifeEvent).where(LifeEvent.id == event_id, LifeEvent.user_id == current_user.id)
    )
    event = result.scalars().first()

    if not event:
        raise HTTPException(status_code=404, detail=f"Life event {event_id} not found")

    await db.delete(event)
    await db.commit()

    return None


@router.post("/events/{event_id}/simulate")
async def simulate_life_event(
    event_id: str,
    request: SimulateEventRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """
    Simulate the financial impact of a life event on a goal.

    Compares outcomes with and without the event.
    """
    # Get event
    result = await db.execute(
        select(LifeEvent).where(LifeEvent.id == event_id, LifeEvent.user_id == current_user.id)
    )
    event = result.scalars().first()

    if not event:
        raise HTTPException(status_code=404, detail=f"Life event {event_id} not found")

    # Get goal
    result = await db.execute(
        select(Goal).where(Goal.id == request.goal_id, Goal.user_id == current_user.id)
    )
    goal = result.scalars().first()

    if not goal:
        raise HTTPException(status_code=404, detail=f"Goal {request.goal_id} not found")

    # TODO: Initialize Monte Carlo engine
    # For now, return mock result structure
    try:
        # simulator = LifeEventSimulator(monte_carlo_engine)
        # result = await simulator.simulate_event_impact(
        #     goal=goal,
        #     event=event,
        #     iterations=request.iterations,
        # )

        # Mock result for now
        result = {
            "event_id": event.id,
            "event_type": event.event_type,
            "baseline": {
                "success_probability": 0.85,
                "median_portfolio_value": 1500000,
            },
            "with_event": {
                "success_probability": 0.72,
                "median_portfolio_value": 1200000,
            },
            "impact": {
                "success_probability_delta": -0.13,
                "success_probability_delta_percentage": -15.3,
                "portfolio_value_delta": -300000,
                "portfolio_value_delta_percentage": -20.0,
                "severity": "significant",
                "recommended_actions": [
                    "Increase emergency fund to 12 months of expenses",
                    "Consider disability insurance with 60-70% income replacement",
                    "Review and update beneficiaries on all accounts",
                ],
            },
            "recovery_analysis": {
                "estimated_recovery_years": 8.5,
                "value_to_recover": 300000,
                "recovery_feasible": True,
            },
        }

        # Store results
        event.simulation_results = result
        event.last_simulated_at = datetime.utcnow()
        await db.commit()

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")


@router.post("/events/{event_id}/toggle", response_model=LifeEventResponse)
async def toggle_life_event(
    event_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Toggle event enabled/disabled status."""
    result = await db.execute(
        select(LifeEvent).where(LifeEvent.id == event_id, LifeEvent.user_id == current_user.id)
    )
    event = result.scalars().first()

    if not event:
        raise HTTPException(status_code=404, detail=f"Life event {event_id} not found")

    event.enabled = 0 if event.enabled else 1
    event.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(event)

    return LifeEventResponse(
        id=event.id,
        user_id=event.user_id,
        goal_id=event.goal_id,
        event_type=event.event_type,
        name=event.name,
        description=event.description,
        start_year=event.start_year,
        duration_years=event.duration_years,
        probability=event.probability,
        enabled=bool(event.enabled),
        financial_impact=event.financial_impact,
        simulation_results=event.simulation_results,
        created_at=event.created_at,
        updated_at=event.updated_at,
        last_simulated_at=event.last_simulated_at,
    )


# Event Templates

@router.get("/templates", response_model=List[EventTemplateResponse])
async def get_event_templates(
    event_type: Optional[LifeEventType] = Query(None, description="Filter by event type"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """
    Get all available event templates.

    Templates provide pre-configured parameters for common scenarios.
    """
    query = select(EventTemplate)

    if event_type:
        query = query.where(EventTemplate.event_type == event_type.value)

    query = query.order_by(EventTemplate.usage_count.desc())
    result = await db.execute(query)
    templates = result.scalars().all()

    return [
        EventTemplateResponse(
            id=t.id,
            event_type=t.event_type,  # Already a string, no .value needed
            name=t.name,
            description=t.description,
            default_parameters=t.default_parameters,
            usage_count=t.usage_count,
            average_rating=t.average_rating,
        )
        for t in templates
    ]


@router.post("/templates/{template_id}/use", response_model=LifeEventResponse, status_code=201)
async def create_from_template(
    template_id: str,
    goal_id: Optional[str] = Query(None, description="Goal to associate with"),
    start_year: int = Query(..., description="Year event occurs"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """
    Create a new life event from a template.

    Uses template's default parameters but allows customization.
    """
    result = await db.execute(select(EventTemplate).where(EventTemplate.id == template_id))
    template = result.scalars().first()

    if not template:
        raise HTTPException(status_code=404, detail=f"Template {template_id} not found")

    # Validate goal if provided
    if goal_id:
        result = await db.execute(select(Goal).where(Goal.id == goal_id, Goal.user_id == current_user.id))
        goal = result.scalars().first()

        if not goal:
            raise HTTPException(status_code=404, detail=f"Goal {goal_id} not found")

    # Create event from template
    import uuid
    event_id = str(uuid.uuid4())

    event = LifeEvent(
        id=event_id,
        user_id=current_user.id,
        goal_id=goal_id,
        event_type=template.event_type,
        name=template.name,
        description=template.description,
        start_year=start_year,
        duration_years=1,
        probability=1.0,
        enabled=1,
        financial_impact=template.default_parameters,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    db.add(event)

    # Update template usage
    template.usage_count += 1

    await db.commit()
    await db.refresh(event)

    return LifeEventResponse(
        id=event.id,
        user_id=event.user_id,
        goal_id=event.goal_id,
        event_type=event.event_type,
        name=event.name,
        description=event.description,
        start_year=event.start_year,
        duration_years=event.duration_years,
        probability=event.probability,
        enabled=bool(event.enabled),
        financial_impact=event.financial_impact,
        simulation_results=event.simulation_results,
        created_at=event.created_at,
        updated_at=event.updated_at,
        last_simulated_at=event.last_simulated_at,
    )


@router.post("/templates/initialize")
async def initialize_templates(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),  # Should be admin only
):
    """
    Initialize database with default event templates.

    Admin-only endpoint to seed templates on first setup.
    """
    # TODO: Add admin role check

    created_count = 0

    for template_data in DEFAULT_EVENT_TEMPLATES:
        # Check if template already exists
        result = await db.execute(select(EventTemplate).where(EventTemplate.id == template_data["id"]))
        existing = result.scalars().first()

        if not existing:
            template = EventTemplate(**template_data)
            db.add(template)
            created_count += 1

    await db.commit()

    return {
        "message": f"Successfully initialized {created_count} event templates",
        "count": created_count,
    }
