# Risk Management API Documentation

## Overview

The Risk Management API provides comprehensive risk assessment, stress testing, and hedging strategy recommendations for portfolio management. This system implements institutional-grade risk analytics including Value at Risk (VaR), stress testing with historical scenarios, and options-based hedging strategies.

**Version:** 1.0.0
**Base URL:** `/api/v1/risk-management`
**Total Endpoints:** 6

---

## Table of Contents

1. [API Endpoints](#api-endpoints)
2. [Request/Response Models](#requestresponse-models)
3. [Usage Examples](#usage-examples)
4. [Risk Metrics Reference](#risk-metrics-reference)
5. [Stress Test Scenarios](#stress-test-scenarios)
6. [Hedging Strategies](#hedging-strategies)
7. [Error Handling](#error-handling)
8. [Integration Guide](#integration-guide)

---

## API Endpoints

### 1. POST /assess-risk
**Comprehensive Portfolio Risk Assessment**

Calculate 20+ risk metrics including VaR, CVaR, Sharpe ratio, Sortino ratio, maximum drawdown, beta, alpha, and more.

**Request Body:**
```json
{
  "portfolio_value": 500000,
  "allocation": {
    "US_LC_BLEND": 0.40,
    "INTL_DEV_BLEND": 0.20,
    "US_TREASURY_INTER": 0.30,
    "GOLD": 0.10
  },
  "expected_return": 0.08,
  "volatility": 0.15,
  "returns_history": [0.001, -0.002, 0.003, ...],  // Optional
  "benchmark_returns": [0.001, -0.001, 0.002, ...]  // Optional
}
```

**Response:**
```json
{
  "portfolio_value": 500000,
  "metrics": {
    "var_95_1day": 9712,
    "var_99_1day": 15284,
    "var_95_1month": 42893,
    "var_99_1month": 59823,
    "cvar_95": 12140,
    "cvar_99": 19105,
    "sharpe_ratio": 0.267,
    "sortino_ratio": 0.378,
    "calmar_ratio": 0.267,
    "max_drawdown": 0.30,
    "avg_drawdown": 0.12,
    "recovery_duration_days": 120,
    "beta": 0.88,
    "alpha": 0.005,
    "tracking_error": 0.03,
    "information_ratio": 0.167,
    "skewness": -0.45,
    "kurtosis": 3.2,
    "annual_volatility": 0.15,
    "concentration_score": 42.5,
    "risk_score": 45.2,
    "risk_level": "moderate"
  },
  "recommendations": [
    "✅ Portfolio risk profile is well-balanced.",
    "✅ Sharpe ratio indicates positive risk-adjusted returns.",
    "💡 Consider increasing diversification to reduce concentration risk."
  ],
  "warnings": [
    "⚠️ Max drawdown of 30.0% may be significant during market stress."
  ],
  "timestamp": "2025-11-01T10:30:00Z"
}
```

**Risk Levels:**
- `conservative`: Risk score 0-25
- `moderate`: Risk score 25-50
- `aggressive`: Risk score 50-75
- `very_aggressive`: Risk score 75-100

---

### 2. POST /stress-test
**Portfolio Stress Testing with Scenarios**

Run comprehensive stress tests using historical and hypothetical market scenarios.

**Request Body:**
```json
{
  "portfolio_value": 500000,
  "allocation": {
    "US_LC_BLEND": 0.60,
    "US_TREASURY_INTER": 0.30,
    "GOLD": 0.10
  },
  "scenarios": ["2008_financial_crisis", "2020_covid_crash", "recession"],  // Optional
  "include_all_presets": true  // Optional, default true
}
```

**Response:**
```json
{
  "portfolio_value": 500000,
  "scenarios_tested": 7,
  "results": [
    {
      "scenario_name": "2008 Financial Crisis",
      "original_value": 500000,
      "stressed_value": 315000,
      "value_change": -185000,
      "pct_change": -0.37,
      "asset_impacts": {
        "US_LC_BLEND": -111000,
        "US_TREASURY_INTER": 7500,
        "GOLD": 2500
      },
      "risk_metrics_change": {
        "volatility_change": 0.185,
        "sharpe_change": -0.74,
        "max_drawdown": 0.37
      },
      "severity": "catastrophic"
    }
    // ... more scenarios
  ],
  "worst_case_scenario": {
    "scenario_name": "2008 Financial Crisis",
    "value_change": -185000,
    "pct_change": -0.37,
    "severity": "catastrophic"
  },
  "best_case_scenario": {
    "scenario_name": "1987 Black Monday",
    "value_change": -65000,
    "pct_change": -0.13,
    "severity": "moderate"
  },
  "average_impact": -128000,
  "value_at_risk_stress": 175000
}
```

**Severity Levels:**
- `mild`: <5% loss
- `moderate`: 5-15% loss
- `severe`: 15-30% loss
- `catastrophic`: >30% loss

---

### 3. POST /hedging-strategies
**Hedging Strategy Recommendations**

Get comprehensive hedging strategy recommendations based on portfolio risk profile.

**Request Body:**
```json
{
  "portfolio_value": 500000,
  "allocation": {
    "US_LC_BLEND": 0.70,
    "US_TREASURY_INTER": 0.30
  },
  "risk_metrics": {
    "annual_volatility": 0.18,
    "beta": 1.15,
    "max_drawdown": 0.28,
    "risk_level": "aggressive"
  },
  "market_conditions": {
    "vix": 25,
    "market_regime": "volatile"
  }
}
```

**Response:**
```json
{
  "portfolio_value": 500000,
  "current_risk_level": "aggressive",
  "optimal_strategy": {
    "strategy_type": "collar",
    "name": "Collar Strategy",
    "description": "Buy protective puts while selling calls to offset cost",
    "cost_estimate": 2500,
    "cost_pct": 0.005,
    "protection_level": 0.90,
    "implementation_steps": [
      "Buy 90% strike puts on equity portfolio",
      "Sell 110% strike calls to offset cost",
      "Monitor positions monthly for adjustments",
      "Roll positions before expiration"
    ],
    "pros": [
      "Low/zero net cost if structured properly",
      "Protection against significant downside",
      "Maintains core portfolio positions"
    ],
    "cons": [
      "Caps upside potential",
      "Requires active management",
      "Transaction costs on entry and exit"
    ],
    "suitability_score": 85,
    "when_to_use": "Moderate volatility with desire to maintain upside participation"
  },
  "recommended_strategies": [
    // Array of all 7 hedging strategies ranked by suitability
  ],
  "market_conditions_note": "Current volatility elevated - hedging cost higher than normal",
  "implementation_priority": "high",
  "total_cost_estimate": 8750
}
```

---

### 4. POST /monte-carlo-stress
**Monte Carlo Simulation Stress Testing**

Run Monte Carlo simulation for probabilistic stress testing.

**Request Body:**
```json
{
  "portfolio_value": 500000,
  "allocation": {
    "US_LC_BLEND": 0.60,
    "US_TREASURY_INTER": 0.40
  },
  "asset_volatilities": {
    "US_LC_BLEND": 0.18,
    "US_TREASURY_INTER": 0.05
  },
  "n_simulations": 10000,  // Optional, default 10000
  "confidence_level": 0.05  // Optional, default 0.05 (95% VaR)
}
```

**Response:**
```json
{
  "simulations": 10000,
  "mean_value": 500250,
  "median_value": 500180,
  "std_deviation": 22500,
  "var_value": 463000,
  "var_loss": 37000,
  "cvar_value": 451000,
  "cvar_loss": 49000,
  "worst_case_value": 423000,
  "worst_loss": 77000,
  "confidence_level": 0.05
}
```

---

### 5. GET /stress-scenarios
**List Available Stress Test Scenarios**

Get all available preset stress test scenarios with descriptions.

**Response:**
```json
{
  "scenarios": [
    {
      "name": "2008 Financial Crisis",
      "description": "Global financial crisis scenario",
      "type": "historical",
      "probability": 0.01,
      "key": "2008_financial_crisis"
    },
    {
      "name": "COVID-19 Market Crash",
      "description": "March 2020 pandemic shock",
      "type": "historical",
      "probability": 0.02,
      "key": "2020_covid_crash"
    }
    // ... 5 more scenarios
  ],
  "total": 7
}
```

---

### 6. GET /health
**Health Check**

Check service health status.

**Response:**
```json
{
  "status": "healthy",
  "service": "Risk Management API",
  "endpoints": 6
}
```

---

## Request/Response Models

### RiskAssessmentRequest
```typescript
interface RiskAssessmentRequest {
  portfolio_value: number;           // Portfolio value in USD
  allocation: Record<string, number>; // Asset allocation weights (sum to 1.0)
  expected_return: number;            // Expected annual return (e.g., 0.08 = 8%)
  volatility: number;                 // Annual volatility (e.g., 0.15 = 15%)
  returns_history?: number[];         // Optional historical daily returns
  benchmark_returns?: number[];       // Optional benchmark daily returns
}
```

### RiskMetrics
```typescript
interface RiskMetrics {
  // Value at Risk
  var_95_1day: number;      // 95% confidence, 1-day VaR
  var_99_1day: number;      // 99% confidence, 1-day VaR
  var_95_1month: number;    // 95% confidence, 1-month VaR
  var_99_1month: number;    // 99% confidence, 1-month VaR

  // Conditional VaR (Expected Shortfall)
  cvar_95: number;          // Expected loss beyond 95% VaR
  cvar_99: number;          // Expected loss beyond 99% VaR

  // Risk-Adjusted Returns
  sharpe_ratio: number;     // (Return - RiskFree) / Volatility
  sortino_ratio: number;    // (Return - RiskFree) / Downside Volatility
  calmar_ratio: number;     // Return / Max Drawdown

  // Drawdown Metrics
  max_drawdown: number;     // Maximum peak-to-trough decline
  avg_drawdown: number;     // Average drawdown
  recovery_duration_days: number;  // Days to recover from drawdown

  // Market Risk (CAPM)
  beta: number;             // Portfolio beta vs benchmark
  alpha: number;            // Excess return vs expected
  tracking_error: number;   // Standard deviation of excess returns
  information_ratio: number; // Alpha / Tracking Error

  // Distribution Characteristics
  skewness: number;         // Distribution asymmetry
  kurtosis: number;         // Tail risk measure
  annual_volatility: number; // Annualized standard deviation

  // Diversification
  concentration_score: number; // 0-100, HHI-based

  // Overall Risk
  risk_score: number;       // Composite risk score 0-100
  risk_level: string;       // conservative/moderate/aggressive/very_aggressive
}
```

---

## Usage Examples

### Example 1: Basic Risk Assessment

```python
import requests

# Configure request
request = {
    "portfolio_value": 1000000,
    "allocation": {
        "US_LC_BLEND": 0.50,
        "US_TREASURY_INTER": 0.40,
        "GOLD": 0.10
    },
    "expected_return": 0.07,
    "volatility": 0.12
}

# Call API
response = requests.post(
    "http://localhost:8000/api/v1/risk-management/assess-risk",
    json=request
)

result = response.json()
print(f"Risk Level: {result['metrics']['risk_level']}")
print(f"Risk Score: {result['metrics']['risk_score']}")
print(f"95% VaR (1-day): ${result['metrics']['var_95_1day']:,.0f}")
print(f"Sharpe Ratio: {result['metrics']['sharpe_ratio']:.3f}")
```

### Example 2: Stress Testing

```python
# Run stress test with specific scenarios
stress_request = {
    "portfolio_value": 1000000,
    "allocation": {
        "US_LC_BLEND": 0.70,
        "US_TREASURY_INTER": 0.30
    },
    "scenarios": [
        "2008_financial_crisis",
        "2020_covid_crash",
        "recession"
    ]
}

response = requests.post(
    "http://localhost:8000/api/v1/risk-management/stress-test",
    json=stress_request
)

result = response.json()
worst = result['worst_case_scenario']
print(f"Worst Case: {worst['scenario_name']}")
print(f"Loss: ${worst['value_change']:,.0f} ({worst['pct_change']:.1%})")
print(f"Severity: {worst['severity']}")
```

### Example 3: Hedging Recommendations

```python
# Get hedging strategy recommendations
hedging_request = {
    "portfolio_value": 1000000,
    "allocation": {
        "US_LC_BLEND": 0.80,
        "US_TREASURY_INTER": 0.20
    },
    "risk_metrics": {
        "annual_volatility": 0.20,
        "beta": 1.3,
        "max_drawdown": 0.35,
        "risk_level": "aggressive"
    }
}

response = requests.post(
    "http://localhost:8000/api/v1/risk-management/hedging-strategies",
    json=hedging_request
)

result = response.json()
optimal = result['optimal_strategy']
print(f"Optimal Strategy: {optimal['name']}")
print(f"Cost: ${optimal['cost_estimate']:,.0f} ({optimal['cost_pct']:.2%})")
print(f"Protection Level: {optimal['protection_level']:.0%}")
print(f"Suitability Score: {optimal['suitability_score']}/100")
```

### Example 4: Monte Carlo Simulation

```python
# Run Monte Carlo stress test
mc_request = {
    "portfolio_value": 1000000,
    "allocation": {
        "US_LC_BLEND": 0.60,
        "US_TREASURY_INTER": 0.40
    },
    "asset_volatilities": {
        "US_LC_BLEND": 0.18,
        "US_TREASURY_INTER": 0.05
    },
    "n_simulations": 10000,
    "confidence_level": 0.05
}

response = requests.post(
    "http://localhost:8000/api/v1/risk-management/monte-carlo-stress",
    json=mc_request
)

result = response.json()
print(f"Simulations: {result['simulations']:,}")
print(f"Mean Value: ${result['mean_value']:,.0f}")
print(f"95% VaR Loss: ${result['var_loss']:,.0f}")
print(f"95% CVaR Loss: ${result['cvar_loss']:,.0f}")
print(f"Worst Case Loss: ${result['worst_loss']:,.0f}")
```

---

## Risk Metrics Reference

### Value at Risk (VaR)

**Definition:** Maximum expected loss at a given confidence level over a time horizon.

**Calculation Methods:**
1. **Parametric VaR:** Assumes normal distribution
   - VaR = Portfolio Value × Volatility × Z-score
   - Z-score: -1.645 (95%), -2.326 (99%)

2. **Historical Simulation VaR:** Uses actual return distribution
   - Sort historical returns
   - Find percentile corresponding to confidence level

**Interpretation:**
- 95% VaR of $10,000: Expected to lose ≤$10,000 on 95% of days
- 99% VaR of $20,000: Expected to lose ≤$20,000 on 99% of days

### Conditional VaR (CVaR)

**Definition:** Expected loss given that VaR threshold has been exceeded.

**Formula:** CVaR = E[Loss | Loss > VaR]

**Interpretation:**
- CVaR of $15,000 with 95% VaR: If loss exceeds VaR, expect average loss of $15,000
- Always ≥ VaR (worst losses are typically larger than threshold)

### Sharpe Ratio

**Definition:** Risk-adjusted return measure.

**Formula:** (Portfolio Return - Risk-Free Rate) / Portfolio Volatility

**Interpretation:**
- < 1.0: Poor risk-adjusted returns
- 1.0-2.0: Good risk-adjusted returns
- > 2.0: Excellent risk-adjusted returns

### Sortino Ratio

**Definition:** Risk-adjusted return using downside deviation instead of total volatility.

**Formula:** (Portfolio Return - Risk-Free Rate) / Downside Deviation

**Interpretation:**
- Higher than Sharpe if returns skewed positive
- Penalizes only downside volatility
- Preferred for asymmetric return distributions

### Beta

**Definition:** Portfolio sensitivity to market movements.

**Formula:** Covariance(Portfolio, Market) / Variance(Market)

**Interpretation:**
- β = 1.0: Moves in line with market
- β < 1.0: Less volatile than market
- β > 1.0: More volatile than market

### Maximum Drawdown

**Definition:** Largest peak-to-trough decline in portfolio value.

**Calculation:**
1. Track running maximum (peak)
2. Calculate drawdown at each point: (Current - Peak) / Peak
3. Take minimum drawdown

**Interpretation:**
- -30% max drawdown: Portfolio lost 30% from peak at worst point
- Key metric for downside risk

---

## Stress Test Scenarios

### Historical Scenarios

#### 1. 2008 Financial Crisis
- **Type:** Historical
- **Probability:** 1% per year
- **Impact:** US Large Cap -37%, International -43%, EM -53%
- **Duration:** Peak to trough ~18 months
- **Key Features:** Credit crisis, banking failures, global contagion

#### 2. 2020 COVID-19 Crash
- **Type:** Historical
- **Probability:** 2% per year
- **Impact:** US Large Cap -34%, US Small Cap -45%
- **Duration:** Peak to trough ~1 month (fastest recovery in history)
- **Key Features:** Pandemic, unprecedented fiscal/monetary response

#### 3. 2000 Dot-Com Bubble
- **Type:** Historical
- **Probability:** 1.5% per year
- **Impact:** US Large Cap -49%, US Growth -62%
- **Duration:** Peak to trough ~2.5 years
- **Key Features:** Tech bubble, valuation correction

#### 4. 1987 Black Monday
- **Type:** Historical
- **Probability:** 0.5% per year
- **Impact:** US stocks -22% in single day
- **Duration:** Single day event
- **Key Features:** Program trading, market panic

### Hypothetical Scenarios

#### 5. Rising Interest Rates
- **Type:** Hypothetical
- **Probability:** 10% per year
- **Impact:** Bonds -10%, REITs -20%, High Yield -25%
- **Key Features:** Fed aggressive tightening

#### 6. Economic Recession
- **Type:** Hypothetical
- **Probability:** 15% per year
- **Impact:** Stocks -20 to -30%, Credit spreads widen
- **Key Features:** Standard economic contraction

#### 7. Stagflation
- **Type:** Hypothetical
- **Probability:** 8% per year
- **Impact:** Stocks -15%, Bonds -8%, Commodities +15%
- **Key Features:** High inflation + low growth

---

## Hedging Strategies

### 1. Protective Put
**Description:** Buy put options to protect downside.

**Pros:**
- Unlimited upside potential
- Defined maximum loss
- Simple to implement

**Cons:**
- Direct cost to portfolio (2-5% annually)
- Time decay if market stable
- Requires rolling positions

**Best For:** Conservative investors, pre-retirement

**Typical Cost:** 2-5% of portfolio value annually

### 2. Collar Strategy
**Description:** Buy protective puts + sell calls to offset cost.

**Pros:**
- Low/zero net cost if structured properly
- Protection against significant downside
- Maintains core positions

**Cons:**
- Caps upside potential
- Requires active management
- Transaction costs

**Best For:** Moderate volatility, maintain upside participation

**Typical Cost:** 0-2% of portfolio value annually

### 3. Put Spread
**Description:** Buy put + sell lower strike put.

**Pros:**
- Lower cost than protective put
- Still provides meaningful protection
- Flexible strike selection

**Cons:**
- Limited protection below lower strike
- More complex than simple put
- Requires monitoring

**Best For:** Cost-conscious investors, mild downturn protection

**Typical Cost:** 1-3% of portfolio value annually

### 4. Tail Risk Hedge
**Description:** Deep out-of-the-money puts for extreme events.

**Pros:**
- Very low cost
- Massive payoff in crisis
- No upside cap

**Cons:**
- Expires worthless most of the time
- Requires discipline to maintain
- "Fire insurance" mindset needed

**Best For:** Black swan protection, aggressive portfolios

**Typical Cost:** 0.5-1% of portfolio value annually

### 5. Diversification
**Description:** Add uncorrelated or negatively correlated assets.

**Pros:**
- No ongoing cost
- Improves overall risk/return profile
- Permanent portfolio change

**Cons:**
- May reduce returns in bull markets
- Requires rebalancing
- Correlation can change

**Best For:** All investors, foundational strategy

**Typical Cost:** Opportunity cost only

### 6. Volatility Hedge
**Description:** Long VIX futures or options.

**Pros:**
- Direct volatility exposure
- High payoff when market stressed
- Liquid instruments

**Cons:**
- Steep contango costs
- Requires active management
- Can lose value quickly

**Best For:** Sophisticated investors, tactical hedging

**Typical Cost:** 3-8% annually due to contango

### 7. Inverse ETF
**Description:** Short market exposure via inverse ETFs.

**Pros:**
- Simple to implement
- Liquid and transparent
- No options expertise required

**Cons:**
- Daily reset causes tracking error
- Not suitable for long-term holding
- Loses value in stable markets

**Best For:** Short-term tactical hedges only

**Typical Cost:** Expense ratio + tracking error

---

## Error Handling

### HTTP Status Codes

- **200 OK:** Request successful
- **400 Bad Request:** Invalid request parameters
- **422 Unprocessable Entity:** Validation error
- **500 Internal Server Error:** Server error

### Common Validation Errors

```json
{
  "detail": [
    {
      "loc": ["body", "portfolio_value"],
      "msg": "ensure this value is greater than 0",
      "type": "value_error.number.not_gt"
    }
  ]
}
```

### Error Response Format

```json
{
  "detail": "Error message describing the issue"
}
```

### Handling Errors in Client Code

```typescript
try {
  const result = await assessRisk(request);
  // Handle success
} catch (error) {
  if (error.response?.status === 422) {
    // Validation error - check request parameters
  } else if (error.response?.status === 500) {
    // Server error - retry or contact support
  } else {
    // Network error or other issue
  }
}
```

---

## Integration Guide

### Frontend Integration

#### 1. Import API Client

```typescript
import {
  assessRisk,
  runStressTest,
  getHedgingRecommendations,
  runMonteCarloStress,
  getStressScenarios,
} from '@/services/riskManagementApi';
```

#### 2. Use React Hook

```typescript
import { useRiskManagement } from '@/hooks/useRiskManagement';

function RiskDashboard() {
  const {
    riskResult,
    loadingRisk,
    riskError,
    assessPortfolioRisk,
  } = useRiskManagement();

  useEffect(() => {
    assessPortfolioRisk({
      portfolio_value: 500000,
      allocation: { US_LC_BLEND: 0.6, US_TREASURY_INTER: 0.4 },
      expected_return: 0.08,
      volatility: 0.15,
    });
  }, []);

  if (loadingRisk) return <LoadingSpinner />;
  if (riskError) return <ErrorMessage error={riskError} />;

  return <RiskMetricsDisplay data={riskResult} />;
}
```

#### 3. Use Components

```typescript
import { RiskDashboard } from '@/components/risk/RiskDashboard';
import { HedgingStrategies } from '@/components/risk/HedgingStrategies';

function App() {
  return (
    <>
      <RiskDashboard
        portfolioValue={500000}
        allocation={{ US_LC_BLEND: 0.6, US_TREASURY_INTER: 0.4 }}
        expectedReturn={0.08}
        volatility={0.15}
      />

      <HedgingStrategies
        portfolioValue={500000}
        allocation={{ US_LC_BLEND: 0.7, US_TREASURY_INTER: 0.3 }}
        riskMetrics={{
          annual_volatility: 0.18,
          beta: 1.15,
          risk_level: 'aggressive'
        }}
      />
    </>
  );
}
```

### Backend Integration

#### 1. Import Services

```python
from app.services.risk.risk_assessment import RiskAssessmentService
from app.services.risk.stress_testing import StressTestingService
from app.services.risk.hedging_strategies import HedgingService
```

#### 2. Use in Your Code

```python
# Risk assessment
risk_service = RiskAssessmentService()
result = risk_service.assess_risk(
    portfolio_value=500000,
    allocation={"US_LC_BLEND": 0.6, "US_TREASURY_INTER": 0.4},
    expected_return=0.08,
    volatility=0.15
)

# Stress testing
stress_service = StressTestingService()
suite = stress_service.run_stress_test_suite(
    portfolio_value=500000,
    allocation={"US_LC_BLEND": 0.6, "US_TREASURY_INTER": 0.4},
    scenarios=["2008_financial_crisis", "2020_covid_crash"]
)

# Hedging recommendations
hedging_service = HedgingService()
recommendations = hedging_service.recommend_hedging_strategies(
    portfolio_value=500000,
    allocation={"US_LC_BLEND": 0.7, "US_TREASURY_INTER": 0.3},
    risk_metrics={"annual_volatility": 0.18, "beta": 1.15}
)
```

---

## Performance Considerations

### Optimization Tips

1. **Cache Risk Assessments:** Risk metrics don't change frequently - cache for 1 hour
2. **Batch Stress Tests:** Run all scenarios together rather than individually
3. **Limit Monte Carlo Simulations:** 10,000 simulations provides good accuracy
4. **Use Parametric VaR:** Faster than historical simulation for real-time dashboards

### Rate Limits

No rate limits currently enforced. Recommended client-side throttling:
- Risk assessment: Max 10 requests/minute
- Stress testing: Max 5 requests/minute
- Monte Carlo: Max 2 requests/minute (computationally expensive)

---

## Best Practices

1. **Always Include Returns History:** Provides more accurate VaR/CVaR calculations
2. **Run Multiple Scenarios:** Don't rely on single stress test
3. **Consider Correlations:** Asset correlations change during crises
4. **Monitor Regularly:** Risk metrics should be reviewed monthly
5. **Combine Strategies:** Use multiple hedging strategies for robustness
6. **Document Assumptions:** Risk models depend on assumptions - document them
7. **Backtest Strategies:** Test hedging strategies on historical data

---

## Support

For API support or questions:
- Documentation: [GitHub Repository]
- Issues: [GitHub Issues]
- Email: support@wealthnavigator.ai

---

**Last Updated:** November 1, 2025
**Version:** 1.0.0
