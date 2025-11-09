"""
Plaid Sync API endpoints
Manual and automated syncing controls
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any

from app.api.deps import get_db, get_current_user, CurrentUser
from app.services.plaid_sync_service import plaid_sync_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/plaid/sync", tags=["plaid-sync"])


@router.post("/all")
async def sync_all_items(
    background_tasks: BackgroundTasks,
    run_in_background: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Trigger sync for all active Plaid items

    Can run in background or wait for completion
    """
    try:
        if run_in_background:
            # Run in background
            background_tasks.add_task(
                plaid_sync_service.sync_all_active_items,
                db
            )
            return {
                "status": "scheduled",
                "message": "Sync job scheduled in background"
            }
        else:
            # Run synchronously
            stats = await plaid_sync_service.sync_all_active_items(db)
            return {
                "status": "completed",
                "stats": stats
            }

    except Exception as e:
        logger.error(f"Failed to trigger sync: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to trigger sync: {str(e)}"
        )


@router.post("/item/{item_id}")
async def sync_item(
    item_id: str,
    force: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Sync a specific Plaid item

    Args:
        item_id: Plaid item ID
        force: Force sync even if recently synced
    """
    try:
        result = await plaid_sync_service.sync_item(db, item_id, force=force)
        return result

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to sync item {item_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync item: {str(e)}"
        )


@router.get("/status")
async def get_sync_status(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get sync status for all user's items

    Returns summary of last sync times and status
    """
    try:
        # This would query the database for sync status
        # For now, return a placeholder
        return {
            "status": "ok",
            "message": "Sync status endpoint - to be implemented"
        }

    except Exception as e:
        logger.error(f"Failed to get sync status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
