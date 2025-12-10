"""
Audit Service
Manages audit logging for security events and compliance
"""

from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import datetime

from app.models.audit_log import AuditLog
import logging

logger = logging.getLogger(__name__)


class AuditService:
    """Service for managing audit logs."""

    @staticmethod
    async def log_event(
        db: AsyncSession,
        event_type: str,
        event_category: str,
        description: str,
        user_id: Optional[str] = None,
        severity: str = "info",
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        request_path: Optional[str] = None,
        request_method: Optional[str] = None,
        status_code: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> AuditLog:
        """
        Log an audit event.

        Args:
            db: Database session
            event_type: Type of event (e.g., "login", "data_export")
            event_category: Category (e.g., "authentication", "compliance")
            description: Human-readable description
            user_id: ID of user who performed action (optional for system events)
            severity: Event severity ("info", "warning", "error", "critical")
            ip_address: Client IP address
            user_agent: Client user agent string
            request_path: API endpoint path
            request_method: HTTP method
            status_code: HTTP response status code
            metadata: Additional context data

        Returns:
            Created AuditLog instance
        """
        audit_log = AuditLog(
            event_type=event_type,
            event_category=event_category,
            description=description,
            user_id=user_id,
            severity=severity,
            ip_address=ip_address,
            user_agent=user_agent,
            request_path=request_path,
            request_method=request_method,
            status_code=status_code,
            event_metadata=metadata,  # Note: renamed from metadata to event_metadata
        )

        db.add(audit_log)
        await db.commit()
        await db.refresh(audit_log)

        # Also log to application logger for immediate visibility
        log_level = {
            "info": logging.INFO,
            "warning": logging.WARNING,
            "error": logging.ERROR,
            "critical": logging.CRITICAL,
        }.get(severity, logging.INFO)

        logger.log(
            log_level,
            f"AUDIT: {event_type} - {description} "
            f"(user_id={user_id}, ip={ip_address})"
        )

        return audit_log

    @staticmethod
    async def log_authentication_event(
        db: AsyncSession,
        event_type: str,
        user_id: Optional[str],
        success: bool,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        reason: Optional[str] = None,
    ) -> AuditLog:
        """
        Log an authentication-related event.

        Args:
            db: Database session
            event_type: "login", "logout", "register", "password_change", etc.
            user_id: User ID (if known)
            success: Whether the operation succeeded
            ip_address: Client IP address
            user_agent: Client user agent
            reason: Reason for failure (if applicable)

        Returns:
            Created AuditLog instance
        """
        description = f"{event_type} {'successful' if success else 'failed'}"
        if reason:
            description += f": {reason}"

        return await AuditService.log_event(
            db=db,
            event_type=event_type,
            event_category="authentication",
            description=description,
            user_id=user_id,
            severity="warning" if not success else "info",
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={
                "success": success,
                "reason": reason,
            }
        )

    @staticmethod
    async def log_data_access(
        db: AsyncSession,
        user_id: str,
        resource_type: str,
        resource_id: str,
        action: str,
        ip_address: Optional[str] = None,
    ) -> AuditLog:
        """
        Log a data access event.

        Args:
            db: Database session
            user_id: User who accessed the data
            resource_type: Type of resource (e.g., "goal", "portfolio")
            resource_id: ID of the resource
            action: Action performed (e.g., "read", "update", "delete")
            ip_address: Client IP address

        Returns:
            Created AuditLog instance
        """
        return await AuditService.log_event(
            db=db,
            event_type=f"{resource_type}_{action}",
            event_category="data_access",
            description=f"User accessed {resource_type} {resource_id} ({action})",
            user_id=user_id,
            ip_address=ip_address,
            metadata={
                "resource_type": resource_type,
                "resource_id": resource_id,
                "action": action,
            }
        )

    @staticmethod
    async def log_compliance_event(
        db: AsyncSession,
        user_id: str,
        event_type: str,
        description: str,
        ip_address: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> AuditLog:
        """
        Log a compliance-related event (GDPR/CCPA).

        Args:
            db: Database session
            user_id: User ID
            event_type: "data_export", "data_deletion", "consent_update", etc.
            description: Event description
            ip_address: Client IP address
            metadata: Additional context

        Returns:
            Created AuditLog instance
        """
        return await AuditService.log_event(
            db=db,
            event_type=event_type,
            event_category="compliance",
            description=description,
            user_id=user_id,
            severity="info",
            ip_address=ip_address,
            metadata=metadata,
        )

    @staticmethod
    async def get_user_audit_logs(
        db: AsyncSession,
        user_id: str,
        limit: int = 100,
        offset: int = 0,
    ) -> list[AuditLog]:
        """
        Get audit logs for a specific user.

        Args:
            db: Database session
            user_id: User ID
            limit: Maximum number of logs to return
            offset: Offset for pagination

        Returns:
            List of AuditLog instances
        """
        stmt = (
            select(AuditLog)
            .where(AuditLog.user_id == user_id)
            .order_by(desc(AuditLog.created_at))
            .limit(limit)
            .offset(offset)
        )

        result = await db.execute(stmt)
        return list(result.scalars().all())
