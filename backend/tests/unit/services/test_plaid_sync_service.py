"""
Plaid Sync Service Tests

Validates summary accounting, transactional inserts, and holding updates.
"""

from datetime import datetime, timedelta
from types import SimpleNamespace
from typing import Any, List
from unittest.mock import AsyncMock, Mock

import pytest

from app.models.plaid import (
    PlaidAccount,
    PlaidHolding,
    PlaidItem,
    PlaidTransaction,
)
from app.services.plaid_sync_service import PlaidSyncService


class FakeScalarResult:
    """Minimal scalar result adapter for SQLAlchemy async execute calls."""

    def __init__(self, values: Any):
        if values is None:
            self._values: List[Any] = []
        elif isinstance(values, list):
            self._values = values
        else:
            self._values = [values]

    def scalars(self):
        return self

    def all(self):
        return self._values

    def scalar_one_or_none(self):
        return self._values[0] if self._values else None


class FakeSession:
    """Simple async session stub capturing adds/commits."""

    def __init__(self, side_effects: List[FakeScalarResult]):
        self._side_effects = side_effects
        self.execute = AsyncMock(side_effect=self._side_effects)
        self.added: List[Any] = []
        self.commit = AsyncMock()

    def add(self, obj: Any):
        self.added.append(obj)


def build_item() -> PlaidItem:
    return PlaidItem(
        user_id="user-123",
        item_id="item-abc",
        access_token="access-token",
        is_active=True,
    )


@pytest.mark.asyncio
async def test_sync_item_compiles_subtask_results(monkeypatch):
    plaid_service = Mock()
    sync_service = PlaidSyncService(plaid_service=plaid_service)

    item = build_item()
    session = FakeSession([])

    monkeypatch.setattr(sync_service, "sync_accounts", AsyncMock(return_value=2))
    monkeypatch.setattr(sync_service, "sync_transactions", AsyncMock(return_value=5))
    monkeypatch.setattr(sync_service, "sync_holdings", AsyncMock(return_value=3))

    summary = await sync_service.sync_item(session, item)

    assert summary == {
        "accounts_updated": 2,
        "transactions_synced": 5,
        "holdings_updated": 3,
    }
    sync_service.sync_accounts.assert_awaited_once()
    sync_service.sync_transactions.assert_awaited_once()
    sync_service.sync_holdings.assert_awaited_once()
    session.commit.assert_awaited()
    assert item.last_successful_sync is not None


@pytest.mark.asyncio
async def test_sync_transactions_inserts_new_records():
    plaid_service = Mock()
    sync_service = PlaidSyncService(plaid_service=plaid_service)

    account = PlaidAccount(
        account_id="acct-123",
        item_id="item-abc",
        user_id="user-123",
        name="Primary Checking",
        type="depository",
    )

    transaction_payload = {
        "transaction_id": "txn-001",
        "account_id": "acct-123",
        "amount": -120.33,
        "date": "2024-01-15",
        "name": "Coffee Shop",
        "merchant_name": "Caffeine Hub",
        "category": ["Food and Drink"],
        "pending": False,
        "payment_channel": "card",
    }

    plaid_service.get_transactions = AsyncMock(
        return_value={"transactions": [transaction_payload]}
    )

    session = FakeSession(
        [
            FakeScalarResult(account),
            FakeScalarResult(None),
        ]
    )

    item = build_item()

    synced = await sync_service.sync_transactions(session, item, days=7)

    assert synced == 1
    assert len(session.added) == 1
    stored_txn: PlaidTransaction = session.added[0]
    assert stored_txn.transaction_id == "txn-001"
    assert stored_txn.account_id == account.id
    assert stored_txn.user_id == item.user_id
    assert stored_txn.amount == transaction_payload["amount"]
    session.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_sync_accounts_updates_existing_record(monkeypatch):
    plaid_service = Mock()
    sync_service = PlaidSyncService(plaid_service=plaid_service)

    existing_account = PlaidAccount(
        account_id="acct-001",
        item_id="item-abc",
        user_id="user-123",
        name="Checking",
        type="depository",
    )

    plaid_service.get_accounts = AsyncMock(
        return_value={
            "accounts": [
                {
                    "account_id": "acct-001",
                    "balances": {
                        "available": 1500.0,
                        "current": 1650.0,
                        "limit": None,
                    },
                }
            ]
        }
    )

    session = FakeSession([FakeScalarResult(existing_account)])

    update_portfolio = AsyncMock()
    monkeypatch.setattr(sync_service, "_update_portfolio_account", update_portfolio)

    updated_count = await sync_service.sync_accounts(session, build_item())

    assert updated_count == 1
    assert existing_account.current_balance == pytest.approx(1650.0)
    assert existing_account.available_balance == pytest.approx(1500.0)
    assert existing_account.limit is None
    assert isinstance(existing_account.last_balance_update, str)
    update_portfolio.assert_awaited_once()
    session.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_sync_holdings_updates_and_creates(monkeypatch):
    plaid_service = Mock()
    sync_service = PlaidSyncService(plaid_service=plaid_service)

    existing_account = PlaidAccount(
        account_id="acct-001",
        item_id="item-abc",
        user_id="user-123",
        name="Investment",
        type="investment",
    )
    other_account = PlaidAccount(
        account_id="acct-002",
        item_id="item-abc",
        user_id="user-123",
        name="401k",
        type="investment",
    )

    existing_holding = PlaidHolding(
        account_id=existing_account.id,
        user_id=existing_account.user_id,
        security_id="sec-001",
        name="Existing ETF",
        quantity=10.0,
    )

    plaid_service.get_holdings = AsyncMock(
        return_value={
            "holdings": [
                {
                    "account_id": "acct-001",
                    "security_id": "sec-001",
                    "quantity": 12.5,
                    "institution_price": 110.0,
                    "institution_value": 1375.0,
                    "cost_basis": 900.0,
                },
                {
                    "account_id": "acct-002",
                    "security_id": "sec-XYZ",
                    "quantity": 5.0,
                    "institution_price": 80.0,
                    "institution_value": 400.0,
                    "cost_basis": 350.0,
                    "iso_currency_code": "USD",
                },
            ]
        }
    )

    session = FakeSession(
        [
            FakeScalarResult(existing_account),
            FakeScalarResult(existing_holding),
            FakeScalarResult(other_account),
            FakeScalarResult(None),
        ]
    )

    updated = await sync_service.sync_holdings(session, build_item())

    assert updated == 2
    assert existing_holding.quantity == pytest.approx(12.5)
    assert existing_holding.institution_value == pytest.approx(1375.0)

    # A new holding instance should have been staged for insert
    assert len(session.added) == 1
    new_holding: PlaidHolding = session.added[0]
    assert new_holding.account_id == other_account.id
    assert new_holding.user_id == other_account.user_id
    assert new_holding.security_id == "sec-XYZ"
    assert new_holding.institution_price == pytest.approx(80.0)
    session.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_sync_all_users_handles_mixed_results(monkeypatch):
    plaid_service = Mock()
    sync_service = PlaidSyncService(plaid_service=plaid_service)

    active_items = [
        PlaidItem(user_id="user-1", item_id="item-1", access_token="token-1"),
        PlaidItem(user_id="user-2", item_id="item-2", access_token="token-2"),
    ]

    session = FakeSession([FakeScalarResult(active_items)])

    first_result = {"accounts_updated": 2, "transactions_synced": 5, "holdings_updated": 1}

    monkeypatch.setattr(
        sync_service,
        "sync_item",
        AsyncMock(side_effect=[first_result, RuntimeError("sync failure")]),
    )

    summary = await sync_service.sync_all_users(session)

    assert summary["total_items"] == 2
    assert summary["successful"] == 1
    assert summary["failed"] == 1
    assert summary["transactions_synced"] == 5
    assert summary["errors"][0]["item_id"] == active_items[1].id


@pytest.mark.asyncio
async def test_force_sync_user_summarizes_results(monkeypatch):
    plaid_service = Mock()
    sync_service = PlaidSyncService(plaid_service=plaid_service)

    items = [
        PlaidItem(user_id="user-123", item_id="item-1", access_token="t1"),
        PlaidItem(user_id="user-123", item_id="item-2", access_token="t2"),
    ]

    session = FakeSession([FakeScalarResult(items)])

    monkeypatch.setattr(
        sync_service,
        "sync_item",
        AsyncMock(
            side_effect=[
                {"accounts_updated": 1, "transactions_synced": 2, "holdings_updated": 0},
                RuntimeError("boom"),
            ]
        ),
    )

    summary = await sync_service.force_sync_user(session, user_id="user-123")

    assert summary["total_items"] == 2
    assert summary["successful"] == 1
    assert summary["failed"] == 1
    assert summary["accounts_updated"] == 1


@pytest.mark.asyncio
async def test_update_portfolio_account_updates_balance():
    plaid_service = Mock()
    sync_service = PlaidSyncService(plaid_service=plaid_service)

    portfolio_account = SimpleNamespace(current_value=0.0, last_synced=None)
    session = FakeSession([FakeScalarResult(portfolio_account)])

    await sync_service._update_portfolio_account(
        session,
        user_id="user-1",
        plaid_account_id="acct-9",
        current_balance=2500.0,
    )

    assert portfolio_account.current_value == pytest.approx(2500.0)
    assert portfolio_account.last_synced is not None
    session.commit.assert_awaited_once()


def test_needs_sync_logic():
    plaid_service = Mock()
    sync_service = PlaidSyncService(plaid_service=plaid_service)

    fresh_item = PlaidItem(user_id="user-1", item_id="item-1", access_token="t1")
    fresh_item.last_successful_sync = datetime.utcnow().isoformat()

    stale_item = PlaidItem(user_id="user-1", item_id="item-2", access_token="t2")
    stale_item.last_successful_sync = (datetime.utcnow() - timedelta(hours=48)).isoformat()

    assert sync_service._needs_sync(fresh_item) is False
    assert sync_service._needs_sync(stale_item) is True
    assert sync_service._needs_sync(PlaidItem(user_id="u", item_id="item-3", access_token="t3")) is True
