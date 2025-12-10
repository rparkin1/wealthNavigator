# Import/Export Guide: Account & Holding Relationships

## Overview

The Portfolio Data Manager uses a **relational model** where Holdings reference Accounts via `account_id`. This guide explains how to properly import/export data while maintaining referential integrity.

---

## Account & Holding Relationship

### Data Model

```typescript
interface Account {
  id: string;              // Unique identifier (UUID)
  name: string;
  accountType: string;
  institution: string;
  // ... other fields
}

interface Holding {
  id: string;              // Unique identifier (UUID)
  accountId: string;       // Foreign key → Account.id
  ticker: string;
  shares: number;
  // ... other fields
}
```

### Relationship Diagram

```
┌─────────────────┐         ┌─────────────────┐
│    Account      │         │    Holding      │
├─────────────────┤         ├─────────────────┤
│ id: "account-123"│ ←──────┤ accountId: "account-123"│
│ name: "401(k)"  │         │ ticker: "SPY"   │
│ type: "tax_def" │         │ shares: 100     │
└─────────────────┘         └─────────────────┘
```

---

## Export Process

### Step 1: Export Accounts

When you export accounts, the CSV includes the **account ID**:

**accounts_export_2024-12-02.csv**
```csv
id,name,account_type,institution,account_number,balance,opened,notes
account-123,My 401(k),tax_deferred,Vanguard,1234,150000,2018-03-15,Employer match
account-456,Roth IRA,tax_exempt,Fidelity,5678,45000,2020-01-01,
account-789,Brokerage,taxable,Schwab,9012,75000,2019-06-15,General investing
```

✅ **Each account has a persistent ID**

### Step 2: Export Holdings

When you export holdings, the CSV includes the **account_id** foreign key:

**holdings_export_2024-12-02.csv**
```csv
ticker,name,security_type,shares,cost_basis,current_value,purchase_date,account_id,asset_class,expense_ratio
SPY,SPDR S&P 500,etf,100,45000,47000,2024-01-15,account-123,US_LargeCap,0.0945
AAPL,Apple Inc.,stock,50,9500,10200,2024-01-15,account-123,US_Technology,
VTI,Vanguard Total,etf,150,30000,32000,2023-06-01,account-456,US_LargeCap,0.03
```

✅ **Each holding references its account via account_id**

---

## Import Process

### ✅ Correct Order: Accounts First, Then Holdings

#### Step 1: Import Accounts

The system will:
1. Read the `id` column from the CSV
2. Use the provided ID (if present) or generate a new UUID
3. Create accounts with those IDs

```javascript
// PortfolioDataManager behavior
const newAccounts = data.map(item => ({
  ...item,
  id: item.id || crypto.randomUUID(), // Use CSV ID if provided
}));
```

#### Step 2: Import Holdings

The system will:
1. Validate that each `account_id` matches an existing account
2. Warn if any holdings reference non-existent accounts
3. Map `account_id` to `accountId` property

```javascript
// Validation logic
const accountIds = new Set(accounts.map(a => a.id));
const orphanedHoldings = holdings.filter(h => !accountIds.has(h.account_id));

if (orphanedHoldings.length > 0) {
  // Show warning dialog
}
```

**Warning Example:**
```
⚠️ Warning: 3 holding(s) reference non-existent accounts:

SPY (account_id: account-999)
AAPL (account_id: account-888)
TSLA (account_id: account-777)

These holdings will be imported but won't be linked to any account.

Import accounts first, then import holdings. Continue anyway?
```

---

## Common Import Scenarios

### Scenario 1: Fresh Import (No Existing Data)

**Steps:**
1. Import accounts CSV (with `id` column)
2. Import holdings CSV (with matching `account_id` values)
3. ✅ All holdings properly linked

### Scenario 2: Adding Holdings to Existing Accounts

**Steps:**
1. Export accounts to get current IDs
2. Create holdings CSV using those account IDs
3. Import holdings CSV
4. ✅ New holdings linked to existing accounts

### Scenario 3: Migrating from Another System

**Option A: Use your existing IDs**
```csv
id,name,account_type,institution,...
my-legacy-id-1,401(k),tax_deferred,Vanguard,...
my-legacy-id-2,IRA,tax_exempt,Fidelity,...
```
✅ Maintains your ID structure

**Option B: Let system generate new IDs**
```csv
name,account_type,institution,...
401(k),tax_deferred,Vanguard,...
IRA,tax_exempt,Fidelity,...
```
⚠️ You'll need to update holding references afterward

---

## CSV Templates

### Accounts Template

Download from UI: `accounts_template.csv`

```csv
id,name,account_type,institution,account_number,balance,opened,notes
account-123,My 401(k),tax_deferred,Vanguard,1234,150000,2018-03-15,Employer match
account-456,Roth IRA,tax_exempt,Fidelity,5678,45000,2020-01-01,
```

**Fields:**
- `id` (optional): Unique identifier. If omitted, system generates UUID
- `name` (required): Account display name
- `account_type` (required): `taxable`, `tax_deferred`, `tax_exempt`, `depository`, `credit`
- `institution` (required): Financial institution name
- `account_number` (optional): Last 4 digits or account identifier
- `balance` (required): Current account balance in USD
- `opened` (optional): Account opening date (YYYY-MM-DD)
- `notes` (optional): Free-form notes

### Holdings Template

Download from UI: `holdings_template.csv`

```csv
ticker,name,security_type,shares,cost_basis,current_value,purchase_date,account_id,asset_class,expense_ratio
SPY,SPDR S&P 500,etf,100,45000,47000,2024-01-15,account-123,US_LargeCap,0.0945
```

**Fields:**
- `ticker` (required): Security ticker symbol
- `name` (required): Full security name
- `security_type` (required): `stock`, `bond`, `etf`, `mutual_fund`, `other`
- `shares` (required): Number of shares owned
- `cost_basis` (required): Total purchase cost in USD
- `current_value` (required): Current market value in USD
- `purchase_date` (optional): Purchase date (YYYY-MM-DD)
- `account_id` (required): Reference to account ID ⚠️ **Must match an existing account**
- `asset_class` (optional): Asset classification
- `expense_ratio` (optional): Fund expense ratio (decimal, e.g., 0.0945 = 9.45 basis points)

---

## Troubleshooting

### Problem: "Account ID is required" error

**Cause:** Holdings CSV is missing the `account_id` column

**Solution:**
1. Download the holdings template
2. Ensure your CSV includes `account_id` column
3. Populate with valid account IDs

### Problem: Orphaned holdings warning

**Cause:** Holdings reference account IDs that don't exist

**Solutions:**
1. **Import accounts first** with matching IDs
2. Export current accounts to get valid IDs
3. Update holdings CSV with correct account IDs
4. Re-import holdings

### Problem: New random IDs breaking references

**Cause:** Accounts imported without `id` column

**Solution:**
- Always include `id` column in accounts CSV when maintaining relationships
- Export accounts first to see current IDs
- Use those IDs in holdings CSV

---

## Best Practices

### ✅ DO:

1. **Export both accounts and holdings together** when backing up
2. **Import accounts before holdings** in a fresh system
3. **Include ID column** in accounts CSV for consistent references
4. **Validate account IDs** before creating holdings CSV
5. **Use stable IDs** (e.g., "401k-vanguard") for easier management

### ❌ DON'T:

1. Import holdings before accounts
2. Manually edit account IDs after export without updating holdings
3. Mix IDs from different systems without validation
4. Omit `account_id` from holdings CSV

---

## Technical Implementation

### Account Import Logic
```typescript
// frontend/src/components/portfolio/PortfolioDataManager.tsx:367-373
const newAccounts = data.map(item => ({
  ...item,
  id: item.id || crypto.randomUUID(), // Preserve CSV ID or generate new
}));
```

### Holding Import Logic
```typescript
// frontend/src/components/portfolio/PortfolioDataManager.tsx:382-412
const accountIds = new Set(accounts.map(a => a.id));
const orphanedHoldings: string[] = [];

const newHoldings = data.map(item => {
  if (item.account_id && !accountIds.has(item.account_id)) {
    orphanedHoldings.push(`${item.ticker} (account_id: ${item.account_id})`);
  }
  return {
    ...item,
    id: item.id || crypto.randomUUID(),
    accountId: item.account_id, // Map CSV field to interface property
  };
});

// Show warning if orphaned holdings detected
if (orphanedHoldings.length > 0) {
  // Display confirmation dialog
}
```

### Validation Logic
```typescript
// frontend/src/components/portfolio/ImportExportPanel.tsx:128-130
if (!item.account_id || typeof item.account_id !== 'string') {
  errors.push('Account ID is required');
}
```

---

## Summary

**Key Insight:** The `account_id` field in holdings CSV MUST match the `id` field in accounts CSV.

**Import Order:**
```
1. Import Accounts (includes id column)
   ↓
2. Import Holdings (account_id references those IDs)
   ↓
3. ✅ Proper relationships established
```

For questions or issues, refer to the component code:
- `PortfolioDataManager.tsx` - Main data management logic
- `ImportExportPanel.tsx` - CSV import/export functionality
- `AccountForm.tsx` - Account data model
- `HoldingForm.tsx` - Holding data model
