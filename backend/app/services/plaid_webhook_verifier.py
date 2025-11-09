"""
Plaid Webhook Signature Verification
Verifies that webhooks are genuinely from Plaid
"""

import hmac
import hashlib
import time
import os
from typing import Optional

from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class PlaidWebhookVerifier:
    """Service for verifying Plaid webhook signatures"""

    def __init__(self):
        """Initialize webhook verifier"""
        # In production, get this from Plaid dashboard
        self.webhook_verification_key = os.getenv('PLAID_WEBHOOK_VERIFICATION_KEY')

    def verify_signature(
        self,
        body: bytes,
        plaid_signature: str,
        timestamp: Optional[str] = None
    ) -> bool:
        """
        Verify Plaid webhook signature

        Args:
            body: Raw request body (bytes)
            plaid_signature: Signature from Plaid-Verification header
            timestamp: Timestamp from request (optional, for replay attack protection)

        Returns:
            True if signature is valid
        """
        try:
            if not self.webhook_verification_key:
                logger.warning("Webhook verification key not configured - skipping verification")
                return True  # In development, allow webhooks without verification

            # Verify timestamp is recent (within 5 minutes) to prevent replay attacks
            if timestamp:
                try:
                    webhook_time = int(timestamp)
                    current_time = int(time.time())
                    time_diff = abs(current_time - webhook_time)

                    if time_diff > 300:  # 5 minutes
                        logger.warning(f"Webhook timestamp too old: {time_diff} seconds")
                        return False
                except ValueError:
                    logger.warning("Invalid webhook timestamp")
                    return False

            # Compute expected signature
            message = body
            expected_signature = hmac.new(
                self.webhook_verification_key.encode(),
                message,
                hashlib.sha256
            ).hexdigest()

            # Compare signatures (constant-time comparison to prevent timing attacks)
            return hmac.compare_digest(expected_signature, plaid_signature)

        except Exception as e:
            logger.error(f"Webhook verification failed: {e}")
            return False


# Singleton instance
webhook_verifier = PlaidWebhookVerifier()
