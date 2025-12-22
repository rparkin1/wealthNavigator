"""
Net Worth Snapshot Service

Service for creating, retrieving, and managing historical net worth snapshots.
"""

from datetime import date, datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, delete
from sqlalchemy.dialects.postgresql import insert
import logging

from app.models.net_worth_snapshot import NetWorthSnapshot
from app.models.plaid import PlaidAccount, PlaidHolding

logger = logging.getLogger(__name__)


class NetWorthSnapshotService:
    """Service for managing net worth snapshots"""

    @staticmethod
    async def create_snapshot(
        user_id: str,
        snapshot_date: date,
        total_assets: float,
        total_liabilities: float,
        liquid_net_worth: float,
        assets_by_class: Dict[str, float],
        num_accounts: int = 0,
        num_investment_accounts: int = 0,
        num_depository_accounts: int = 0,
        num_credit_accounts: int = 0,
        source: str = "plaid",
        snapshot_metadata: Optional[Dict[str, Any]] = None,
        db: AsyncSession = None,
    ) -> NetWorthSnapshot:
        """
        Create or update a net worth snapshot.

        Uses upsert to handle duplicate dates (one snapshot per day per user).
        """
        total_net_worth = total_assets - total_liabilities

        # Prepare snapshot data
        snapshot_data = {
            "user_id": user_id,
            "snapshot_date": snapshot_date,
            "total_assets": total_assets,
            "total_liabilities": total_liabilities,
            "total_net_worth": total_net_worth,
            "liquid_net_worth": liquid_net_worth,
            "assets_by_class": assets_by_class,
            "num_accounts": num_accounts,
            "num_investment_accounts": num_investment_accounts,
            "num_depository_accounts": num_depository_accounts,
            "num_credit_accounts": num_credit_accounts,
            "source": source,
            "snapshot_metadata": snapshot_metadata,
            "updated_at": datetime.utcnow(),
        }

        # Use PostgreSQL upsert to handle duplicates
        stmt = insert(NetWorthSnapshot).values(**snapshot_data)
        stmt = stmt.on_conflict_do_update(
            constraint="uq_user_snapshot_date",
            set_={
                "total_assets": stmt.excluded.total_assets,
                "total_liabilities": stmt.excluded.total_liabilities,
                "total_net_worth": stmt.excluded.total_net_worth,
                "liquid_net_worth": stmt.excluded.liquid_net_worth,
                "assets_by_class": stmt.excluded.assets_by_class,
                "num_accounts": stmt.excluded.num_accounts,
                "num_investment_accounts": stmt.excluded.num_investment_accounts,
                "num_depository_accounts": stmt.excluded.num_depository_accounts,
                "num_credit_accounts": stmt.excluded.num_credit_accounts,
                "source": stmt.excluded.source,
                "snapshot_metadata": stmt.excluded.snapshot_metadata,
                "updated_at": stmt.excluded.updated_at,
            }
        ).returning(NetWorthSnapshot)

        result = await db.execute(stmt)
        await db.commit()
        snapshot = result.scalar_one()

        logger.info(f"Created/updated snapshot for user {user_id} on {snapshot_date}")
        return snapshot

    @staticmethod
    async def get_snapshots(
        user_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        db: AsyncSession = None,
    ) -> List[NetWorthSnapshot]:
        """
        Get net worth snapshots for a user within a date range.

        Args:
            user_id: User ID
            start_date: Start date (inclusive)
            end_date: End date (inclusive)
            db: Database session

        Returns:
            List of snapshots ordered by date
        """
        query = select(NetWorthSnapshot).where(NetWorthSnapshot.user_id == user_id)

        if start_date:
            query = query.where(NetWorthSnapshot.snapshot_date >= start_date)
        if end_date:
            query = query.where(NetWorthSnapshot.snapshot_date <= end_date)

        query = query.order_by(NetWorthSnapshot.snapshot_date.asc())

        result = await db.execute(query)
        snapshots = result.scalars().all()

        logger.debug(f"Retrieved {len(snapshots)} snapshots for user {user_id}")
        return list(snapshots)

    @staticmethod
    async def get_latest_snapshot(
        user_id: str,
        db: AsyncSession = None,
    ) -> Optional[NetWorthSnapshot]:
        """Get the most recent snapshot for a user"""
        query = (
            select(NetWorthSnapshot)
            .where(NetWorthSnapshot.user_id == user_id)
            .order_by(NetWorthSnapshot.snapshot_date.desc())
            .limit(1)
        )

        result = await db.execute(query)
        snapshot = result.scalar_one_or_none()

        return snapshot

    @staticmethod
    async def snapshot_exists(
        user_id: str,
        snapshot_date: date,
        db: AsyncSession = None,
    ) -> bool:
        """Check if a snapshot exists for a given date"""
        query = select(func.count(NetWorthSnapshot.id)).where(
            and_(
                NetWorthSnapshot.user_id == user_id,
                NetWorthSnapshot.snapshot_date == snapshot_date
            )
        )

        result = await db.execute(query)
        count = result.scalar()

        return count > 0

    @staticmethod
    async def get_snapshot_count(
        user_id: str,
        db: AsyncSession = None,
    ) -> int:
        """Get total number of snapshots for a user"""
        query = select(func.count(NetWorthSnapshot.id)).where(
            NetWorthSnapshot.user_id == user_id
        )

        result = await db.execute(query)
        count = result.scalar()

        return count

    @staticmethod
    async def delete_snapshots_before(
        user_id: str,
        before_date: date,
        db: AsyncSession = None,
    ) -> int:
        """
        Delete snapshots before a certain date (data retention).

        Returns number of deleted snapshots.
        """
        stmt = delete(NetWorthSnapshot).where(
            and_(
                NetWorthSnapshot.user_id == user_id,
                NetWorthSnapshot.snapshot_date < before_date
            )
        )

        result = await db.execute(stmt)
        await db.commit()

        deleted_count = result.rowcount
        logger.info(f"Deleted {deleted_count} snapshots before {before_date} for user {user_id}")

        return deleted_count

    @staticmethod
    async def calculate_and_store_snapshot(
        user_id: str,
        snapshot_date: Optional[date] = None,
        db: AsyncSession = None,
    ) -> NetWorthSnapshot:
        """
        Calculate net worth from current Plaid data and store as snapshot.

        This is used for daily snapshot creation.
        """
        if snapshot_date is None:
            snapshot_date = date.today()

        # Get all active Plaid accounts
        accounts_query = select(PlaidAccount).where(
            and_(
                PlaidAccount.user_id == user_id,
                PlaidAccount.is_active == True
            )
        )
        result = await db.execute(accounts_query)
        accounts = result.scalars().all()

        if not accounts:
            logger.warning(f"No active accounts found for user {user_id}")
            # Create empty snapshot
            return await NetWorthSnapshotService.create_snapshot(
                user_id=user_id,
                snapshot_date=snapshot_date,
                total_assets=0.0,
                total_liabilities=0.0,
                liquid_net_worth=0.0,
                assets_by_class={},
                num_accounts=0,
                source="plaid",
                db=db,
            )

        # Count accounts by type
        num_investment = sum(1 for a in accounts if a.type == "investment")
        num_depository = sum(1 for a in accounts if a.type == "depository")
        num_credit = sum(1 for a in accounts if a.type in ["credit", "loan"])

        # Calculate assets by class
        assets_by_class = {}
        total_assets = 0.0

        # Add cash from depository accounts
        for account in accounts:
            if account.type == "depository" and account.current_balance:
                balance = float(account.current_balance)
                if balance > 0:
                    assets_by_class["cash"] = assets_by_class.get("cash", 0) + balance
                    total_assets += balance

        # Get holdings from investment accounts
        investment_account_ids = [a.id for a in accounts if a.type == "investment"]
        if investment_account_ids:
            holdings_query = select(PlaidHolding).where(
                and_(
                    PlaidHolding.account_id.in_(investment_account_ids),
                    PlaidHolding.is_active == True
                )
            )
            result = await db.execute(holdings_query)
            holdings = result.scalars().all()

            # Classify holdings by asset class
            for holding in holdings:
                value = float(holding.institution_value) if holding.institution_value else 0.0
                if value <= 0:
                    continue

                asset_class = NetWorthSnapshotService._classify_holding(holding)
                assets_by_class[asset_class] = assets_by_class.get(asset_class, 0) + value
                total_assets += value

        # Calculate liabilities
        total_liabilities = 0.0
        for account in accounts:
            if account.type in ["credit", "loan"] and account.current_balance:
                balance = float(account.current_balance)
                if balance > 0:
                    total_liabilities += balance

        # Calculate liquid net worth (excluding real estate)
        liquid_net_worth = (
            assets_by_class.get("cash", 0) +
            assets_by_class.get("stocks", 0) +
            assets_by_class.get("bonds", 0) +
            assets_by_class.get("other", 0) -
            total_liabilities
        )

        # Create snapshot
        return await NetWorthSnapshotService.create_snapshot(
            user_id=user_id,
            snapshot_date=snapshot_date,
            total_assets=total_assets,
            total_liabilities=total_liabilities,
            liquid_net_worth=liquid_net_worth,
            assets_by_class=assets_by_class,
            num_accounts=len(accounts),
            num_investment_accounts=num_investment,
            num_depository_accounts=num_depository,
            num_credit_accounts=num_credit,
            source="plaid",
            snapshot_metadata={
                "calculation_timestamp": datetime.utcnow().isoformat(),
                "num_holdings": len(holdings) if investment_account_ids else 0,
            },
            db=db,
        )

    @staticmethod
    def _classify_holding(holding: PlaidHolding) -> str:
        """
        Classify a Plaid holding into an asset class.

        Uses enhanced classification with Plaid's security types and ticker symbols.
        """
        ticker = (holding.ticker_symbol or "").upper()
        security_type = (holding.type or "").lower()
        name = (holding.name or "").lower()

        # Priority 1: Check security type from Plaid (most reliable)
        if security_type:
            # Equity types
            if any(t in security_type for t in ["equity", "stock", "derivative"]):
                return "stocks"

            # Fixed income types
            if any(t in security_type for t in ["bond", "fixed income", "treasury", "municipal"]):
                return "bonds"

            # Cash equivalents
            if any(t in security_type for t in ["cash", "money market", "sweep"]):
                return "cash"

            # Real estate
            if "reit" in security_type or "real estate" in security_type:
                return "realEstate"

            # Commodities
            if any(t in security_type for t in ["commodity", "future", "option"]):
                return "other"

        # Priority 2: ETF/Mutual Fund classification by ticker
        if ticker:
            # US Stock ETFs
            if ticker in [
                "SPY", "VOO", "VTI", "IVV", "QQQ", "VUG", "VTV", "IWD", "IWF",
                "VO", "IJH", "IWM", "IJR", "VB", "ITOT", "SCHB", "SCHA", "VXF"
            ]:
                return "stocks"

            # International Stock ETFs
            if ticker in [
                "VEA", "IEFA", "EFA", "VXUS", "IXUS", "ACWI", "ACWX",
                "VWO", "IEMG", "EEM", "EEMV", "VSS", "SCZ"
            ]:
                return "stocks"

            # Bond ETFs
            if ticker in [
                "BND", "AGG", "BNDX", "VGIT", "IEF", "TLT", "VGLT", "SHY", "SHV",
                "LQD", "VCLT", "HYG", "JNK", "MUB", "VMBS", "TIP", "VTIP", "SCHP"
            ]:
                return "bonds"

            # REIT ETFs
            if ticker in ["VNQ", "IYR", "VNQI", "RWR", "SCHH", "REET", "USRT"]:
                return "realEstate"

            # Commodity/Gold ETFs
            if ticker in ["GLD", "IAU", "SLV", "DBC", "GSG", "USO", "UNG", "PDBC"]:
                return "other"

            # Sector-specific classification
            # Technology = stocks
            if ticker in ["XLK", "VGT", "FTEC", "IYW"]:
                return "stocks"

            # Financials = stocks
            if ticker in ["XLF", "VFH", "IYF"]:
                return "stocks"

        # Priority 3: Name-based classification (fallback)
        if name:
            if any(word in name for word in ["stock", "equity", "growth", "value", "index"]):
                return "stocks"

            if any(word in name for word in ["bond", "treasury", "corporate", "municipal", "fixed"]):
                return "bonds"

            if any(word in name for word in ["reit", "real estate"]):
                return "realEstate"

            if any(word in name for word in ["gold", "commodity", "oil", "energy"]):
                return "other"

            if any(word in name for word in ["money market", "cash", "sweep"]):
                return "cash"

        # Default fallback
        # If it's a mutual fund or ETF with no clear classification, assume stocks
        if "mutual" in security_type or "etf" in security_type:
            return "stocks"

        # Final fallback
        return "other"
