"""
Privacy & Compliance Endpoints
GDPR/CCPA data export and deletion functionality
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import json
import io
from datetime import datetime

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.services.audit_service import AuditService
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/privacy", tags=["privacy", "compliance"])


class DataDeletionRequest(BaseModel):
    """Request to delete user data."""

    confirmation: str  # Must be "DELETE MY DATA" to proceed
    reason: Optional[str] = None


class DataExportResponse(BaseModel):
    """Response for data export request."""

    message: str
    export_id: str
    estimated_completion: str


@router.get("/export")
async def export_user_data(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Export all user data in JSON format (GDPR/CCPA compliance).

    Includes:
    - User profile
    - Goals and milestones
    - Portfolio data
    - Budget entries
    - Plaid connections
    - Life events
    - Preferences

    Returns:
        JSON file with all user data
    """
    # Log compliance event
    await AuditService.log_compliance_event(
        db=db,
        user_id=current_user.id,
        event_type="data_export",
        description="User requested data export",
        ip_address=request.client.host if request.client else None,
    )

    # Collect all user data
    export_data = {
        "export_metadata": {
            "user_id": current_user.id,
            "export_date": datetime.utcnow().isoformat(),
            "app_name": "WealthNavigator AI",
            "version": "1.0.0",
        },
        "user_profile": {
            "email": current_user.email,
            "full_name": current_user.full_name,
            "age": current_user.age,
            "risk_tolerance": current_user.risk_tolerance,
            "tax_rate": current_user.tax_rate,
            "preferences": current_user.preferences,
            "is_active": current_user.is_active,
            "created_at": current_user.created_at.isoformat() if hasattr(current_user, 'created_at') else None,
        },
    }

    # Add goals
    if current_user.goals:
        export_data["goals"] = [
            {
                "id": goal.id,
                "name": goal.name,
                "category": goal.category,
                "target_amount": float(goal.target_amount) if goal.target_amount else None,
                "target_date": goal.target_date.isoformat() if goal.target_date else None,
                "priority": goal.priority,
                "created_at": goal.created_at.isoformat() if hasattr(goal, 'created_at') else None,
            }
            for goal in current_user.goals
        ]

    # Add portfolios
    if current_user.portfolios:
        export_data["portfolios"] = [
            {
                "id": portfolio.id,
                "name": portfolio.name,
                "total_value": float(portfolio.total_value) if hasattr(portfolio, 'total_value') and portfolio.total_value else None,
                "created_at": portfolio.created_at.isoformat() if hasattr(portfolio, 'created_at') else None,
            }
            for portfolio in current_user.portfolios
        ]

    # Add budget entries
    if current_user.budget_entries:
        export_data["budget_entries"] = [
            {
                "id": entry.id,
                "category": entry.category,
                "amount": float(entry.amount) if entry.amount else None,
                "entry_type": entry.entry_type,
                "date": entry.date.isoformat() if entry.date else None,
                "description": entry.description,
            }
            for entry in current_user.budget_entries[:1000]  # Limit to 1000 entries
        ]

    # Add Plaid connections (without sensitive data)
    if current_user.plaid_items:
        export_data["plaid_connections"] = [
            {
                "id": item.id,
                "institution_name": item.institution_name,
                "created_at": item.created_at.isoformat() if hasattr(item, 'created_at') else None,
            }
            for item in current_user.plaid_items
        ]

    # Add life events
    if current_user.life_events:
        export_data["life_events"] = [
            {
                "id": event.id,
                "event_type": event.event_type,
                "event_date": event.event_date.isoformat() if event.event_date else None,
                "description": event.description,
            }
            for event in current_user.life_events
        ]

    # Create JSON file
    json_str = json.dumps(export_data, indent=2, default=str)
    json_bytes = json_str.encode('utf-8')

    # Create streaming response
    buffer = io.BytesIO(json_bytes)

    filename = f"wealthnavigator_export_{current_user.id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"

    logger.info(f"Data export completed for user {current_user.id}")

    return StreamingResponse(
        buffer,
        media_type="application/json",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )


@router.post("/delete", status_code=status.HTTP_202_ACCEPTED)
async def delete_user_data(
    request: Request,
    deletion_request: DataDeletionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete all user data (GDPR/CCPA right to be forgotten).

    This is a permanent operation and cannot be undone.
    User must confirm by providing the exact confirmation string.

    Args:
        deletion_request: Deletion confirmation

    Returns:
        Confirmation message
    """
    # Verify confirmation string
    if deletion_request.confirmation != "DELETE MY DATA":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid confirmation. Must provide exact confirmation string.",
        )

    # Log compliance event BEFORE deletion
    await AuditService.log_compliance_event(
        db=db,
        user_id=current_user.id,
        event_type="data_deletion",
        description=f"User requested data deletion. Reason: {deletion_request.reason or 'Not provided'}",
        ip_address=request.client.host if request.client else None,
        metadata={
            "reason": deletion_request.reason,
            "email": current_user.email,
            "deletion_timestamp": datetime.utcnow().isoformat(),
        }
    )

    # Perform cascading deletion
    # The User model has cascade="all, delete-orphan" on all relationships,
    # so deleting the user will delete all related data
    await db.delete(current_user)
    await db.commit()

    logger.info(f"User data deleted for user {current_user.id} (email: {current_user.email})")

    return {
        "message": "Your data has been successfully deleted",
        "deleted_at": datetime.utcnow().isoformat(),
        "user_id": current_user.id,
    }


@router.get("/audit-log")
async def get_audit_log(
    request: Request,
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get user's audit log (GDPR/CCPA access to processing records).

    Args:
        limit: Maximum number of records to return (max 1000)
        offset: Offset for pagination

    Returns:
        List of audit log entries
    """
    # Limit maximum results
    limit = min(limit, 1000)

    # Get audit logs
    audit_logs = await AuditService.get_user_audit_logs(
        db=db,
        user_id=current_user.id,
        limit=limit,
        offset=offset,
    )

    # Format response
    return {
        "audit_logs": [
            {
                "id": log.id,
                "event_type": log.event_type,
                "event_category": log.event_category,
                "description": log.description,
                "severity": log.severity,
                "ip_address": log.ip_address,
                "timestamp": log.created_at.isoformat() if hasattr(log, 'created_at') else None,
                "metadata": log.event_metadata,  # Note: field renamed from metadata to event_metadata
            }
            for log in audit_logs
        ],
        "total": len(audit_logs),
        "limit": limit,
        "offset": offset,
    }
