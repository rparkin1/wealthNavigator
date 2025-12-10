# Fix: Set Correct User ID for Portfolio Data

## Problem
The retirement planning system is using `user_id='demo-user'` but your Plaid portfolio data is stored under `user_id='test-user-123'`.

**Backend logs confirm:**
```
WHERE plaid_accounts.user_id = 'demo-user'
No Plaid investment accounts found for user demo-user
No portfolio data found for user demo-user, using default $1M
```

## Solution: Set the Correct User ID

### Option 1: Set user_id in Browser Console (Quickest)

Open your browser console (F12) and run:

```javascript
// Set user_id to match your Plaid data
localStorage.setItem('user_id', 'test-user-123');

// Set user profile
localStorage.setItem('user_profile', JSON.stringify({
  age: 58,
  birthYear: 1967,
  retirementAge: 65,
  gender: 'male'
}));

// Refresh the page
location.reload();
```

### Option 2: Add Initialization Script to App

Add this to `frontend/src/App.tsx` initialization:

```typescript
useEffect(() => {
  // Initialize user_id if not set
  if (!localStorage.getItem('user_id')) {
    localStorage.setItem('user_id', 'test-user-123');
  }

  // Initialize user profile if not set
  if (!localStorage.getItem('user_profile')) {
    localStorage.setItem('user_profile', JSON.stringify({
      age: 58,
      birthYear: 1967,
      retirementAge: 65,
      gender: 'male'
    }));
  }
}, []);
```

### Option 3: Update Default in useUser Hook

Change the default in `frontend/src/hooks/useUser.ts`:

```typescript
// Line 23: Change from
const userId = localStorage.getItem('user_id') || 'demo-user';

// To:
const userId = localStorage.getItem('user_id') || 'test-user-123';
```

## Verification

After setting the user_id, verify it worked:

### 1. Check localStorage
```javascript
console.log('user_id:', localStorage.getItem('user_id'));
// Should show: "test-user-123"
```

### 2. Check Backend Logs
After refreshing and viewing retirement projections, you should see:

```
WHERE plaid_accounts.user_id = 'test-user-123'
Portfolio value from Plaid: $XXX,XXX.XX, N asset classes
Using actual portfolio value from Plaid: $XXX,XXX.XX
```

### 3. Check UI Banner
You should now see a **GREEN** banner:
```
✓ Using Your Actual Portfolio
Portfolio Value: $XXX,XXX
✓ Fetched from N connected Plaid accounts
Expected Return: 7.0% annually
```

## Why This Happened

The system has multiple default user_id values:
- `api.ts`: defaults to `'test-user-123'`
- `useUser.ts`: defaults to `'demo-user'`
- API client adds header: `X-User-Id: test-user-123`

When the retirement API receives the request body, it uses `user_id` from the request (which comes from `useUser()` hook, defaulting to 'demo-user'), NOT from the header.

## Permanent Fix

For a permanent solution, update the default in `useUser.ts`:

```bash
# Edit the file
cd frontend/src/hooks
# Change line 23 from 'demo-user' to 'test-user-123'
```

Or create an environment-specific default:

```typescript
const DEFAULT_USER_ID = import.meta.env.VITE_DEFAULT_USER_ID || 'test-user-123';
const userId = localStorage.getItem('user_id') || DEFAULT_USER_ID;
```

## Testing

After applying the fix:

1. **Clear existing localStorage** (optional):
   ```javascript
   localStorage.clear();
   ```

2. **Set user_id**:
   ```javascript
   localStorage.setItem('user_id', 'test-user-123');
   ```

3. **Refresh** and complete retirement configuration

4. **Verify** you see green banner with actual portfolio value

## Quick Test Script

Paste this in browser console:

```javascript
// Reset and configure
localStorage.setItem('user_id', 'test-user-123');
localStorage.setItem('user_profile', JSON.stringify({
  age: 58,
  birthYear: 1967,
  retirementAge: 65,
  gender: 'male'
}));

console.log('✅ User ID set to:', localStorage.getItem('user_id'));
console.log('✅ User profile set');
console.log('📝 Now refresh the page and complete retirement configuration');
console.log('🎯 You should see a GREEN banner showing your actual portfolio value');
```

## Database Check (Optional)

To verify Plaid data exists for the correct user:

```sql
-- Check which users have investment accounts
SELECT
  user_id,
  COUNT(*) as account_count,
  STRING_AGG(name, ', ') as account_names
FROM plaid_accounts
WHERE type = 'investment' AND is_active = true
GROUP BY user_id;

-- Check portfolio value for test-user-123
SELECT
  pa.user_id,
  pa.name as account_name,
  SUM(ph.institution_value) as total_value,
  COUNT(ph.id) as holdings_count
FROM plaid_accounts pa
LEFT JOIN plaid_holdings ph ON ph.account_id = pa.id
WHERE pa.user_id = 'test-user-123'
  AND pa.type = 'investment'
  AND pa.is_active = true
GROUP BY pa.user_id, pa.name;
```

---

**Once fixed, your retirement projections will use your ACTUAL portfolio value from Plaid instead of the $1M default!** 🎉
