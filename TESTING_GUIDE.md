# Retirement Portfolio Integration - Testing Guide

## Quick Start Testing

### Prerequisites
- Backend running on `http://localhost:8000`
- Frontend running on `http://localhost:5173` (or configured port)
- PostgreSQL database with Plaid tables

## Test Scenarios

### Scenario A: User with Connected Plaid Accounts ✅

**Setup:**
```javascript
// Open browser console and run:
localStorage.setItem('user_id', 'test-user-123');
localStorage.setItem('user_profile', JSON.stringify({
  age: 58,
  birthYear: 1967,
  retirementAge: 65,
  gender: 'male'
}));

// Refresh page
```

**Steps:**
1. Navigate to Retirement Dashboard
2. Go to "Social Security" tab
   - Enter PIA: `$3,000`
   - Birth year: `1967`
   - Filing age: `67`
   - Click "Calculate Benefits"

3. Go to "Spending Plan" tab
   - Base annual spending: `$80,000`
   - Keep default multipliers
   - Healthcare annual: `$15,000`
   - Click "Update Pattern"

4. Go to "Life Expectancy" tab
   - Current age: `58` (should auto-fill)
   - Gender: `male`
   - Health status: `good`
   - Planning age: `95`
   - Click "Calculate"

5. Go to "Income Projection" tab

**Expected Results:**
- ✅ **Green banner appears** with text "Using Your Actual Portfolio"
- Shows actual portfolio value from Plaid (e.g., "$543,210")
- Shows number of connected accounts (e.g., "Fetched from 3 connected Plaid accounts")
- Shows expected return: "Expected Return: 7.0% annually"
- Projections use actual portfolio value (verify in chart/table)

**Backend Logs:**
```
INFO: Fetching actual portfolio value for user test-user-123
INFO: Using actual portfolio value from Plaid: $543,210.00
```

---

### Scenario B: User Without Portfolio Data ⚠️

**Setup:**
```javascript
localStorage.setItem('user_id', 'user-no-portfolio');
localStorage.setItem('user_profile', JSON.stringify({
  age: 65,
  retirementAge: 65
}));
// Refresh page
```

**Steps:**
1. Complete all retirement configuration tabs (same as Scenario A)
2. View "Income Projection" tab

**Expected Results:**
- ⚠️ **Yellow banner appears** with text "Using Default Portfolio Value"
- Shows: "Using default: $1,000,000"
- Shows warning: "💡 Connect your investment accounts for accurate projections"
- Shows: "Expected Return: 7.0% annually"
- Projections use $1M default

**Backend Logs:**
```
INFO: Fetching actual portfolio value for user user-no-portfolio
WARNING: No portfolio data found for user user-no-portfolio, using default $1M
```

---

### Scenario C: Override Portfolio Value ℹ️

**API Test:**
```bash
curl -X POST http://localhost:8000/api/v1/retirement/income-projection \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-user",
    "current_age": 65,
    "retirement_age": 65,
    "initial_portfolio": 750000,
    "expected_return": 0.06,
    "social_security": {
      "primary_insurance_amount": 3000,
      "birth_year": 1960,
      "filing_age": 67,
      "cola_rate": 0.025
    },
    "spending_pattern": {
      "base_annual_spending": 80000,
      "go_go_multiplier": 1.0,
      "slow_go_multiplier": 0.85,
      "no_go_multiplier": 0.75,
      "healthcare_annual": 15000,
      "healthcare_growth_rate": 0.06,
      "major_expenses": []
    },
    "planning_age": 95
  }'
```

**Expected Response:**
```json
{
  "projections": [ /* ... */ ],
  "metadata": {
    "portfolio_source": "override",
    "portfolio_value": 750000,
    "expected_return": 0.06,
    "accounts_count": 0,
    "user_id": "test-user"
  }
}
```

---

### Scenario D: Dynamic User Profile Updates

**Test:**
```javascript
// Import and use the updateUserProfile helper
import { updateUserProfile } from './hooks/useUser';

// Update age mid-session
updateUserProfile({ age: 60 });

// Reconfigure and view projections
// Should use age 60 instead of previous value
```

**Expected:**
- User profile updates immediately
- Retirement projections reflect new age
- No page refresh required

---

## Validation Checks

### Frontend Checks

1. **User Hook Working:**
```javascript
// In browser console
const profile = JSON.parse(localStorage.getItem('user_profile'));
console.log(profile);
// Should show: { age: 58, birthYear: 1967, ... }
```

2. **Metadata Received:**
```javascript
// Check network tab for /income-projection response
// Should have "metadata" key with portfolio_source
```

3. **Banner Rendering:**
- Green banner: Plaid data
- Yellow banner: Default data
- Blue banner: Override data
- Each shows appropriate icon and message

### Backend Checks

1. **Portfolio Fetch Working:**
```sql
-- Check Plaid data exists
SELECT
  pa.user_id,
  COUNT(DISTINCT pa.id) as account_count,
  COUNT(ph.id) as holdings_count,
  SUM(ph.institution_value) as total_value
FROM plaid_accounts pa
LEFT JOIN plaid_holdings ph ON ph.account_id = pa.id
WHERE pa.user_id = 'test-user-123'
  AND pa.type = 'investment'
  AND pa.is_active = true
GROUP BY pa.user_id;
```

2. **API Response Structure:**
```bash
# Verify metadata structure
curl http://localhost:8000/api/v1/retirement/income-projection \
  -X POST -H "Content-Type: application/json" \
  -d '{ "user_id": "test", ... }' | jq '.metadata'

# Should return:
# {
#   "portfolio_source": "plaid",
#   "portfolio_value": 543210,
#   "expected_return": 0.07,
#   "accounts_count": 3,
#   "user_id": "test-user-123"
# }
```

---

## Integration Tests

### Test 1: End-to-End Flow with Plaid Data

```bash
# 1. Create test user with Plaid accounts
# 2. Import holdings data
# 3. Set user profile in localStorage
# 4. Complete all retirement configuration
# 5. Verify green banner shows actual portfolio
# 6. Verify projections use actual values
```

**Success Criteria:**
- ✅ No errors in console
- ✅ Green banner displays
- ✅ Portfolio value matches Plaid data
- ✅ Backend logs show "Using actual portfolio value"

### Test 2: Fallback to Default

```bash
# 1. Use user_id with no Plaid accounts
# 2. Complete retirement configuration
# 3. Verify yellow warning banner
# 4. Verify projections use $1M
```

**Success Criteria:**
- ✅ Yellow banner displays
- ✅ Shows $1,000,000 default
- ✅ Warning message appears
- ✅ Backend logs show "using default $1M"

### Test 3: Override Behavior

```bash
# 1. Provide explicit initial_portfolio
# 2. Verify blue info banner
# 3. Verify uses override value
```

**Success Criteria:**
- ✅ Blue banner displays
- ✅ Shows override value
- ✅ Backend logs show "Using override portfolio value"

---

## Performance Tests

### Load Time
- Projection load time: < 3 seconds
- Portfolio fetch time: < 500ms
- Frontend render time: < 100ms

### Monitoring
```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null -s \
  http://localhost:8000/api/v1/retirement/income-projection \
  -X POST -d '{ ... }'

# curl-format.txt:
time_namelookup:  %{time_namelookup}s\n
time_connect:  %{time_connect}s\n
time_starttransfer:  %{time_starttransfer}s\n
time_total:  %{time_total}s\n
```

---

## Error Scenarios

### Test Error 1: Database Connection Failure

**Trigger:** Stop PostgreSQL

**Expected:**
- API returns 500 error
- Frontend shows error message
- User is notified of issue

### Test Error 2: Malformed User Profile

**Trigger:**
```javascript
localStorage.setItem('user_profile', 'invalid-json');
```

**Expected:**
- Falls back to default profile
- Console warning logged
- Retirement dashboard still works

### Test Error 3: Invalid Portfolio Data

**Trigger:** Plaid account with null values

**Expected:**
- Falls back to default $1M
- Warning banner shown
- Backend logs warning

---

## Regression Tests

Ensure existing functionality still works:

1. **Social Security Calculator** - Still calculates correctly
2. **Spending Pattern Editor** - Updates work
3. **Longevity Calculator** - Life expectancy accurate
4. **Income Projection Charts** - Render correctly
5. **All Tabs Navigation** - No broken links

---

## Browser Compatibility

Test in:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

**Check:**
- localStorage works
- Banner renders correctly
- Icons display properly
- Colors accurate

---

## Accessibility Tests

1. **Screen Reader:**
   - Banner text readable
   - Portfolio values announced
   - Source indication clear

2. **Keyboard Navigation:**
   - Tab through all elements
   - Focus visible on banner
   - No keyboard traps

3. **Color Contrast:**
   - Green banner: WCAG AA compliant
   - Yellow banner: WCAG AA compliant
   - Blue banner: WCAG AA compliant

---

## Mobile Testing

Test on:
- iOS Safari
- Android Chrome

**Verify:**
- Banner responsive
- Text readable
- No horizontal scroll
- Touch targets adequate

---

## Quick Smoke Test Script

```javascript
// Run in browser console after page load

// 1. Check user profile
const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
console.log('✓ User Profile:', profile);

// 2. Check user_id
const userId = localStorage.getItem('user_id');
console.log('✓ User ID:', userId);

// 3. Check for retirement data
const ssData = document.querySelector('[data-testid="social-security-data"]');
console.log('✓ SS Data Present:', !!ssData);

// 4. Check for banner
const banner = document.querySelector('.bg-green-50, .bg-yellow-50, .bg-blue-50');
console.log('✓ Portfolio Banner:', banner ? 'Found' : 'Not Found');

// 5. Check metadata
// (View network tab for /income-projection response)
console.log('✓ Check Network Tab for metadata in response');
```

---

## Troubleshooting

### Issue: Banner Not Showing

**Possible Causes:**
1. API not returning metadata
2. TypeScript type mismatch
3. Conditional rendering issue

**Debug:**
```javascript
// Check if metadata exists
console.log('Metadata:', metadata);

// Check response in network tab
// Look for "metadata" key in JSON response
```

### Issue: Wrong Portfolio Value

**Possible Causes:**
1. Plaid sync outdated
2. Wrong user_id being used
3. Holdings calculation error

**Debug:**
```sql
-- Check Plaid data
SELECT * FROM plaid_holdings
WHERE account_id IN (
  SELECT id FROM plaid_accounts
  WHERE user_id = 'test-user-123'
);
```

### Issue: Default Showing When Should Be Plaid

**Possible Causes:**
1. No active investment accounts
2. account type != 'investment'
3. is_active = false

**Debug:**
```sql
SELECT * FROM plaid_accounts
WHERE user_id = 'test-user-123'
  AND type = 'investment'
  AND is_active = true;
```

---

## Success Metrics

After testing, verify:

- ✅ 0 JavaScript errors
- ✅ 0 TypeScript errors
- ✅ API response < 3s
- ✅ UI renders in < 100ms
- ✅ All 3 banner types display correctly
- ✅ Portfolio values accurate
- ✅ Backend logs informative
- ✅ Graceful error handling
- ✅ Mobile responsive
- ✅ Accessible

---

**Ready for Production:** Yes ✅
**Risk Level:** Low
**Rollback Plan:** Remove metadata display, keep API changes
