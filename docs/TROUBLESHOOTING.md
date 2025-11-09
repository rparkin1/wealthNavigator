# WealthNavigator AI: Troubleshooting Guide

Comprehensive solutions to common issues and problems.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Authentication & Login](#authentication--login)
- [Connection Problems](#connection-problems)
- [Feature-Specific Issues](#feature-specific-issues)
  - [Monte Carlo Simulation](#monte-carlo-simulation)
  - [Portfolio Optimization](#portfolio-optimization)
  - [Plaid Integration](#plaid-integration)
  - [AI Chat](#ai-chat)
- [Performance Issues](#performance-issues)
- [Data & Database](#data--database)
- [Browser & UI Issues](#browser--ui-issues)
- [API & Integration](#api--integration)
- [Error Messages](#error-messages)

---

## Installation Issues

### Docker Compose Fails to Start

**Error**: `ERROR: Couldn't connect to Docker daemon`

**Solution**:
```bash
# Verify Docker is running
docker ps

# Start Docker Desktop (macOS/Windows)
open -a Docker  # macOS

# Linux: Start Docker service
sudo systemctl start docker
```

---

### Database Migration Errors

**Error**: `alembic.util.exc.CommandError: Can't locate revision identified by 'xyz'`

**Solution**:
```bash
# Reset migrations (development only!)
cd backend
rm -rf alembic/versions/*

# Drop database
docker exec -it wealthnav-postgres psql -U postgres -c "DROP DATABASE wealthnav;"
docker exec -it wealthnav-postgres psql -U postgres -c "CREATE DATABASE wealthnav;"

# Regenerate migrations
alembic revision --autogenerate -m "initial"
alembic upgrade head
```

---

### Python Dependency Conflicts

**Error**: `ERROR: Could not find a version that satisfies the requirement...`

**Solution**:
```bash
# Create fresh virtual environment
cd backend
rm -rf venv
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# If still fails, try without cache
pip install --no-cache-dir -r requirements.txt
```

---

### Node.js Installation Issues

**Error**: `npm ERR! EACCES: permission denied`

**Solution**:
```bash
# Fix npm permissions (Unix/macOS)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Or use nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

---

## Authentication & Login

### Cannot Log In

**Symptom**: Login fails with "Invalid credentials"

**Solutions**:

1. **Verify Email and Password**
   - Check for typos
   - Password is case-sensitive
   - Ensure Caps Lock is off

2. **Reset Password**
   ```
   Click "Forgot Password"
   Check email (including spam folder)
   Follow reset link
   ```

3. **Account Locked**
   - Too many failed attempts locks account for 15 minutes
   - Wait 15 minutes or contact support

---

### 2FA Not Working

**Error**: "Invalid verification code"

**Solutions**:

1. **Time Sync Issues**
   ```bash
   # Ensure device time is accurate
   # iOS: Settings → General → Date & Time → Set Automatically
   # Android: Settings → System → Date & Time → Use network time
   ```

2. **Use Backup Codes**
   - Locate saved backup codes
   - Enter one code to bypass 2FA
   - Reconfigure 2FA after login

3. **Contact Support**
   - Email: support@wealthnavigator.ai
   - Provide: Username, date of last successful login

---

### Token Expired Error

**Error**: "JWT token has expired"

**Solution**:
```javascript
// Automatic token refresh (if using SDK)
// Frontend should handle this automatically

// Manual refresh
POST /api/v1/auth/refresh
{
  "refresh_token": "your_refresh_token"
}
```

---

## Connection Problems

### Cannot Connect to Backend

**Error**: `Network Error` or `ERR_CONNECTION_REFUSED`

**Diagnosis**:
```bash
# 1. Check if backend is running
curl http://localhost:8000/health

# 2. Check Docker containers
docker ps

# 3. Check backend logs
docker logs wealthnav-backend
# or
cd backend && tail -f app.log
```

**Solutions**:

1. **Start Backend**
   ```bash
   cd backend
   source venv/bin/activate
   uvicorn app.main:app --reload --port 8000
   ```

2. **Fix CORS Issues**

   Edit `backend/.env`:
   ```env
   CORS_ORIGINS=["http://localhost:5173", "http://localhost:3000"]
   ```

3. **Check Firewall**
   ```bash
   # Allow port 8000
   sudo ufw allow 8000  # Linux
   ```

---

### Frontend Cannot Reach API

**Error**: `TypeError: Failed to fetch`

**Solution**:

1. **Verify Environment Variables**

   `frontend/.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:8000
   ```

2. **Restart Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Check Browser Console**
   - Open DevTools (F12)
   - Look for CORS errors
   - Verify API URL in Network tab

---

### Database Connection Failed

**Error**: `FATAL: password authentication failed for user "postgres"`

**Solutions**:

1. **Verify Database Running**
   ```bash
   docker ps | grep postgres
   ```

2. **Check Credentials**

   `backend/.env`:
   ```env
   DATABASE_URL=postgresql://postgres:dev@localhost:5432/wealthnav
   ```

3. **Reset Database Password**
   ```bash
   docker exec -it wealthnav-postgres psql -U postgres
   ALTER USER postgres PASSWORD 'dev';
   \q
   ```

---

## Feature-Specific Issues

### Monte Carlo Simulation

#### Simulation Times Out

**Error**: `Simulation timed out after 60 seconds`

**Solutions**:

1. **Reduce Iterations**
   ```
   Settings → Simulations → Max Iterations
   Change from 5000 to 1000
   ```

2. **Check System Resources**
   ```bash
   # Monitor CPU and RAM
   top  # Linux/macOS
   # Task Manager (Windows)

   # Close unnecessary applications
   ```

3. **Increase Timeout**

   `backend/app/core/config.py`:
   ```python
   SIMULATION_TIMEOUT = 120  # seconds
   ```

---

#### Simulation Returns NaN or Invalid Results

**Error**: `Result contains NaN or Infinity`

**Causes & Solutions**:

1. **Invalid Input Parameters**
   - Expected return > 0 and < 1 (use decimal, e.g., 0.07 for 7%)
   - Standard deviation > 0
   - Years > 0

2. **Extreme Values**
   - Avoid expected returns > 0.20 (20%)
   - Avoid volatility > 0.50 (50%)
   - Use realistic inflation (0.02-0.05)

3. **Backend Error**
   ```bash
   # Check logs
   docker logs wealthnav-backend | grep ERROR
   ```

---

### Portfolio Optimization

#### Optimization Fails or Produces Unrealistic Results

**Issue**: Recommended allocation is 100% cash or other extreme

**Solutions**:

1. **Check Risk Tolerance**
   - Retake questionnaire
   - Ensure score matches your actual tolerance
   - Manual override: Settings → Profile → Risk Tolerance

2. **Remove Strict Constraints**
   - ESG preferences can over-constrain
   - Sector limits may be too restrictive
   - Try optimization without constraints first

3. **Verify Market Data**
   ```
   Portfolio → Settings → Refresh Market Data
   ```

4. **Check Time Horizon**
   - Short horizons (<5 years) favor conservative allocations
   - Long horizons (>20 years) favor aggressive allocations

---

### Plaid Integration

#### Cannot Connect Bank Account

**Error**: `Unable to connect to [Bank Name]`

**Solutions**:

1. **Verify Bank Credentials**
   - Test login at bank's website
   - Ensure no pending security questions
   - Check if account is locked

2. **Bank Maintenance**
   - Check Plaid status: https://status.plaid.com
   - Try again in 1-2 hours

3. **Security Settings**
   - Some banks require pre-authorization for third-party access
   - Log in to bank → Settings → Third-Party Access
   - Add "Plaid" to authorized services

4. **Use Manual Entry**
   - Portfolio → Add Account → Manual Entry
   - Enter holdings manually
   - Update quarterly

---

#### Transactions Not Syncing

**Issue**: New transactions not appearing

**Solutions**:

1. **Force Sync**
   ```
   Portfolio → Connected Accounts → [Account] → Sync Now
   ```

2. **Check Connection Status**
   ```
   Portfolio → Connected Accounts → [Account] → Status
   ```
   - Green: Active
   - Yellow: Requires re-authentication
   - Red: Disconnected

3. **Re-authenticate**
   - Click "Re-connect"
   - Complete authentication flow
   - Test sync again

---

### AI Chat

#### AI Not Responding

**Issue**: Message sent but no response

**Solutions**:

1. **Check API Key**

   `backend/.env`:
   ```env
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   ```

2. **Verify API Key is Valid**
   ```bash
   curl https://api.anthropic.com/v1/messages \
     -H "x-api-key: $ANTHROPIC_API_KEY" \
     -H "anthropic-version: 2023-06-01" \
     -H "content-type: application/json" \
     -d '{"model":"claude-sonnet-4-5-20250929","max_tokens":10,"messages":[{"role":"user","content":"Hi"}]}'
   ```

3. **Check Rate Limits**
   - Anthropic API has rate limits
   - Wait 1 minute between requests
   - Upgrade Anthropic plan if needed

4. **Backend Logs**
   ```bash
   docker logs wealthnav-backend --tail 50
   # Look for Anthropic API errors
   ```

---

#### AI Responses are Slow

**Issue**: Taking >10 seconds to respond

**Solutions**:

1. **Use Streaming**
   - Enable SSE streaming (default)
   - Responses appear incrementally

2. **Shorter Messages**
   - Keep messages under 500 characters
   - Break complex questions into parts

3. **Check Backend Performance**
   ```bash
   # Monitor backend CPU/RAM
   docker stats wealthnav-backend
   ```

---

## Performance Issues

### Dashboard Loads Slowly

**Issue**: Dashboard takes >5 seconds to load

**Solutions**:

1. **Clear Browser Cache**
   ```
   Chrome: Ctrl+Shift+Delete → Clear cached images and files
   Firefox: Ctrl+Shift+Delete → Cache
   Safari: Cmd+Option+E
   ```

2. **Reduce Goals**
   - Archive completed goals
   - Dashboard performs best with <10 active goals

3. **Limit Chart Data**
   ```
   Settings → Display → Chart Data Points
   Reduce from "All" to "Last 12 months"
   ```

4. **Check Backend Performance**
   ```bash
   # Redis cache status
   docker exec -it wealthnav-redis redis-cli INFO stats

   # If cache is full, flush
   docker exec -it wealthnav-redis redis-cli FLUSHDB
   ```

---

### Charts Not Rendering

**Issue**: Blank charts or loading spinners

**Solutions**:

1. **Browser Compatibility**
   - Update browser to latest version
   - Try Chrome or Firefox (best support for D3.js)

2. **JavaScript Errors**
   - Open DevTools (F12)
   - Check Console tab for errors
   - Report errors to support

3. **Data Issues**
   - Ensure goals have sufficient data
   - Minimum 2 data points for line charts
   - Run simulation if no projection data

---

## Data & Database

### Data Not Saving

**Issue**: Changes not persisting after reload

**Solutions**:

1. **Check Browser Storage**
   ```
   DevTools → Application → Local Storage
   Verify wealthnav-* keys exist
   ```

2. **Clear and Re-sync**
   ```
   Settings → Advanced → Clear Local Storage
   Refresh page
   Re-sync from backend
   ```

3. **Database Connection**
   ```bash
   # Test database
   docker exec -it wealthnav-postgres psql -U postgres -d wealthnav -c "SELECT COUNT(*) FROM goals;"
   ```

---

### Lost Data After Update

**Issue**: Goals or portfolio missing after update

**Solutions**:

1. **Check Soft Deletes**
   ```
   Dashboard → Settings → Show Deleted Items
   Restore items if needed
   ```

2. **Restore from Backup**
   ```bash
   # Restore database backup (if available)
   docker exec -i wealthnav-postgres psql -U postgres -d wealthnav < backup.sql
   ```

3. **Contact Support**
   - Email: support@wealthnavigator.ai
   - Provide: User ID, approximate date of data loss

---

## Browser & UI Issues

### Layout Broken or Overlapping

**Issue**: Components overlapping or misaligned

**Solutions**:

1. **Hard Refresh**
   ```
   Ctrl+F5 (Windows)
   Cmd+Shift+R (Mac)
   ```

2. **Clear Cache**
   ```
   Settings → Privacy → Clear browsing data
   Select "Cached images and files"
   ```

3. **Try Incognito Mode**
   - Tests if browser extensions are causing issues
   - If works in incognito, disable extensions one by one

---

### Buttons Not Clickable

**Issue**: Buttons unresponsive to clicks

**Solutions**:

1. **Disable Browser Extensions**
   - Ad blockers can interfere
   - Disable extensions for localhost

2. **Check for JavaScript Errors**
   ```
   DevTools (F12) → Console
   Look for errors
   ```

3. **Zoom Level**
   - Reset zoom to 100% (Ctrl+0)
   - Some elements break at extreme zoom

---

## API & Integration

### 401 Unauthorized Error

**Error**: `{"error":"unauthorized","message":"Invalid or expired token"}`

**Solutions**:

1. **Refresh Token**
   ```bash
   curl -X POST http://localhost:8000/api/v1/auth/refresh \
     -H "Content-Type: application/json" \
     -d '{"refresh_token":"your_refresh_token"}'
   ```

2. **Re-login**
   ```bash
   curl -X POST http://localhost:8000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"password"}'
   ```

---

### 429 Rate Limit Exceeded

**Error**: `{"error":"rate_limit_exceeded"}`

**Solutions**:

1. **Wait for Rate Limit Reset**
   - Check `X-RateLimit-Reset` header
   - Wait until timestamp

2. **Upgrade Plan**
   - Basic: 300 requests/hour
   - Professional: 1,000 requests/hour
   - Enterprise: Unlimited

3. **Optimize API Calls**
   - Batch requests when possible
   - Cache responses client-side
   - Use webhooks instead of polling (coming soon)

---

## Error Messages

### Common Error Codes

| Code | Message | Solution |
|------|---------|----------|
| `ERR_GOAL_INVALID` | Invalid goal parameters | Check required fields, ensure positive values |
| `ERR_SIM_TIMEOUT` | Simulation timeout | Reduce iterations or increase timeout |
| `ERR_DB_CONNECTION` | Database connection failed | Verify PostgreSQL running, check credentials |
| `ERR_AUTH_FAILED` | Authentication failed | Verify API key, check token expiration |
| `ERR_PLAID_CONN` | Plaid connection error | Re-authenticate bank, check Plaid status |
| `ERR_OPTIMIZATION` | Optimization failed | Review constraints, verify market data |

---

## Getting More Help

### Diagnostic Information to Provide

When contacting support, include:

1. **System Information**
   - OS and version
   - Browser and version
   - Docker version (if applicable)

2. **Error Details**
   - Full error message
   - Steps to reproduce
   - Screenshots (if relevant)

3. **Logs**
   ```bash
   # Backend logs
   docker logs wealthnav-backend > backend.log

   # Browser console
   Right-click → Inspect → Console → Copy all
   ```

### Contact Support

- **Email**: support@wealthnavigator.ai
- **GitHub Issues**: https://github.com/yourusername/wealthNavigator/issues
- **Discord**: https://discord.gg/wealthnavigator
- **Documentation**: https://docs.wealthnavigator.ai

---

## Additional Resources

- [Getting Started Guide](GETTING_STARTED.md)
- [Feature Tutorials](FEATURE_TUTORIALS.md)
- [FAQ](FAQ.md)
- [API Documentation](API_DOCUMENTATION.md)

---

**Last Updated**: January 2025
