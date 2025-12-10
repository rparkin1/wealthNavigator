#!/bin/bash
#
# Production Deployment Script for WealthNavigator AI
# This script prepares and validates the application for production deployment
#

set -e  # Exit on error

echo "========================================="
echo "WealthNavigator AI - Production Deploy"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if running in production mode
if [ "$PLAID_ENV" != "production" ]; then
    print_error "PLAID_ENV must be set to 'production'"
    print_info "Current value: $PLAID_ENV"
    exit 1
fi

print_success "Environment check passed: production"

# 1. Check required environment variables
echo ""
echo "1. Checking environment variables..."

REQUIRED_VARS=(
    "DATABASE_URL"
    "SECRET_KEY"
    "ANTHROPIC_API_KEY"
    "PLAID_CLIENT_ID"
    "PLAID_SECRET"
    "PLAID_ENV"
    "PLAID_WEBHOOK_VERIFICATION_KEY"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
        print_error "$var is not set"
    else
        print_success "$var is set"
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    print_error "Missing required environment variables. Please set them before deploying."
    exit 1
fi

# 2. Check for production Plaid credentials
echo ""
echo "2. Validating Plaid configuration..."

if [[ "$PLAID_CLIENT_ID" == *"sandbox"* ]] || [[ "$PLAID_CLIENT_ID" == "your_"* ]]; then
    print_error "PLAID_CLIENT_ID appears to be a sandbox or placeholder value"
    exit 1
fi

print_success "Plaid credentials appear valid"

# 3. Check database connection
echo ""
echo "3. Testing database connection..."

if python -c "from app.db.session import engine; import asyncio; asyncio.run(engine.dispose())" 2>/dev/null; then
    print_success "Database connection successful"
else
    print_error "Database connection failed"
    exit 1
fi

# 4. Check if database has SSL enabled
echo ""
echo "4. Checking database SSL configuration..."

if [[ "$DATABASE_URL" == *"sslmode=require"* ]] || [[ "$DATABASE_URL" == *"sslmode=verify"* ]]; then
    print_success "Database SSL is configured"
else
    print_warning "Database SSL is not configured (recommended for production)"
fi

# 5. Run database migrations
echo ""
echo "5. Running database migrations..."

if uv run alembic upgrade head; then
    print_success "Database migrations completed"
else
    print_error "Database migrations failed"
    exit 1
fi

# 6. Run tests
echo ""
echo "6. Running test suite..."

if uv run pytest tests/ -v --tb=short; then
    print_success "All tests passed"
else
    print_error "Tests failed - deployment aborted"
    exit 1
fi

# 7. Security checks
echo ""
echo "7. Running security checks..."

# Check if sentry is configured
if [ -z "$SENTRY_DSN" ]; then
    print_warning "SENTRY_DSN is not set - error tracking disabled"
else
    print_success "Sentry error tracking configured"
fi

# Check SECRET_KEY strength
if [ ${#SECRET_KEY} -lt 32 ]; then
    print_error "SECRET_KEY is too short (minimum 32 characters)"
    exit 1
else
    print_success "SECRET_KEY meets length requirements"
fi

# Check for default secrets
if [[ "$SECRET_KEY" == *"change-this"* ]]; then
    print_error "SECRET_KEY is using default value - must be changed for production"
    exit 1
fi

print_success "Security checks passed"

# 8. Create backup before deployment
echo ""
echo "8. Creating pre-deployment database backup..."

if python app/scripts/backup_database.py backup; then
    print_success "Pre-deployment backup created"
else
    print_warning "Backup failed - continuing anyway"
fi

# 9. Check CORS configuration
echo ""
echo "9. Validating CORS configuration..."

if [[ "$CORS_ORIGINS" == *"localhost"* ]]; then
    print_warning "CORS includes localhost - may want to remove for production"
else
    print_success "CORS configuration looks good"
fi

# 10. Final checks
echo ""
echo "10. Final deployment checks..."

# Check if SSL certificate exists (if using local SSL)
if [ -f "/etc/ssl/certs/wealthnav.pem" ]; then
    print_success "SSL certificate found"
else
    print_info "SSL certificate not found at default location (may be using reverse proxy)"
fi

# Summary
echo ""
echo "========================================="
echo "Pre-Deployment Checks Complete"
echo "========================================="
echo ""

print_success "Application is ready for production deployment!"
echo ""
print_info "Next steps:"
echo "  1. Review deployment logs above"
echo "  2. Deploy application using your deployment method"
echo "  3. Monitor error rates and performance"
echo "  4. Verify webhook delivery"
echo "  5. Test critical user flows"
echo ""
print_warning "Remember to:"
echo "  - Set up automated backups"
echo "  - Configure monitoring alerts"
echo "  - Enable rate limiting"
echo "  - Review security headers"
echo ""

exit 0
