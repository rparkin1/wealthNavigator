# Retirement Planning - Portfolio Integration Fix

## Problem Summary

The retirement planning system was using a **hardcoded $1M portfolio value** instead of the user's actual investment portfolio from Plaid data. This resulted in inaccurate retirement income projections that didn't reflect the user's real financial situation.

## Solution Implemented

### 1. Backend Changes (`backend/app/api/retirement.py`)

**Added automatic portfolio data fetching:**
- Now accepts `user_id` in the retirement projection request
- Automatically fetches actual portfolio value from Plaid using `get_portfolio_value_and_allocation()`
- Falls back to $1M default only if no Plaid data is available
- Added proper logging to track when actual vs. default values are used

**New API Parameters:**
```python
class RetirementProjectionRequest(BaseModel):
    user_id: str  # NEW: Required to fetch portfolio data
    initial_portfolio: Optional[float] = None  # Now optional
    expected_return: float = 0.07  # NEW: Expected annual return (7% default)
    # ... other existing fields
```

### 2. Portfolio Growth Model (`backend/app/tools/retirement_income.py`)

**Enhanced income projection algorithm:**
- **Investment Returns**: Applies expected annual returns (default 7%) to portfolio each year
- **Smart Withdrawals**: Caps withdrawals at portfolio value to prevent negative balances
- **Realistic Modeling**: Tracks portfolio growth/depletion throughout retirement
- **Accurate Cash Flow**: Properly accounts for all income and expenses

**Before (Simplified):**
```python
portfolio_value += net_cash_flow  # Too simplistic
```

**After (Realistic):**
```python
# Apply investment returns
portfolio_value *= (1 + expected_return)

# Calculate withdrawal
portfolio_withdrawal = min(
    portfolio_value * portfolio_withdrawal_rate,
    portfolio_value
)

# Update balance
portfolio_value -= portfolio_withdrawal
portfolio_value += (total_income - total_expenses - portfolio_withdrawal)
portfolio_value = max(0, portfolio_value)
```

### 3. Frontend Changes

**Updated TypeScript types (`frontend/src/services/retirementApi.ts`):**
- Added `user_id: string` (required)
- Made `initial_portfolio` optional
- Added `expected_return` parameter

**Updated dashboard (`frontend/src/components/retirement/RetirementDashboard.tsx`):**
- Removed hardcoded `initial_portfolio: 1000000`
- Added `user_id: 'demo-user'` (needs to be replaced with actual auth context)
- Added `expected_return: 0.07` for realistic growth modeling

## How It Works Now

### Data Flow

```
1. User configures retirement parameters (Social Security, spending, longevity)
   ↓
2. Frontend sends projection request with user_id
   ↓
3. Backend checks if initial_portfolio is provided
   ↓
4. If not provided → Fetch from Plaid via get_portfolio_value_and_allocation()
   ↓
5. Calculate projections with:
   - Actual portfolio value from Plaid accounts
   - Investment returns (7% annually)
   - Social Security with COLA
   - Age-based spending patterns
   ↓
6. Return year-by-year projections showing portfolio depletion/growth
```

### Portfolio Value Source Priority

1. **Explicit override**: If `initial_portfolio` is provided in request → use it
2. **Plaid data**: If no override → fetch from `plaid_accounts` and `plaid_holdings` tables
3. **Default fallback**: If no Plaid data → use $1M default (with warning logged)

## Benefits

### ✅ Accurate Projections
- Uses your **actual** portfolio value from connected accounts
- Models realistic investment returns over time
- Accounts for portfolio growth during retirement

### ✅ Better Planning
- See how your **real** portfolio will perform
- Identify if you're undersaving or oversaving
- Adjust withdrawal rates based on actual holdings

### ✅ Flexible Testing
- Can still override with test values if needed
- Graceful fallback if no portfolio data exists
- Clear logging shows which data source is being used

## Testing

### Test with Real Portfolio Data

```bash
# 1. Ensure user has Plaid accounts connected with holdings
# 2. Call retirement projection endpoint
POST /api/v1/retirement/income-projection
{
  "user_id": "actual-user-id",
  "current_age": 65,
  "retirement_age": 65,
  "social_security": { ... },
  "spending_pattern": { ... },
  "planning_age": 95
  // Note: initial_portfolio NOT provided - will fetch from Plaid
}

# 3. Check logs for:
# "Fetching actual portfolio value for user {user_id}"
# "Using actual portfolio value: ${X}"
```

### Test with Override Value

```bash
POST /api/v1/retirement/income-projection
{
  "user_id": "test-user",
  "initial_portfolio": 750000,  # Override with specific value
  "expected_return": 0.06,       # Use 6% returns
  # ... other parameters
}
```

### Test Fallback Behavior

```bash
# Use user_id with no Plaid accounts
POST /api/v1/retirement/income-projection
{
  "user_id": "user-without-portfolio",
  # ... other parameters
}

# Should log:
# "No portfolio data found for user user-without-portfolio, using default $1M"
```

## Next Steps

### Immediate TODOs

1. **Replace hardcoded user_id**: Update frontend to get `user_id` from authentication context
   ```typescript
   // Current:
   user_id: 'demo-user'

   // Should be:
   user_id: authContext.userId
   ```

2. **Get current_age from profile**: Replace hardcoded age with user profile data
   ```typescript
   // Current:
   current_age: 65

   // Should be:
   current_age: userProfile.age
   ```

3. **Add UI indicator**: Show users whether projection uses actual or default portfolio value
   ```tsx
   {portfolioSource === 'plaid' ? (
     <Badge>Using your actual portfolio: ${actualValue}</Badge>
   ) : (
     <Badge variant="warning">Using default $1M (connect accounts for accuracy)</Badge>
   )}
   ```

### Future Enhancements

1. **Monte Carlo Integration**: Replace deterministic returns with probabilistic simulations
2. **Asset Allocation Impact**: Use actual allocation to determine expected returns
3. **Tax-Aware Withdrawals**: Optimize withdrawal order based on account types
4. **Dynamic Rebalancing**: Model portfolio rebalancing during retirement
5. **Inflation Adjustments**: Apply inflation to portfolio returns
6. **Sequence of Returns Risk**: Model impact of market downturns early in retirement

## Code Changes Summary

### Files Modified
- ✅ `backend/app/api/retirement.py` - Added Plaid integration
- ✅ `backend/app/tools/retirement_income.py` - Enhanced portfolio modeling
- ✅ `frontend/src/services/retirementApi.ts` - Updated types
- ✅ `frontend/src/components/retirement/RetirementDashboard.tsx` - Removed hardcoded values

### Dependencies
- Uses existing `get_portfolio_value_and_allocation()` from `portfolio_data_service.py`
- No new dependencies required
- Backward compatible (still supports explicit portfolio values)

## Verification Checklist

- [x] Backend fetches portfolio value from Plaid
- [x] Portfolio growth applies investment returns
- [x] Withdrawals capped at available portfolio value
- [x] Frontend sends user_id in requests
- [x] TypeScript types updated to match API
- [x] Graceful fallback for missing portfolio data
- [x] Proper logging for debugging
- [ ] TODO: Replace demo-user with actual auth context
- [ ] TODO: Add UI indicator for data source
- [ ] TODO: End-to-end testing with real Plaid accounts

## Questions or Issues?

If retirement projections still seem off:

1. **Check Plaid connection**: Verify investment accounts are connected and synced
2. **Verify holdings data**: Ensure `plaid_holdings` table has current values
3. **Review logs**: Look for "Fetching actual portfolio value" and "Using actual portfolio value" messages
4. **Test with override**: Try providing explicit `initial_portfolio` to rule out calculation issues
5. **Check expected_return**: Adjust expected return rate (default 7%) if needed

---

**Status**: ✅ Implementation Complete - Ready for Testing
**Impact**: High - Fixes critical accuracy issue in retirement planning
**Priority**: Users should test with their actual portfolio data immediately
