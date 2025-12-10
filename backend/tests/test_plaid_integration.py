"""
Tests for Plaid integration
Tests encryption, webhook verification, and API endpoints
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime

from app.services.encryption_service import EncryptionService
from app.services.plaid_webhook_verifier import PlaidWebhookVerifier
from app.services.plaid_sync_service import PlaidSyncService


class TestEncryptionService:
    """Test encryption service"""

    def test_encrypt_decrypt(self):
        """Test basic encryption and decryption"""
        service = EncryptionService()

        plaintext = "test-access-token-12345"
        encrypted = service.encrypt(plaintext)
        decrypted = service.decrypt(encrypted)

        assert encrypted != plaintext
        assert decrypted == plaintext

    def test_encrypt_empty_string(self):
        """Test encrypting empty string"""
        service = EncryptionService()

        encrypted = service.encrypt("")
        decrypted = service.decrypt(encrypted)

        assert encrypted == ""
        assert decrypted == ""

    def test_encrypt_access_token(self):
        """Test access token encryption"""
        service = EncryptionService()

        token = "access-sandbox-12345-token"
        encrypted = service.encrypt_access_token(token)
        decrypted = service.decrypt_access_token(encrypted)

        assert encrypted != token
        assert decrypted == token


class TestPlaidWebhookVerifier:
    """Test webhook verification"""

    def test_verify_signature_with_no_key(self):
        """Test that verification passes when no key is configured (development)"""
        verifier = PlaidWebhookVerifier()

        # Without verification key, should return True (development mode)
        result = verifier.verify_signature(
            body=b'{"webhook_type": "TRANSACTIONS"}',
            plaid_signature="fake-signature"
        )

        # In development without key, should allow through
        assert result == True


class TestPlaidSyncService:
    """Test sync service"""

    def test_should_sync_item_no_last_sync(self):
        """Test that items with no last sync should be synced"""
        from app.models.plaid import PlaidItem
        from app.services.plaid_service import plaid_service

        service = PlaidSyncService(plaid_service)

        item = PlaidItem(
            id="test-id",
            user_id="user-1",
            item_id="item-1",
            access_token="token",
            last_successful_sync=None
        )

        assert service._needs_sync(item) == True

    def test_should_sync_item_old_sync(self):
        """Test that items with old sync should be synced"""
        from app.models.plaid import PlaidItem
        from datetime import datetime, timedelta
        from app.services.plaid_service import plaid_service

        service = PlaidSyncService(plaid_service)

        # Last synced 25 hours ago (over the 24 hour threshold)
        old_sync_time = (datetime.utcnow() - timedelta(hours=25)).isoformat()

        item = PlaidItem(
            id="test-id",
            user_id="user-1",
            item_id="item-1",
            access_token="token",
            last_successful_sync=old_sync_time
        )

        assert service._needs_sync(item) == True

    def test_should_not_sync_recent_item(self):
        """Test that recently synced items should not be synced"""
        from app.models.plaid import PlaidItem
        from datetime import datetime, timedelta
        from app.services.plaid_service import plaid_service

        service = PlaidSyncService(plaid_service)

        # Last synced 1 hour ago (under the 24 hour threshold)
        recent_sync_time = (datetime.utcnow() - timedelta(hours=1)).isoformat()

        item = PlaidItem(
            id="test-id",
            user_id="user-1",
            item_id="item-1",
            access_token="token",
            last_successful_sync=recent_sync_time
        )

        assert service._needs_sync(item) == False


@pytest.mark.asyncio
class TestPlaidAPI:
    """Test Plaid API endpoints"""

    async def test_create_link_token(self):
        """Test link token creation"""
        # This would require a full integration test with the API
        # Placeholder for future implementation
        pass

    async def test_exchange_public_token(self):
        """Test public token exchange"""
        # Placeholder for future implementation
        pass

    async def test_sync_accounts(self):
        """Test account sync"""
        # Placeholder for future implementation
        pass


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
