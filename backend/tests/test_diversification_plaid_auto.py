"""
Test Diversification Analysis Plaid Auto-Fetch

Verifies the GET /api/v1/diversification/analyze endpoint fetches from Plaid tables.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.models.plaid import PlaidAccount, PlaidHolding, PlaidItem
from app.models.user import User


@pytest.mark.asyncio
class TestDiversificationPlaidAutoFetch:
    """Test diversification auto-fetch from Plaid"""

    async def test_analyze_with_plaid_data_success(
        self,
        authenticated_client: AsyncClient,
        async_session: AsyncSession,
        test_user: User
    ):
        """Test successful analysis with Plaid holdings"""

        # Create Plaid item
        plaid_item = PlaidItem(
            id="item_auto_1",
            user_id=test_user.id,
            item_id="plaid_item_auto_1",
            access_token="access-sandbox-test-token",
        )
        async_session.add(plaid_item)

        # Create Plaid investment account
        account = PlaidAccount(
            id="test_plaid_acc",
            item_id="item_auto_1",
            user_id=test_user.id,
            account_id="plaid_123",
            type="investment",
            subtype="brokerage",
            name="Test Brokerage",
            mask="1234",
            current_balance=100000.0,
            available_balance=100000.0,
            is_active=True,
        )
        async_session.add(account)

        # Add holdings
        holdings = [
            PlaidHolding(
                id="h1",
                account_id="test_plaid_acc",
                user_id=test_user.id,
                security_id="sec_spy_auto",
                ticker_symbol="SPY",
                name="SPDR S&P 500 ETF",
                quantity=100.0,
                institution_value=45000.0,
                cost_basis=40000.0,
                type="etf"
            ),
            PlaidHolding(
                id="h2",
                account_id="test_plaid_acc",
                user_id=test_user.id,
                security_id="sec_bnd_auto",
                ticker_symbol="BND",
                name="Vanguard Total Bond Market ETF",
                quantity=400.0,
                institution_value=30000.0,
                cost_basis=32000.0,
                type="etf"
            ),
            PlaidHolding(
                id="h3",
                account_id="test_plaid_acc",
                user_id=test_user.id,
                security_id="sec_vea_auto",
                ticker_symbol="VEA",
                name="Vanguard FTSE Developed Markets ETF",
                quantity=300.0,
                institution_value=15000.0,
                cost_basis=14000.0,
                type="etf"
            ),
            PlaidHolding(
                id="h4",
                account_id="test_plaid_acc",
                user_id=test_user.id,
                security_id="sec_gld_auto",
                ticker_symbol="GLD",
                name="SPDR Gold Trust",
                quantity=50.0,
                institution_value=10000.0,
                cost_basis=9000.0,
                type="etf"
            )
        ]

        for h in holdings:
            async_session.add(h)

        await async_session.commit()

        # Call auto-fetch endpoint
        response = await authenticated_client.get("/api/v1/diversification/analyze")

        # Verify response
        assert response.status_code == 200
        data = response.json()

        assert data["portfolio_value"] == 100000.0
        assert "metrics" in data
        assert data["metrics"]["total_holdings"] == 4
        assert data["metrics"]["diversification_score"] > 0
        assert "concentration_risks" in data
        assert "recommendations" in data

    async def test_analyze_without_plaid_data(
        self,
        authenticated_client: AsyncClient,
        test_user: User
    ):
        """Test endpoint returns 404 when no Plaid data"""

        response = await authenticated_client.get("/api/v1/diversification/analyze")

        assert response.status_code == 404
        assert "No holdings found" in response.json()["detail"]
        assert "Plaid" in response.json()["detail"]

    async def test_analyze_only_active_accounts(
        self,
        authenticated_client: AsyncClient,
        async_session: AsyncSession,
        test_user: User
    ):
        """Test endpoint ignores inactive Plaid accounts"""

        # Create Plaid item
        plaid_item = PlaidItem(
            id="item_auto_inactive",
            user_id=test_user.id,
            item_id="plaid_item_auto_inactive",
            access_token="access-sandbox-test-token",
        )
        async_session.add(plaid_item)

        # Create inactive account
        account = PlaidAccount(
            id="test_inactive",
            item_id="item_auto_inactive",
            user_id=test_user.id,
            account_id="plaid_456",
            type="investment",
            subtype="brokerage",
            name="Inactive Account",
            mask="5678",
            current_balance=50000.0,
            available_balance=50000.0,
            is_active=False,  # Inactive
        )
        async_session.add(account)

        holding = PlaidHolding(
            id="h_inactive",
            account_id="test_inactive",
            user_id=test_user.id,
            security_id="sec_spy_inactive_auto",
            ticker_symbol="SPY",
            name="SPDR S&P 500 ETF",
            quantity=100.0,
            institution_value=50000.0,
            cost_basis=45000.0,
            type="etf"
        )
        async_session.add(holding)
        await async_session.commit()

        # Should return 404 since account is inactive
        response = await authenticated_client.get("/api/v1/diversification/analyze")
        assert response.status_code == 404
