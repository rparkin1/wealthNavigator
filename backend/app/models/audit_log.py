"""
Audit Log Database Model
Tracks security-relevant events and user actions for compliance
"""

from sqlalchemy import String, Text, JSON, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional, Any
from datetime import datetime
import uuid

from .base import Base, TimestampMixin


class AuditLog(Base, TimestampMixin):
    """
    Audit log for tracking security events and user actions.

    Supports GDPR/CCPA compliance by maintaining an audit trail of:
    - Authentication events (login, logout, password changes)
    - Data access and modifications
    - Permission changes
    - Data exports and deletions
    - Security events (failed logins, suspicious activities)
    """

    __tablename__ = "audit_logs"

    # Primary key
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    # User who performed the action (nullable for system events)
    user_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    # Event details
    event_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True
    )  # e.g., "login", "logout", "data_export", "data_deletion"

    event_category: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True
    )  # e.g., "authentication", "data_access", "security", "compliance"

    severity: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="info"
    )  # "info", "warning", "error", "critical"

    # Event description
    description: Mapped[str] = mapped_column(Text, nullable=False)

    # Request details
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)  # IPv6 max length
    user_agent: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    request_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    request_method: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)

    # Response details
    status_code: Mapped[Optional[int]] = mapped_column(nullable=True)

    # Additional context (stored as JSON) - renamed from 'metadata' to avoid SQLAlchemy reserved word
    event_metadata: Mapped[Optional[dict[str, Any]]] = mapped_column(
        "metadata",  # Database column name stays the same
        JSON,
        nullable=True
    )

    # Relationship to user
    user: Mapped[Optional["User"]] = relationship("User", back_populates="audit_logs")

    # Indexes for common queries
    __table_args__ = (
        Index("ix_audit_logs_user_created", "user_id", "created_at"),
        Index("ix_audit_logs_event_created", "event_type", "created_at"),
        Index("ix_audit_logs_category_created", "event_category", "created_at"),
        Index("ix_audit_logs_severity_created", "severity", "created_at"),
    )

    def __repr__(self) -> str:
        return (
            f"<AuditLog(id={self.id}, event_type={self.event_type}, "
            f"user_id={self.user_id}, created_at={self.created_at})>"
        )


class MFASecret(Base, TimestampMixin):
    """
    Stores MFA (Multi-Factor Authentication) secrets for users.

    Uses TOTP (Time-based One-Time Password) algorithm.
    """

    __tablename__ = "mfa_secrets"

    # Primary key
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    # User who owns this MFA secret (one-to-one relationship)
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,  # One MFA secret per user
        nullable=False,
        index=True
    )

    # Encrypted TOTP secret (base32 encoded)
    secret_encrypted: Mapped[str] = mapped_column(String(500), nullable=False)

    # Backup codes (encrypted, comma-separated)
    backup_codes_encrypted: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # MFA enabled flag
    is_enabled: Mapped[bool] = mapped_column(default=False)

    # Last verified timestamp
    last_verified_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)

    # Failed verification attempts counter (for rate limiting)
    failed_attempts: Mapped[int] = mapped_column(default=0)

    # Relationship to user
    user: Mapped["User"] = relationship("User", back_populates="mfa_secret")

    def __repr__(self) -> str:
        return (
            f"<MFASecret(id={self.id}, user_id={self.user_id}, "
            f"is_enabled={self.is_enabled})>"
        )
