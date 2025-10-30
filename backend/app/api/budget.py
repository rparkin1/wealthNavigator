"""
Budget API Endpoints

API routes for budget entry management and AI-powered operations.
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID
import json

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.budget import BudgetEntry, BudgetAnalysis, BudgetType, BudgetCategory, Frequency, ExtractionMethod
from app.schemas.budget import (
    BudgetEntryCreate,
    BudgetEntryUpdate,
    BudgetEntryResponse,
    BudgetEntriesList,
    BudgetExtractionRequest,
    BudgetCategorizationRequest,
    BudgetCategorizationResponse,
    BudgetPatternRequest,
    BudgetPatternResponse,
    BudgetSuggestionsRequest,
    BudgetSuggestionsResponse,
    BudgetSummary,
    BulkBudgetEntryCreate,
    BulkBudgetEntryResponse,
)
from app.tools.budget_ai_tools import BudgetAITools

router = APIRouter(prefix="/budget", tags=["budget"])

# Initialize AI tools
budget_ai = BudgetAITools()


# ==================== CRUD Operations ====================

@router.post("/entries", response_model=BudgetEntryResponse, status_code=201)
async def create_budget_entry(
    entry: BudgetEntryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new budget entry."""

    # Validate category for type
    category_value = entry.category
    type_value = entry.type

    # Create entry
    db_entry = BudgetEntry(
        user_id=current_user.id,
        category=BudgetCategory[category_value.upper()],
        name=entry.name,
        amount=entry.amount,
        frequency=Frequency[entry.frequency.upper()],
        type=BudgetType[type_value.upper()],
        is_fixed=entry.is_fixed,
        notes=entry.notes,
        start_date=entry.start_date,
        end_date=entry.end_date,
        extraction_method=ExtractionMethod.MANUAL,
    )

    db.add(db_entry)
    await db.commit()
    await db.refresh(db_entry)

    # Add calculated fields
    response = BudgetEntryResponse.model_validate(db_entry)
    response.annual_amount = db_entry.calculate_annual_amount()
    response.monthly_amount = db_entry.calculate_monthly_amount()

    return response


@router.get("/entries", response_model=BudgetEntriesList)
async def list_budget_entries(
    type: Optional[str] = Query(None, description="Filter by type: income, expense, savings"),
    category: Optional[str] = Query(None, description="Filter by category"),
    is_fixed: Optional[bool] = Query(None, description="Filter by fixed/variable"),
    include_deleted: bool = Query(False, description="Include soft-deleted entries"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all budget entries for current user."""

    # Build query
    query = select(BudgetEntry).where(BudgetEntry.user_id == current_user.id)

    # Apply filters
    if not include_deleted:
        query = query.where(BudgetEntry.deleted_at.is_(None))

    if type:
        query = query.where(BudgetEntry.type == BudgetType[type.upper()])

    if category:
        query = query.where(BudgetEntry.category == BudgetCategory[category.upper()])

    if is_fixed is not None:
        query = query.where(BudgetEntry.is_fixed == is_fixed)

    # Order by created date descending
    query = query.order_by(BudgetEntry.created_at.desc())

    # Execute query
    result = await db.execute(query)
    entries = result.scalars().all()

    # Convert to response models with calculated fields
    entry_responses = []
    for entry in entries:
        response = BudgetEntryResponse.model_validate(entry)
        response.annual_amount = entry.calculate_annual_amount()
        response.monthly_amount = entry.calculate_monthly_amount()
        entry_responses.append(response)

    # Calculate counts by type
    income_count = sum(1 for e in entries if e.type == BudgetType.INCOME)
    expense_count = sum(1 for e in entries if e.type == BudgetType.EXPENSE)
    savings_count = sum(1 for e in entries if e.type == BudgetType.SAVINGS)

    return BudgetEntriesList(
        entries=entry_responses,
        total=len(entries),
        income_count=income_count,
        expense_count=expense_count,
        savings_count=savings_count,
    )


@router.get("/entries/{entry_id}", response_model=BudgetEntryResponse)
async def get_budget_entry(
    entry_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific budget entry."""

    query = select(BudgetEntry).where(
        and_(
            BudgetEntry.id == entry_id,
            BudgetEntry.user_id == current_user.id,
            BudgetEntry.deleted_at.is_(None),
        )
    )

    result = await db.execute(query)
    entry = result.scalar_one_or_none()

    if not entry:
        raise HTTPException(status_code=404, detail="Budget entry not found")

    response = BudgetEntryResponse.model_validate(entry)
    response.annual_amount = entry.calculate_annual_amount()
    response.monthly_amount = entry.calculate_monthly_amount()

    return response


@router.put("/entries/{entry_id}", response_model=BudgetEntryResponse)
async def update_budget_entry(
    entry_id: UUID,
    entry_update: BudgetEntryUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a budget entry."""

    # Get existing entry
    query = select(BudgetEntry).where(
        and_(
            BudgetEntry.id == entry_id,
            BudgetEntry.user_id == current_user.id,
            BudgetEntry.deleted_at.is_(None),
        )
    )

    result = await db.execute(query)
    entry = result.scalar_one_or_none()

    if not entry:
        raise HTTPException(status_code=404, detail="Budget entry not found")

    # Update fields
    update_data = entry_update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if field == "category" and value:
            setattr(entry, field, BudgetCategory[value.upper()])
        elif field == "frequency" and value:
            setattr(entry, field, Frequency[value.upper()])
        elif field == "type" and value:
            setattr(entry, field, BudgetType[value.upper()])
        else:
            setattr(entry, field, value)

    entry.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(entry)

    response = BudgetEntryResponse.model_validate(entry)
    response.annual_amount = entry.calculate_annual_amount()
    response.monthly_amount = entry.calculate_monthly_amount()

    return response


@router.delete("/entries/{entry_id}", status_code=204)
async def delete_budget_entry(
    entry_id: UUID,
    permanent: bool = Query(False, description="Permanently delete (otherwise soft delete)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a budget entry."""

    query = select(BudgetEntry).where(
        and_(
            BudgetEntry.id == entry_id,
            BudgetEntry.user_id == current_user.id,
        )
    )

    result = await db.execute(query)
    entry = result.scalar_one_or_none()

    if not entry:
        raise HTTPException(status_code=404, detail="Budget entry not found")

    if permanent:
        await db.delete(entry)
    else:
        entry.deleted_at = datetime.utcnow()

    await db.commit()

    return None


@router.post("/entries/bulk", response_model=BulkBudgetEntryResponse, status_code=201)
async def bulk_create_budget_entries(
    bulk_request: BulkBudgetEntryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Bulk create budget entries."""

    created_entries = []
    errors = []

    for idx, entry_data in enumerate(bulk_request.entries):
        try:
            db_entry = BudgetEntry(
                user_id=current_user.id,
                category=BudgetCategory[entry_data.category.upper()],
                name=entry_data.name,
                amount=entry_data.amount,
                frequency=Frequency[entry_data.frequency.upper()],
                type=BudgetType[entry_data.type.upper()],
                is_fixed=entry_data.is_fixed,
                notes=entry_data.notes,
                start_date=entry_data.start_date,
                end_date=entry_data.end_date,
                extraction_method=ExtractionMethod.IMPORT,
            )

            db.add(db_entry)
            await db.flush()  # Get ID without committing

            response = BudgetEntryResponse.model_validate(db_entry)
            response.annual_amount = db_entry.calculate_annual_amount()
            response.monthly_amount = db_entry.calculate_monthly_amount()

            created_entries.append(response)

        except Exception as e:
            errors.append({
                "index": idx,
                "entry": entry_data.model_dump(),
                "error": str(e),
            })

    await db.commit()

    return BulkBudgetEntryResponse(
        created=len(created_entries),
        failed=len(errors),
        entries=created_entries,
        errors=errors,
    )


# ==================== AI Operations ====================

@router.post("/extract", response_model=List[BudgetEntryResponse], status_code=201)
async def extract_budget_from_conversation(
    request: BudgetExtractionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Extract budget entries from natural language conversation."""

    # Use AI to extract entries
    extracted_entries = budget_ai.extract_budget_from_conversation(request.conversation_text)

    if not extracted_entries:
        return []

    response_entries = []

    # Optionally save to database
    if request.auto_save:
        for entry_data in extracted_entries:
            try:
                db_entry = BudgetEntry(
                    user_id=current_user.id,
                    category=BudgetCategory[entry_data["category"].upper()],
                    name=entry_data["name"],
                    amount=entry_data["amount"],
                    frequency=Frequency[entry_data["frequency"].upper()],
                    type=BudgetType[entry_data["type"].upper()],
                    is_fixed=entry_data.get("is_fixed", False),
                    notes=entry_data.get("notes"),
                    extraction_method=ExtractionMethod.AI_CONVERSATION,
                    extraction_confidence=entry_data.get("confidence"),
                    extracted_at=datetime.utcnow(),
                )

                db.add(db_entry)
                await db.flush()

                response = BudgetEntryResponse.model_validate(db_entry)
                response.annual_amount = db_entry.calculate_annual_amount()
                response.monthly_amount = db_entry.calculate_monthly_amount()

                response_entries.append(response)

            except Exception as e:
                print(f"Error saving extracted entry: {e}")
                continue

        await db.commit()
    else:
        # Return extracted data without saving
        for entry_data in extracted_entries:
            response_entries.append(BudgetEntryResponse(
                id=UUID('00000000-0000-0000-0000-000000000000'),  # Placeholder
                user_id=current_user.id,
                **entry_data,
                extraction_method="ai_conversation",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
                annual_amount=entry_data["amount"] * _get_frequency_multiplier(entry_data["frequency"]),
                monthly_amount=entry_data["amount"] * _get_frequency_multiplier(entry_data["frequency"]) / 12,
            ))

    return response_entries


@router.post("/categorize", response_model=BudgetCategorizationResponse)
async def categorize_budget_entry(
    request: BudgetCategorizationRequest,
    current_user: User = Depends(get_current_user),
):
    """Categorize a budget entry using AI."""

    result = budget_ai.categorize_entry(
        request.entry_description,
        request.amount,
        request.context,
    )

    return BudgetCategorizationResponse(**result)


@router.post("/analyze-pattern", response_model=BudgetPatternResponse)
async def analyze_budget_pattern(
    request: BudgetPatternRequest,
    current_user: User = Depends(get_current_user),
):
    """Analyze patterns in a budget entry."""

    analysis = budget_ai.analyze_pattern(
        request.entry_name,
        request.amount,
        request.frequency,
        request.category,
    )

    return BudgetPatternResponse(**analysis)


@router.post("/suggestions", response_model=BudgetSuggestionsResponse)
async def get_budget_suggestions(
    request: BudgetSuggestionsRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get AI-powered budget suggestions and recommendations."""

    # Get user's budget entries
    query = select(BudgetEntry).where(
        and_(
            BudgetEntry.user_id == current_user.id,
            BudgetEntry.deleted_at.is_(None),
        )
    )

    if request.entry_ids:
        query = query.where(BudgetEntry.id.in_(request.entry_ids))

    result = await db.execute(query)
    entries = result.scalars().all()

    if not entries:
        raise HTTPException(status_code=404, detail="No budget entries found")

    # Convert to dict format for AI
    entry_dicts = []
    for entry in entries:
        entry_dicts.append({
            "category": entry.category.value,
            "name": entry.name,
            "amount": entry.amount,
            "frequency": entry.frequency.value,
            "type": entry.type.value,
            "is_fixed": entry.is_fixed,
        })

    # Get AI suggestions
    suggestions = budget_ai.generate_smart_suggestions(entry_dicts)

    # Save analysis to database
    analysis = BudgetAnalysis(
        user_id=current_user.id,
        analysis_type="suggestions",
        health_score=suggestions.get("health_score"),
        health_category=suggestions.get("health_category"),
        savings_rate=suggestions.get("savings_rate"),
        concerns=json.dumps(suggestions.get("concerns", [])),
        opportunities=json.dumps(suggestions.get("opportunities", [])),
        recommendations=json.dumps(suggestions.get("recommendations", [])),
    )

    db.add(analysis)
    await db.commit()

    return BudgetSuggestionsResponse(**suggestions)


@router.get("/summary", response_model=BudgetSummary)
async def get_budget_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get comprehensive budget summary."""

    # Get all active entries
    query = select(BudgetEntry).where(
        and_(
            BudgetEntry.user_id == current_user.id,
            BudgetEntry.deleted_at.is_(None),
        )
    )

    result = await db.execute(query)
    entries = result.scalars().all()

    # Calculate totals
    total_income = sum(
        e.calculate_annual_amount() for e in entries if e.type == BudgetType.INCOME
    )
    total_expenses = sum(
        e.calculate_annual_amount() for e in entries if e.type == BudgetType.EXPENSE
    )
    total_savings = sum(
        e.calculate_annual_amount() for e in entries if e.type == BudgetType.SAVINGS
    )

    net_cash_flow = total_income - total_expenses - total_savings
    savings_rate = (total_savings / total_income * 100) if total_income > 0 else 0

    # Calculate category breakdowns
    income_by_category = {}
    expenses_by_category = {}
    savings_by_category = {}

    for entry in entries:
        annual = entry.calculate_annual_amount()
        category = entry.category.value

        if entry.type == BudgetType.INCOME:
            income_by_category[category] = income_by_category.get(category, 0) + annual
        elif entry.type == BudgetType.EXPENSE:
            expenses_by_category[category] = expenses_by_category.get(category, 0) + annual
        elif entry.type == BudgetType.SAVINGS:
            savings_by_category[category] = savings_by_category.get(category, 0) + annual

    # Determine health category
    if savings_rate >= 20:
        health_category = "excellent"
        health_score = min(100, 80 + savings_rate)
    elif savings_rate >= 10:
        health_category = "good"
        health_score = 60 + (savings_rate - 10) * 2
    else:
        health_category = "needs_work"
        health_score = max(0, savings_rate * 6)

    return BudgetSummary(
        total_income=total_income,
        total_expenses=total_expenses,
        total_savings=total_savings,
        net_cash_flow=net_cash_flow,
        savings_rate=savings_rate,
        monthly_income=total_income / 12,
        monthly_expenses=total_expenses / 12,
        monthly_savings=total_savings / 12,
        monthly_net=net_cash_flow / 12,
        income_by_category=income_by_category,
        expenses_by_category=expenses_by_category,
        savings_by_category=savings_by_category,
        total_entries=len(entries),
        income_entries=sum(1 for e in entries if e.type == BudgetType.INCOME),
        expense_entries=sum(1 for e in entries if e.type == BudgetType.EXPENSE),
        savings_entries=sum(1 for e in entries if e.type == BudgetType.SAVINGS),
        health_category=health_category,
        health_score=health_score,
    )


# ==================== Helper Functions ====================

def _get_frequency_multiplier(frequency: str) -> float:
    """Get annual multiplier for frequency."""
    multipliers = {
        "weekly": 52,
        "biweekly": 26,
        "monthly": 12,
        "quarterly": 4,
        "annual": 1,
        "one_time": 0,
    }
    return multipliers.get(frequency.lower(), 12)
