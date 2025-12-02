# CSV Template Reference - Quick Guide

## 🏦 Accounts Template

**Filename:** `accounts_template.csv`

**Required Fields:**
- `id` - Account unique identifier (e.g., "account-123")
- `name` - Account name (e.g., "My 401(k)")
- `account_type` - One of: `taxable`, `tax_deferred`, `tax_exempt`, `depository`, `credit`
- `institution` - Bank/broker name (e.g., "Vanguard")
- `balance` - Current balance in USD

**Optional Fields:**
- `account_number` - Account number (last 4 digits)
- `opened` - Opening date (YYYY-MM-DD)
- `notes` - Free-form notes

**Example:**
```csv
id,name,account_type,institution,account_number,balance,opened,notes
account-123,My 401(k),tax_deferred,Vanguard,1234,150000,2018-03-15,Employer matches 6%
account-456,Roth IRA,tax_exempt,Fidelity,5678,45000,2020-01-01,
```

---

## 📈 Holdings Template

**Filename:** `holdings_template.csv`

**Required Fields:**
- `ticker` - Stock/fund symbol (e.g., "SPY", "AAPL")
- `name` - Full security name (e.g., "SPDR S&P 500 ETF")
- `security_type` - One of: `stock`, `bond`, `etf`, `mutual_fund`, `other`
- `shares` - Number of shares owned
- `cost_basis` - Total purchase cost in USD
- `current_value` - Current market value in USD
- `account_id` - **MUST match an account's `id`** (e.g., "account-123")

**Optional Fields:**
- `purchase_date` - Purchase date (YYYY-MM-DD)
- `asset_class` - Asset classification (e.g., "US_LargeCap")
- `expense_ratio` - Fund expense ratio (decimal, e.g., 0.0945)

**Example:**
```csv
ticker,name,security_type,shares,cost_basis,current_value,purchase_date,account_id,asset_class,expense_ratio
SPY,SPDR S&P 500 ETF,etf,100,45000,47000,2024-01-15,account-123,US_LargeCap,0.0945
AAPL,Apple Inc.,stock,50,9500,10200,2024-01-15,account-123,US_Technology,
```

---

## ⚠️ Common Mistakes

### ❌ DON'T Mix Templates!

**WRONG:** Adding account fields to holdings CSV
```csv
ticker,name,account_type,institution,shares,account_id
SPY,SPDR S&P 500,tax_deferred,Vanguard,100,account-123
```
❌ Holdings don't have `account_type` or `institution` fields!

**CORRECT:** Keep templates separate
```csv
ticker,name,security_type,shares,cost_basis,current_value,account_id
SPY,SPDR S&P 500 ETF,etf,100,45000,47000,account-123
```
✅ Only holdings fields

### ❌ DON'T Use Wrong Column Names!

**WRONG:** Using spaces or different names
```csv
Ticker,Security Name,Account Type,Number of Shares
SPY,SPDR S&P 500,tax_deferred,100
```
❌ Column names must match exactly!

**CORRECT:** Use exact template headers
```csv
ticker,name,security_type,shares,cost_basis,current_value,account_id
SPY,SPDR S&P 500 ETF,etf,100,45000,47000,account-123
```
✅ Exact column names from template

---

## 🔍 Field Comparison

| Field | Accounts | Holdings | Notes |
|-------|----------|----------|-------|
| `id` | ✅ Required | ❌ Not used | Account identifier |
| `account_id` | ❌ Not used | ✅ Required | References account's `id` |
| `name` | ✅ Required | ✅ Required | Different meanings! |
| `account_type` | ✅ Required | ❌ Not used | Only for accounts |
| `institution` | ✅ Required | ❌ Not used | Only for accounts |
| `ticker` | ❌ Not used | ✅ Required | Only for holdings |
| `security_type` | ❌ Not used | ✅ Required | Only for holdings |
| `shares` | ❌ Not used | ✅ Required | Only for holdings |

---

## 📋 Quick Troubleshooting

### Error: "Account type is required"

**Cause:** You're trying to import a holdings CSV using the accounts import

**Solution:**
1. Make sure you're using the Holdings import panel (not Accounts)
2. Download the correct template: `holdings_template.csv`
3. Verify your CSV matches the holdings template structure

### Error: "Institution is required"

**Cause:** Same as above - wrong template for wrong import type

**Solution:** Use the correct import panel for your data type

### Error: "Account ID is required"

**Cause:** Your holdings CSV is missing the `account_id` column

**Solution:**
1. Add `account_id` column to your CSV
2. Fill it with valid account IDs from your accounts export
3. Make sure accounts are imported first!

---

## 💡 Pro Tips

1. **Always download the template** - Don't try to create CSVs from memory
2. **Keep column names exact** - Case-sensitive, no spaces for underscores
3. **Import accounts first** - Holdings need accounts to reference
4. **Verify IDs match** - Holdings' `account_id` must match Accounts' `id`
5. **Check the UI** - The import panel shows which template it expects

---

## 🎯 Import Order Checklist

- [ ] 1. Download `accounts_template.csv`
- [ ] 2. Fill in account data (include `id` column!)
- [ ] 3. Import accounts CSV
- [ ] 4. Download `holdings_template.csv`
- [ ] 5. Fill in holdings data (use account IDs from step 3)
- [ ] 6. Import holdings CSV
- [ ] 7. ✅ Verify relationships in the UI

---

For detailed information, see `IMPORT_EXPORT_GUIDE.md`
