"""
Portfolio Data Management API endpoints
Handles CRUD operations for accounts and holdings
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import logging

from app.core.database import get_db
from app.models.portfolio_db import Account, Holding, Portfolio
from app.schemas.portfolio_data import (
    AccountCreate,
    AccountUpdate,
    AccountResponse,
    AccountBulkCreateRequest,
    AccountBulkCreateResponse,
    AccountListResponse,
    HoldingCreate,
    HoldingUpdate,
    HoldingResponse,
    HoldingBulkCreateRequest,
    HoldingBulkCreateResponse,
    HoldingListResponse,
)

router = APIRouter(prefix="/portfolio-data", tags=["portfolio-data"])
logger = logging.getLogger(__name__)


# ============================================================================
# Account Endpoints
# ============================================================================

@router.post("/accounts/bulk", response_model=AccountBulkCreateResponse)
async def bulk_create_accounts(
    request: AccountBulkCreateRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Bulk create accounts from CSV import

    - Finds or creates user's portfolio
    - Creates all accounts in a single transaction
    - Returns created accounts with IDs
    """
    try:
        # Get or create portfolio for user
        portfolio_query = select(Portfolio).where(Portfolio.user_id == request.user_id)
        result = await db.execute(portfolio_query)
        portfolio = result.scalar_one_or_none()

        if not portfolio:
            # Create default portfolio for user
            portfolio = Portfolio(
                user_id=request.user_id,
                name="Primary Portfolio"
            )
            db.add(portfolio)
            await db.flush()  # Get portfolio ID
            logger.info(f"Created new portfolio {portfolio.id} for user {request.user_id}")

        # Create accounts
        created_accounts = []
        errors = []

        for idx, account_data in enumerate(request.accounts):
            try:
                # Create account instance
                account = Account(
                    id=account_data.id if account_data.id else None,  # Let DB generate if not provided
                    portfolio_id=portfolio.id,
                    name=account_data.name,
                    account_type=account_data.account_type,
                    institution=account_data.institution,
                    account_number=account_data.account_number,
                    balance=account_data.balance,
                    current_value=account_data.balance,  # Initialize current_value with balance
                    opened=account_data.opened,
                    notes=account_data.notes,
                )
                db.add(account)
                created_accounts.append(account)

            except Exception as e:
                logger.error(f"Error creating account at index {idx}: {str(e)}")
                errors.append({
                    "index": idx,
                    "account": account_data.name,
                    "error": str(e)
                })

        # Commit transaction
        await db.commit()

        # Refresh to get all fields
        for account in created_accounts:
            await db.refresh(account)

        logger.info(f"Bulk created {len(created_accounts)} accounts for user {request.user_id}")

        return AccountBulkCreateResponse(
            success=True,
            created_count=len(created_accounts),
            accounts=[AccountResponse.model_validate(acc) for acc in created_accounts],
            errors=errors
        )

    except Exception as e:
        await db.rollback()
        logger.error(f"Bulk account creation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create accounts: {str(e)}"
        )


@router.get("/accounts", response_model=AccountListResponse)
async def list_accounts(
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    List all accounts for a user
    """
    try:
        # Get user's portfolio
        portfolio_query = select(Portfolio).where(Portfolio.user_id == user_id)
        result = await db.execute(portfolio_query)
        portfolio = result.scalar_one_or_none()

        if not portfolio:
            return AccountListResponse(
                success=True,
                count=0,
                accounts=[]
            )

        # Get all accounts
        accounts_query = select(Account).where(Account.portfolio_id == portfolio.id)
        result = await db.execute(accounts_query)
        accounts = result.scalars().all()

        return AccountListResponse(
            success=True,
            count=len(accounts),
            accounts=[AccountResponse.model_validate(acc) for acc in accounts]
        )

    except Exception as e:
        logger.error(f"Failed to list accounts: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list accounts: {str(e)}"
        )


@router.delete("/accounts/{account_id}")
async def delete_account(
    account_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete an account and all its holdings
    """
    try:
        # Get account
        account_query = select(Account).where(Account.id == account_id)
        result = await db.execute(account_query)
        account = result.scalar_one_or_none()

        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Account {account_id} not found"
            )

        # Delete account (cascade will delete holdings)
        await db.delete(account)
        await db.commit()

        logger.info(f"Deleted account {account_id}")

        return {"success": True, "message": "Account deleted"}

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to delete account: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete account: {str(e)}"
        )


# ============================================================================
# Holding Endpoints
# ============================================================================

@router.post("/holdings/bulk", response_model=HoldingBulkCreateResponse)
async def bulk_create_holdings(
    request: HoldingBulkCreateRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Bulk create holdings from CSV import

    - Validates that all referenced accounts exist
    - Creates all holdings in a single transaction
    - Returns created holdings with IDs
    """
    try:
        # Get user's portfolio to validate accounts
        portfolio_query = select(Portfolio).where(Portfolio.user_id == request.user_id)
        result = await db.execute(portfolio_query)
        portfolio = result.scalar_one_or_none()

        if not portfolio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No portfolio found for user {request.user_id}"
            )

        # Get all valid account IDs for this portfolio
        accounts_query = select(Account.id).where(Account.portfolio_id == portfolio.id)
        result = await db.execute(accounts_query)
        valid_account_ids = {row[0] for row in result.all()}

        # Create holdings
        created_holdings = []
        errors = []

        for idx, holding_data in enumerate(request.holdings):
            try:
                # Validate account exists
                if holding_data.account_id not in valid_account_ids:
                    errors.append({
                        "index": idx,
                        "ticker": holding_data.ticker,
                        "error": f"Account {holding_data.account_id} not found"
                    })
                    continue

                # Create holding instance
                holding = Holding(
                    id=holding_data.id if holding_data.id else None,  # Let DB generate if not provided
                    account_id=holding_data.account_id,
                    ticker=holding_data.ticker,
                    name=holding_data.name,
                    security_type=holding_data.security_type,
                    shares=holding_data.shares,
                    cost_basis=holding_data.cost_basis,
                    current_value=holding_data.current_value,
                    purchase_date=holding_data.purchase_date,
                    asset_class=holding_data.asset_class,
                    expense_ratio=holding_data.expense_ratio,
                )
                db.add(holding)
                created_holdings.append(holding)

            except Exception as e:
                logger.error(f"Error creating holding at index {idx}: {str(e)}")
                errors.append({
                    "index": idx,
                    "ticker": holding_data.ticker,
                    "error": str(e)
                })

        # Commit transaction
        await db.commit()

        # Refresh to get all fields
        for holding in created_holdings:
            await db.refresh(holding)

        logger.info(f"Bulk created {len(created_holdings)} holdings for user {request.user_id}")

        return HoldingBulkCreateResponse(
            success=True,
            created_count=len(created_holdings),
            holdings=[HoldingResponse.model_validate(h) for h in created_holdings],
            errors=errors
        )

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Bulk holding creation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create holdings: {str(e)}"
        )


@router.get("/holdings", response_model=HoldingListResponse)
async def list_holdings(
    user_id: str,
    account_id: str = None,
    db: AsyncSession = Depends(get_db)
):
    """
    List all holdings for a user (optionally filtered by account)
    """
    try:
        # Get user's portfolio
        portfolio_query = select(Portfolio).where(Portfolio.user_id == user_id)
        result = await db.execute(portfolio_query)
        portfolio = result.scalar_one_or_none()

        if not portfolio:
            return HoldingListResponse(
                success=True,
                count=0,
                holdings=[]
            )

        # Get all accounts for this portfolio
        accounts_query = select(Account.id).where(Account.portfolio_id == portfolio.id)
        result = await db.execute(accounts_query)
        valid_account_ids = [row[0] for row in result.all()]

        if not valid_account_ids:
            return HoldingListResponse(
                success=True,
                count=0,
                holdings=[]
            )

        # Build holdings query
        if account_id:
            if account_id not in valid_account_ids:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Account {account_id} not found"
                )
            holdings_query = select(Holding).where(Holding.account_id == account_id)
        else:
            holdings_query = select(Holding).where(Holding.account_id.in_(valid_account_ids))

        result = await db.execute(holdings_query)
        holdings = result.scalars().all()

        return HoldingListResponse(
            success=True,
            count=len(holdings),
            holdings=[HoldingResponse.model_validate(h) for h in holdings]
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to list holdings: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list holdings: {str(e)}"
        )


@router.delete("/holdings/{holding_id}")
async def delete_holding(
    holding_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a holding
    """
    try:
        # Get holding
        holding_query = select(Holding).where(Holding.id == holding_id)
        result = await db.execute(holding_query)
        holding = result.scalar_one_or_none()

        if not holding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Holding {holding_id} not found"
            )

        # Delete holding
        await db.delete(holding)
        await db.commit()

        logger.info(f"Deleted holding {holding_id}")

        return {"success": True, "message": "Holding deleted"}

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to delete holding: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete holding: {str(e)}"
        )
