"""
Background Job Scheduler Service

Handles scheduled tasks like daily net worth snapshots, data retention, etc.
Uses APScheduler for job scheduling.
"""

from datetime import datetime, time, date, timedelta
from typing import List, Optional
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

logger = logging.getLogger(__name__)


class SchedulerService:
    """Service for managing background scheduled tasks"""

    def __init__(self):
        """Initialize scheduler"""
        self.scheduler = AsyncIOScheduler()
        self._is_running = False

    def start(self):
        """Start the scheduler"""
        if not self._is_running:
            self.scheduler.start()
            self._is_running = True
            logger.info("Scheduler service started")

    def shutdown(self):
        """Shutdown the scheduler"""
        if self._is_running:
            self.scheduler.shutdown()
            self._is_running = False
            logger.info("Scheduler service shutdown")

    def add_daily_snapshot_job(self, hour: int = 1, minute: int = 0):
        """
        Add job to create daily net worth snapshots for all active users.

        Args:
            hour: Hour to run (0-23), default 1 AM
            minute: Minute to run (0-59), default 0
        """
        self.scheduler.add_job(
            func=self._create_daily_snapshots,
            trigger=CronTrigger(hour=hour, minute=minute),
            id="daily_snapshot_job",
            name="Create daily net worth snapshots",
            replace_existing=True,
            max_instances=1,  # Prevent overlapping runs
        )
        logger.info(f"Daily snapshot job scheduled for {hour:02d}:{minute:02d}")

    def add_data_retention_job(self, hour: int = 2, minute: int = 0):
        """
        Add job to clean up old daily snapshots and convert to weekly.

        Args:
            hour: Hour to run (0-23), default 2 AM
            minute: Minute to run (0-59), default 0
        """
        self.scheduler.add_job(
            func=self._run_data_retention,
            trigger=CronTrigger(hour=hour, minute=minute, day_of_week=0),  # Run on Mondays
            id="data_retention_job",
            name="Data retention and cleanup",
            replace_existing=True,
            max_instances=1,
        )
        logger.info(f"Data retention job scheduled for Mondays at {hour:02d}:{minute:02d}")

    def add_backfill_check_job(self, hours: int = 6):
        """
        Add job to check for users needing backfill.

        Args:
            hours: Interval in hours to check, default every 6 hours
        """
        self.scheduler.add_job(
            func=self._check_backfill_needed,
            trigger=IntervalTrigger(hours=hours),
            id="backfill_check_job",
            name="Check for users needing backfill",
            replace_existing=True,
            max_instances=1,
        )
        logger.info(f"Backfill check job scheduled every {hours} hours")

    async def _create_daily_snapshots(self):
        """Create net worth snapshots for all active users"""
        from app.core.database import AsyncSessionLocal
        from app.models.user import User
        from app.services.net_worth_snapshot_service import NetWorthSnapshotService

        logger.info("Starting daily snapshot creation job")
        snapshot_service = NetWorthSnapshotService()
        success_count = 0
        error_count = 0
        total_users = 0

        async with AsyncSessionLocal() as db:
            try:
                # Get all active users
                query = select(User).where(User.is_active == True)
                result = await db.execute(query)
                users = result.scalars().all()
                total_users = len(users)

                logger.info(f"Creating snapshots for {total_users} active users")

                for user in users:
                    try:
                        await snapshot_service.calculate_and_store_snapshot(
                            user_id=str(user.id),
                            snapshot_date=date.today(),
                            db=db,
                        )
                        success_count += 1

                        # Log progress every 10 users
                        if success_count % 10 == 0:
                            logger.info(f"Progress: {success_count}/{total_users} snapshots created")

                    except Exception as e:
                        error_count += 1
                        logger.error(
                            f"Failed to create snapshot for user {user.id}: {str(e)}",
                            exc_info=True
                        )
                        # Continue with next user
                        continue

                logger.info(
                    f"Daily snapshot job complete: "
                    f"{success_count} succeeded, {error_count} failed, {total_users} total"
                )

            except Exception as e:
                logger.error(f"Daily snapshot job failed: {str(e)}", exc_info=True)
                raise

    async def _run_data_retention(self):
        """Run data retention policy - convert old daily snapshots to weekly"""
        from app.core.database import AsyncSessionLocal
        from app.models.user import User
        from app.services.data_retention_service import DataRetentionService

        logger.info("Starting data retention job")
        retention_service = DataRetentionService()
        success_count = 0
        error_count = 0

        async with AsyncSessionLocal() as db:
            try:
                # Get all active users
                query = select(User).where(User.is_active == True)
                result = await db.execute(query)
                users = result.scalars().all()

                logger.info(f"Running data retention for {len(users)} users")

                for user in users:
                    try:
                        result = await retention_service.apply_retention_policy(
                            user_id=str(user.id),
                            db=db,
                        )
                        success_count += 1

                        if result.get("deleted_count", 0) > 0:
                            logger.info(
                                f"User {user.id}: Deleted {result['deleted_count']} old snapshots"
                            )

                    except Exception as e:
                        error_count += 1
                        logger.error(
                            f"Data retention failed for user {user.id}: {str(e)}",
                            exc_info=True
                        )
                        continue

                logger.info(
                    f"Data retention job complete: "
                    f"{success_count} succeeded, {error_count} failed"
                )

            except Exception as e:
                logger.error(f"Data retention job failed: {str(e)}", exc_info=True)
                raise

    async def _check_backfill_needed(self):
        """Check for users who need historical backfill"""
        from app.core.database import AsyncSessionLocal
        from app.models.user import User
        from app.models.plaid import PlaidItem
        from app.services.net_worth_backfill_service import NetWorthBackfillService

        logger.info("Starting backfill check job")
        backfill_service = NetWorthBackfillService()
        needs_backfill = []

        async with AsyncSessionLocal() as db:
            try:
                # Get users with Plaid connections
                query = select(User).join(PlaidItem).where(
                    User.is_active == True,
                    PlaidItem.is_active == True
                ).distinct()
                result = await db.execute(query)
                users = result.scalars().all()

                logger.info(f"Checking backfill status for {len(users)} users")

                for user in users:
                    try:
                        status = await backfill_service.get_backfill_status(
                            user_id=str(user.id),
                            db=db
                        )

                        if status.get("needs_backfill"):
                            needs_backfill.append({
                                "user_id": str(user.id),
                                "has_history": status.get("has_history"),
                                "snapshot_count": status.get("snapshot_count", 0),
                            })

                    except Exception as e:
                        logger.error(
                            f"Backfill check failed for user {user.id}: {str(e)}",
                            exc_info=True
                        )
                        continue

                if needs_backfill:
                    logger.warning(
                        f"Found {len(needs_backfill)} users needing backfill: "
                        f"{[u['user_id'] for u in needs_backfill]}"
                    )
                    # TODO: Trigger automatic backfill or send notification
                else:
                    logger.info("All users have up-to-date historical data")

            except Exception as e:
                logger.error(f"Backfill check job failed: {str(e)}", exc_info=True)
                raise

    def get_job_status(self) -> List[dict]:
        """Get status of all scheduled jobs"""
        jobs = []
        for job in self.scheduler.get_jobs():
            jobs.append({
                "id": job.id,
                "name": job.name,
                "next_run_time": job.next_run_time.isoformat() if job.next_run_time else None,
                "trigger": str(job.trigger),
            })
        return jobs


# Global scheduler instance
_scheduler_instance: Optional[SchedulerService] = None


def get_scheduler() -> SchedulerService:
    """Get or create the global scheduler instance"""
    global _scheduler_instance
    if _scheduler_instance is None:
        _scheduler_instance = SchedulerService()
    return _scheduler_instance


async def start_scheduler():
    """Start the background scheduler with all jobs"""
    scheduler = get_scheduler()

    # Add all scheduled jobs
    scheduler.add_daily_snapshot_job(hour=1, minute=0)  # 1 AM daily
    scheduler.add_data_retention_job(hour=2, minute=0)  # 2 AM on Mondays
    scheduler.add_backfill_check_job(hours=6)  # Every 6 hours

    # Start the scheduler
    scheduler.start()
    logger.info("All scheduled jobs configured and started")


async def shutdown_scheduler():
    """Shutdown the background scheduler"""
    scheduler = get_scheduler()
    scheduler.shutdown()
