#!/usr/bin/env python3
"""
Quick cleanup script for test Plaid data
"""
import asyncio
from sqlalchemy import delete
from app.db.session import async_session
from app.models.plaid import PlaidItem

async def cleanup():
    async with async_session() as session:
        # Delete all Plaid items for test user (cascade will handle accounts and transactions)
        result = await session.execute(
            delete(PlaidItem).where(PlaidItem.user_id == 'test-user-123')
        )
        items_deleted = result.rowcount

        await session.commit()

        print(f'✓ Deleted {items_deleted} Plaid items and all associated data')
        print('✓ Ready for fresh testing!')

if __name__ == "__main__":
    asyncio.run(cleanup())
