#!/usr/bin/env python3
"""
Check transactions in database
"""
import asyncio
from sqlalchemy import select, func
from app.db.session import async_session
from app.models.plaid import PlaidTransaction, PlaidItem

async def check():
    async with async_session() as session:
        # Count transactions
        result = await session.execute(
            select(func.count(PlaidTransaction.id)).where(
                PlaidTransaction.user_id == 'test-user-123'
            )
        )
        count = result.scalar()
        print(f'Transaction count: {count}')

        # Check Plaid item cursor
        result = await session.execute(
            select(PlaidItem).where(PlaidItem.user_id == 'test-user-123')
        )
        item = result.scalar_one_or_none()
        if item:
            print(f'Plaid item: {item.institution_name}')
            print(f'Last sync: {item.last_successful_sync}')
            print(f'Cursor: {item.cursor}')
        else:
            print('No Plaid item found')

if __name__ == "__main__":
    asyncio.run(check())
