# Plaid Integration - Production Security Checklist

## ✅ Completed Security Features

### 1. Access Token Encryption ✓
- **Status**: Implemented
- **File**: `app/services/encryption_service.py`
- **Details**:
  - Access tokens are encrypted at rest using Fernet (AES-256)
  - Key derived from SECRET_KEY using PBKDF2 with SHA-256
  - 100,000 iterations for key derivation
- **Usage**: Automatically applied in `plaid.py` API endpoints
- **Test**: Run `pytest backend/tests/test_plaid_integration.py::TestEncryptionService`

### 2. Webhook Signature Verification ✓
- **Status**: Implemented
- **File**: `app/services/plaid_webhook_verifier.py`
- **Details**:
  - HMAC-SHA256 signature verification
  - Timestamp validation (5-minute window) to prevent replay attacks
  - Constant-time comparison to prevent timing attacks
- **Configuration**: Set `PLAID_WEBHOOK_VERIFICATION_KEY` environment variable
- **Test**: Run `pytest backend/tests/test_plaid_integration.py::TestPlaidWebhookVerifier`

### 3. Background Sync Service ✓
- **Status**: Pre-existing
- **File**: `app/services/plaid_sync_service.py`
- **Details**: Automated syncing of accounts, transactions, and holdings
- **Endpoints**: `POST /api/v1/plaid/sync/all`, `POST /api/v1/plaid/sync/item/{item_id}`

## 🔧 Pre-Production Configuration

### Required Environment Variables

```bash
# Production Plaid credentials
PLAID_CLIENT_ID=your_production_client_id
PLAID_SECRET=your_production_secret
PLAID_ENV=production

# Webhook verification key (from Plaid dashboard)
PLAID_WEBHOOK_VERIFICATION_KEY=your_webhook_key

# Strong encryption key (separate from SECRET_KEY in production)
ENCRYPTION_KEY=your_strong_encryption_key_here

# Database encryption at rest
# Enable PostgreSQL encryption for production database
```

### 1. Upgrade to Production Plaid Account

- [ ] Sign up for Plaid Production account
- [ ] Complete compliance questionnaire
- [ ] Submit application for review
- [ ] Get approved for production access
- [ ] Generate production credentials
- [ ] Update `.env` with production credentials

**Timeline**: 1-2 weeks for approval

### 2. Database Security

- [ ] Enable PostgreSQL encryption at rest
- [ ] Configure SSL/TLS for database connections
- [ ] Set up database backup encryption
- [ ] Implement database access audit logging
- [ ] Configure connection pooling with SSL

```python
# Update DATABASE_URL to include SSL
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
```

### 3. API Security Hardening

#### Rate Limiting

```bash
pip install slowapi
```

Add to `main.py`:

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add to sensitive endpoints
@limiter.limit("5/minute")
@router.post("/link/token/create")
async def create_link_token(...):
    ...
```

#### CORS Configuration

```python
# Restrict CORS to production domains only
CORS_ORIGINS='["https://yourapp.com","https://www.yourapp.com"]'
```

#### Security Headers

```python
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        return response

app.add_middleware(SecurityHeadersMiddleware)
```

### 4. HTTPS/SSL Configuration

- [ ] Obtain SSL certificate (Let's Encrypt recommended)
- [ ] Configure reverse proxy (nginx/Apache) with SSL
- [ ] Enforce HTTPS redirects
- [ ] Set up SSL certificate auto-renewal
- [ ] Test SSL configuration with SSL Labs

Example nginx configuration:

```nginx
server {
    listen 443 ssl http2;
    server_name api.yourapp.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 5. Monitoring & Alerting

#### Error Tracking

```bash
pip install sentry-sdk
```

```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn="your-sentry-dsn",
    integrations=[FastApiIntegration()],
    environment="production",
    traces_sample_rate=0.1,
)
```

#### Application Monitoring

- [ ] Set up Datadog/New Relic/Prometheus
- [ ] Monitor API response times
- [ ] Track Plaid API error rates
- [ ] Set up alerts for failed syncs
- [ ] Monitor database connection pool
- [ ] Track encryption/decryption performance

#### Logging

```python
import logging
from logging.handlers import RotatingFileHandler

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        RotatingFileHandler('app.log', maxBytes=10485760, backupCount=10),
        logging.StreamHandler()
    ]
)

# NEVER log sensitive data
logger.info(f"User {user_id} connected bank account")  # ✓ OK
logger.info(f"Access token: {access_token}")  # ✗ NEVER DO THIS
```

### 6. Background Jobs

Set up automated sync jobs using APScheduler or Celery:

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.services.plaid_sync_service import plaid_sync_service

scheduler = AsyncIOScheduler()

# Sync all users every hour
scheduler.add_job(
    plaid_sync_service.sync_all_users,
    'interval',
    hours=1,
    id='plaid_hourly_sync'
)

scheduler.start()
```

### 7. Data Retention Policy

```python
from datetime import timedelta

async def cleanup_old_data(db: AsyncSession):
    """Remove transactions older than retention period"""

    # Delete transactions older than 7 years (required by some regulations)
    cutoff_date = datetime.utcnow() - timedelta(days=2555)

    await db.execute(
        delete(PlaidTransaction)
        .where(PlaidTransaction.date < cutoff_date)
    )

    await db.commit()
```

### 8. Disaster Recovery

- [ ] Set up automated database backups (daily)
- [ ] Test backup restoration procedure
- [ ] Implement multi-region deployment
- [ ] Create runbook for common issues
- [ ] Document incident response procedures
- [ ] Set up database replication

## 🧪 Pre-Production Testing

### 1. Security Testing

```bash
# Run security audit
pip install safety bandit
safety check
bandit -r app/

# Check for common vulnerabilities
pip install semgrep
semgrep --config=auto app/
```

### 2. Load Testing

```bash
pip install locust

# Create locustfile.py for load testing
locust -f tests/locustfile.py --host=https://api.yourapp.com
```

### 3. Integration Testing

```bash
# Test Plaid integration
python backend/app/scripts/test_plaid_connection.py

# Run full test suite
pytest backend/tests/ -v --cov=app --cov-report=html
```

### 4. Penetration Testing

- [ ] SQL injection testing
- [ ] XSS testing
- [ ] CSRF testing
- [ ] Authentication bypass testing
- [ ] Rate limit testing
- [ ] Session management testing

## 📋 Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Security audit completed
- [ ] Load testing completed
- [ ] SSL certificates configured
- [ ] Monitoring and alerting set up
- [ ] Backup and recovery tested
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Rollback plan documented

### Deployment

- [ ] Deploy to staging environment
- [ ] Run smoke tests on staging
- [ ] Perform security scan on staging
- [ ] Get stakeholder approval
- [ ] Deploy to production (blue-green or rolling)
- [ ] Verify production deployment
- [ ] Monitor for errors (first 24 hours)
- [ ] Verify backups running

### Post-Deployment

- [ ] Monitor error rates
- [ ] Check API response times
- [ ] Verify sync jobs running
- [ ] Test webhook delivery
- [ ] Review security logs
- [ ] Update documentation
- [ ] Notify users of new features

## 🔐 Compliance Requirements

### PCI DSS

- [ ] Plaid is PCI DSS compliant (tokens used instead of raw credentials)
- [ ] Encrypt all network communications (TLS 1.2+)
- [ ] Implement access controls
- [ ] Regular security testing
- [ ] Maintain security policy

### SOC 2

- [ ] Security policies documented
- [ ] Access controls implemented
- [ ] Audit logging enabled
- [ ] Data encryption at rest and in transit
- [ ] Incident response plan

### GLBA (Gramm-Leach-Bliley Act)

- [ ] Privacy policy published
- [ ] Customer opt-out mechanisms
- [ ] Data security standards
- [ ] Third-party service provider agreements

## 📞 Support & Resources

### Plaid Support

- Dashboard: https://dashboard.plaid.com/
- Documentation: https://plaid.com/docs/
- Status Page: https://status.plaid.com/
- Support: support@plaid.com

### Internal Contacts

- Security Team: security@yourcompany.com
- DevOps: devops@yourcompany.com
- Compliance: compliance@yourcompany.com

## ⚠️ Known Limitations

1. **Sandbox vs Production**: Sandbox has different rate limits and data
2. **Institution Coverage**: Not all banks support all products
3. **Real-time Updates**: Transactions may take 24-48 hours to appear
4. **API Rate Limits**: Respect Plaid's rate limits (varies by plan)
5. **Webhook Delivery**: Not guaranteed; implement polling as backup

## 🎯 Success Criteria

- [ ] 99.9% uptime for Plaid endpoints
- [ ] < 2 second average response time
- [ ] Zero access token leaks
- [ ] 100% webhook signature verification
- [ ] Automated daily syncs completing successfully
- [ ] Zero critical security vulnerabilities
- [ ] All compliance requirements met
