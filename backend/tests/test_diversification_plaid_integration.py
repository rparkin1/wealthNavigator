"""
Tests for Diversification Plaid Auto-Fetch Integration

Verifies that the GET /api/v1/diversification/analyze endpoint correctly
fetches holdings from Plaid tables and performs analysis.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.models.plaid import PlaidAccount, PlaidHolding
from app.models.user import User


@pytest.mark.asyncio
class TestDiversificationPlaidIntegration:
    """Test diversification analysis with Plaid data auto-fetch"""

    async def test_analyze_with_plaid_data(
        self,
        authenticated_client: AsyncClient,
        async_session: AsyncSession,
        test_user: User
    ):
        """Test successful diversification analysis with Plaid holdings"""

        # Create Plaid investment account
        plaid_account = PlaidAccount(
            id="plaid_acc_1"
            user_id=test_user.id
            plaid_account_id="account_xyz"
            type="investment"
            subtype="brokerage"
            name="Test Brokerage Account"
            mask="1234"
            current_balance=100000.0
            available_balance=100000.0
            is_active=True
            last_synced=datetime.utcnow()
        )
        async_session.add(plaid_account)

        # Add diverse holdings
        holdings = [
            PlaidHolding(
                id="holding_1"
                account_id="plaid_acc_1"
                ticker_symbol="SPY"
                name="SPDR S&P 500 ETF"
                quantity=100.0
                institution_value=45000.0
                cost_basis=40000.0
                type="etf"
            )
            PlaidHolding(
                id="holding_2"
                account_id="plaid_acc_1"
                ticker_symbol="BND"
                name="Vanguard Total Bond Market ETF"
                quantity=400.0
                institution_value=30000.0
                cost_basis=32000.0
                type="etf"
            )
            PlaidHolding(
                id="holding_3"
                account_id="plaid_acc_1"
                ticker_symbol="VEA"
                name="Vanguard FTSE Developed Markets ETF"
                quantity=300.0
                institution_value=15000.0
                cost_basis=14000.0
                type="etf"
            )
            PlaidHolding(
                id="holding_4"
                account_id="plaid_acc_1"
                ticker_symbol="GLD"
                name="SPDR Gold Trust"
                quantity=50.0
                institution_value=10000.0
                cost_basis=9000.0
                type="etf"
            )
        ]

        for holding in holdings:
            async_session.add(holding)

        await async_session.commit()

        # Call the auto-fetch endpoint
        response = await authenticated_client.get(
            "/api/v1/diversification/analyze"
        )

        # Verify response
        assert response.status_code == 200
        data = response.json()

        # Verify portfolio value
        assert data["portfolio_value"] == 100000.0

        # Verify metrics
        assert "metrics" in data
        metrics = data["metrics"]
        assert metrics["total_holdings"] == 4
        assert metrics["diversification_score"] > 0
        assert metrics["asset_class_count"] >= 3  # US stocks, bonds, international, gold

        # Verify concentration risks
        assert "concentration_risks" in data

        # Verify recommendations
        assert "recommendations" in data

    async def test_analyze_without_plaid_accounts(
        self,
        authenticated_client: AsyncClient,
        test_user: User
    ):
        """Test endpoint returns 404 when user has no Plaid investment accounts"""

        response = await authenticated_client.get(
            "/api/v1/diversification/analyze"
        )

        assert response.status_code == 404
        assert "No holdings found" in response.json()["detail"]
        assert "Plaid" in response.json()["detail"]

    async def test_analyze_with_inactive_plaid_account(
        self,
        authenticated_client: AsyncClient,
        async_session: AsyncSession,
        test_user: User
    ):
        """Test endpoint ignores inactive Plaid accounts"""

        # Create inactive Plaid account
        plaid_account = PlaidAccount(
            id="plaid_acc_inactive"
            user_id=test_user.id
            plaid_account_id="account_inactive"
            type="investment"
            subtype="brokerage"
            name="Inactive Account"
            mask="5678"
            current_balance=50000.0
            available_balance=50000.0
            is_active=False,  # Inactive!
            last_synced=datetime.utcnow()
        )
        async_session.add(plaid_account)

        # Add holding
        holding = PlaidHolding(
            id="holding_inactive"
            account_id="plaid_acc_inactive"
            ticker_symbol="SPY"
            name="SPDR S&P 500 ETF"
            quantity=100.0
            institution_value=50000.0
            cost_basis=45000.0
            type="etf"
        )
        async_session.add(holding)
        await async_session.commit()

        # Should return 404 since account is inactive
        response = await authenticated_client.get(
            "/api/v1/diversification/analyze"
        )

        assert response.status_code == 404

    async def test_analyze_with_non_investment_account(
        self,
        authenticated_client: AsyncClient,
        async_session: AsyncSession,
        test_user: User
        
    ):
        """Test endpoint only uses investment accounts, not depository/credit"""

        # Create depository account (checking/savings)
        plaid_account = PlaidAccount(
            id="plaid_acc_checking"
            user_id=test_user.id
            plaid_account_id="account_checking"
            type="depository",  # Not investment!
            subtype="checking"
            name="Checking Account"
            mask="9999"
            current_balance=5000.0
            available_balance=5000.0
            is_active=True
            last_synced=datetime.utcnow()
        )
        async_session.add(plaid_account)
        await async_session.commit()

        # Should return 404 since no investment accounts
        response = await authenticated_client.get(
            "/api/v1/diversification/analyze"
            
        )

        assert response.status_code == 404

    async def test_analyze_asset_class_mapping(
        self,
        authenticated_client: AsyncClient,
        async_session: AsyncSession,
        test_user: User
        
    ):
        """Test that asset classes are correctly mapped from tickers"""

        # Create account
        plaid_account = PlaidAccount(
            id="plaid_acc_2"
            user_id=test_user.id
            plaid_account_id="account_map"
            type="investment"
            subtype="brokerage"
            name="Test Account"
            mask="0000"
            current_balance=60000.0
            available_balance=60000.0
            is_active=True
            last_synced=datetime.utcnow()
        )
        async_session.add(plaid_account)

        # Add holdings with specific tickers that should map to asset classes
        holdings = [
            PlaidHolding(
                id="h_voo"
                account_id="plaid_acc_2"
                ticker_symbol="VOO"
                name="Vanguard S&P 500 ETF"
                quantity=100.0
                institution_value=30000.0
                cost_basis=28000.0
                type="etf"
            )
            PlaidHolding(
                id="h_vgit"
                account_id="plaid_acc_2"
                ticker_symbol="VGIT"
                name="Vanguard Intermediate-Term Treasury ETF"
                quantity=300.0
                institution_value=20000.0
                cost_basis=19000.0
                type="etf"
            )
            PlaidHolding(
                id="h_vwo"
                account_id="plaid_acc_2"
                ticker_symbol="VWO"
                name="Vanguard Emerging Markets ETF"
                quantity=200.0
                institution_value=10000.0
                cost_basis=11000.0
                type="etf"
            )
        ]

        for h in holdings:
            async_session.add(h)

        await async_session.commit()

        # Fetch and analyze
        response = await authenticated_client.get(
            "/api/v1/diversification/analyze"
            
        )

        assert response.status_code == 200
        data = response.json()

        # Should have multiple asset classes mapped correctly
        metrics = data["metrics"]
        assert metrics["asset_class_count"] >= 3  # US LC, Treasury, EM

    async def test_analyze_zero_value_holdings_ignored(
        self,
        authenticated_client: AsyncClient,
        async_session: AsyncSession,
        test_user: User
        
    ):
        """Test that holdings with zero or negative values are ignored"""

        plaid_account = PlaidAccount(
            id="plaid_acc_3"
            user_id=test_user.id
            plaid_account_id="account_zero"
            type="investment"
            subtype="brokerage"
            name="Test Account"
            mask="1111"
            current_balance=50000.0
            available_balance=50000.0
            is_active=True
            last_synced=datetime.utcnow()
        )
        async_session.add(plaid_account)

        holdings = [
            PlaidHolding(
                id="h_good"
                account_id="plaid_acc_3"
                ticker_symbol="SPY"
                name="Valid Holding"
                quantity=100.0
                institution_value=50000.0
                cost_basis=48000.0
                type="etf"
            )
            PlaidHolding(
                id="h_zero"
                account_id="plaid_acc_3"
                ticker_symbol="ZERO"
                name="Zero Value Holding"
                quantity=0.0
                institution_value=0.0,  # Should be ignored
                cost_basis=0.0
                type="etf"
            )
        ]

        for h in holdings:
            async_session.add(h)

        await async_session.commit()

        response = await authenticated_client.get(
            "/api/v1/diversification/analyze"
            
        )

        assert response.status_code == 200
        data = response.json()

        # Should only count the valid holding
        assert data["metrics"]["total_holdings"] == 1
        assert data["portfolio_value"] == 50000.0
