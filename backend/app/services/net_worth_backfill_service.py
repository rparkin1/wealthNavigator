"""
Net Worth Backfill Service

Service for backfilling historical net worth snapshots from Plaid transaction
and balance history.
"""

from datetime import date, datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
import logging
from collections import defaultdict

from app.models.plaid import PlaidItem, PlaidAccount, PlaidTransaction, PlaidHolding
from app.services.net_worth_snapshot_service import NetWorthSnapshotService
from app.services.plaid_service import PlaidService

logger = logging.getLogger(__name__)


class NetWorthBackfillService:
    """Service for backfilling historical net worth data"""

    def __init__(self, plaid_service: Optional[PlaidService] = None):
        """Initialize backfill service"""
        self.plaid_service = plaid_service or PlaidService()
        self.snapshot_service = NetWorthSnapshotService()

    async def backfill_user_history(
        self,
        user_id: str,
        days_back: int = 365,
        db: AsyncSession = None,
    ) -> Dict[str, Any]:
        """
        Backfill net worth history for a user.

        Strategy:
        1. Get all Plaid items and accounts for the user
        2. Fetch transaction history from Plaid
        3. Calculate daily balances by reconstructing from transactions
        4. Create snapshots for each day

        Args:
            user_id: User ID
            days_back: Number of days to backfill (default 365)
            db: Database session

        Returns:
            Dict with summary of backfill results
        """
        logger.info(f"Starting backfill for user {user_id}, {days_back} days back")

        # Get user's Plaid items
        items_query = select(PlaidItem).where(
            and_(
                PlaidItem.user_id == user_id,
                PlaidItem.is_active == True
            )
        )
        result = await db.execute(items_query)
        plaid_items = result.scalars().all()

        if not plaid_items:
            logger.warning(f"No active Plaid items found for user {user_id}")
            return {
                "success": False,
                "message": "No connected accounts found",
                "snapshots_created": 0,
            }

        # Calculate date range
        end_date = date.today()
        start_date = end_date - timedelta(days=days_back)

        # Get all transactions in the date range
        transactions_query = select(PlaidTransaction).where(
            and_(
                PlaidTransaction.user_id == user_id,
                PlaidTransaction.date >= start_date,
                PlaidTransaction.date <= end_date
            )
        ).order_by(PlaidTransaction.date.asc())

        result = await db.execute(transactions_query)
        transactions = result.scalars().all()

        logger.info(f"Found {len(transactions)} transactions for backfill")

        # Get current account balances
        accounts_query = select(PlaidAccount).where(
            and_(
                PlaidAccount.user_id == user_id,
                PlaidAccount.is_active == True
            )
        )
        result = await db.execute(accounts_query)
        accounts = result.scalars().all()

        # Build daily snapshots by working backwards from current balances
        snapshots_created = 0
        errors = []

        try:
            # Group transactions by date
            transactions_by_date = defaultdict(list)
            for txn in transactions:
                transactions_by_date[txn.date].append(txn)

            # Start with current balances and work backwards
            current_balances = {
                acc.id: float(acc.current_balance) if acc.current_balance else 0.0
                for acc in accounts
            }

            # Calculate snapshots day by day (working backwards from today)
            current_date = end_date
            daily_data = []

            while current_date >= start_date:
                # Calculate balances for this day
                day_balances = current_balances.copy()

                # Adjust for transactions on this day (reverse them to get previous balance)
                if current_date in transactions_by_date:
                    for txn in transactions_by_date[current_date]:
                        if txn.account_id in day_balances:
                            # Reverse the transaction to get previous day's balance
                            day_balances[txn.account_id] -= float(txn.amount)

                # Store daily data
                daily_data.append({
                    "date": current_date,
                    "balances": day_balances.copy()
                })

                # Update current balances for next iteration (previous day)
                current_balances = day_balances

                current_date -= timedelta(days=1)

            # Reverse to chronological order
            daily_data.reverse()

            # Now create snapshots (in chronological order)
            for day_data in daily_data:
                snapshot_date = day_data["date"]
                balances = day_data["balances"]

                # Skip if snapshot already exists
                if await self.snapshot_service.snapshot_exists(user_id, snapshot_date, db):
                    logger.debug(f"Snapshot already exists for {snapshot_date}, skipping")
                    continue

                # Calculate totals and asset breakdown
                assets_by_class = {}
                total_assets = 0.0
                total_liabilities = 0.0

                for account in accounts:
                    balance = balances.get(account.id, 0.0)

                    if account.type == "depository":
                        if balance > 0:
                            assets_by_class["cash"] = assets_by_class.get("cash", 0) + balance
                            total_assets += balance
                    elif account.type == "investment":
                        # For investment accounts, we use current holdings as approximation
                        # (more accurate would be to track holding history, but that's complex)
                        if balance > 0:
                            # Distribute proportionally across asset classes based on current holdings
                            # This is a simplification - real implementation would need historical holdings
                            assets_by_class["stocks"] = assets_by_class.get("stocks", 0) + (balance * 0.6)
                            assets_by_class["bonds"] = assets_by_class.get("bonds", 0) + (balance * 0.3)
                            assets_by_class["other"] = assets_by_class.get("other", 0) + (balance * 0.1)
                            total_assets += balance
                    elif account.type in ["credit", "loan"]:
                        if balance > 0:
                            total_liabilities += balance

                # Calculate liquid net worth
                liquid_net_worth = (
                    assets_by_class.get("cash", 0) +
                    assets_by_class.get("stocks", 0) +
                    assets_by_class.get("bonds", 0) +
                    assets_by_class.get("other", 0) -
                    total_liabilities
                )

                # Create snapshot
                await self.snapshot_service.create_snapshot(
                    user_id=user_id,
                    snapshot_date=snapshot_date,
                    total_assets=total_assets,
                    total_liabilities=total_liabilities,
                    liquid_net_worth=liquid_net_worth,
                    assets_by_class=assets_by_class,
                    num_accounts=len(accounts),
                    num_investment_accounts=sum(1 for a in accounts if a.type == "investment"),
                    num_depository_accounts=sum(1 for a in accounts if a.type == "depository"),
                    num_credit_accounts=sum(1 for a in accounts if a.type in ["credit", "loan"]),
                    source="backfill",
                    snapshot_metadata={
                        "backfill_timestamp": datetime.utcnow().isoformat(),
                        "num_transactions": len(transactions_by_date.get(snapshot_date, [])),
                    },
                    db=db,
                )

                snapshots_created += 1

                # Log progress every 30 days
                if snapshots_created % 30 == 0:
                    logger.info(f"Created {snapshots_created} snapshots...")

        except Exception as e:
            logger.error(f"Error during backfill: {str(e)}", exc_info=True)
            errors.append(str(e))

        logger.info(f"Backfill complete: {snapshots_created} snapshots created")

        return {
            "success": True,
            "snapshots_created": snapshots_created,
            "date_range": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat(),
            },
            "transactions_processed": len(transactions),
            "errors": errors if errors else None,
        }

    async def backfill_recent_days(
        self,
        user_id: str,
        days: int = 7,
        db: AsyncSession = None,
    ) -> Dict[str, Any]:
        """
        Backfill just the most recent days.

        Useful for catching up after a missed sync.
        """
        logger.info(f"Backfilling recent {days} days for user {user_id}")

        end_date = date.today()
        start_date = end_date - timedelta(days=days)

        snapshots_created = 0
        current_date = start_date

        while current_date <= end_date:
            # Check if snapshot exists
            if not await self.snapshot_service.snapshot_exists(user_id, current_date, db):
                # Create snapshot from current data
                await self.snapshot_service.calculate_and_store_snapshot(
                    user_id=user_id,
                    snapshot_date=current_date,
                    db=db,
                )
                snapshots_created += 1

            current_date += timedelta(days=1)

        return {
            "success": True,
            "snapshots_created": snapshots_created,
            "date_range": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat(),
            }
        }

    async def get_backfill_status(
        self,
        user_id: str,
        db: AsyncSession = None,
    ) -> Dict[str, Any]:
        """
        Get status of historical data for a user.

        Returns info about how much history is available.
        """
        # Get snapshot count
        count = await self.snapshot_service.get_snapshot_count(user_id, db)

        if count == 0:
            return {
                "has_history": False,
                "snapshot_count": 0,
                "oldest_snapshot": None,
                "newest_snapshot": None,
                "needs_backfill": True,
            }

        # Get date range
        snapshots = await self.snapshot_service.get_snapshots(user_id=user_id, db=db)

        if not snapshots:
            return {
                "has_history": False,
                "snapshot_count": 0,
                "needs_backfill": True,
            }

        oldest = snapshots[0]
        newest = snapshots[-1]

        # Check for gaps
        expected_days = (newest.snapshot_date - oldest.snapshot_date).days + 1
        has_gaps = count < expected_days

        return {
            "has_history": True,
            "snapshot_count": count,
            "oldest_snapshot": oldest.snapshot_date.isoformat(),
            "newest_snapshot": newest.snapshot_date.isoformat(),
            "days_of_history": expected_days,
            "has_gaps": has_gaps,
            "needs_backfill": has_gaps or newest.snapshot_date < date.today(),
        }
