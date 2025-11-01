/**
 * Plaid Integration Types
 */

export interface PlaidLinkTokenResponse {
  link_token: string;
  expiration: string;
}

export interface PlaidItem {
  id: string;
  user_id: string;
  item_id: string;
  institution_id: string | null;
  institution_name: string | null;
  is_active: boolean;
  consent_expiration_time: string | null;
  last_successful_sync: string | null;
  error_code: string | null;
  error_message: string | null;
  available_products: string[];
  billed_products: string[];
  created_at: string;
  updated_at: string;
}

export interface PlaidAccount {
  id: string;
  item_id: string;
  user_id: string;
  account_id: string;
  persistent_account_id: string | null;
  name: string;
  official_name: string | null;
  type: 'depository' | 'credit' | 'loan' | 'investment';
  subtype: string | null;
  mask: string | null;
  current_balance: number | null;
  available_balance: number | null;
  limit: number | null;
  iso_currency_code: string;
  is_active: boolean;
  last_balance_update: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlaidTransaction {
  id: string;
  account_id: string;
  user_id: string;
  transaction_id: string;
  amount: number;
  iso_currency_code: string;
  date: string;
  authorized_date: string | null;
  name: string;
  merchant_name: string | null;
  category: string[] | null;
  category_id: string | null;
  personal_finance_category: {
    primary: string;
    detailed: string;
  } | null;
  pending: boolean;
  location: {
    address: string | null;
    city: string | null;
    region: string | null;
    postal_code: string | null;
    country: string | null;
    lat: number | null;
    lon: number | null;
  } | null;
  payment_channel: string | null;
  user_category: string | null;
  user_notes: string | null;
  is_excluded: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlaidHolding {
  id: string;
  account_id: string;
  user_id: string;
  security_id: string;
  ticker_symbol: string | null;
  cusip: string | null;
  isin: string | null;
  sedol: string | null;
  name: string;
  type: string | null;
  quantity: number;
  institution_price: number | null;
  institution_value: number | null;
  cost_basis: number | null;
  iso_currency_code: string;
  unofficial_currency_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface LinkTokenCreateRequest {
  country_codes?: string[];
  language?: string;
  redirect_uri?: string;
  webhook?: string;
}

export interface PublicTokenExchangeRequest {
  public_token: string;
}

export interface TransactionsListRequest {
  account_id?: string;
  start_date?: string;
  end_date?: string;
  category?: string;
  min_amount?: number;
  max_amount?: number;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface TransactionsListResponse {
  transactions: PlaidTransaction[];
  total: number;
  limit: number;
  offset: number;
}

export interface TransactionUpdateRequest {
  user_category?: string;
  user_notes?: string;
  is_excluded?: boolean;
}

export interface ItemsListResponse {
  items: PlaidItem[];
  total: number;
}

export interface AccountsGetResponse {
  accounts: PlaidAccount[];
  total: number;
}

export interface HoldingsListResponse {
  holdings: PlaidHolding[];
  total: number;
}

export interface SyncResponse {
  added: number;
  modified: number;
  removed: number;
}
