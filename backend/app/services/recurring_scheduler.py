"""
Recurring Transaction Scheduler

Service for automatically generating budget entries from recurring transactions.
"""

from datetime import datetime, timedelta
from typing import List, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.budget import BudgetEntry, ExtractionMethod
from app.models.recurring_transaction import RecurringTransaction, RecurrenceStatus, RecurringTransactionHistory


class RecurringTransactionScheduler:
    """Service for managing recurring transaction generation."""

    def __init__(self, db: AsyncSession):
        """Initialize scheduler.

        Args:
            db: Database session
        """
        self.db = db

    async def generate_pending_transactions(
        self,
        user_id: Optional[UUID] = None,
        current_date: Optional[datetime] = None
    ) -> List[BudgetEntry]:
        """Generate all pending recurring transactions.

        Args:
            user_id: Optional user ID to limit generation
            current_date: Optional current date (defaults to now)

        Returns:
            List of generated budget entries
        """
        if current_date is None:
            current_date = datetime.utcnow()

        # Get active recurring transactions
        query = select(RecurringTransaction).where(
            and_(
                RecurringTransaction.status == RecurrenceStatus.ACTIVE,
                RecurringTransaction.auto_generate == True,
            )
        )

        if user_id:
            query = query.where(RecurringTransaction.user_id == user_id)

        result = await self.db.execute(query)
        recurring_transactions = result.scalars().all()

        generated_entries = []

        for recurring_txn in recurring_transactions:
            if recurring_txn.should_generate_now(current_date):
                entry = await self.generate_transaction(recurring_txn, current_date)
                if entry:
                    generated_entries.append(entry)

        await self.db.commit()

        return generated_entries

    async def generate_transaction(
        self,
        recurring_txn: RecurringTransaction,
        generation_date: Optional[datetime] = None,
        is_manual: bool = False
    ) -> Optional[BudgetEntry]:
        """Generate a budget entry from a recurring transaction.

        Args:
            recurring_txn: Recurring transaction template
            generation_date: Date for which to generate (defaults to next_generation_date)
            is_manual: Was this manually triggered?

        Returns:
            Generated budget entry or None if generation failed
        """
        if generation_date is None:
            generation_date = recurring_txn.next_generation_date

        # Check if already generated for this date
        existing_query = select(RecurringTransactionHistory).where(
            and_(
                RecurringTransactionHistory.recurring_transaction_id == recurring_txn.id,
                RecurringTransactionHistory.generation_date == generation_date,
            )
        )
        existing_result = await self.db.execute(existing_query)
        if existing_result.scalar_one_or_none():
            print(f"Entry already generated for {generation_date}")
            return None

        # Create budget entry
        budget_entry = BudgetEntry(
            user_id=recurring_txn.user_id,
            category=recurring_txn.category,
            name=recurring_txn.name,
            amount=recurring_txn.amount,
            frequency=recurring_txn.frequency,
            type=recurring_txn.type,
            is_fixed=recurring_txn.is_fixed,
            notes=recurring_txn.notes,
            start_date=generation_date,
            extraction_method=ExtractionMethod.MANUAL,
            recurring_transaction_id=recurring_txn.id,
        )

        self.db.add(budget_entry)
        await self.db.flush()

        # Create history entry
        history = RecurringTransactionHistory(
            recurring_transaction_id=recurring_txn.id,
            budget_entry_id=budget_entry.id,
            generation_date=generation_date,
            was_manual=is_manual,
        )

        self.db.add(history)

        # Update recurring transaction
        recurring_txn.last_generated_date = generation_date
        recurring_txn.total_generated += 1
        recurring_txn.next_generation_date = recurring_txn.calculate_next_generation_date(generation_date)

        # Check if should complete
        if recurring_txn.max_occurrences and recurring_txn.total_generated >= recurring_txn.max_occurrences:
            recurring_txn.status = RecurrenceStatus.COMPLETED
        elif recurring_txn.end_date and recurring_txn.next_generation_date > recurring_txn.end_date:
            recurring_txn.status = RecurrenceStatus.COMPLETED

        await self.db.flush()

        return budget_entry

    async def generate_next_n_occurrences(
        self,
        recurring_txn: RecurringTransaction,
        n: int = 1
    ) -> List[BudgetEntry]:
        """Generate the next N occurrences of a recurring transaction.

        Args:
            recurring_txn: Recurring transaction template
            n: Number of occurrences to generate

        Returns:
            List of generated budget entries
        """
        generated_entries = []

        current_date = recurring_txn.next_generation_date

        for i in range(n):
            # Check if we can generate
            if recurring_txn.max_occurrences and recurring_txn.total_generated >= recurring_txn.max_occurrences:
                break
            if recurring_txn.end_date and current_date > recurring_txn.end_date:
                break

            entry = await self.generate_transaction(recurring_txn, current_date, is_manual=True)
            if entry:
                generated_entries.append(entry)
                current_date = recurring_txn.calculate_next_generation_date(current_date)
            else:
                break

        await self.db.commit()

        return generated_entries

    async def pause_recurring_transaction(
        self,
        recurring_txn_id: UUID
    ) -> RecurringTransaction:
        """Pause a recurring transaction.

        Args:
            recurring_txn_id: ID of recurring transaction

        Returns:
            Updated recurring transaction
        """
        query = select(RecurringTransaction).where(RecurringTransaction.id == recurring_txn_id)
        result = await self.db.execute(query)
        recurring_txn = result.scalar_one()

        recurring_txn.status = RecurrenceStatus.PAUSED
        await self.db.commit()
        await self.db.refresh(recurring_txn)

        return recurring_txn

    async def resume_recurring_transaction(
        self,
        recurring_txn_id: UUID
    ) -> RecurringTransaction:
        """Resume a paused recurring transaction.

        Args:
            recurring_txn_id: ID of recurring transaction

        Returns:
            Updated recurring transaction
        """
        query = select(RecurringTransaction).where(RecurringTransaction.id == recurring_txn_id)
        result = await self.db.execute(query)
        recurring_txn = result.scalar_one()

        if recurring_txn.status == RecurrenceStatus.PAUSED:
            recurring_txn.status = RecurrenceStatus.ACTIVE
            await self.db.commit()
            await self.db.refresh(recurring_txn)

        return recurring_txn

    async def cancel_recurring_transaction(
        self,
        recurring_txn_id: UUID
    ) -> RecurringTransaction:
        """Cancel a recurring transaction.

        Args:
            recurring_txn_id: ID of recurring transaction

        Returns:
            Updated recurring transaction
        """
        query = select(RecurringTransaction).where(RecurringTransaction.id == recurring_txn_id)
        result = await self.db.execute(query)
        recurring_txn = result.scalar_one()

        recurring_txn.status = RecurrenceStatus.CANCELLED
        await self.db.commit()
        await self.db.refresh(recurring_txn)

        return recurring_txn

    async def get_upcoming_transactions(
        self,
        user_id: UUID,
        days_ahead: int = 30
    ) -> List[dict]:
        """Get upcoming recurring transactions for a user.

        Args:
            user_id: User ID
            days_ahead: Number of days to look ahead

        Returns:
            List of upcoming transaction dictionaries
        """
        cutoff_date = datetime.utcnow() + timedelta(days=days_ahead)

        query = select(RecurringTransaction).where(
            and_(
                RecurringTransaction.user_id == user_id,
                RecurringTransaction.status == RecurrenceStatus.ACTIVE,
                RecurringTransaction.next_generation_date <= cutoff_date,
            )
        ).order_by(RecurringTransaction.next_generation_date)

        result = await self.db.execute(query)
        recurring_transactions = result.scalars().all()

        upcoming = []
        for recurring_txn in recurring_transactions:
            upcoming.append({
                "id": str(recurring_txn.id),
                "name": recurring_txn.name,
                "amount": recurring_txn.amount,
                "frequency": recurring_txn.frequency.value,
                "type": recurring_txn.type.value,
                "category": recurring_txn.category.value,
                "next_date": recurring_txn.next_generation_date.isoformat(),
                "days_until": (recurring_txn.next_generation_date - datetime.utcnow()).days,
                "auto_generate": recurring_txn.auto_generate,
            })

        return upcoming

    async def get_generation_history(
        self,
        recurring_txn_id: UUID,
        limit: int = 50
    ) -> List[RecurringTransactionHistory]:
        """Get generation history for a recurring transaction.

        Args:
            recurring_txn_id: ID of recurring transaction
            limit: Maximum number of history entries to return

        Returns:
            List of history entries
        """
        query = select(RecurringTransactionHistory).where(
            RecurringTransactionHistory.recurring_transaction_id == recurring_txn_id
        ).order_by(RecurringTransactionHistory.generated_at.desc()).limit(limit)

        result = await self.db.execute(query)
        return result.scalars().all()
