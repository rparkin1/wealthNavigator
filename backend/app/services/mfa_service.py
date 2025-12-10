"""
Multi-Factor Authentication Service
Implements TOTP-based two-factor authentication
"""

import pyotp
import qrcode
import io
import base64
from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
import secrets

from app.models.audit_log import MFASecret
from app.models.user import User
from app.core.config import settings
from app.services.encryption_service import EncryptionService
import logging

logger = logging.getLogger(__name__)


class MFAService:
    """Service for managing multi-factor authentication."""

    @staticmethod
    async def setup_mfa(
        db: AsyncSession,
        user_id: str,
    ) -> Tuple[str, str, List[str]]:
        """
        Set up MFA for a user.

        Generates:
        - TOTP secret
        - QR code for authenticator app
        - Backup codes

        Args:
            db: Database session
            user_id: User ID

        Returns:
            Tuple of (secret_uri, qr_code_base64, backup_codes)
        """
        # Check if MFA already exists
        stmt = select(MFASecret).where(MFASecret.user_id == user_id)
        result = await db.execute(stmt)
        existing_mfa = result.scalar_one_or_none()

        if existing_mfa:
            raise ValueError("MFA is already set up for this user")

        # Get user
        user_stmt = select(User).where(User.id == user_id)
        user_result = await db.execute(user_stmt)
        user = user_result.scalar_one_or_none()

        if not user:
            raise ValueError("User not found")

        # Generate TOTP secret
        secret = pyotp.random_base32()

        # Generate backup codes (10 codes)
        backup_codes = [MFAService._generate_backup_code() for _ in range(10)]

        # Encrypt secret and backup codes
        encrypted_secret = EncryptionService.encrypt(secret)
        encrypted_backup_codes = EncryptionService.encrypt(",".join(backup_codes))

        # Create MFA record (not enabled yet - user must verify first)
        mfa_secret = MFASecret(
            user_id=user_id,
            secret_encrypted=encrypted_secret,
            backup_codes_encrypted=encrypted_backup_codes,
            is_enabled=False,
        )

        db.add(mfa_secret)
        await db.commit()
        await db.refresh(mfa_secret)

        # Generate QR code
        totp = pyotp.TOTP(secret)
        provisioning_uri = totp.provisioning_uri(
            name=user.email,
            issuer_name=settings.APP_NAME
        )

        # Create QR code image
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(provisioning_uri)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")

        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        qr_code_base64 = base64.b64encode(buffer.getvalue()).decode()

        logger.info(f"MFA setup initiated for user {user_id}")

        return provisioning_uri, qr_code_base64, backup_codes

    @staticmethod
    async def verify_and_enable_mfa(
        db: AsyncSession,
        user_id: str,
        totp_code: str,
    ) -> bool:
        """
        Verify TOTP code and enable MFA.

        Args:
            db: Database session
            user_id: User ID
            totp_code: 6-digit TOTP code from authenticator app

        Returns:
            True if verification successful and MFA enabled
        """
        # Get MFA secret
        stmt = select(MFASecret).where(MFASecret.user_id == user_id)
        result = await db.execute(stmt)
        mfa_secret = result.scalar_one_or_none()

        if not mfa_secret:
            raise ValueError("MFA not set up for this user")

        # Decrypt secret
        secret = EncryptionService.decrypt(mfa_secret.secret_encrypted)

        # Verify TOTP code
        totp = pyotp.TOTP(secret)
        if totp.verify(totp_code, valid_window=1):  # Allow 30s window
            # Enable MFA
            mfa_secret.is_enabled = True
            mfa_secret.last_verified_at = datetime.utcnow()
            mfa_secret.failed_attempts = 0
            await db.commit()

            logger.info(f"MFA enabled for user {user_id}")
            return True
        else:
            logger.warning(f"Invalid TOTP code for user {user_id}")
            return False

    @staticmethod
    async def verify_totp(
        db: AsyncSession,
        user_id: str,
        totp_code: str,
    ) -> bool:
        """
        Verify a TOTP code for authentication.

        Args:
            db: Database session
            user_id: User ID
            totp_code: 6-digit TOTP code

        Returns:
            True if code is valid
        """
        # Get MFA secret
        stmt = select(MFASecret).where(
            MFASecret.user_id == user_id,
            MFASecret.is_enabled == True
        )
        result = await db.execute(stmt)
        mfa_secret = result.scalar_one_or_none()

        if not mfa_secret:
            return False

        # Check rate limiting (max 5 failed attempts)
        if mfa_secret.failed_attempts >= 5:
            logger.warning(f"MFA rate limit exceeded for user {user_id}")
            return False

        # Decrypt secret
        secret = EncryptionService.decrypt(mfa_secret.secret_encrypted)

        # Verify TOTP code
        totp = pyotp.TOTP(secret)
        if totp.verify(totp_code, valid_window=1):
            # Reset failed attempts and update last verified
            mfa_secret.failed_attempts = 0
            mfa_secret.last_verified_at = datetime.utcnow()
            await db.commit()
            return True
        else:
            # Increment failed attempts
            mfa_secret.failed_attempts += 1
            await db.commit()
            logger.warning(
                f"Invalid TOTP code for user {user_id} "
                f"(attempt {mfa_secret.failed_attempts}/5)"
            )
            return False

    @staticmethod
    async def verify_backup_code(
        db: AsyncSession,
        user_id: str,
        backup_code: str,
    ) -> bool:
        """
        Verify a backup code and remove it from the list.

        Args:
            db: Database session
            user_id: User ID
            backup_code: Backup code to verify

        Returns:
            True if backup code is valid
        """
        # Get MFA secret
        stmt = select(MFASecret).where(
            MFASecret.user_id == user_id,
            MFASecret.is_enabled == True
        )
        result = await db.execute(stmt)
        mfa_secret = result.scalar_one_or_none()

        if not mfa_secret or not mfa_secret.backup_codes_encrypted:
            return False

        # Decrypt backup codes
        backup_codes_str = EncryptionService.decrypt(mfa_secret.backup_codes_encrypted)
        backup_codes = backup_codes_str.split(",")

        # Check if backup code is valid
        if backup_code in backup_codes:
            # Remove used backup code
            backup_codes.remove(backup_code)

            # Re-encrypt and save
            if backup_codes:
                mfa_secret.backup_codes_encrypted = EncryptionService.encrypt(
                    ",".join(backup_codes)
                )
            else:
                mfa_secret.backup_codes_encrypted = None

            mfa_secret.last_verified_at = datetime.utcnow()
            await db.commit()

            logger.info(f"Backup code used for user {user_id}")
            return True

        return False

    @staticmethod
    async def disable_mfa(
        db: AsyncSession,
        user_id: str,
    ) -> bool:
        """
        Disable MFA for a user.

        Args:
            db: Database session
            user_id: User ID

        Returns:
            True if MFA was disabled
        """
        stmt = select(MFASecret).where(MFASecret.user_id == user_id)
        result = await db.execute(stmt)
        mfa_secret = result.scalar_one_or_none()

        if mfa_secret:
            await db.delete(mfa_secret)
            await db.commit()
            logger.info(f"MFA disabled for user {user_id}")
            return True

        return False

    @staticmethod
    async def is_mfa_enabled(
        db: AsyncSession,
        user_id: str,
    ) -> bool:
        """
        Check if MFA is enabled for a user.

        Args:
            db: Database session
            user_id: User ID

        Returns:
            True if MFA is enabled
        """
        stmt = select(MFASecret).where(
            MFASecret.user_id == user_id,
            MFASecret.is_enabled == True
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none() is not None

    @staticmethod
    def _generate_backup_code() -> str:
        """
        Generate a random backup code.

        Returns:
            8-character alphanumeric code
        """
        return secrets.token_hex(4).upper()
