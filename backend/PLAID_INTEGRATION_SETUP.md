# Plaid Integration Setup Guide

## ✅ Completed Steps

1. **Backend Integration** - Complete
   - API endpoints: `/api/v1/plaid/*` (15+ endpoints)
   - Plaid service wrapper
   - Database models (PlaidItem, PlaidAccount, PlaidTransaction, PlaidHolding)
   - Pydantic schemas for request/response
   - Router registered in main.py

2. **Dependencies** - Installed
   - Backend: `plaid-python`
   - Frontend: `react-plaid-link`

3. **Configuration** - Added
   - Environment variables added to `.env`
   - Configuration ready in `config.py`

4. **Database Migration** - Generated
   - Migration created: `10909e653c43_add_plaid_integration_tables.py`
   - Migration needs to be cleaned up (see below)

## 🔧 Next Steps to Complete Integration

### Step 1: Get Plaid Credentials

1. Sign up at https://dashboard.plaid.com/
2. Create a new application
3. Copy your credentials

### Step 2: Update Environment Variables

Edit `backend/.env` and add your Plaid credentials:

```bash
# Replace these with your actual Plaid credentials
PLAID_CLIENT_ID=your_actual_client_id
PLAID_SECRET=your_actual_sandbox_secret
PLAID_ENV=sandbox
PLAID_PRODUCTS='["auth","transactions","investments"]'
PLAID_COUNTRY_CODES='["US","CA"]'
PLAID_REDIRECT_URI=http://localhost:5173/oauth-redirect
```

### Step 3: Clean Up Migration (Required)

The generated migration tries to alter existing tables which causes foreign key conflicts.

**Option A: Create a simplified migration (Recommended)**

Create a new migration that only adds Plaid tables:

```bash
cd backend
uv run alembic revision -m "Add Plaid tables only"
```

Then manually edit the migration to only include the Plaid table creation statements.

**Option B: Manual table creation (Quick fix for development)**

Run this SQL directly on your database:

```sql
-- Create plaid_items table
CREATE TABLE plaid_items (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id VARCHAR(255) UNIQUE NOT NULL,
    access_token TEXT NOT NULL,
    institution_id VARCHAR(255),
    institution_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    consent_expiration_time VARCHAR(50),
    last_successful_sync VARCHAR(50),
    cursor TEXT,
    error_code VARCHAR(255),
    error_message TEXT,
    available_products JSON,
    billed_products JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ix_plaid_items_user_id ON plaid_items(user_id);
CREATE INDEX ix_plaid_items_item_id ON plaid_items(item_id);

-- Create plaid_accounts table
CREATE TABLE plaid_accounts (
    id VARCHAR(36) PRIMARY KEY,
    item_id VARCHAR(36) NOT NULL REFERENCES plaid_items(id) ON DELETE CASCADE,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id VARCHAR(255) UNIQUE NOT NULL,
    persistent_account_id VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    official_name VARCHAR(255),
    type VARCHAR(50) NOT NULL,
    subtype VARCHAR(50),
    mask VARCHAR(10),
    current_balance FLOAT,
    available_balance FLOAT,
    limit FLOAT,
    iso_currency_code VARCHAR(3) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT TRUE,
    last_balance_update VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ix_plaid_accounts_user_id ON plaid_accounts(user_id);
CREATE INDEX ix_plaid_accounts_item_id ON plaid_accounts(item_id);
CREATE INDEX ix_plaid_accounts_account_id ON plaid_accounts(account_id);
CREATE INDEX ix_plaid_accounts_user_type ON plaid_accounts(user_id, type);
CREATE INDEX ix_plaid_accounts_user_active ON plaid_accounts(user_id, is_active);

-- Create plaid_transactions table
CREATE TABLE plaid_transactions (
    id VARCHAR(36) PRIMARY KEY,
    account_id VARCHAR(36) NOT NULL REFERENCES plaid_accounts(id) ON DELETE CASCADE,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_id VARCHAR(255) UNIQUE NOT NULL,
    amount FLOAT NOT NULL,
    iso_currency_code VARCHAR(3) DEFAULT 'USD',
    date DATE NOT NULL,
    authorized_date DATE,
    name VARCHAR(500) NOT NULL,
    merchant_name VARCHAR(255),
    category JSON,
    category_id VARCHAR(50),
    personal_finance_category JSON,
    pending BOOLEAN DEFAULT FALSE,
    location JSON,
    payment_meta JSON,
    payment_channel VARCHAR(50),
    user_category VARCHAR(100),
    user_notes TEXT,
    is_excluded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ix_plaid_transactions_user_id ON plaid_transactions(user_id);
CREATE INDEX ix_plaid_transactions_account_id ON plaid_transactions(account_id);
CREATE INDEX ix_plaid_transactions_transaction_id ON plaid_transactions(transaction_id);
CREATE INDEX ix_plaid_transactions_date ON plaid_transactions(date);
CREATE INDEX ix_plaid_transactions_user_date ON plaid_transactions(user_id, date);
CREATE INDEX ix_plaid_transactions_account_date ON plaid_transactions(account_id, date);
CREATE INDEX ix_plaid_transactions_user_category ON plaid_transactions(user_id, user_category);

-- Create plaid_holdings table
CREATE TABLE plaid_holdings (
    id VARCHAR(36) PRIMARY KEY,
    account_id VARCHAR(36) NOT NULL REFERENCES plaid_accounts(id) ON DELETE CASCADE,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    security_id VARCHAR(255) NOT NULL,
    ticker_symbol VARCHAR(20),
    cusip VARCHAR(20),
    isin VARCHAR(20),
    sedol VARCHAR(20),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    quantity FLOAT NOT NULL,
    institution_price FLOAT,
    institution_value FLOAT,
    cost_basis FLOAT,
    iso_currency_code VARCHAR(3) DEFAULT 'USD',
    unofficial_currency_code VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ix_plaid_holdings_user_id ON plaid_holdings(user_id);
CREATE INDEX ix_plaid_holdings_account_id ON plaid_holdings(account_id);
CREATE INDEX ix_plaid_holdings_ticker_symbol ON plaid_holdings(ticker_symbol);
CREATE INDEX ix_plaid_holdings_user_ticker ON plaid_holdings(user_id, ticker_symbol);
CREATE INDEX ix_plaid_holdings_account ON plaid_holdings(account_id);
```

### Step 4: Test the Backend API

```bash
# Start the backend
cd backend
uv run python -m app.main

# In another terminal, test the link token endpoint
curl -X POST http://localhost:8000/api/v1/plaid/link/token/create \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-user-123" \
  -d '{
    "country_codes": ["US"],
    "language": "en"
  }'
```

You should get a response with a `link_token` if everything is configured correctly.

### Step 5: Create Frontend Components (Optional)

Create basic Plaid Link integration in frontend:

1. **PlaidLinkButton.tsx** - Connect accounts button
2. **ConnectedAccountsList.tsx** - Show linked accounts
3. **TransactionsList.tsx** - Display transactions

Example PlaidLinkButton:

```typescript
import { usePlaidLink } from 'react-plaid-link';
import { useState, useEffect } from 'react';
import axios from 'axios';

export function PlaidLinkButton() {
  const [linkToken, setLinkToken] = useState<string | null>(null);

  useEffect(() => {
    async function createLinkToken() {
      const response = await axios.post(
        'http://localhost:8000/api/v1/plaid/link/token/create',
        { country_codes: ['US'], language: 'en' },
        { headers: { 'X-User-Id': 'test-user' } }
      );
      setLinkToken(response.data.link_token);
    }
    createLinkToken();
  }, []);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (publicToken) => {
      await axios.post(
        'http://localhost:8000/api/v1/plaid/link/token/exchange',
        { public_token: publicToken },
        { headers: { 'X-User-Id': 'test-user' } }
      );
      alert('Account linked successfully!');
    },
  });

  return (
    <button onClick={() => open()} disabled={!ready}>
      Connect Bank Account
    </button>
  );
}
```

## 🐛 Known Issues

1. **Migration Conflict**: The auto-generated migration tries to alter existing budget/recurring transaction tables. Use manual SQL or create a simplified migration.

2. **Test Database**: The test database `wealthnavigator_test` needs to be created manually before running tests.

3. **Plaid Credentials**: You need real Plaid sandbox credentials to test the integration.

## 📚 API Endpoints Available

- `POST /api/v1/plaid/link/token/create` - Create Link token
- `POST /api/v1/plaid/link/token/exchange` - Exchange public token
- `GET /api/v1/plaid/items` - List connected institutions
- `DELETE /api/v1/plaid/items/{item_id}` - Unlink institution
- `GET /api/v1/plaid/accounts` - List accounts
- `POST /api/v1/plaid/accounts/sync` - Sync account balances
- `POST /api/v1/plaid/transactions/sync` - Sync transactions
- `POST /api/v1/plaid/transactions/list` - List transactions with filters
- `PATCH /api/v1/plaid/transactions/{id}` - Update transaction
- `POST /api/v1/plaid/holdings/sync` - Sync investment holdings
- `GET /api/v1/plaid/holdings` - List holdings
- `POST /api/v1/plaid/webhook` - Handle Plaid webhooks

## 🎯 Testing with Plaid Sandbox

Use these test credentials in Plaid Link:
- Username: `user_good`
- Password: `pass_good`
- MFA: `1234`

## 🚀 Production Checklist

Before deploying to production:

- [ ] Encrypt access tokens in database
- [ ] Verify webhook signatures
- [ ] Set up HTTPS
- [ ] Implement rate limiting
- [ ] Add background jobs for sync
- [ ] Set up monitoring
- [ ] Add error tracking
- [ ] Review security headers
- [ ] Test with production Plaid environment
- [ ] Document data retention policies

## 📖 References

- [Plaid API Documentation](https://plaid.com/docs/)
- [Plaid Dashboard](https://dashboard.plaid.com/)
- [React Plaid Link](https://github.com/plaid/react-plaid-link)
- [Plaid Sandbox Testing](https://plaid.com/docs/sandbox/test-credentials/)
