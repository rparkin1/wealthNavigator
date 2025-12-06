"""
Pydantic schemas for Plaid API requests and responses
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from enum import Enum


# Enums
class PlaidEnvironment(str, Enum):
    SANDBOX = "sandbox"
    DEVELOPMENT = "development"
    PRODUCTION = "production"


class AccountType(str, Enum):
    DEPOSITORY = "depository"
    CREDIT = "credit"
    LOAN = "loan"
    INVESTMENT = "investment"
    OTHER = "other"


class AccountSubtype(str, Enum):
    CHECKING = "checking"
    SAVINGS = "savings"
    MONEY_MARKET = "money market"
    CD = "cd"
    CREDIT_CARD = "credit card"
    PAYPAL = "paypal"
    _401K = "401k"
    _403B = "403b"
    _457B = "457b"
    _529 = "529"
    BROKERAGE = "brokerage"
    CASH_ISA = "cash isa"
    EDUCATION_SAVINGS = "education savings account"
    GIC = "gic"
    HEALTH_REIMBURSEMENT_ARRANGEMENT = "health reimbursement arrangement"
    HSA = "hsa"
    IRA = "ira"
    ISA = "isa"
    KEOGH = "keogh"
    LIF = "lif"
    LIRA = "lira"
    LRIF = "lrif"
    LRSP = "lrsp"
    MUTUAL_FUND = "mutual fund"
    NON_TAXABLE_BROKERAGE_ACCOUNT = "non-taxable brokerage account"
    PENSION = "pension"
    PROFIT_SHARING_PLAN = "profit sharing plan"
    RETIREMENT = "retirement"
    RLIF = "rlif"
    ROTH = "roth"
    ROTH_401K = "roth 401k"
    RRIF = "rrif"
    RRSP = "rrsp"
    SARSEP = "sarsep"
    SEP_IRA = "sep ira"
    SIMPLE_IRA = "simple ira"
    SIPP = "sipp"
    STOCK_PLAN = "stock plan"
    TFSA = "tfsa"
    TRUST = "trust"
    UGMA = "ugma"
    UTMA = "utma"
    VARIABLE_ANNUITY = "variable annuity"


# Link Token Requests/Responses
class LinkTokenCreateRequest(BaseModel):
    """Request to create a Plaid Link token"""
    redirect_uri: Optional[str] = None
    webhook: Optional[str] = None
    language: str = "en"
    country_codes: List[str] = ["US"]


class LinkTokenCreateResponse(BaseModel):
    """Response from creating a Link token"""
    link_token: str
    expiration: str


# Public Token Exchange
class PublicTokenExchangeRequest(BaseModel):
    """Request to exchange a public token for an access token"""
    public_token: str = Field(..., description="Public token from Plaid Link")


class PublicTokenExchangeResponse(BaseModel):
    """Response from exchanging a public token"""
    item_id: str
    access_token: str


# Account Schemas
class AccountBalance(BaseModel):
    """Account balance information"""
    current: Optional[float] = None
    available: Optional[float] = None
    limit: Optional[float] = None
    iso_currency_code: Optional[str] = "USD"


class PlaidAccountResponse(BaseModel):
    """Response model for a Plaid account"""
    id: str
    item_id: str
    account_id: str
    name: str
    official_name: Optional[str] = None
    type: str
    subtype: Optional[str] = None
    mask: Optional[str] = None
    current_balance: Optional[float] = None
    available_balance: Optional[float] = None
    limit: Optional[float] = None
    is_active: bool
    last_balance_update: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AccountsGetResponse(BaseModel):
    """Response containing list of accounts"""
    accounts: List[PlaidAccountResponse]
    total: int


# Transaction Schemas
class PersonalFinanceCategory(BaseModel):
    """Personal finance category details"""
    primary: str
    detailed: str
    confidence_level: Optional[str] = None


class TransactionLocation(BaseModel):
    """Transaction location details"""
    address: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    store_number: Optional[str] = None


class PlaidTransactionResponse(BaseModel):
    """Response model for a Plaid transaction"""
    id: str
    account_id: str
    transaction_id: str
    amount: float
    iso_currency_code: Optional[str] = "USD"
    date: date
    authorized_date: Optional[date] = None
    name: str
    merchant_name: Optional[str] = None
    category: Optional[List[str]] = None
    personal_finance_category: Optional[Dict[str, Any]] = None
    pending: bool
    payment_channel: Optional[str] = None
    location: Optional[Dict[str, Any]] = None
    user_category: Optional[str] = None
    user_notes: Optional[str] = None
    is_excluded: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TransactionsSyncRequest(BaseModel):
    """Request to sync transactions"""
    item_id: Optional[str] = None  # If None, sync all items
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class TransactionsSyncResponse(BaseModel):
    """Response from syncing transactions"""
    added: int
    modified: int
    removed: int
    cursor: Optional[str] = None
    has_more: bool


class TransactionsListRequest(BaseModel):
    """Request to list transactions"""
    account_id: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    category: Optional[str] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    search: Optional[str] = None
    limit: int = 100
    offset: int = 0


class TransactionsListResponse(BaseModel):
    """Response containing list of transactions"""
    transactions: List[PlaidTransactionResponse]
    total: int
    limit: int
    offset: int


class TransactionUpdateRequest(BaseModel):
    """Request to update transaction user data"""
    user_category: Optional[str] = None
    user_notes: Optional[str] = None
    is_excluded: Optional[bool] = None


# Investment/Holdings Schemas
class PlaidHoldingResponse(BaseModel):
    """Response model for an investment holding"""
    id: str
    account_id: str
    security_id: str
    ticker_symbol: Optional[str] = None
    name: str
    type: Optional[str] = None
    quantity: float
    institution_price: Optional[float] = None
    institution_value: Optional[float] = None
    cost_basis: Optional[float] = None
    iso_currency_code: Optional[str] = "USD"
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HoldingsSyncRequest(BaseModel):
    """Request to sync investment holdings"""
    item_id: Optional[str] = None  # If None, sync all investment items


class HoldingsSyncResponse(BaseModel):
    """Response from syncing holdings"""
    holdings_count: int
    securities_count: int


class HoldingsListResponse(BaseModel):
    """Response containing list of holdings"""
    holdings: List[PlaidHoldingResponse]
    total: int


# Investment Transactions
class PlaidInvestmentTransactionResponse(BaseModel):
    """Response model for an investment transaction"""
    id: str
    account_id: str
    investment_transaction_id: str
    security_id: Optional[str]
    ticker_symbol: Optional[str]
    date: date
    name: str
    amount: float
    quantity: Optional[float]
    price: Optional[float]
    fees: Optional[float]
    type: str
    subtype: Optional[str]
    iso_currency_code: Optional[str]
    user_category: Optional[str]
    user_notes: Optional[str]
    is_excluded: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InvestmentTransactionsSyncRequest(BaseModel):
    """Request to sync investment transactions"""
    item_id: Optional[str] = None  # If None, sync all investment items
    start_date: Optional[date] = None  # Default: 90 days ago
    end_date: Optional[date] = None  # Default: today


class InvestmentTransactionsSyncResponse(BaseModel):
    """Response from syncing investment transactions"""
    transactions_added: int
    securities_count: int
    total_transactions: int


class InvestmentTransactionsListRequest(BaseModel):
    """Request to list investment transactions"""
    account_id: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    transaction_type: Optional[str] = None  # buy, sell, dividend, etc.
    ticker: Optional[str] = None
    limit: int = Field(default=50, ge=1, le=500)
    offset: int = Field(default=0, ge=0)


class InvestmentTransactionsListResponse(BaseModel):
    """Response containing list of investment transactions"""
    transactions: List[PlaidInvestmentTransactionResponse]
    total: int


# Item Management
class PlaidItemResponse(BaseModel):
    """Response model for a Plaid item"""
    id: str
    item_id: str
    institution_id: Optional[str] = None
    institution_name: Optional[str] = None
    is_active: bool
    consent_expiration_time: Optional[str] = None
    last_successful_sync: Optional[str] = None
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    available_products: Optional[List[str]] = None
    billed_products: Optional[List[str]] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ItemsListResponse(BaseModel):
    """Response containing list of Plaid items"""
    items: List[PlaidItemResponse]
    total: int


class ItemRemoveRequest(BaseModel):
    """Request to remove a Plaid item"""
    item_id: str


# Webhook
class PlaidWebhookRequest(BaseModel):
    """Webhook request from Plaid"""
    webhook_type: str
    webhook_code: str
    item_id: str
    error: Optional[Dict[str, Any]] = None
    new_transactions: Optional[int] = None
    removed_transactions: Optional[List[str]] = None


# Error Response
class PlaidErrorResponse(BaseModel):
    """Standard error response"""
    error_type: str
    error_code: str
    error_message: str
    display_message: Optional[str] = None
    request_id: Optional[str] = None
