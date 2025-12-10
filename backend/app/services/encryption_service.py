"""
Encryption service for sensitive data
Handles encryption/decryption of access tokens and other sensitive information
"""

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
import base64
import os
from typing import Optional

from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class EncryptionService:
    """Service for encrypting and decrypting sensitive data"""

    def __init__(self):
        """Initialize encryption service with derived key from SECRET_KEY"""
        # Derive a Fernet key from the SECRET_KEY
        # In production, use a separate ENCRYPTION_KEY
        salt = b'wealthnav_salt_v1'  # Static salt for key derivation
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
            backend=default_backend()
        )
        key = base64.urlsafe_b64encode(kdf.derive(settings.SECRET_KEY.encode()))
        self.cipher = Fernet(key)

    def encrypt(self, plaintext: str) -> str:
        """
        Encrypt a plaintext string

        Args:
            plaintext: String to encrypt

        Returns:
            Encrypted string (base64 encoded)
        """
        try:
            if not plaintext:
                return ""

            encrypted_bytes = self.cipher.encrypt(plaintext.encode())
            return encrypted_bytes.decode('utf-8')
        except Exception as e:
            logger.error(f"Encryption failed: {e}")
            raise ValueError("Failed to encrypt data")

    def decrypt(self, encrypted: str) -> str:
        """
        Decrypt an encrypted string

        Args:
            encrypted: Encrypted string (base64 encoded)

        Returns:
            Decrypted plaintext string
        """
        try:
            if not encrypted:
                return ""

            decrypted_bytes = self.cipher.decrypt(encrypted.encode())
            return decrypted_bytes.decode('utf-8')
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            raise ValueError("Failed to decrypt data")

    def encrypt_access_token(self, access_token: str) -> str:
        """
        Encrypt a Plaid access token

        Args:
            access_token: Plaid access token

        Returns:
            Encrypted access token
        """
        return self.encrypt(access_token)

    def decrypt_access_token(self, encrypted_token: str) -> str:
        """
        Decrypt a Plaid access token

        Args:
            encrypted_token: Encrypted Plaid access token

        Returns:
            Decrypted access token
        """
        return self.decrypt(encrypted_token)


# Singleton instance
encryption_service = EncryptionService()
