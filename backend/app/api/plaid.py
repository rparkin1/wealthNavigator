"""
Plaid API endpoints for account linking and data synchronization
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from typing import List, Optional
from datetime import datetime, date

from app.api.deps import get_db, get_current_user, CurrentUser
from app.models.plaid import PlaidItem, PlaidAccount, PlaidTransaction, PlaidHolding
from app.schemas.plaid import (
    LinkTokenCreateRequest,
    LinkTokenCreateResponse,
    PublicTokenExchangeRequest,
    PublicTokenExchangeResponse,
    PlaidAccountResponse,
    AccountsGetResponse,
    TransactionsSyncRequest,
    TransactionsSyncResponse,
    TransactionsListRequest,
    TransactionsListResponse,
    PlaidTransactionResponse,
    TransactionUpdateRequest,
    HoldingsSyncRequest,
    HoldingsSyncResponse,
    HoldingsListResponse,
    PlaidHoldingResponse,
    PlaidItemResponse,
    ItemsListResponse,
    ItemRemoveRequest,
    PlaidWebhookRequest
)
from app.services.plaid_service import plaid_service

import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/plaid", tags=["plaid"])


# Link Token Management
@router.post("/link/token/create", response_model=LinkTokenCreateResponse)
async def create_link_token(
    request: LinkTokenCreateRequest,
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Create a Link token for Plaid Link initialization

    This endpoint creates a short-lived token that the frontend uses
    to initialize Plaid Link for account connection.
    """
    try:
        result = plaid_service.create_link_token(
            user_id=current_user.id,
            redirect_uri=request.redirect_uri,
            webhook=request.webhook,
            language=request.language,
            country_codes=request.country_codes
        )

        return LinkTokenCreateResponse(**result)

    except Exception as e:
        logger.error(f"Error creating link token: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create link token: {str(e)}"
        )


@router.post("/link/token/exchange", response_model=PublicTokenExchangeResponse)
async def exchange_public_token(
    request: PublicTokenExchangeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Exchange a public token for an access token and store the item

    After successful Plaid Link, the frontend receives a public token.
    This endpoint exchanges it for a permanent access token and saves
    the connection.
    """
    try:
        # Exchange the public token
        result = plaid_service.exchange_public_token(request.public_token)
        access_token = result["access_token"]
        item_id = result["item_id"]

        # Get item details
        item_details = plaid_service.get_item(access_token)

        # Get institution details if available
        institution_name = None
        if item_details.get("institution_id"):
            try:
                institution = plaid_service.get_institution(item_details["institution_id"])
                institution_name = institution.get("name")
            except Exception as e:
                logger.warning(f"Failed to get institution details: {e}")

        # Create PlaidItem record
        plaid_item = PlaidItem(
            user_id=current_user.id,
            item_id=item_id,
            access_token=access_token,  # In production, encrypt this
            institution_id=item_details.get("institution_id"),
            institution_name=institution_name,
            consent_expiration_time=item_details.get("consent_expiration_time"),
            available_products=item_details.get("available_products"),
            billed_products=item_details.get("billed_products"),
            is_active=True
        )

        db.add(plaid_item)
        await db.commit()
        await db.refresh(plaid_item)

        # Sync accounts
        await _sync_accounts_for_item(db, plaid_item, access_token)

        return PublicTokenExchangeResponse(
            item_id=item_id,
            access_token=access_token
        )

    except Exception as e:
        await db.rollback()
        logger.error(f"Error exchanging public token: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to exchange public token: {str(e)}"
        )


# Items Management
@router.get("/items", response_model=ItemsListResponse)
async def list_items(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """List all Plaid items for the current user"""
    result = await db.execute(
        select(PlaidItem)
        .where(PlaidItem.user_id == current_user.id)
        .order_by(desc(PlaidItem.created_at))
    )
    items = result.scalars().all()

    return ItemsListResponse(
        items=[PlaidItemResponse.model_validate(item) for item in items],
        total=len(items)
    )


@router.delete("/items/{item_id}")
async def remove_item(
    item_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Remove/unlink a Plaid item

    This will remove the connection to the financial institution
    and delete all associated accounts, transactions, and holdings.
    """
    # Get the item
    result = await db.execute(
        select(PlaidItem)
        .where(and_(
            PlaidItem.id == item_id,
            PlaidItem.user_id == current_user.id
        ))
    )
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )

    try:
        # Remove from Plaid
        plaid_service.remove_item(item.access_token)

        # Delete from database (cascade will handle accounts, transactions, holdings)
        await db.delete(item)
        await db.commit()

        return {"message": "Item removed successfully"}

    except Exception as e:
        await db.rollback()
        logger.error(f"Error removing item: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove item: {str(e)}"
        )


# Accounts
@router.get("/accounts", response_model=AccountsGetResponse)
async def list_accounts(
    item_id: Optional[str] = None,
    account_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """List all accounts for the current user"""
    query = select(PlaidAccount).where(
        and_(
            PlaidAccount.user_id == current_user.id,
            PlaidAccount.is_active == True
        )
    )

    if item_id:
        query = query.where(PlaidAccount.item_id == item_id)

    if account_type:
        query = query.where(PlaidAccount.type == account_type)

    query = query.order_by(desc(PlaidAccount.created_at))

    result = await db.execute(query)
    accounts = result.scalars().all()

    return AccountsGetResponse(
        accounts=[PlaidAccountResponse.model_validate(acc) for acc in accounts],
        total=len(accounts)
    )


@router.post("/accounts/sync")
async def sync_accounts(
    item_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Sync account balances from Plaid

    If item_id is provided, sync only that item.
    Otherwise, sync all active items.
    """
    try:
        # Get items to sync
        query = select(PlaidItem).where(
            and_(
                PlaidItem.user_id == current_user.id,
                PlaidItem.is_active == True
            )
        )

        if item_id:
            query = query.where(PlaidItem.id == item_id)

        result = await db.execute(query)
        items = result.scalars().all()

        total_synced = 0
        for item in items:
            count = await _sync_accounts_for_item(db, item, item.access_token)
            total_synced += count

        return {"accounts_synced": total_synced}

    except Exception as e:
        logger.error(f"Error syncing accounts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync accounts: {str(e)}"
        )


# Transactions
@router.post("/transactions/sync", response_model=TransactionsSyncResponse)
async def sync_transactions(
    request: TransactionsSyncRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Sync transactions from Plaid using the Transactions Sync endpoint

    This endpoint incrementally syncs transactions using cursors.
    """
    try:
        # Get items to sync
        query = select(PlaidItem).where(
            and_(
                PlaidItem.user_id == current_user.id,
                PlaidItem.is_active == True
            )
        )

        if request.item_id:
            query = query.where(PlaidItem.id == request.item_id)

        result = await db.execute(query)
        items = result.scalars().all()

        total_added = 0
        total_modified = 0
        total_removed = 0

        for item in items:
            # Sync transactions for this item
            sync_result = plaid_service.sync_transactions(
                access_token=item.access_token,
                cursor=item.cursor
            )

            # Process added transactions
            for txn_data in sync_result["added"]:
                await _upsert_transaction(db, item, txn_data, current_user.id)
                total_added += 1

            # Process modified transactions
            for txn_data in sync_result["modified"]:
                await _upsert_transaction(db, item, txn_data, current_user.id)
                total_modified += 1

            # Process removed transactions
            for txn_id in sync_result["removed"]:
                await _remove_transaction(db, txn_id)
                total_removed += 1

            # Update cursor
            item.cursor = sync_result["cursor"]
            item.last_successful_sync = datetime.utcnow().isoformat()

            await db.commit()

        return TransactionsSyncResponse(
            added=total_added,
            modified=total_modified,
            removed=total_removed,
            cursor=items[0].cursor if items else None,
            has_more=False
        )

    except Exception as e:
        await db.rollback()
        logger.error(f"Error syncing transactions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync transactions: {str(e)}"
        )


@router.post("/transactions/list", response_model=TransactionsListResponse)
async def list_transactions(
    request: TransactionsListRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    List transactions with filtering and pagination
    """
    query = select(PlaidTransaction).where(PlaidTransaction.user_id == current_user.id)

    # Apply filters
    if request.account_id:
        query = query.where(PlaidTransaction.account_id == request.account_id)

    if request.start_date:
        query = query.where(PlaidTransaction.date >= request.start_date)

    if request.end_date:
        query = query.where(PlaidTransaction.date <= request.end_date)

    if request.category:
        query = query.where(PlaidTransaction.user_category == request.category)

    if request.min_amount is not None:
        query = query.where(PlaidTransaction.amount >= request.min_amount)

    if request.max_amount is not None:
        query = query.where(PlaidTransaction.amount <= request.max_amount)

    if request.search:
        search_term = f"%{request.search}%"
        query = query.where(PlaidTransaction.name.ilike(search_term))

    # Get total count
    count_result = await db.execute(select(PlaidTransaction.id).select_from(query.subquery()))
    total = len(count_result.all())

    # Apply pagination and ordering
    query = query.order_by(desc(PlaidTransaction.date))
    query = query.offset(request.offset).limit(request.limit)

    result = await db.execute(query)
    transactions = result.scalars().all()

    return TransactionsListResponse(
        transactions=[PlaidTransactionResponse.model_validate(txn) for txn in transactions],
        total=total,
        limit=request.limit,
        offset=request.offset
    )


@router.patch("/transactions/{transaction_id}", response_model=PlaidTransactionResponse)
async def update_transaction(
    transaction_id: str,
    request: TransactionUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """Update user-editable transaction fields (category, notes, excluded status)"""
    result = await db.execute(
        select(PlaidTransaction).where(
            and_(
                PlaidTransaction.id == transaction_id,
                PlaidTransaction.user_id == current_user.id
            )
        )
    )
    transaction = result.scalar_one_or_none()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )

    # Update fields
    if request.user_category is not None:
        transaction.user_category = request.user_category
    if request.user_notes is not None:
        transaction.user_notes = request.user_notes
    if request.is_excluded is not None:
        transaction.is_excluded = request.is_excluded

    await db.commit()
    await db.refresh(transaction)

    return PlaidTransactionResponse.model_validate(transaction)


# Holdings/Investments
@router.post("/holdings/sync", response_model=HoldingsSyncResponse)
async def sync_holdings(
    request: HoldingsSyncRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """Sync investment holdings from Plaid"""
    try:
        # Get investment items to sync
        query = select(PlaidItem).where(
            and_(
                PlaidItem.user_id == current_user.id,
                PlaidItem.is_active == True
            )
        )

        if request.item_id:
            query = query.where(PlaidItem.id == request.item_id)

        result = await db.execute(query)
        items = result.scalars().all()

        total_holdings = 0
        total_securities = 0

        for item in items:
            # Check if item has investments product
            if "investments" not in (item.billed_products or []):
                continue

            # Get holdings
            holdings_data = plaid_service.get_investments_holdings(item.access_token)

            # Process holdings
            for holding_data in holdings_data["holdings"]:
                security = holdings_data["securities"].get(holding_data["security_id"], {})
                await _upsert_holding(db, item, holding_data, security, current_user.id)
                total_holdings += 1

            total_securities += len(holdings_data["securities"])

            item.last_successful_sync = datetime.utcnow().isoformat()
            await db.commit()

        return HoldingsSyncResponse(
            holdings_count=total_holdings,
            securities_count=total_securities
        )

    except Exception as e:
        await db.rollback()
        logger.error(f"Error syncing holdings: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync holdings: {str(e)}"
        )


@router.get("/holdings", response_model=HoldingsListResponse)
async def list_holdings(
    account_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """List investment holdings"""
    query = select(PlaidHolding).where(PlaidHolding.user_id == current_user.id)

    if account_id:
        query = query.where(PlaidHolding.account_id == account_id)

    query = query.order_by(desc(PlaidHolding.institution_value))

    result = await db.execute(query)
    holdings = result.scalars().all()

    return HoldingsListResponse(
        holdings=[PlaidHoldingResponse.model_validate(h) for h in holdings],
        total=len(holdings)
    )


# Webhooks
@router.post("/webhook")
async def handle_webhook(
    webhook_data: PlaidWebhookRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Handle webhooks from Plaid

    Plaid sends webhooks for various events like new transactions,
    item errors, etc. This endpoint processes those webhooks.
    """
    try:
        logger.info(f"Received Plaid webhook: {webhook_data.webhook_type}/{webhook_data.webhook_code}")

        # Get the item
        result = await db.execute(
            select(PlaidItem).where(PlaidItem.item_id == webhook_data.item_id)
        )
        item = result.scalar_one_or_none()

        if not item:
            logger.warning(f"Webhook for unknown item: {webhook_data.item_id}")
            return {"status": "ignored"}

        # Handle different webhook types
        if webhook_data.webhook_type == "TRANSACTIONS":
            if webhook_data.webhook_code in ["SYNC_UPDATES_AVAILABLE", "DEFAULT_UPDATE"]:
                # Trigger transaction sync (in production, use background task)
                logger.info(f"New transactions available for item {item.id}")

        elif webhook_data.webhook_type == "ITEM":
            if webhook_data.webhook_code == "ERROR":
                # Update item error status
                item.error_code = webhook_data.error.get("error_code") if webhook_data.error else None
                item.error_message = webhook_data.error.get("error_message") if webhook_data.error else None
                await db.commit()

        return {"status": "processed"}

    except Exception as e:
        logger.error(f"Error processing webhook: {e}")
        return {"status": "error", "detail": str(e)}


# Helper functions
async def _sync_accounts_for_item(
    db: AsyncSession,
    item: PlaidItem,
    access_token: str
) -> int:
    """Sync accounts for a specific item"""
    accounts_data = plaid_service.get_accounts(access_token)

    for acc_data in accounts_data:
        # Check if account exists
        result = await db.execute(
            select(PlaidAccount).where(PlaidAccount.account_id == acc_data["account_id"])
        )
        account = result.scalar_one_or_none()

        if account:
            # Update existing account
            account.current_balance = acc_data["balances"]["current"]
            account.available_balance = acc_data["balances"]["available"]
            account.limit = acc_data["balances"]["limit"]
            account.last_balance_update = datetime.utcnow().isoformat()
        else:
            # Create new account
            account = PlaidAccount(
                item_id=item.id,
                user_id=item.user_id,
                account_id=acc_data["account_id"],
                name=acc_data["name"],
                official_name=acc_data.get("official_name"),
                type=acc_data["type"],
                subtype=acc_data.get("subtype"),
                mask=acc_data.get("mask"),
                current_balance=acc_data["balances"]["current"],
                available_balance=acc_data["balances"]["available"],
                limit=acc_data["balances"]["limit"],
                iso_currency_code=acc_data["balances"].get("iso_currency_code", "USD"),
                last_balance_update=datetime.utcnow().isoformat()
            )
            db.add(account)

    await db.commit()
    return len(accounts_data)


async def _upsert_transaction(
    db: AsyncSession,
    item: PlaidItem,
    txn_data: dict,
    user_id: str
):
    """Insert or update a transaction"""
    # Get account
    result = await db.execute(
        select(PlaidAccount).where(PlaidAccount.account_id == txn_data["account_id"])
    )
    account = result.scalar_one_or_none()

    if not account:
        logger.warning(f"Transaction for unknown account: {txn_data['account_id']}")
        return

    # Check if transaction exists
    result = await db.execute(
        select(PlaidTransaction).where(PlaidTransaction.transaction_id == txn_data["transaction_id"])
    )
    transaction = result.scalar_one_or_none()

    if transaction:
        # Update existing
        transaction.amount = txn_data["amount"]
        transaction.date = txn_data["date"]
        transaction.name = txn_data["name"]
        transaction.merchant_name = txn_data.get("merchant_name")
        transaction.category = txn_data.get("category")
        transaction.personal_finance_category = txn_data.get("personal_finance_category")
        transaction.pending = txn_data.get("pending", False)
    else:
        # Create new
        transaction = PlaidTransaction(
            account_id=account.id,
            user_id=user_id,
            transaction_id=txn_data["transaction_id"],
            amount=txn_data["amount"],
            iso_currency_code=txn_data.get("iso_currency_code", "USD"),
            date=txn_data["date"],
            authorized_date=txn_data.get("authorized_date"),
            name=txn_data["name"],
            merchant_name=txn_data.get("merchant_name"),
            category=txn_data.get("category"),
            category_id=txn_data.get("category_id"),
            personal_finance_category=txn_data.get("personal_finance_category"),
            pending=txn_data.get("pending", False),
            payment_channel=txn_data.get("payment_channel"),
            location=txn_data.get("location"),
            payment_meta=txn_data.get("payment_meta")
        )
        db.add(transaction)


async def _remove_transaction(db: AsyncSession, transaction_id: str):
    """Remove a transaction"""
    result = await db.execute(
        select(PlaidTransaction).where(PlaidTransaction.transaction_id == transaction_id)
    )
    transaction = result.scalar_one_or_none()

    if transaction:
        await db.delete(transaction)


async def _upsert_holding(
    db: AsyncSession,
    item: PlaidItem,
    holding_data: dict,
    security_data: dict,
    user_id: str
):
    """Insert or update a holding"""
    # Get account
    result = await db.execute(
        select(PlaidAccount).where(PlaidAccount.account_id == holding_data["account_id"])
    )
    account = result.scalar_one_or_none()

    if not account:
        logger.warning(f"Holding for unknown account: {holding_data['account_id']}")
        return

    # Check if holding exists
    result = await db.execute(
        select(PlaidHolding).where(
            and_(
                PlaidHolding.account_id == account.id,
                PlaidHolding.security_id == holding_data["security_id"]
            )
        )
    )
    holding = result.scalar_one_or_none()

    if holding:
        # Update existing
        holding.quantity = holding_data["quantity"]
        holding.institution_price = holding_data.get("institution_price")
        holding.institution_value = holding_data.get("institution_value")
        holding.cost_basis = holding_data.get("cost_basis")
    else:
        # Create new
        holding = PlaidHolding(
            account_id=account.id,
            user_id=user_id,
            security_id=holding_data["security_id"],
            ticker_symbol=security_data.get("ticker_symbol"),
            cusip=security_data.get("cusip"),
            isin=security_data.get("isin"),
            sedol=security_data.get("sedol"),
            name=security_data.get("name", "Unknown"),
            type=security_data.get("type"),
            quantity=holding_data["quantity"],
            institution_price=holding_data.get("institution_price"),
            institution_value=holding_data.get("institution_value"),
            cost_basis=holding_data.get("cost_basis"),
            iso_currency_code=holding_data.get("iso_currency_code", "USD")
        )
        db.add(holding)
