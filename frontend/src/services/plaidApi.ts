/**
 * Plaid API Service
 * Handles all Plaid-related API calls
 */

import axios, { type AxiosInstance } from 'axios';
import type {
  PlaidLinkTokenResponse,
  LinkTokenCreateRequest,
  PublicTokenExchangeRequest,
  ItemsListResponse,
  AccountsGetResponse,
  TransactionsListRequest,
  TransactionsListResponse,
  TransactionUpdateRequest,
  PlaidTransaction,
  HoldingsListResponse,
  SyncResponse,
} from '../types/plaid';

function normalizeApiBase(raw: string): string {
  const stripped = raw.replace(/\/$/, '');
  return /\/api\/v\d+$/.test(stripped) ? stripped : `${stripped}/api/v1`;
}

const API_BASE_URL = normalizeApiBase(
  (import.meta.env.VITE_API_BASE_URL as string | undefined) || 'http://localhost:8000'
);

class PlaidApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/plaid`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for auth
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // For development, use a test user ID
      config.headers['X-User-Id'] = localStorage.getItem('user_id') || 'test-user-123';
      return config;
    });
  }

  /**
   * Create a Link token for Plaid Link initialization
   */
  async createLinkToken(request: LinkTokenCreateRequest = {}): Promise<PlaidLinkTokenResponse> {
    const response = await this.client.post<PlaidLinkTokenResponse>('/link/token/create', {
      country_codes: request.country_codes || ['US'],
      language: request.language || 'en',
      redirect_uri: request.redirect_uri,
      webhook: request.webhook,
    });
    return response.data;
  }

  /**
   * Exchange public token for access token
   */
  async exchangePublicToken(request: PublicTokenExchangeRequest): Promise<{ item_id: string; access_token: string }> {
    const response = await this.client.post('/link/token/exchange', request);
    return response.data;
  }

  /**
   * List all connected items (institutions)
   */
  async listItems(): Promise<ItemsListResponse> {
    const response = await this.client.get<ItemsListResponse>('/items');
    return response.data;
  }

  /**
   * Remove/unlink an item
   */
  async removeItem(itemId: string): Promise<void> {
    await this.client.delete(`/items/${itemId}`);
  }

  /**
   * List all accounts
   */
  async listAccounts(itemId?: string, accountType?: string): Promise<AccountsGetResponse> {
    const params: Record<string, string> = {};
    if (itemId) params.item_id = itemId;
    if (accountType) params.account_type = accountType;

    const response = await this.client.get<AccountsGetResponse>('/accounts', { params });
    return response.data;
  }

  /**
   * Sync account balances
   */
  async syncAccounts(itemId?: string): Promise<{ accounts_synced: number }> {
    const response = await this.client.post('/accounts/sync', { item_id: itemId });
    return response.data;
  }

  /**
   * Sync transactions
   */
  async syncTransactions(itemId?: string): Promise<SyncResponse> {
    const response = await this.client.post<SyncResponse>('/transactions/sync', { item_id: itemId });
    return response.data;
  }

  /**
   * List transactions with filtering and pagination
   */
  async listTransactions(request: TransactionsListRequest = {}): Promise<TransactionsListResponse> {
    const response = await this.client.post<TransactionsListResponse>('/transactions/list', {
      limit: 50,
      offset: 0,
      ...request,
    });
    return response.data;
  }

  /**
   * Update transaction (category, notes, excluded status)
   */
  async updateTransaction(transactionId: string, updates: TransactionUpdateRequest): Promise<PlaidTransaction> {
    const response = await this.client.patch<PlaidTransaction>(`/transactions/${transactionId}`, updates);
    return response.data;
  }

  /**
   * Sync investment holdings
   */
  async syncHoldings(itemId?: string): Promise<{ holdings_count: number; securities_count: number }> {
    const response = await this.client.post('/holdings/sync', { item_id: itemId });
    return response.data;
  }

  /**
   * List investment holdings
   */
  async listHoldings(accountId?: string): Promise<HoldingsListResponse> {
    const params: Record<string, string> = {};
    if (accountId) params.account_id = accountId;

    const response = await this.client.get<HoldingsListResponse>('/holdings', { params });
    return response.data;
  }

  /**
   * Sync investment transactions (buy/sell/dividend/etc)
   */
  async syncInvestmentTransactions(itemId?: string): Promise<{ transactions_added: number; securities_count: number; total_transactions: number }> {
    const response = await this.client.post('/investment-transactions/sync', { item_id: itemId });
    return response.data;
  }

  /**
   * List investment transactions with filtering and pagination
   */
  async listInvestmentTransactions(request: {
    account_id?: string;
    start_date?: string;
    end_date?: string;
    transaction_type?: string;
    ticker?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{
    transactions: any[];
    total: number;
  }> {
    const response = await this.client.post('/investment-transactions', {
      limit: 50,
      offset: 0,
      ...request,
    });
    return response.data;
  }
}

// Export singleton instance
export const plaidApi = new PlaidApiService();
