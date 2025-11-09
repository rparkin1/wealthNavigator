"""
Multi-Factor Authentication Endpoints
Setup, verification, and management of MFA
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.services.mfa_service import MFAService
from app.services.audit_service import AuditService
from app.core.rate_limit import limiter, RATE_LIMITS
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/mfa", tags=["mfa", "security"])


class MFASetupResponse(BaseModel):
    """Response for MFA setup."""

    secret_uri: str
    qr_code_base64: str
    backup_codes: List[str]


class MFAVerifyRequest(BaseModel):
    """Request to verify TOTP code."""

    totp_code: str


class MFABackupCodeRequest(BaseModel):
    """Request to verify backup code."""

    backup_code: str


@router.post("/setup", response_model=MFASetupResponse)
@limiter.limit("3/hour")  # Prevent abuse
async def setup_mfa(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Set up multi-factor authentication for the current user.

    Generates:
    - TOTP secret for authenticator app
    - QR code image (base64 encoded)
    - Backup codes for account recovery

    The user must verify the TOTP code to enable MFA.

    Returns:
        MFA setup data including QR code and backup codes
    """
    try:
        secret_uri, qr_code_base64, backup_codes = await MFAService.setup_mfa(
            db=db,
            user_id=current_user.id,
        )

        # Log security event
        await AuditService.log_event(
            db=db,
            event_type="mfa_setup_initiated",
            event_category="security",
            description="User initiated MFA setup",
            user_id=current_user.id,
            ip_address=request.client.host if request.client else None,
        )

        return MFASetupResponse(
            secret_uri=secret_uri,
            qr_code_base64=qr_code_base64,
            backup_codes=backup_codes,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/verify")
@limiter.limit("10/minute")  # Prevent brute force
async def verify_and_enable_mfa(
    request: Request,
    verify_request: MFAVerifyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Verify TOTP code and enable MFA.

    This endpoint is called after MFA setup to verify that the user
    has correctly configured their authenticator app.

    Args:
        verify_request: TOTP code from authenticator app

    Returns:
        Success message if MFA is enabled
    """
    try:
        success = await MFAService.verify_and_enable_mfa(
            db=db,
            user_id=current_user.id,
            totp_code=verify_request.totp_code,
        )

        if success:
            # Log security event
            await AuditService.log_event(
                db=db,
                event_type="mfa_enabled",
                event_category="security",
                description="User enabled MFA",
                user_id=current_user.id,
                severity="info",
                ip_address=request.client.host if request.client else None,
            )

            return {
                "message": "MFA successfully enabled",
                "mfa_enabled": True,
            }
        else:
            # Log failed attempt
            await AuditService.log_event(
                db=db,
                event_type="mfa_verification_failed",
                event_category="security",
                description="Failed MFA verification attempt",
                user_id=current_user.id,
                severity="warning",
                ip_address=request.client.host if request.client else None,
            )

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid TOTP code",
            )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/verify-login")
@limiter.limit("5/minute")  # Strict rate limit for login verification
async def verify_mfa_for_login(
    request: Request,
    verify_request: MFAVerifyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Verify TOTP code during login (second factor).

    This endpoint is called during the login flow after username/password
    authentication to verify the second factor.

    Args:
        verify_request: TOTP code from authenticator app

    Returns:
        Success message if code is valid
    """
    success = await MFAService.verify_totp(
        db=db,
        user_id=current_user.id,
        totp_code=verify_request.totp_code,
    )

    if success:
        # Log successful MFA verification
        await AuditService.log_authentication_event(
            db=db,
            event_type="mfa_verification",
            user_id=current_user.id,
            success=True,
            ip_address=request.client.host if request.client else None,
        )

        return {
            "message": "MFA verification successful",
            "verified": True,
        }
    else:
        # Log failed verification
        await AuditService.log_authentication_event(
            db=db,
            event_type="mfa_verification",
            user_id=current_user.id,
            success=False,
            ip_address=request.client.host if request.client else None,
            reason="Invalid TOTP code",
        )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid TOTP code",
        )


@router.post("/verify-backup-code")
@limiter.limit("3/hour")  # Very strict rate limit for backup codes
async def verify_backup_code(
    request: Request,
    backup_request: MFABackupCodeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Verify a backup code (for account recovery).

    Backup codes can be used when the user doesn't have access to their
    authenticator app. Each code can only be used once.

    Args:
        backup_request: Backup code to verify

    Returns:
        Success message if code is valid
    """
    success = await MFAService.verify_backup_code(
        db=db,
        user_id=current_user.id,
        backup_code=backup_request.backup_code,
    )

    if success:
        # Log backup code usage
        await AuditService.log_event(
            db=db,
            event_type="mfa_backup_code_used",
            event_category="security",
            description="User verified MFA using backup code",
            user_id=current_user.id,
            severity="warning",  # Backup code usage is notable
            ip_address=request.client.host if request.client else None,
        )

        return {
            "message": "Backup code verified successfully",
            "verified": True,
            "warning": "This backup code has been consumed and cannot be used again",
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid backup code",
        )


@router.delete("/disable")
async def disable_mfa(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Disable MFA for the current user.

    This removes all MFA settings including TOTP secret and backup codes.

    Returns:
        Confirmation message
    """
    success = await MFAService.disable_mfa(
        db=db,
        user_id=current_user.id,
    )

    if success:
        # Log security event
        await AuditService.log_event(
            db=db,
            event_type="mfa_disabled",
            event_category="security",
            description="User disabled MFA",
            user_id=current_user.id,
            severity="warning",  # Disabling MFA is a security-relevant action
            ip_address=request.client.host if request.client else None,
        )

        return {
            "message": "MFA successfully disabled",
            "mfa_enabled": False,
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="MFA is not enabled for this user",
        )


@router.get("/status")
async def get_mfa_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get MFA status for the current user.

    Returns:
        MFA enabled status
    """
    is_enabled = await MFAService.is_mfa_enabled(
        db=db,
        user_id=current_user.id,
    )

    return {
        "mfa_enabled": is_enabled,
        "user_id": current_user.id,
    }
