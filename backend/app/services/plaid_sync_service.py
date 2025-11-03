"""
Plaid Synchronization Service

Automatic account and investment updates via Plaid API.
Implements REQ-BUD-011: System shall automatically update investment account values.
"""

from datetime import datetime, timedelta
from typing import List, Dict, Optional
import asyncio

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.plaid import PlaidItem, PlaidAccount, PlaidTransaction, PlaidHolding
from app.models.user import User
from app.models.portfolio_db import Portfolio, Account
from app.services.plaid_service import PlaidService


class PlaidSyncService:
    """Service for synchronizing Plaid data automatically."""

    def __init__(self, plaid_service: PlaidService):
        self.plaid_service = plaid_service

    async def sync_all_users(self, db: AsyncSession) -> Dict[str, any]:
        """
        Sync all users' Plaid accounts (scheduled job).

        Args:
            db: Database session

        Returns:
            Summary of sync results
        """
        # Get all active Plaid items
        result = await db.execute(
            select(PlaidItem)
            .where(PlaidItem.is_active == True)
        )
        items = result.scalars().all()

        summary = {
            'total_items': len(items),
            'successful': 0,
            'failed': 0,
            'accounts_updated': 0,
            'transactions_synced': 0,
            'holdings_updated': 0,
            'errors': [],
        }

        for item in items:
            try:
                result = await self.sync_item(db, item)
                summary['successful'] += 1
                summary['accounts_updated'] += result['accounts_updated']
                summary['transactions_synced'] += result['transactions_synced']
                summary['holdings_updated'] += result['holdings_updated']
            except Exception as e:
                summary['failed'] += 1
                summary['errors'].append({
                    'item_id': item.id,
                    'user_id': item.user_id,
                    'error': str(e),
                })

        return summary

    async def sync_item(self, db: AsyncSession, item: PlaidItem) -> Dict[str, int]:
        """
        Sync a single Plaid item.

        Args:
            db: Database session
            item: Plaid item to sync

        Returns:
            Sync results summary
        """
        summary = {
            'accounts_updated': 0,
            'transactions_synced': 0,
            'holdings_updated': 0,
        }

        # 1. Sync account balances
        accounts_result = await self.sync_accounts(db, item)
        summary['accounts_updated'] = accounts_result

        # 2. Sync transactions (last 30 days)
        transactions_result = await self.sync_transactions(db, item, days=30)
        summary['transactions_synced'] = transactions_result

        # 3. Sync investment holdings (if investment account)
        holdings_result = await self.sync_holdings(db, item)
        summary['holdings_updated'] = holdings_result

        # Update last sync time
        item.last_sync = datetime.utcnow()
        await db.commit()

        return summary

    async def sync_accounts(self, db: AsyncSession, item: PlaidItem) -> int:
        """
        Sync account balances from Plaid.

        Args:
            db: Database session
            item: Plaid item

        Returns:
            Number of accounts updated
        """
        # Get account balances from Plaid
        balances = await self.plaid_service.get_accounts(item.access_token)

        updated_count = 0

        for plaid_account_data in balances.get('accounts', []):
            account_id = plaid_account_data['account_id']

            # Get or create PlaidAccount
            result = await db.execute(
                select(PlaidAccount)
                .where(PlaidAccount.plaid_account_id == account_id)
            )
            plaid_account = result.scalar_one_or_none()

            if plaid_account:
                # Update balance
                balance_info = plaid_account_data.get('balances', {})
                plaid_account.available_balance = balance_info.get('available')
                plaid_account.current_balance = balance_info.get('current')
                plaid_account.limit_balance = balance_info.get('limit')
                plaid_account.last_sync = datetime.utcnow()

                # Update corresponding Portfolio Account
                await self._update_portfolio_account(
                    db,
                    item.user_id,
                    plaid_account.plaid_account_id,
                    balance_info.get('current', 0),
                )

                updated_count += 1

        await db.commit()
        return updated_count

    async def sync_transactions(
        self,
        db: AsyncSession,
        item: PlaidItem,
        days: int = 30,
    ) -> int:
        """
        Sync recent transactions from Plaid.

        Args:
            db: Database session
            item: Plaid item
            days: Number of days of transactions to sync

        Returns:
            Number of transactions synced
        """
        start_date = (datetime.utcnow() - timedelta(days=days)).date()
        end_date = datetime.utcnow().date()

        # Get transactions from Plaid
        transactions_data = await self.plaid_service.get_transactions(
            item.access_token,
            start_date,
            end_date,
        )

        synced_count = 0

        for txn_data in transactions_data.get('transactions', []):
            txn_id = txn_data['transaction_id']

            # Check if transaction already exists
            result = await db.execute(
                select(PlaidTransaction)
                .where(PlaidTransaction.transaction_id == txn_id)
            )
            existing_txn = result.scalar_one_or_none()

            if not existing_txn:
                # Create new transaction
                transaction = PlaidTransaction(
                    transaction_id=txn_id,
                    account_id=txn_data['account_id'],
                    item_id=item.id,
                    amount=txn_data['amount'],
                    date=datetime.strptime(txn_data['date'], '%Y-%m-%d').date(),
                    name=txn_data.get('name'),
                    merchant_name=txn_data.get('merchant_name'),
                    category=txn_data.get('category', []),
                    pending=txn_data.get('pending', False),
                    transaction_type=txn_data.get('transaction_type'),
                    payment_channel=txn_data.get('payment_channel'),
                )
                db.add(transaction)
                synced_count += 1

        await db.commit()
        return synced_count

    async def sync_holdings(self, db: AsyncSession, item: PlaidItem) -> int:
        """
        Sync investment holdings from Plaid.

        Args:
            db: Database session
            item: Plaid item

        Returns:
            Number of holdings updated
        """
        # Get holdings from Plaid
        holdings_data = await self.plaid_service.get_holdings(item.access_token)

        updated_count = 0

        for holding_data in holdings_data.get('holdings', []):
            account_id = holding_data['account_id']
            security_id = holding_data['security_id']

            # Get or create PlaidHolding
            result = await db.execute(
                select(PlaidHolding)
                .where(
                    PlaidHolding.account_id == account_id,
                    PlaidHolding.security_id == security_id,
                )
            )
            holding = result.scalar_one_or_none()

            if holding:
                # Update existing holding
                holding.quantity = holding_data.get('quantity', 0)
                holding.institution_price = holding_data.get('institution_price', 0)
                holding.institution_value = holding_data.get('institution_value', 0)
                holding.cost_basis = holding_data.get('cost_basis')
                holding.last_sync = datetime.utcnow()
            else:
                # Create new holding
                holding = PlaidHolding(
                    account_id=account_id,
                    security_id=security_id,
                    quantity=holding_data.get('quantity', 0),
                    institution_price=holding_data.get('institution_price', 0),
                    institution_value=holding_data.get('institution_value', 0),
                    cost_basis=holding_data.get('cost_basis'),
                    currency=holding_data.get('iso_currency_code', 'USD'),
                    last_sync=datetime.utcnow(),
                )
                db.add(holding)

            updated_count += 1

        await db.commit()
        return updated_count

    async def _update_portfolio_account(
        self,
        db: AsyncSession,
        user_id: str,
        plaid_account_id: str,
        current_balance: float,
    ):
        """
        Update Portfolio Account with latest balance.

        Args:
            db: Database session
            user_id: User ID
            plaid_account_id: Plaid account ID
            current_balance: Current balance from Plaid
        """
        # Find matching Portfolio Account
        result = await db.execute(
            select(Account)
            .join(Portfolio)
            .where(
                Portfolio.user_id == user_id,
                Account.external_account_id == plaid_account_id,
            )
        )
        account = result.scalar_one_or_none()

        if account:
            # Update balance
            account.balance = current_balance
            account.updated_at = datetime.utcnow()
            await db.commit()

    async def check_sync_status(self, db: AsyncSession, user_id: str) -> Dict[str, any]:
        """
        Check sync status for all user's Plaid items.

        Args:
            db: Database session
            user_id: User ID

        Returns:
            Sync status for each item
        """
        result = await db.execute(
            select(PlaidItem)
            .where(PlaidItem.user_id == user_id)
        )
        items = result.scalars().all()

        status = []
        for item in items:
            status.append({
                'item_id': item.id,
                'institution_id': item.institution_id,
                'institution_name': item.institution_name,
                'is_active': item.is_active,
                'last_sync': item.last_sync.isoformat() if item.last_sync else None,
                'needs_sync': self._needs_sync(item),
            })

        return {
            'total_items': len(items),
            'items': status,
        }

    def _needs_sync(self, item: PlaidItem, max_age_hours: int = 24) -> bool:
        """
        Determine if item needs synchronization.

        Args:
            item: Plaid item
            max_age_hours: Maximum age in hours before sync needed

        Returns:
            True if sync needed
        """
        if not item.last_sync:
            return True

        age = datetime.utcnow() - item.last_sync
        return age > timedelta(hours=max_age_hours)

    async def force_sync_user(self, db: AsyncSession, user_id: str) -> Dict[str, any]:
        """
        Force immediate sync for all user's Plaid items.

        Args:
            db: Database session
            user_id: User ID

        Returns:
            Sync results
        """
        result = await db.execute(
            select(PlaidItem)
            .where(PlaidItem.user_id == user_id, PlaidItem.is_active == True)
        )
        items = result.scalars().all()

        summary = {
            'total_items': len(items),
            'successful': 0,
            'failed': 0,
            'accounts_updated': 0,
            'transactions_synced': 0,
            'holdings_updated': 0,
        }

        for item in items:
            try:
                result = await self.sync_item(db, item)
                summary['successful'] += 1
                summary['accounts_updated'] += result['accounts_updated']
                summary['transactions_synced'] += result['transactions_synced']
                summary['holdings_updated'] += result['holdings_updated']
            except Exception as e:
                summary['failed'] += 1
                print(f"Failed to sync item {item.id}: {e}")

        return summary
