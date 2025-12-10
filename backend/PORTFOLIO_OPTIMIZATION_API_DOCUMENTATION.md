# Portfolio Optimization API Documentation

**Version:** 3.0.0
**Base URL:** `/api/v1/portfolio-optimization`
**Status:** Production Ready ✅
**Last Updated:** November 1, 2025

---

## Overview

The Portfolio Optimization API provides institutional-grade portfolio management capabilities with 45+ asset classes, multi-level optimization, ESG/ethical screening, portfolio insights, and proactive alerts.

### Key Features

- 🎯 **Modern Portfolio Theory** - Mean-variance optimization with efficient frontier
- 📊 **45+ Asset Classes** - Comprehensive coverage across 6 categories
- 🏦 **Multi-Level Optimization** - Goal, Account, and Household level
- 🌱 **ESG Screening** - Environmental, Social, Governance filtering with 4 presets
- 💡 **Portfolio Insights** - AI-powered analysis across 6 categories
- ⚠️ **Proactive Alerts** - 9 types of alerts for portfolio health
- 💰 **Tax-Aware Optimization** - Asset location and tax drag minimization

---

## Authentication

All endpoints require Bearer token authentication:

```http
Authorization: Bearer <your_access_token>
```

Obtain an access token through the `/api/v1/auth/login` endpoint.

---

## Endpoints

### 1. Asset Classes

#### GET `/asset-classes`

Get all available asset classes with optional filtering.

**Query Parameters:**
- `category` (optional): Filter by category (equity, fixed_income, alternative, commodity, real_estate, cash)
- `min_return` (optional): Minimum expected return (decimal, e.g., 0.08 for 8%)
- `max_volatility` (optional): Maximum volatility (decimal, e.g., 0.15 for 15%)

**Example Request:**
```http
GET /api/v1/portfolio-optimization/asset-classes?category=equity&min_return=0.08
```

**Example Response:**
```json
[
  {
    "code": "US_LC_BLEND",
    "name": "US Large Cap Blend",
    "category": "equity",
    "expected_return": 0.09,
    "volatility": 0.16,
    "tax_efficiency": 0.88,
    "benchmark_ticker": "VOO",
    "description": "S&P 500 and broad large-cap blend"
  },
  {
    "code": "US_LC_GROWTH",
    "name": "US Large Cap Growth",
    "category": "equity",
    "expected_return": 0.10,
    "volatility": 0.18,
    "tax_efficiency": 0.90,
    "benchmark_ticker": "VUG",
    "description": "Large-cap growth stocks"
  }
]
```

---

#### GET `/asset-classes/{asset_code}`

Get detailed information about a specific asset class.

**Path Parameters:**
- `asset_code` (required): Asset class code (e.g., "US_LC_BLEND")

**Example Request:**
```http
GET /api/v1/portfolio-optimization/asset-classes/US_LC_BLEND
```

**Example Response:**
```json
{
  "code": "US_LC_BLEND",
  "name": "US Large Cap Blend",
  "category": "equity",
  "expected_return": 0.09,
  "volatility": 0.16,
  "tax_efficiency": 0.88,
  "benchmark_ticker": "VOO",
  "description": "S&P 500 and broad large-cap blend"
}
```

---

### 2. Simple Allocation

#### POST `/simple-allocation`

Generate a simple diversified portfolio based on risk tolerance and time horizon.

**Request Body:**
```json
{
  "risk_tolerance": 0.6,
  "time_horizon": 15,
  "include_alternatives": true
}
```

**Parameters:**
- `risk_tolerance` (required): Risk level from 0.0 (conservative) to 1.0 (aggressive)
- `time_horizon` (required): Years until goal (positive integer)
- `include_alternatives` (optional): Include REITs, gold, commodities (default: false)

**Response:**
```json
{
  "allocation": {
    "US_LC_BLEND": 0.27,
    "US_MC_BLEND": 0.06,
    "US_SC_BLEND": 0.06,
    "INTL_DEV_BLEND": 0.15,
    "EM_BLEND": 0.09,
    "US_TREASURY_INTER": 0.16,
    "US_CORP_IG": 0.12,
    "TIPS": 0.08,
    "CASH": 0.04,
    "US_REIT": 0.03,
    "GOLD": 0.02
  },
  "expected_return": 0.078,
  "expected_volatility": 0.123,
  "sharpe_ratio": 0.31,
  "risk_level": "moderate"
}
```

---

### 3. Multi-Level Optimization

#### POST `/multi-level-optimization`

Perform comprehensive household optimization across goals and accounts with tax-aware placement.

**Request Body:**
```json
{
  "accounts": [
    {
      "id": "401k",
      "name": "401(k) Plan",
      "type": "tax_deferred",
      "balance": 150000,
      "current_holdings": {}
    },
    {
      "id": "roth",
      "name": "Roth IRA",
      "type": "tax_exempt",
      "balance": 75000,
      "current_holdings": {}
    },
    {
      "id": "taxable",
      "name": "Brokerage Account",
      "type": "taxable",
      "balance": 50000,
      "current_holdings": {}
    }
  ],
  "goals": [
    {
      "id": "retirement",
      "name": "Retirement at 65",
      "target_amount": 2000000,
      "current_amount": 275000,
      "years_to_goal": 20,
      "priority": "essential",
      "risk_tolerance": 0.6,
      "success_threshold": 0.85
    }
  ],
  "asset_codes": [],
  "use_esg_screening": false
}
```

**Response:**
```json
{
  "optimization_level": "household",
  "total_value": 275000,
  "expected_return": 0.075,
  "expected_volatility": 0.14,
  "sharpe_ratio": 0.25,
  "goal_allocations": {
    "retirement": {
      "US_LC_BLEND": 0.35,
      "INTL_DEV_BLEND": 0.20,
      "US_TREASURY_INTER": 0.25,
      "US_CORP_IG": 0.15,
      "CASH": 0.05
    }
  },
  "account_allocations": {
    "401k": {
      "US_CORP_IG": 90000,
      "US_TREASURY_INTER": 60000
    },
    "roth": {
      "US_LC_BLEND": 52500,
      "INTL_DEV_BLEND": 22500
    },
    "taxable": {
      "US_LC_BLEND": 35000,
      "INTL_DEV_BLEND": 12500,
      "CASH": 2500
    }
  },
  "household_allocation": {
    "US_LC_BLEND": 0.35,
    "INTL_DEV_BLEND": 0.20,
    "US_TREASURY_INTER": 0.25,
    "US_CORP_IG": 0.15,
    "CASH": 0.05
  },
  "tax_metrics": {
    "estimated_tax_drag": 0.012,
    "asset_location_efficiency": 0.82
  },
  "diversification_score": 0.78,
  "rebalancing_needed": false,
  "recommendations": [
    "✅ Portfolio is well-optimized for your 20-year retirement goal.",
    "📊 Asset location efficiency is 82%. Consider moving more bonds to tax-deferred accounts."
  ]
}
```

---

### 4. ESG Screening

#### POST `/esg-screening`

Screen assets based on ESG/ethical criteria.

**Request Body:**
```json
{
  "asset_codes": ["US_LC_BLEND", "US_ESG", "ENERGY", "INTL_ESG", "GREEN_BOND"],
  "exclusions": ["fossil_fuels", "tobacco"],
  "required_criteria": ["climate_change"],
  "minimum_esg_rating": "average",
  "allow_not_rated": true
}
```

**Response:**
```json
{
  "eligible_assets": ["US_ESG", "INTL_ESG", "GREEN_BOND", "US_LC_BLEND"],
  "excluded_assets": {
    "ENERGY": "Excluded: fossil_fuels"
  },
  "portfolio_esg_score": 75.0,
  "recommendations": [
    "✅ 4 of 5 assets meet your ESG criteria.",
    "Consider increasing allocation to US_ESG and GREEN_BOND for higher ESG scores."
  ],
  "summary": "Portfolio has high ESG alignment with 75/100 score"
}
```

---

#### GET `/esg-presets`

Get available ESG screening presets.

**Response:**
```json
{
  "presets": [
    {
      "name": "conservative",
      "label": "Conservative",
      "description": "Strict ESG criteria with multiple exclusions",
      "exclusions": ["fossil_fuels", "tobacco", "weapons", "gambling", "alcohol"],
      "required_criteria": ["climate_change", "renewable_energy"],
      "minimum_esg_rating": "leader",
      "minimum_overall_score": 75,
      "allow_not_rated": false
    },
    {
      "name": "moderate",
      "label": "Moderate",
      "description": "Balanced ESG approach",
      "exclusions": ["fossil_fuels", "tobacco", "weapons"],
      "required_criteria": [],
      "minimum_esg_rating": "average",
      "minimum_overall_score": 60,
      "allow_not_rated": true
    },
    {
      "name": "light",
      "label": "Light",
      "description": "Basic ESG screening",
      "exclusions": ["tobacco"],
      "required_criteria": [],
      "minimum_esg_rating": "average",
      "minimum_overall_score": null,
      "allow_not_rated": true
    },
    {
      "name": "none",
      "label": "No Screening",
      "description": "No ESG restrictions",
      "exclusions": [],
      "required_criteria": [],
      "minimum_esg_rating": "laggard",
      "minimum_overall_score": null,
      "allow_not_rated": true
    }
  ]
}
```

---

### 5. Portfolio Insights

#### POST `/insights`

Generate AI-powered portfolio insights.

**Request Body:**
```json
{
  "portfolio_allocation": {
    "US_LC_BLEND": 0.50,
    "US_TREASURY_INTER": 0.30,
    "US_CORP_IG": 0.20
  },
  "performance_metrics": {
    "total_return_1y": 0.10,
    "sharpe_ratio_1y": 0.85,
    "vs_benchmark_1y": 0.02
  }
}
```

**Response:**
```json
[
  {
    "category": "diversification",
    "title": "Good Portfolio Diversification",
    "description": "Your portfolio has adequate diversification with a score of 72%.",
    "impact": "positive",
    "confidence": 0.85,
    "data": {
      "diversification_score": 0.72,
      "position_count": 3
    }
  },
  {
    "category": "performance",
    "title": "Outperforming Benchmark",
    "description": "Portfolio is beating its benchmark by 2.0% annually.",
    "impact": "positive",
    "confidence": 0.90,
    "data": {
      "alpha": 0.02,
      "sharpe_ratio": 0.85
    }
  }
]
```

---

### 6. Portfolio Alerts

#### POST `/alerts`

Generate proactive portfolio alerts.

**Request Body:**
```json
{
  "portfolio_allocation": {
    "US_LC_BLEND": 0.45,
    "US_TREASURY_INTER": 0.55
  },
  "target_allocation": {
    "US_LC_BLEND": 0.60,
    "US_TREASURY_INTER": 0.40
  },
  "performance_metrics": {
    "vs_benchmark_1y": -0.03
  },
  "holdings_detail": {
    "average_expense_ratio": 0.015,
    "positions_with_losses": [
      {"security": "VTI", "unrealized_loss": -2500}
    ]
  }
}
```

**Response:**
```json
[
  {
    "type": "drift_threshold",
    "severity": "warning",
    "title": "Portfolio Rebalancing Needed",
    "message": "2 asset(s) have drifted more than 5% from target allocation.",
    "recommendation": "Review and rebalance portfolio to restore target allocation. Use tax-loss harvesting if rebalancing in taxable accounts.",
    "created_at": "2025-11-01T10:30:00Z"
  },
  {
    "type": "high_fees",
    "severity": "warning",
    "title": "High Portfolio Fees",
    "message": "Average expense ratio is 1.50%, which is above recommended 0.50%.",
    "recommendation": "Consider switching to lower-cost index funds. Over 30 years, a 1% fee difference can reduce returns by 25%.",
    "created_at": "2025-11-01T10:30:00Z"
  },
  {
    "type": "tax_loss_opportunity",
    "severity": "info",
    "title": "Tax-Loss Harvesting Opportunity",
    "message": "$2,500 in unrealized losses available for tax-loss harvesting.",
    "recommendation": "Consider selling losing positions to offset capital gains. Reinvest in similar (but not substantially identical) securities to maintain exposure.",
    "created_at": "2025-11-01T10:30:00Z"
  }
]
```

---

### 7. Health & Summary

#### GET `/health`

Check service health status.

**Response:**
```json
{
  "status": "healthy",
  "service": "Portfolio Optimization API",
  "asset_classes_available": 45
}
```

---

#### GET `/summary`

Get service capabilities summary.

**Response:**
```json
{
  "name": "Portfolio Optimization Service",
  "version": "3.0.0",
  "features": [
    "45+ asset classes",
    "Multi-level optimization",
    "ESG/ethical screening",
    "Portfolio insights",
    "Proactive alerts",
    "Tax-aware optimization"
  ],
  "api_endpoints": 11
}
```

---

## Error Handling

All endpoints return standard HTTP status codes:

- `200 OK` - Request successful
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Missing or invalid authentication
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation error
- `500 Internal Server Error` - Server error

**Error Response Format:**
```json
{
  "detail": "Error message describing what went wrong"
}
```

---

## Rate Limiting

- **Standard tier:** 100 requests per minute
- **Premium tier:** 1000 requests per minute

Rate limit headers are included in all responses:
- `X-RateLimit-Limit`: Maximum requests per minute
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Unix timestamp when limit resets

---

## Best Practices

### 1. Caching

Cache asset class data locally as it rarely changes:
```javascript
const assetClasses = await getAllAssetClasses();
// Cache for 24 hours
localStorage.setItem('asset_classes', JSON.stringify(assetClasses));
localStorage.setItem('asset_classes_timestamp', Date.now());
```

### 2. Debouncing

Debounce optimization requests when users adjust sliders:
```javascript
const debouncedOptimize = debounce(async (params) => {
  await optimizePortfolio(params);
}, 500); // Wait 500ms after last change
```

### 3. Progressive Enhancement

Start with simple allocation, then upgrade to multi-level:
```javascript
// Step 1: Simple allocation
const simple = await getSimpleAllocation({
  risk_tolerance: 0.6,
  time_horizon: 20
});

// Step 2: If user has multiple accounts, upgrade to multi-level
if (accounts.length > 1) {
  const optimized = await multiLevelOptimization({
    accounts,
    goals,
    asset_codes: Object.keys(simple.allocation)
  });
}
```

### 4. Error Recovery

Implement retry logic with exponential backoff:
```javascript
async function optimizeWithRetry(request, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await multiLevelOptimization(request);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000); // 1s, 2s, 4s
    }
  }
}
```

---

## SDK Examples

### React Hook

```typescript
import { usePortfolioOptimization } from '@/hooks/usePortfolioOptimization';

function Portfolio() {
  const {
    optimizationResult,
    loadingOptimization,
    optimizePortfolio
  } = usePortfolioOptimization();

  const handleOptimize = async () => {
    await optimizePortfolio({
      accounts: myAccounts,
      goals: myGoals
    });
  };

  return (
    <div>
      <button onClick={handleOptimize} disabled={loadingOptimization}>
        Optimize
      </button>
      {optimizationResult && (
        <Results data={optimizationResult} />
      )}
    </div>
  );
}
```

### Python Client

```python
import requests

class PortfolioOptimizationClient:
    def __init__(self, base_url, api_key):
        self.base_url = base_url
        self.headers = {"Authorization": f"Bearer {api_key}"}

    def optimize(self, accounts, goals):
        response = requests.post(
            f"{self.base_url}/multi-level-optimization",
            json={"accounts": accounts, "goals": goals},
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

# Usage
client = PortfolioOptimizationClient(
    "https://api.wealthnavigator.ai/api/v1/portfolio-optimization",
    "your_api_key"
)

result = client.optimize(accounts=[...], goals=[...])
```

---

## Support & Resources

- **Quick Start Guide:** `/backend/PORTFOLIO_QUICK_START_GUIDE.md`
- **Implementation Details:** `/backend/SECTION_3_PORTFOLIO_OPTIMIZATION_COMPLETION.md`
- **API Reference:** `http://localhost:8000/docs` (Swagger UI)
- **Test Examples:** `/backend/tests/api/v1/test_portfolio_optimization_api.py`

---

## Changelog

### v3.0.0 (2025-11-01)
- ✅ Added 45 asset classes across 6 categories
- ✅ Implemented multi-level optimization (Goal, Account, Household)
- ✅ Added ESG screening with 4 presets
- ✅ Implemented portfolio insights (6 categories)
- ✅ Added proactive alerts (9 types)
- ✅ Tax-aware optimization with location efficiency
- ✅ Comprehensive OpenAPI documentation
- ✅ React components and hooks
- ✅ 101/109 tests passing (92.7%)

---

**Happy Optimizing! 📈**
