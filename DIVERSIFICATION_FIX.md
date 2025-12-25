# Diversification Analysis Plaid Data Fix

## Problem
The diversification analysis in the Risk Analysis page was showing "No portfolio data" even though portfolio data was being used in other pages (Risk Assessment, Stress Testing).

## Root Cause
The RiskDashboard component was manually constructing holdings from the `allocation` prop:
```typescript
holdings={Object.entries(allocation || {}).map(([assetClass, weight]) => ({ ... }))}
```

When `usePlaidData` was true, the `allocation` prop was undefined or empty, resulting in an empty holdings array and the "No Holdings Data" message.

The Risk Assessment tab worked because it used `assessPortfolioRiskAuto()` to automatically fetch Plaid data, but the Diversification tab didn't have this capability.

## Solution

### 1. Added Auto-Fetch Function to API Service
**File:** `frontend/src/services/diversificationApi.ts`

Added a new function `analyzeDiversificationAuto()` that calls the existing backend GET endpoint at `/api/v1/diversification/analyze` which automatically fetches holdings from Plaid/database:

```typescript
export async function analyzeDiversificationAuto(): Promise<DiversificationAnalysisResult> {
  const response = await fetch(`${API_BASE_URL}${BASE_PATH}/analyze`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  // ... error handling
  return await response.json();
}
```

This follows the same pattern as `assessRiskAuto()` in the risk management API.

### 2. Updated DiversificationAnalysisDashboard Component
**File:** `frontend/src/components/risk/DiversificationAnalysisDashboard.tsx`

Added:
- New prop `usePlaidData?: boolean` to control data source
- Made `portfolioValue` and `holdings` props optional
- New function `runAnalysisAuto()` to call the auto-fetch API
- Updated `useEffect` to call `runAnalysisAuto()` when `usePlaidData` is true
- Updated button click handlers to use the appropriate function
- Fixed empty state to only show when not using Plaid data

### 3. Updated RiskDashboard Component
**File:** `frontend/src/components/risk/RiskDashboard.tsx`

Updated the diversification tab to:
- Pass `usePlaidData` prop to DiversificationAnalysisDashboard
- Only pass manual holdings when NOT using Plaid data:
  ```typescript
  holdings={usePlaidData ? undefined : Object.entries(allocation || {}).map(...)}
  ```

## Backend Endpoint Update
The backend endpoint at `/api/v1/diversification/analyze` (GET) was updated to:
1. Fetch holdings from **Plaid** (not old database tables) using `get_holdings_details()`
2. Calculate portfolio value and weights from Plaid data
3. Convert to HoldingInfo format for analysis
4. Perform diversification analysis
5. Return comprehensive results

**Changes Made:**
- Replaced database queries (Portfolio, Account, Holding tables) with Plaid service
- Now uses `portfolio_data_service.get_holdings_details()` to fetch from PlaidAccount and PlaidHolding tables
- Matches the pattern used by risk_management endpoint's `assess-risk-auto`
- Properly handles cases where user has no Plaid data connected

**File:** `backend/app/api/v1/endpoints/diversification.py` (lines 56-122)

## Testing
1. Navigate to Risk Analysis page → Diversification tab
2. With Plaid data connected, the analysis should now automatically fetch holdings
3. The "Run Analysis" button should work without showing "No Holdings Data"
4. Results should display properly with portfolio metrics, concentration risks, and recommendations

## Files Changed
1. `frontend/src/services/diversificationApi.ts` - Added `analyzeDiversificationAuto()` function
2. `frontend/src/components/risk/DiversificationAnalysisDashboard.tsx` - Added Plaid data support
3. `frontend/src/components/risk/RiskDashboard.tsx` - Pass `usePlaidData` prop
4. `backend/app/api/v1/endpoints/diversification.py` - Updated to fetch from Plaid tables instead of old database tables

## Benefits
- Consistent behavior across all Risk Analysis tabs
- Automatic data fetching from Plaid when available
- Backward compatible with manual data entry
- Follows established pattern from risk assessment functionality
