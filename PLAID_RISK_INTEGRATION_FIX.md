# Plaid Data Integration Fix for Risk Management

## Issue Summary
The Risk Management dashboards (Stress Testing and Hedging) were not using Plaid data. They were calling POST endpoints that required manual `portfolio_value` and `allocation` parameters instead of fetching real data from the database.

## Root Cause
The frontend was calling the wrong API endpoints:
- ❌ **Before**: POST endpoints (`/assess-risk`, `/stress-test`, `/hedging-strategies`)
  - Required manual portfolio data as request body parameters
  - Did NOT fetch from database/Plaid

- ✅ **After**: GET endpoints with `-auto` suffix (`/assess-risk-auto`, `/stress-test-auto`, `/hedging-strategies-auto`)
  - Automatically fetch portfolio data from database using `get_portfolio_value_and_allocation()`
  - Data comes from Plaid integration via Holdings table

## Changes Made

### 1. Backend Verification (No Changes Needed)
The backend already had the correct endpoints:
- `GET /api/v1/risk-management/assess-risk-auto` - ✅ Uses Plaid data
- `GET /api/v1/risk-management/stress-test-auto` - ✅ Uses Plaid data
- `GET /api/v1/risk-management/hedging-strategies-auto` - ✅ Uses Plaid data
- `GET /api/v1/diversification/analyze` - ✅ Uses Plaid data

All these endpoints use `get_portfolio_value_and_allocation()` which fetches from:
```python
Portfolio → Account → Holding (Plaid data)
```

### 2. Frontend API Service Updates
**File**: `frontend/src/services/riskManagementApi.ts`

Added new functions for auto endpoints:
```typescript
// Risk Assessment - Auto
export async function assessRiskAuto(
  expectedReturn: number = 0.08,
  volatility: number = 0.15
): Promise<RiskAssessmentResult>

// Stress Testing - Auto
export async function runStressTestAuto(
  scenarios?: string[],
  includeAllPresets: boolean = true
): Promise<StressTestingSuite>

// Hedging - Auto
export async function getHedgingRecommendationsAuto(): Promise<HedgingRecommendation>

// Diversification - Auto
export async function analyzeDiversificationAuto(): Promise<DiversificationAnalysisResult>
```

### 3. Hook Updates
**File**: `frontend/src/hooks/useRiskManagement.ts`

Added new hook methods:
```typescript
interface UseRiskManagementResult {
  assessPortfolioRiskAuto: (expectedReturn?: number, volatility?: number) => Promise<void>;
  performStressTestAuto: (scenarios?: string[], includeAllPresets?: boolean) => Promise<void>;
  fetchHedgingStrategiesAuto: () => Promise<void>;
}
```

## How to Use Auto Endpoints

### Option 1: Update Existing Components
Replace manual data passing with auto calls:

**Before (Manual Data):**
```typescript
const { assessPortfolioRisk, performStressTest, fetchHedgingStrategies } = useRiskManagement();

// Manually pass portfolio data
assessPortfolioRisk({
  portfolio_value: 500000,
  allocation: { ... },
  expected_return: 0.08,
  volatility: 0.15
});
```

**After (Auto with Plaid Data):**
```typescript
const { assessPortfolioRiskAuto, performStressTestAuto, fetchHedgingStrategiesAuto } = useRiskManagement();

// Automatically fetches from Plaid
assessPortfolioRiskAuto(0.08, 0.15);
performStressTestAuto(['2008_financial_crisis', 'recession']);
fetchHedgingStrategiesAuto();
```

### Option 2: Direct API Calls
```typescript
import {
  assessRiskAuto,
  runStressTestAuto,
  getHedgingRecommendationsAuto,
  analyzeDiversificationAuto
} from '@/services/riskManagementApi';

// All of these automatically use Plaid data
const riskResult = await assessRiskAuto();
const stressResult = await runStressTestAuto();
const hedgingResult = await getHedgingRecommendationsAuto();
const diversificationResult = await analyzeDiversificationAuto();
```

## Testing Instructions

### 1. Verify Plaid Data is Available
```bash
# Check that holdings exist in database
curl http://localhost:8000/api/v1/plaid/holdings
```

### 2. Test Auto Endpoints Directly
```bash
# Risk Assessment (should use Plaid holdings)
curl http://localhost:8000/api/v1/risk-management/assess-risk-auto

# Stress Testing (should use Plaid holdings)
curl http://localhost:8000/api/v1/risk-management/stress-test-auto

# Hedging Strategies (should use Plaid holdings)
curl http://localhost:8000/api/v1/risk-management/hedging-strategies-auto

# Diversification (should use Plaid holdings)
curl http://localhost:8000/api/v1/diversification/analyze
```

### 3. Test in Frontend
1. Navigate to Risk Management Dashboard
2. The dashboards should now automatically load data from Plaid
3. Verify that portfolio values match Plaid holdings
4. Check that calculations are based on actual asset allocations

## Data Flow

### Complete Integration Path
```
User → Plaid Link → Plaid API
         ↓
    Plaid Webhook
         ↓
    Backend Sync
         ↓
Portfolio → Account → Holding (Database)
         ↓
get_portfolio_value_and_allocation()
         ↓
Risk Management Services
  - Risk Assessment
  - Stress Testing
  - Hedging
  - Diversification
         ↓
    Frontend Display
```

### Portfolio Data Service
The key function that fetches Plaid data:

```python
# backend/app/services/portfolio_data_service.py
async def get_portfolio_value_and_allocation(
    user_id: str,
    db: AsyncSession
) -> Tuple[float, Dict[str, float]]:
    """
    Fetches portfolio from:
    1. Portfolio table (user's portfolio)
    2. Account table (all accounts)
    3. Holding table (all holdings with Plaid data)

    Returns: (total_value, allocation_dict)
    """
```

## Verification Checklist

- ✅ Backend endpoints verified to use `get_portfolio_value_and_allocation()`
- ✅ Frontend API service has auto functions
- ✅ Hook has auto methods
- ✅ Auto endpoints call GET with no body (use query params)
- ✅ Manual POST endpoints preserved for flexibility
- ⬜ Components updated to use auto methods (NEXT STEP)
- ⬜ Integration tested with real Plaid data (NEXT STEP)

## Next Steps

1. **Update Components**: Modify `RiskDashboard.tsx` and `HedgingStrategies.tsx` to use auto methods
2. **Remove Manual Props**: Components should no longer require `portfolioValue` and `allocation` props
3. **Test with Real Data**: Connect Plaid account and verify calculations match holdings
4. **Error Handling**: Ensure proper error messages when no Plaid data exists

## Benefits

1. **Automatic Data**: No manual data entry required
2. **Always Current**: Uses latest Plaid-synced data
3. **Consistent**: All risk calculations use same data source
4. **Simplified**: Frontend doesn't need to manage portfolio state
5. **Real-Time**: Reflects actual account balances and holdings

## API Endpoint Summary

| Endpoint | Method | Uses Plaid Data | Purpose |
|----------|--------|----------------|---------|
| `/assess-risk` | POST | ❌ | Manual risk assessment |
| `/assess-risk-auto` | GET | ✅ | Auto risk from Plaid |
| `/stress-test` | POST | ❌ | Manual stress test |
| `/stress-test-auto` | GET | ✅ | Auto stress test from Plaid |
| `/hedging-strategies` | POST | ❌ | Manual hedging |
| `/hedging-strategies-auto` | GET | ✅ | Auto hedging from Plaid |
| `/diversification/analyze` (POST) | POST | ❌ | Manual diversification |
| `/diversification/analyze` (GET) | GET | ✅ | Auto diversification from Plaid |

## Notes

- The manual POST endpoints are still available for testing or custom scenarios
- Auto endpoints require user authentication to fetch their portfolio
- If no Plaid data exists, endpoints return 404 with clear error message
- All financial calculations remain the same, only data source changed
