"""
Data Retention Service

Implements data retention policies for net worth snapshots:
- Keep daily snapshots for the last 365 days
- Convert snapshots older than 365 days to weekly (delete non-Monday snapshots)
- Keep weekly snapshots for up to 5 years
- Delete snapshots older than 5 years
"""

from datetime import date, datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, and_, extract
import logging

from app.models.net_worth_snapshot import NetWorthSnapshot

logger = logging.getLogger(__name__)


class DataRetentionService:
    """Service for managing data retention policies"""

    # Retention policy constants
    DAILY_RETENTION_DAYS = 365  # Keep daily snapshots for 1 year
    WEEKLY_RETENTION_DAYS = 365 * 5  # Keep weekly snapshots for 5 years
    TOTAL_RETENTION_DAYS = WEEKLY_RETENTION_DAYS  # Maximum retention

    async def apply_retention_policy(
        self,
        user_id: str,
        db: AsyncSession,
    ) -> Dict[str, Any]:
        """
        Apply data retention policy for a user.

        Policy:
        1. Keep ALL daily snapshots for last 365 days
        2. For snapshots 365+ days old: Keep only Monday snapshots (delete others)
        3. Delete ALL snapshots older than 5 years

        Args:
            user_id: User ID
            db: Database session

        Returns:
            Dict with summary of actions taken
        """
        today = date.today()

        # Calculate date thresholds
        daily_cutoff = today - timedelta(days=self.DAILY_RETENTION_DAYS)
        total_cutoff = today - timedelta(days=self.TOTAL_RETENTION_DAYS)

        logger.info(f"Applying retention policy for user {user_id}")
        logger.debug(f"Daily cutoff: {daily_cutoff}, Total cutoff: {total_cutoff}")

        deleted_old = 0
        deleted_weekly = 0

        # Step 1: Delete snapshots older than total retention period
        deleted_old = await self._delete_old_snapshots(user_id, total_cutoff, db)

        # Step 2: Convert daily to weekly for snapshots between daily_cutoff and total_cutoff
        deleted_weekly = await self._convert_to_weekly(user_id, daily_cutoff, total_cutoff, db)

        total_deleted = deleted_old + deleted_weekly

        result = {
            "user_id": user_id,
            "deleted_count": total_deleted,
            "deleted_old": deleted_old,
            "deleted_weekly_conversion": deleted_weekly,
            "daily_cutoff": daily_cutoff.isoformat(),
            "total_cutoff": total_cutoff.isoformat(),
        }

        if total_deleted > 0:
            logger.info(
                f"Retention policy applied for user {user_id}: "
                f"{deleted_old} old snapshots, {deleted_weekly} converted to weekly"
            )
        else:
            logger.debug(f"No snapshots deleted for user {user_id}")

        return result

    async def _delete_old_snapshots(
        self,
        user_id: str,
        cutoff_date: date,
        db: AsyncSession,
    ) -> int:
        """Delete snapshots older than the total retention period"""
        stmt = delete(NetWorthSnapshot).where(
            and_(
                NetWorthSnapshot.user_id == user_id,
                NetWorthSnapshot.snapshot_date < cutoff_date
            )
        )

        result = await db.execute(stmt)
        await db.commit()

        deleted_count = result.rowcount

        if deleted_count > 0:
            logger.info(
                f"Deleted {deleted_count} snapshots older than {cutoff_date} "
                f"for user {user_id}"
            )

        return deleted_count

    async def _convert_to_weekly(
        self,
        user_id: str,
        start_date: date,
        end_date: date,
        db: AsyncSession,
    ) -> int:
        """
        Convert daily snapshots to weekly by keeping only Monday snapshots.

        Deletes all non-Monday snapshots in the date range.
        """
        # In PostgreSQL, extract(dow from date) returns 0 for Sunday, 1 for Monday, etc.
        # We want to keep Mondays (dow = 1) and delete everything else

        stmt = delete(NetWorthSnapshot).where(
            and_(
                NetWorthSnapshot.user_id == user_id,
                NetWorthSnapshot.snapshot_date >= start_date,
                NetWorthSnapshot.snapshot_date < end_date,
                # Delete non-Monday snapshots (dow != 1)
                extract('dow', NetWorthSnapshot.snapshot_date) != 1
            )
        )

        result = await db.execute(stmt)
        await db.commit()

        deleted_count = result.rowcount

        if deleted_count > 0:
            logger.info(
                f"Converted to weekly: Deleted {deleted_count} non-Monday snapshots "
                f"between {start_date} and {end_date} for user {user_id}"
            )

        return deleted_count

    async def get_retention_stats(
        self,
        user_id: str,
        db: AsyncSession,
    ) -> Dict[str, Any]:
        """
        Get statistics about snapshot retention for a user.

        Returns counts by retention zone (daily, weekly, total).
        """
        today = date.today()
        daily_cutoff = today - timedelta(days=self.DAILY_RETENTION_DAYS)
        total_cutoff = today - timedelta(days=self.TOTAL_RETENTION_DAYS)

        # Get all snapshots
        query = select(NetWorthSnapshot).where(
            NetWorthSnapshot.user_id == user_id
        ).order_by(NetWorthSnapshot.snapshot_date.asc())

        result = await db.execute(query)
        snapshots = result.scalars().all()

        if not snapshots:
            return {
                "user_id": user_id,
                "total_snapshots": 0,
                "daily_zone_count": 0,
                "weekly_zone_count": 0,
                "oldest_snapshot": None,
                "newest_snapshot": None,
            }

        # Count by zone
        daily_count = sum(1 for s in snapshots if s.snapshot_date >= daily_cutoff)
        weekly_count = sum(
            1 for s in snapshots
            if daily_cutoff > s.snapshot_date >= total_cutoff
        )
        old_count = sum(1 for s in snapshots if s.snapshot_date < total_cutoff)

        return {
            "user_id": user_id,
            "total_snapshots": len(snapshots),
            "daily_zone_count": daily_count,  # Last 365 days
            "weekly_zone_count": weekly_count,  # 1-5 years old
            "old_snapshots_count": old_count,  # Older than 5 years (should be 0 after cleanup)
            "oldest_snapshot": snapshots[0].snapshot_date.isoformat(),
            "newest_snapshot": snapshots[-1].snapshot_date.isoformat(),
            "daily_cutoff": daily_cutoff.isoformat(),
            "total_cutoff": total_cutoff.isoformat(),
        }

    async def preview_retention_changes(
        self,
        user_id: str,
        db: AsyncSession,
    ) -> Dict[str, Any]:
        """
        Preview what would be deleted if retention policy is applied.

        Does NOT actually delete anything.
        """
        today = date.today()
        daily_cutoff = today - timedelta(days=self.DAILY_RETENTION_DAYS)
        total_cutoff = today - timedelta(days=self.TOTAL_RETENTION_DAYS)

        # Count snapshots that would be deleted (older than 5 years)
        query_old = select(NetWorthSnapshot).where(
            and_(
                NetWorthSnapshot.user_id == user_id,
                NetWorthSnapshot.snapshot_date < total_cutoff
            )
        )
        result = await db.execute(query_old)
        old_snapshots = result.scalars().all()

        # Count non-Monday snapshots between 1-5 years old
        query_weekly = select(NetWorthSnapshot).where(
            and_(
                NetWorthSnapshot.user_id == user_id,
                NetWorthSnapshot.snapshot_date >= total_cutoff,
                NetWorthSnapshot.snapshot_date < daily_cutoff,
                extract('dow', NetWorthSnapshot.snapshot_date) != 1
            )
        )
        result = await db.execute(query_weekly)
        weekly_snapshots = result.scalars().all()

        return {
            "user_id": user_id,
            "would_delete_old": len(old_snapshots),
            "would_delete_weekly_conversion": len(weekly_snapshots),
            "total_would_delete": len(old_snapshots) + len(weekly_snapshots),
            "old_snapshots_dates": [s.snapshot_date.isoformat() for s in old_snapshots[:10]],
            "sample_weekly_dates": [s.snapshot_date.isoformat() for s in weekly_snapshots[:10]],
        }

    async def force_delete_all_snapshots(
        self,
        user_id: str,
        db: AsyncSession,
        confirm: bool = False,
    ) -> int:
        """
        Delete ALL snapshots for a user (admin/testing only).

        Args:
            user_id: User ID
            db: Database session
            confirm: Must be True to actually delete

        Returns:
            Number of snapshots deleted
        """
        if not confirm:
            raise ValueError("Must confirm deletion by setting confirm=True")

        stmt = delete(NetWorthSnapshot).where(NetWorthSnapshot.user_id == user_id)
        result = await db.execute(stmt)
        await db.commit()

        deleted_count = result.rowcount
        logger.warning(f"Force deleted ALL {deleted_count} snapshots for user {user_id}")

        return deleted_count
