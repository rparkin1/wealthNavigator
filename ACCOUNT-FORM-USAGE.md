# AccountForm - Usage Guide

**Component**: AccountForm
**Location**: `frontend/src/components/portfolio/AccountForm.tsx`
**Status**: ✅ **READY TO USE**
**Size**: 474 lines

---

## Quick Start

### 1. Import the Component

```typescript
import { AccountForm } from '@/components/portfolio';
import type { Account } from '@/components/portfolio';
```

### 2. Add State Management

```typescript
import { useState } from 'react';

function PortfolioDashboard() {
  // Modal visibility
  const [showAccountForm, setShowAccountForm] = useState(false);

  // Edit mode
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Accounts data
  const [accounts, setAccounts] = useState<Account[]>([]);

  // ... handlers below
}
```

### 3. Implement Handlers

```typescript
// Create new account
const handleCreateAccount = async (accountData: Partial<Account>) => {
  try {
    const response = await fetch('/api/v1/portfolio/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(accountData),
    });

    if (!response.ok) throw new Error('Failed to create account');

    const newAccount = await response.json();
    setAccounts([...accounts, newAccount]);
    setShowAccountForm(false);

    // Show success message
    alert('Account created successfully!');
  } catch (error) {
    console.error('Error creating account:', error);
    alert('Failed to create account');
  }
};

// Update existing account
const handleUpdateAccount = async (accountData: Partial<Account>) => {
  try {
    const response = await fetch(`/api/v1/portfolio/accounts/${accountData.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(accountData),
    });

    if (!response.ok) throw new Error('Failed to update account');

    const updatedAccount = await response.json();
    setAccounts(accounts.map(a => a.id === updatedAccount.id ? updatedAccount : a));
    setShowAccountForm(false);
    setEditingAccount(null);

    alert('Account updated successfully!');
  } catch (error) {
    console.error('Error updating account:', error);
    alert('Failed to update account');
  }
};
```

### 4. Render the Form

```typescript
return (
  <div className="p-6">
    {/* Header with Add Button */}
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">My Accounts</h1>
      <button
        onClick={() => setShowAccountForm(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        + Add Account
      </button>
    </div>

    {/* Accounts List */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {accounts.map(account => (
        <div key={account.id} className="border rounded-lg p-4">
          <h3 className="font-semibold">{account.name}</h3>
          <p className="text-sm text-gray-600">{account.institution}</p>
          <p className="text-lg font-bold mt-2">
            ${account.balance.toLocaleString()}
          </p>
          <button
            onClick={() => {
              setEditingAccount(account);
              setShowAccountForm(true);
            }}
            className="mt-2 text-blue-600 hover:text-blue-700"
          >
            Edit
          </button>
        </div>
      ))}
    </div>

    {/* Account Form Modal */}
    {showAccountForm && (
      <AccountForm
        account={editingAccount}
        onSubmit={editingAccount ? handleUpdateAccount : handleCreateAccount}
        onCancel={() => {
          setShowAccountForm(false);
          setEditingAccount(null);
        }}
        mode={editingAccount ? 'edit' : 'create'}
      />
    )}
  </div>
);
```

---

## Component Features

### Account Types Supported

| Type | Icon | Examples | Use Case |
|------|------|----------|----------|
| **Taxable** | 💼 | Brokerage, Individual, Joint | Regular investment accounts |
| **Tax-Deferred** | 🏦 | 401(k), Traditional IRA, 403(b) | Pre-tax retirement accounts |
| **Tax-Exempt** | 🌟 | Roth IRA, Roth 401(k) | After-tax retirement accounts |
| **Depository** | 🏛️ | Checking, Savings, CD | Bank accounts |
| **Credit/Debt** | 💳 | Credit cards, Mortgages, Loans | Debt tracking |

### Popular Institutions Included

Pre-populated dropdown with 15+ institutions:
- Vanguard
- Fidelity
- Charles Schwab
- TD Ameritrade
- E*TRADE
- Merrill Edge
- Interactive Brokers
- Robinhood
- Betterment
- Wealthfront
- Bank of America
- Chase
- Wells Fargo
- Ally Bank
- Marcus by Goldman Sachs
- Other (custom entry)

### Form Fields

**Required Fields**:
- Account Name (e.g., "My 401(k)")
- Account Type (5 options)
- Institution (dropdown or custom)
- Current Balance ($)

**Optional Fields**:
- Account Number (last 4 digits)
- Date Opened
- Notes (free text)

### Validation Rules

- ✅ Account name: 1-100 characters, required
- ✅ Institution: Required, non-empty
- ✅ Balance: Valid number (negative allowed for credit accounts only)
- ✅ Account number: At least 4 digits if provided
- ✅ Date opened: Cannot be in future

---

## API Integration

### Required Backend Endpoint

**POST /api/v1/portfolio/accounts**

Create a new account:

```python
from fastapi import APIRouter, HTTPException, Depends
from app.models import Account, AccountCreate
from app.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/portfolio", tags=["portfolio"])

@router.post("/accounts", response_model=Account)
async def create_account(
    account: AccountCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Create a new investment account."""

    db_account = Account(
        user_id=user_id,
        name=account.name,
        account_type=account.account_type,
        institution=account.institution,
        account_number=account.account_number,
        balance=account.balance,
        opened=account.opened,
        notes=account.notes
    )

    db.add(db_account)
    await db.commit()
    await db.refresh(db_account)

    return db_account
```

### Database Schema

```sql
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    account_type VARCHAR(20) NOT NULL, -- taxable, tax_deferred, tax_exempt, depository, credit
    institution VARCHAR(100) NOT NULL,
    account_number VARCHAR(50),
    balance DECIMAL(18,2) NOT NULL,
    opened DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_type ON accounts(account_type);
```

### Pydantic Models

```python
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date
from enum import Enum

class AccountType(str, Enum):
    TAXABLE = "taxable"
    TAX_DEFERRED = "tax_deferred"
    TAX_EXEMPT = "tax_exempt"
    DEPOSITORY = "depository"
    CREDIT = "credit"

class AccountCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    account_type: AccountType
    institution: str = Field(..., min_length=1)
    account_number: Optional[str] = None
    balance: float
    opened: Optional[date] = None
    notes: Optional[str] = None

class Account(AccountCreate):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
```

---

## Usage Examples

### Example 1: Creating a 401(k) Account

**User Input**:
- Account Type: Tax-Deferred 🏦
- Name: "Company 401(k)"
- Institution: Vanguard
- Balance: $150,000
- Opened: 2018-03-15
- Notes: "Employer matches 6%"

**Submitted Data**:
```json
{
  "name": "Company 401(k)",
  "accountType": "tax_deferred",
  "institution": "Vanguard",
  "balance": 150000,
  "opened": "2018-03-15",
  "notes": "Employer matches 6%"
}
```

**API Response**:
```json
{
  "id": "account-uuid-123",
  "user_id": "user-uuid-456",
  "name": "Company 401(k)",
  "accountType": "tax_deferred",
  "institution": "Vanguard",
  "accountNumber": null,
  "balance": 150000,
  "opened": "2018-03-15",
  "notes": "Employer matches 6%",
  "created_at": "2025-10-29T22:30:00Z",
  "updated_at": "2025-10-29T22:30:00Z"
}
```

### Example 2: Creating a Roth IRA

**User Input**:
- Account Type: Tax-Exempt 🌟
- Name: "Roth IRA"
- Institution: Fidelity
- Balance: $45,000
- Account Number: "...7890"

**Result**: Account created with tax-free growth benefits highlighted

### Example 3: Tracking Credit Card Debt

**User Input**:
- Account Type: Credit/Debt 💳
- Name: "Chase Sapphire Card"
- Institution: Chase
- Balance: 5000 (negative allowed for credit type)

**Result**: Debt tracking account created

---

## Advanced Integration

### With React Query

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Fetch accounts
const { data: accounts } = useQuery({
  queryKey: ['accounts'],
  queryFn: async () => {
    const response = await fetch('/api/v1/portfolio/accounts');
    return response.json();
  }
});

// Create account mutation
const queryClient = useQueryClient();
const createAccount = useMutation({
  mutationFn: async (accountData: Partial<Account>) => {
    const response = await fetch('/api/v1/portfolio/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(accountData),
    });
    return response.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
    setShowAccountForm(false);
  }
});
```

### With Toast Notifications

```typescript
import { toast } from 'react-hot-toast';

const handleCreateAccount = async (accountData: Partial<Account>) => {
  try {
    await createAccount.mutateAsync(accountData);
    toast.success('Account created successfully!');
  } catch (error) {
    toast.error('Failed to create account');
  }
};
```

---

## Component Props Reference

```typescript
interface AccountFormProps {
  account?: Account | null;           // Existing account (for edit mode)
  onSubmit: (data: Partial<Account>) => void;  // Submit callback
  onCancel: () => void;               // Cancel callback
  mode?: 'create' | 'edit';           // Form mode (default: 'create')
}
```

---

## Keyboard Shortcuts

The form automatically responds to:
- **Escape**: Close form
- **Enter**: Submit form (when all required fields valid)

Optional: Add custom shortcuts in parent component:

```typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      setShowAccountForm(true);
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, []);
```

---

## Testing

### Unit Test Example

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AccountForm } from './AccountForm';

describe('AccountForm', () => {
  it('creates a new account', async () => {
    const onSubmit = jest.fn();
    const onCancel = jest.fn();

    render(<AccountForm onSubmit={onSubmit} onCancel={onCancel} />);

    // Fill in form
    fireEvent.change(screen.getByLabelText(/Account Name/i), {
      target: { value: 'Test Account' }
    });

    fireEvent.click(screen.getByText(/Taxable/i));

    fireEvent.change(screen.getByLabelText(/Institution/i), {
      target: { value: 'Vanguard' }
    });

    fireEvent.change(screen.getByLabelText(/Current Balance/i), {
      target: { value: '10000' }
    });

    // Submit
    fireEvent.click(screen.getByText(/Create Account/i));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Test Account',
        accountType: 'taxable',
        institution: 'Vanguard',
        balance: 10000
      });
    });
  });
});
```

---

## Summary

✅ **AccountForm is ready to use immediately**

**Key Features**:
- 5 account types with visual selection
- 15+ pre-populated institutions
- Comprehensive validation
- Tax benefits information
- Edit mode support
- Professional UI/UX

**Next Steps**:
1. Create backend API endpoint
2. Add database table
3. Integrate form into dashboard
4. Test end-to-end flow

**Questions?** See FORMS-IMPLEMENTATION-GUIDE.md for more details.
