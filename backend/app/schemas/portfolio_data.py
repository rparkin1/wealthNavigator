"""
Pydantic schemas for portfolio data management (accounts and holdings)
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime


# ============================================================================
# Account Schemas
# ============================================================================

class AccountBase(BaseModel):
    """Base account schema"""
    name: str = Field(..., description="Account name")
    account_type: str = Field(..., description="Account type (taxable, tax_deferred, tax_exempt, etc.)")
    institution: str = Field(..., description="Financial institution")
    account_number: Optional[str] = Field(None, description="Account number (masked)")
    balance: float = Field(0.0, description="Current balance")
    opened: Optional[str] = Field(None, description="Date opened (YYYY-MM-DD)")
    notes: Optional[str] = Field(None, description="Additional notes")


class AccountCreate(AccountBase):
    """Schema for creating an account"""
    id: Optional[str] = Field(None, description="Optional custom ID")
    portfolio_id: Optional[str] = Field(None, description="Portfolio ID (auto-assigned if not provided)")


class AccountUpdate(BaseModel):
    """Schema for updating an account"""
    name: Optional[str] = None
    account_type: Optional[str] = None
    institution: Optional[str] = None
    account_number: Optional[str] = None
    balance: Optional[float] = None
    opened: Optional[str] = None
    notes: Optional[str] = None


class AccountResponse(AccountBase):
    """Schema for account response"""
    id: str
    portfolio_id: str
    current_value: float
    connection_status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AccountBulkCreateRequest(BaseModel):
    """Schema for bulk account creation"""
    user_id: str = Field(..., description="User ID")
    accounts: List[AccountCreate] = Field(..., description="List of accounts to create")


class AccountBulkCreateResponse(BaseModel):
    """Response for bulk account creation"""
    success: bool
    created_count: int
    accounts: List[AccountResponse]
    errors: List[dict] = Field(default_factory=list)


# ============================================================================
# Holding Schemas
# ============================================================================

class HoldingBase(BaseModel):
    """Base holding schema"""
    ticker: str = Field(..., description="Security ticker symbol")
    name: str = Field(..., description="Security name")
    security_type: str = Field(..., description="Security type (stock, etf, mutual_fund, bond, etc.)")
    shares: float = Field(..., description="Number of shares")
    cost_basis: float = Field(..., description="Total cost basis")
    current_value: float = Field(..., description="Current market value")
    purchase_date: Optional[str] = Field(None, description="Purchase date (YYYY-MM-DD)")
    asset_class: Optional[str] = Field(None, description="Asset class category")
    expense_ratio: Optional[float] = Field(None, description="Expense ratio (for funds)")


class HoldingCreate(HoldingBase):
    """Schema for creating a holding"""
    id: Optional[str] = Field(None, description="Optional custom ID")
    account_id: str = Field(..., description="Account ID this holding belongs to")


class HoldingUpdate(BaseModel):
    """Schema for updating a holding"""
    ticker: Optional[str] = None
    name: Optional[str] = None
    security_type: Optional[str] = None
    shares: Optional[float] = None
    cost_basis: Optional[float] = None
    current_value: Optional[float] = None
    purchase_date: Optional[str] = None
    asset_class: Optional[str] = None
    expense_ratio: Optional[float] = None


class HoldingResponse(HoldingBase):
    """Schema for holding response"""
    id: str
    account_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HoldingBulkCreateRequest(BaseModel):
    """Schema for bulk holding creation"""
    user_id: str = Field(..., description="User ID")
    holdings: List[HoldingCreate] = Field(..., description="List of holdings to create")


class HoldingBulkCreateResponse(BaseModel):
    """Response for bulk holding creation"""
    success: bool
    created_count: int
    holdings: List[HoldingResponse]
    errors: List[dict] = Field(default_factory=list)


# ============================================================================
# List/Query Schemas
# ============================================================================

class AccountListResponse(BaseModel):
    """Response for listing accounts"""
    success: bool
    count: int
    accounts: List[AccountResponse]


class HoldingListResponse(BaseModel):
    """Response for listing holdings"""
    success: bool
    count: int
    holdings: List[HoldingResponse]
