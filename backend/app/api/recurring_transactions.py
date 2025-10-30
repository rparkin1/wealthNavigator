"""
Recurring Transaction API Endpoints

API routes for managing recurring transactions and automatic generation.
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.recurring_transaction import RecurringTransaction, RecurrenceStatus
from app.schemas.recurring_transaction import (
    RecurringTransactionCreate,
    RecurringTransactionUpdate,
    RecurringTransactionResponse,
    RecurringTransactionsList,
    GenerateOccurrencesRequest,
    UpcomingTransaction,
    RecurringTransactionHistoryResponse,
)
from app.services.recurring_scheduler import RecurringTransactionScheduler
from app.models.budget import BudgetCategory, BudgetType, Frequency

router = APIRouter(prefix="/recurring", tags=["recurring-transactions"])


# ==================== CRUD Operations ====================

@router.post("/transactions", response_model=RecurringTransactionResponse, status_code=201)
async def create_recurring_transaction(
    transaction: RecurringTransactionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new recurring transaction."""

    # Calculate next generation date
    next_gen_date = transaction.start_date

    # Create recurring transaction
    db_transaction = RecurringTransaction(
        user_id=current_user.id,
        category=BudgetCategory[transaction.category.upper()],
        name=transaction.name,
        amount=transaction.amount,
        frequency=Frequency[transaction.frequency.upper()],
        type=BudgetType[transaction.type.upper()],
        is_fixed=transaction.is_fixed,
        notes=transaction.notes,
        status=RecurrenceStatus.ACTIVE,
        start_date=transaction.start_date,
        end_date=transaction.end_date,
        next_generation_date=next_gen_date,
        max_occurrences=transaction.max_occurrences,
        auto_generate=transaction.auto_generate,
        days_ahead=transaction.days_ahead,
        reminder_enabled=transaction.reminder_enabled,
        reminder_days_before=transaction.reminder_days_before,
    )

    db.add(db_transaction)
    await db.commit()
    await db.refresh(db_transaction)

    return db_transaction


@router.get("/transactions", response_model=RecurringTransactionsList)
async def list_recurring_transactions(
    status: Optional[str] = Query(None, description="Filter by status: active, paused, completed, cancelled"),
    type: Optional[str] = Query(None, description="Filter by type: income, expense, savings"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all recurring transactions for current user."""

    # Build query
    query = select(RecurringTransaction).where(RecurringTransaction.user_id == current_user.id)

    # Apply filters
    if status:
        query = query.where(RecurringTransaction.status == RecurrenceStatus[status.upper()])

    if type:
        query = query.where(RecurringTransaction.type == BudgetType[type.upper()])

    # Order by next generation date
    query = query.order_by(RecurringTransaction.next_generation_date)

    # Execute query
    result = await db.execute(query)
    transactions = result.scalars().all()

    # Calculate counts by status
    active_count = sum(1 for t in transactions if t.status == RecurrenceStatus.ACTIVE)
    paused_count = sum(1 for t in transactions if t.status == RecurrenceStatus.PAUSED)

    return RecurringTransactionsList(
        transactions=transactions,
        total=len(transactions),
        active_count=active_count,
        paused_count=paused_count,
    )


@router.get("/transactions/{transaction_id}", response_model=RecurringTransactionResponse)
async def get_recurring_transaction(
    transaction_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific recurring transaction."""

    query = select(RecurringTransaction).where(
        and_(
            RecurringTransaction.id == transaction_id,
            RecurringTransaction.user_id == current_user.id,
        )
    )

    result = await db.execute(query)
    transaction = result.scalar_one_or_none()

    if not transaction:
        raise HTTPException(status_code=404, detail="Recurring transaction not found")

    return transaction


@router.put("/transactions/{transaction_id}", response_model=RecurringTransactionResponse)
async def update_recurring_transaction(
    transaction_id: UUID,
    transaction_update: RecurringTransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a recurring transaction."""

    # Get existing transaction
    query = select(RecurringTransaction).where(
        and_(
            RecurringTransaction.id == transaction_id,
            RecurringTransaction.user_id == current_user.id,
        )
    )

    result = await db.execute(query)
    transaction = result.scalar_one_or_none()

    if not transaction:
        raise HTTPException(status_code=404, detail="Recurring transaction not found")

    # Update fields
    update_data = transaction_update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if field == "category" and value:
            setattr(transaction, field, BudgetCategory[value.upper()])
        elif field == "frequency" and value:
            setattr(transaction, field, Frequency[value.upper()])
        elif field == "type" and value:
            setattr(transaction, field, BudgetType[value.upper()])
        else:
            setattr(transaction, field, value)

    transaction.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(transaction)

    return transaction


@router.delete("/transactions/{transaction_id}", status_code=204)
async def delete_recurring_transaction(
    transaction_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a recurring transaction (cancels it)."""

    scheduler = RecurringTransactionScheduler(db)

    try:
        await scheduler.cancel_recurring_transaction(transaction_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail="Recurring transaction not found")

    return None


# ==================== Generation Operations ====================

@router.post("/transactions/{transaction_id}/generate", response_model=List[dict])
async def generate_occurrences(
    transaction_id: UUID,
    request: GenerateOccurrencesRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Manually generate the next N occurrences."""

    # Get transaction
    query = select(RecurringTransaction).where(
        and_(
            RecurringTransaction.id == transaction_id,
            RecurringTransaction.user_id == current_user.id,
        )
    )

    result = await db.execute(query)
    transaction = result.scalar_one_or_none()

    if not transaction:
        raise HTTPException(status_code=404, detail="Recurring transaction not found")

    # Generate occurrences
    scheduler = RecurringTransactionScheduler(db)
    entries = await scheduler.generate_next_n_occurrences(transaction, request.n)

    return [entry.to_dict() for entry in entries]


@router.post("/transactions/{transaction_id}/pause", response_model=RecurringTransactionResponse)
async def pause_recurring_transaction(
    transaction_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Pause a recurring transaction."""

    scheduler = RecurringTransactionScheduler(db)

    try:
        transaction = await scheduler.pause_recurring_transaction(transaction_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail="Recurring transaction not found")

    return transaction


@router.post("/transactions/{transaction_id}/resume", response_model=RecurringTransactionResponse)
async def resume_recurring_transaction(
    transaction_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Resume a paused recurring transaction."""

    scheduler = RecurringTransactionScheduler(db)

    try:
        transaction = await scheduler.resume_recurring_transaction(transaction_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail="Recurring transaction not found")

    return transaction


@router.get("/upcoming", response_model=List[UpcomingTransaction])
async def get_upcoming_transactions(
    days_ahead: int = Query(30, ge=1, le=90, description="Days to look ahead"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get upcoming recurring transactions."""

    scheduler = RecurringTransactionScheduler(db)
    upcoming = await scheduler.get_upcoming_transactions(current_user.id, days_ahead)

    return [UpcomingTransaction(**item) for item in upcoming]


@router.get("/transactions/{transaction_id}/history", response_model=List[RecurringTransactionHistoryResponse])
async def get_generation_history(
    transaction_id: UUID,
    limit: int = Query(50, ge=1, le=200, description="Max history entries"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get generation history for a recurring transaction."""

    # Verify ownership
    query = select(RecurringTransaction).where(
        and_(
            RecurringTransaction.id == transaction_id,
            RecurringTransaction.user_id == current_user.id,
        )
    )

    result = await db.execute(query)
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Recurring transaction not found")

    # Get history
    scheduler = RecurringTransactionScheduler(db)
    history = await scheduler.get_generation_history(transaction_id, limit)

    return history


# ==================== Background Processing ====================

@router.post("/generate-all", status_code=202)
async def trigger_generation(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Trigger generation of all pending recurring transactions for current user."""

    async def generate_task():
        scheduler = RecurringTransactionScheduler(db)
        await scheduler.generate_pending_transactions(user_id=current_user.id)

    background_tasks.add_task(generate_task)

    return {"message": "Generation task queued"}
