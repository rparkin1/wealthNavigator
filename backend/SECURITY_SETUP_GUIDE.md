# Security Features Setup Guide

Quick reference for setting up and using the new security features in WealthNavigator AI.

---

## 🚀 Quick Start

### 1. Install Security Dependencies

```bash
cd backend
pip install -r requirements_security.txt
```

### 2. Configure Environment Variables

Add to `backend/.env`:

```bash
# Encryption key for MFA secrets (generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")
ENCRYPTION_KEY=your-32-byte-base64-encoded-encryption-key-here

# Secret key for JWT and CSRF tokens (already configured)
SECRET_KEY=your-secret-key-here
```

**Generate encryption key:**
```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

### 3. Run Database Migrations

```bash
cd backend
alembic upgrade head
```

This creates:
- `audit_logs` table
- `mfa_secrets` table
- Relationships to `users` table

### 4. Restart Backend Server

```bash
cd backend
uvicorn app.main:app --reload
```

---

## 🔐 Feature Guide

### Multi-Factor Authentication (MFA)

**Setup Flow:**

1. **User initiates MFA setup:**
   ```bash
   POST /api/v1/mfa/setup
   Authorization: Bearer <jwt_token>
   ```

   Response includes:
   - `qr_code_base64`: QR code image for authenticator app
   - `secret_uri`: URI for manual entry
   - `backup_codes`: 10 recovery codes (save these!)

2. **User scans QR code** with Google Authenticator, Authy, or similar app

3. **User verifies TOTP code to enable MFA:**
   ```bash
   POST /api/v1/mfa/verify
   Authorization: Bearer <jwt_token>
   Content-Type: application/json

   {
     "totp_code": "123456"
   }
   ```

**Login Flow with MFA:**

1. User logs in with username/password
2. Backend returns JWT token
3. User submits TOTP code:
   ```bash
   POST /api/v1/mfa/verify-login
   Authorization: Bearer <jwt_token>
   Content-Type: application/json

   {
     "totp_code": "123456"
   }
   ```

**Using Backup Codes:**

If authenticator app is unavailable:

```bash
POST /api/v1/mfa/verify-backup-code
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "backup_code": "ABCD1234"
}
```

⚠️ Each backup code can only be used once!

**Check MFA Status:**

```bash
GET /api/v1/mfa/status
Authorization: Bearer <jwt_token>
```

**Disable MFA:**

```bash
DELETE /api/v1/mfa/disable
Authorization: Bearer <jwt_token>
```

---

### CSRF Protection

All state-changing requests (POST, PUT, PATCH, DELETE) require CSRF token:

**1. Get CSRF token from cookie:**

The server automatically sets a `csrf_token` cookie on first request.

**2. Include token in request header:**

```bash
POST /api/v1/goals
X-CSRF-Token: <token_from_cookie>
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Retirement",
  "target_amount": 1000000
}
```

**Frontend Example (JavaScript):**

```javascript
// Get CSRF token from cookie
function getCsrfToken() {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrf_token') {
      return value;
    }
  }
  return null;
}

// Include in fetch request
fetch('/api/v1/goals', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${jwtToken}`,
    'X-CSRF-Token': getCsrfToken()
  },
  body: JSON.stringify({ name: 'Retirement', target_amount: 1000000 })
})
```

**Exempt Paths (no CSRF required):**
- `/api/v1/auth/login`
- `/api/v1/auth/register`
- `/api/v1/plaid/webhook`
- `/health`
- `/`

---

### GDPR/CCPA Data Export

**Export all user data:**

```bash
GET /api/v1/privacy/export
Authorization: Bearer <jwt_token>
```

Downloads JSON file: `wealthnavigator_export_{user_id}_{timestamp}.json`

**Includes:**
- User profile
- Goals and milestones
- Portfolio data
- Budget entries
- Plaid connections (without sensitive credentials)
- Life events
- Preferences

---

### GDPR/CCPA Data Deletion

**Permanently delete all user data:**

```bash
POST /api/v1/privacy/delete
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "confirmation": "DELETE MY DATA",
  "reason": "No longer using the service"
}
```

⚠️ **WARNING:** This is irreversible!

**Deletes:**
- User profile
- All goals
- All portfolios
- All budget entries
- All Plaid data
- All audit logs

**Audit log entry is created BEFORE deletion** for compliance.

---

### Audit Log Access

**View your activity history:**

```bash
GET /api/v1/privacy/audit-log?limit=100&offset=0
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "audit_logs": [
    {
      "id": "log_id",
      "event_type": "login",
      "event_category": "authentication",
      "description": "User login successful",
      "severity": "info",
      "ip_address": "192.168.1.1",
      "timestamp": "2025-01-08T12:00:00Z",
      "metadata": {}
    }
  ],
  "total": 100,
  "limit": 100,
  "offset": 0
}
```

---

### Role-Based Access Control (RBAC)

**Roles:**
- `USER`: Full access to own data
- `ADMIN`: System administration
- `READONLY`: View-only access
- `DEMO`: Limited demo access

**Set user role** (via preferences):

```python
user.preferences = {"role": "readonly"}
```

**Protected endpoint example:**

```python
from app.core.rbac import RBACService, Permission

@router.delete("/admin/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: User = Depends(RBACService.require_permission(Permission.USER_ADMIN))
):
    # Only admins can access this endpoint
    ...
```

---

## 🔒 Security Best Practices

### For Users

1. **Enable MFA** for all accounts
2. **Save backup codes** in a secure location
3. **Review audit log** regularly for suspicious activity
4. **Use strong passwords** (minimum 8 characters)
5. **Export data** periodically for backup

### For Developers

1. **Never commit secrets** to version control
2. **Use HTTPS** in production (HSTS enabled)
3. **Validate all input** (middleware handles this)
4. **Check permissions** before data access
5. **Log security events** using AuditService
6. **Rotate keys** regularly (SECRET_KEY, ENCRYPTION_KEY)

---

## 🧪 Testing

### Test MFA Setup

```bash
# 1. Register user
POST /api/v1/auth/register
{
  "email": "test@example.com",
  "password": "testpass123"
}

# 2. Setup MFA
POST /api/v1/mfa/setup
Authorization: Bearer <token>

# 3. Scan QR code with authenticator app
# 4. Verify with TOTP code
POST /api/v1/mfa/verify
Authorization: Bearer <token>
{
  "totp_code": "123456"
}
```

### Test CSRF Protection

```bash
# This should fail (no CSRF token)
POST /api/v1/goals
Authorization: Bearer <token>
{
  "name": "Test Goal"
}
# Response: 403 CSRF token required

# This should succeed (with CSRF token)
POST /api/v1/goals
Authorization: Bearer <token>
X-CSRF-Token: <token_from_cookie>
{
  "name": "Test Goal"
}
# Response: 201 Created
```

### Test Data Export

```bash
GET /api/v1/privacy/export
Authorization: Bearer <token>

# Should download JSON file with all user data
```

### Test RBAC

```python
# Set user to readonly role
user.preferences = {"role": "readonly"}

# Try to create goal (should fail)
POST /api/v1/goals
Authorization: Bearer <token>
# Response: 403 Permission denied
```

---

## 📊 Monitoring

### View Audit Logs (Admin)

```sql
SELECT
  event_type,
  event_category,
  severity,
  COUNT(*) as count
FROM audit_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY event_type, event_category, severity
ORDER BY count DESC;
```

### Failed Login Attempts

```sql
SELECT
  ip_address,
  COUNT(*) as failed_attempts,
  MAX(created_at) as last_attempt
FROM audit_logs
WHERE
  event_type = 'login'
  AND severity = 'warning'
  AND created_at >= NOW() - INTERVAL '1 hour'
GROUP BY ip_address
HAVING COUNT(*) >= 5
ORDER BY failed_attempts DESC;
```

### MFA Adoption Rate

```sql
SELECT
  COUNT(CASE WHEN mfa_secrets.is_enabled THEN 1 END) as mfa_enabled,
  COUNT(*) as total_users,
  ROUND(100.0 * COUNT(CASE WHEN mfa_secrets.is_enabled THEN 1 END) / COUNT(*), 2) as adoption_rate_pct
FROM users
LEFT JOIN mfa_secrets ON users.id = mfa_secrets.user_id;
```

---

## 🚨 Troubleshooting

### "CSRF token missing"

**Cause:** Client didn't include `X-CSRF-Token` header

**Fix:** Get token from `csrf_token` cookie and include in request header

### "Invalid TOTP code"

**Causes:**
- Time drift (authenticator app time != server time)
- Wrong secret scanned
- Code expired (30-second window)

**Fix:**
- Check device time sync
- Re-setup MFA if needed
- Use backup code

### "MFA rate limit exceeded"

**Cause:** 5 failed TOTP verification attempts

**Fix:** Wait 1 hour or use backup code

### "Encryption key not configured"

**Cause:** `ENCRYPTION_KEY` not set in environment

**Fix:**
```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# Add to .env: ENCRYPTION_KEY=<generated_key>
```

---

## 📚 Additional Resources

- [OWASP Top 10 Audit](./SECURITY_AUDIT_OWASP_TOP_10.md)
- [Implementation Summary](./SECURITY_IMPLEMENTATION_SUMMARY.md)
- [TOTP RFC 6238](https://tools.ietf.org/html/rfc6238)
- [GDPR Guidelines](https://gdpr.eu/)
- [CCPA Overview](https://oag.ca.gov/privacy/ccpa)

---

## 🆘 Support

For security issues, contact: security@wealthnavigator.ai

**DO NOT** disclose security vulnerabilities in public issues!
