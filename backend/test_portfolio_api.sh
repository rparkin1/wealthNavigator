#!/bin/bash

# Portfolio API Test Script
# Tests all advanced portfolio endpoints

echo "========================================="
echo "Portfolio API Endpoint Tests"
echo "========================================="
echo ""

BASE_URL="http://localhost:8000/api/v1/portfolio"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_count=0
pass_count=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4

    test_count=$((test_count + 1))
    echo -e "${YELLOW}Test $test_count: $name${NC}"
    echo "  Endpoint: $method $endpoint"

    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$endpoint" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" 2>&1)
    fi

    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "  ${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        pass_count=$((pass_count + 1))
        echo "  Response: $(echo $body | jq -c '.' 2>/dev/null || echo $body | head -c 100)"
    else
        echo -e "  ${RED}✗ FAILED${NC} (HTTP $http_code)"
        echo "  Error: $body"
    fi
    echo ""
}

# Test 1: Health Check
test_endpoint \
    "Portfolio API Health Check" \
    "GET" \
    "$BASE_URL/health"

# Test 2: Tax-Loss Harvesting
test_endpoint \
    "Tax-Loss Harvesting Analysis" \
    "POST" \
    "$BASE_URL/tax-loss-harvest" \
    '{
        "user_id": "test-user-123",
        "portfolio_id": "test-portfolio-456",
        "tax_rate": 0.24,
        "min_loss_threshold": 100.0
    }'

# Test 3: Portfolio Rebalancing
test_endpoint \
    "Portfolio Rebalancing Analysis" \
    "POST" \
    "$BASE_URL/rebalance" \
    '{
        "user_id": "test-user-123",
        "portfolio_id": "test-portfolio-456",
        "drift_threshold": 5.0,
        "tax_rate": 0.24,
        "new_contributions": 0.0
    }'

# Test 4: Performance Tracking
test_endpoint \
    "Performance Tracking Analysis" \
    "POST" \
    "$BASE_URL/performance" \
    '{
        "user_id": "test-user-123",
        "portfolio_id": "test-portfolio-456",
        "start_date": "2024-01-01",
        "end_date": "2024-12-31",
        "benchmark": "SPY"
    }'

# Test 5: Comprehensive Analysis
test_endpoint \
    "Comprehensive Portfolio Analysis" \
    "POST" \
    "$BASE_URL/analyze" \
    '{
        "user_id": "test-user-123",
        "portfolio_id": "test-portfolio-456",
        "analysis_types": ["tax_loss_harvesting", "rebalancing", "performance"],
        "tax_rate": 0.24,
        "drift_threshold": 5.0
    }'

# Summary
echo "========================================="
echo "Test Summary"
echo "========================================="
echo "Total Tests: $test_count"
echo -e "Passed: ${GREEN}$pass_count${NC}"
echo -e "Failed: ${RED}$((test_count - pass_count))${NC}"

if [ $pass_count -eq $test_count ]; then
    echo -e "\n${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}✗ Some tests failed${NC}"
    exit 1
fi
