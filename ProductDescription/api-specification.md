# API Specification: WealthNavigator AI
## Financial Planning & Portfolio Management Platform

**Version:** 1.0  
**Date:** October 28, 2025  
**Base URL:** `https://api.wealthnavigator.ai/v1`  
**Authentication:** JWT Bearer Token

---

## Table of Contents

1. [Authentication](#authentication)
2. [Thread Management](#thread-management)
3. [Chat & Streaming](#chat--streaming)
4. [Goal Management](#goal-management)
5. [Portfolio Operations](#portfolio-operations)
6. [Tax Optimization](#tax-optimization)
7. [Risk Analysis](#risk-analysis)
8. [Monte Carlo Simulations](#monte-carlo-simulations)
9. [Account Integration](#account-integration)
10. [User Profile](#user-profile)
11. [Analysis History](#analysis-history)
12. [Webhooks](#webhooks)

---

## Authentication

### POST /auth/register
Create new user account

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1980-05-15",
  "country": "US"
}
```

**Response:** `201 Created`
```json
{
  "userId": "usr_abc123",
  "email": "user@example.com",
  "accessToken": "eyJhbGc...",
  "refreshToken": "refresh_...",
  "expiresIn": 3600
}
```

---

### POST /auth/login
Authenticate existing user

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123!"
}
```

**Response:** `200 OK`
```json
{
  "userId": "usr_abc123",
  "accessToken": "eyJhbGc...",
  "refreshToken": "refresh_...",
  "expiresIn": 3600,
  "mfaRequired": false
}
```

---

### POST /auth/refresh
Refresh access token

**Request Body:**
```json
{
  "refreshToken": "refresh_..."
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "eyJhbGc...",
  "expiresIn": 3600
}
```

---

## Thread Management

### GET /threads
Retrieve all conversation threads for authenticated user

**Query Parameters:**
- `limit` (optional): Number of threads to return (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)
- `category` (optional): Filter by category: "today", "yesterday", "past7days", "past30days", "older"
- `goalType` (optional): Filter by goal type: "retirement", "education", "home", "emergency", "legacy"
- `search` (optional): Search query string

**Response:** `200 OK`
```json
{
  "threads": [
    {
      "id": "thd_uuid_123",
      "title": "Retirement Planning at Age 60",
      "createdAt": "2025-10-15T14:30:00Z",
      "updatedAt": "2025-10-28T09:15:00Z",
      "messageCount": 24,
      "goalTypes": ["retirement"],
      "analysisCount": 5,
      "lastMessage": "Based on your updated savings rate..."
    }
  ],
  "total": 15,
  "limit": 50,
  "offset": 0,
  "hasMore": false
}
```

---

### POST /threads
Create new conversation thread

**Request Body:**
```json
{
  "title": "College Savings Plan" // optional, will auto-generate if not provided
}
```

**Response:** `201 Created`
```json
{
  "id": "thd_uuid_456",
  "title": "College Savings Plan",
  "createdAt": "2025-10-28T10:00:00Z",
  "updatedAt": "2025-10-28T10:00:00Z",
  "messageCount": 0,
  "goalTypes": [],
  "analysisCount": 0
}
```

---

### GET /threads/{threadId}
Retrieve full thread with messages and analyses

**Path Parameters:**
- `threadId`: UUID of thread

**Query Parameters:**
- `includeMessages` (optional): Include full message history (default: true)
- `includeAnalyses` (optional): Include analysis results (default: false)

**Response:** `200 OK`
```json
{
  "id": "thd_uuid_123",
  "title": "Retirement Planning at Age 60",
  "createdAt": "2025-10-15T14:30:00Z",
  "updatedAt": "2025-10-28T09:15:00Z",
  "messages": [
    {
      "id": "msg_001",
      "role": "user",
      "content": "I want to retire at 60 with $80,000 per year",
      "timestamp": "2025-10-15T14:30:00Z"
    },
    {
      "id": "msg_002",
      "role": "assistant",
      "content": "I'll help you plan for retirement at 60. Let me gather some information...",
      "timestamp": "2025-10-15T14:30:15Z",
      "agentId": "orchestrator"
    }
  ],
  "goalTypes": ["retirement"],
  "analysisCount": 5
}
```

---

### PATCH /threads/{threadId}
Update thread metadata

**Path Parameters:**
- `threadId`: UUID of thread

**Request Body:**
```json
{
  "title": "Updated Retirement Plan"
}
```

**Response:** `200 OK`
```json
{
  "id": "thd_uuid_123",
  "title": "Updated Retirement Plan",
  "updatedAt": "2025-10-28T11:00:00Z"
}
```

---

### DELETE /threads/{threadId}
Soft delete thread (30-day recovery window)

**Path Parameters:**
- `threadId`: UUID of thread

**Response:** `200 OK`
```json
{
  "id": "thd_uuid_123",
  "deletedAt": "2025-10-28T11:30:00Z",
  "recoveryDeadline": "2025-11-27T11:30:00Z"
}
```

---

### POST /threads/{threadId}/restore
Restore soft-deleted thread

**Path Parameters:**
- `threadId`: UUID of thread

**Response:** `200 OK`
```json
{
  "id": "thd_uuid_123",
  "deletedAt": null,
  "restoredAt": "2025-10-28T12:00:00Z"
}
```

---

## Chat & Streaming

### POST /chat/stream
Stream AI responses via Server-Sent Events (SSE)

**Request Body:**
```json
{
  "threadId": "thd_uuid_123",
  "message": "What if I retire at 62 instead of 60?",
  "context": {
    "currentGoals": ["goal_123"],
    "preferences": {
      "detailLevel": "moderate"
    }
  }
}
```

**Response:** `200 OK` with `text/event-stream` content type

**SSE Event Types:**

#### connected
Connection established
```
event: connected
data: {"timestamp": "2025-10-28T10:00:00Z", "threadId": "thd_uuid_123"}
```

#### thread_created
New thread created (if starting new conversation)
```
event: thread_created
data: {"threadId": "thd_uuid_789", "title": "Retirement Age Analysis"}
```

#### query_started
Analysis query initiated
```
event: query_started
data: {"queryId": "qry_abc123", "query": "What if I retire at 62 instead of 60?", "timestamp": "2025-10-28T10:00:01Z"}
```

#### message
Text content streaming
```
event: message
data: {"content": "Based on your current savings", "messageId": "msg_456"}

event: message
data: {"content": " and portfolio allocation,", "messageId": "msg_456"}

event: message
data: {"content": " retiring at 62 would require...", "messageId": "msg_456"}
```

#### agent_activated
Specialist agent begins work
```
event: agent_activated
data: {
  "agentId": "retirement_planner",
  "agentName": "Retirement Planner",
  "task": "Analyzing retirement income scenarios",
  "timestamp": "2025-10-28T10:00:05Z"
}
```

#### agent_progress
Progress update from active agent
```
event: agent_progress
data: {
  "agentId": "monte_carlo_simulator",
  "agentName": "Monte Carlo Simulator",
  "progress": 45,
  "status": "Running simulations (2,250/5,000 complete)",
  "timestamp": "2025-10-28T10:00:20Z"
}
```

#### agent_complete
Agent finishes task
```
event: agent_complete
data: {
  "agentId": "retirement_planner",
  "agentName": "Retirement Planner",
  "result": {
    "retirementAge": 62,
    "successProbability": 0.78,
    "requiredSavings": "$2,150/month"
  },
  "timestamp": "2025-10-28T10:00:35Z"
}
```

#### result_generated
Analysis result ready
```
event: result_generated
data: {
  "resultId": "res_xyz789",
  "queryId": "qry_abc123",
  "type": "retirement_analysis",
  "summary": "Retiring at 62 is feasible with 78% success probability",
  "timestamp": "2025-10-28T10:00:40Z"
}
```

#### visualization_ready
Visualization component available
```
event: visualization_ready
data: {
  "visualizationId": "viz_123",
  "resultId": "res_xyz789",
  "type": "fan_chart",
  "title": "Portfolio Projections: Retire at 62",
  "componentUrl": "/api/visualizations/viz_123/component"
}
```

#### tool_call
Agent invokes external tool
```
event: tool_call
data: {
  "toolName": "portfolio_optimizer",
  "input": {"riskTolerance": 0.6, "timeHorizon": 18},
  "status": "executing"
}
```

#### tool_result
Tool execution result
```
event: tool_result
data: {
  "toolName": "portfolio_optimizer",
  "result": {"allocation": {"stocks": 0.65, "bonds": 0.35}},
  "status": "success"
}
```

#### result_saved
Result persisted to database
```
event: result_saved
data: {
  "resultId": "res_xyz789",
  "queryId": "qry_abc123",
  "savedAt": "2025-10-28T10:00:45Z"
}
```

#### error
Error occurred during processing
```
event: error
data: {
  "code": "PORTFOLIO_OPTIMIZATION_FAILED",
  "message": "Unable to optimize portfolio. Market data temporarily unavailable.",
  "retryable": true,
  "retryAfter": 30,
  "timestamp": "2025-10-28T10:01:00Z"
}
```

#### error_retry
Retry attempt after error
```
event: error_retry
data: {
  "attemptNumber": 2,
  "maxAttempts": 3,
  "nextRetryIn": 4,
  "reason": "Network timeout"
}
```

#### done
Stream complete
```
event: done
data: {
  "messageId": "msg_456",
  "queryId": "qry_abc123",
  "duration": 45.2,
  "timestamp": "2025-10-28T10:00:50Z"
}
```

---

### POST /chat/message
Send message without streaming (for simple queries)

**Request Body:**
```json
{
  "threadId": "thd_uuid_123",
  "message": "Show my goal progress"
}
```

**Response:** `200 OK`
```json
{
  "messageId": "msg_789",
  "response": "Here's your goal progress:\n\n- Retirement: 65% funded, 85% success probability\n- Education (Child 1): 40% funded, 92% success probability",
  "timestamp": "2025-10-28T10:05:00Z"
}
```

---

## Goal Management

### POST /goals
Create new financial goal

**Request Body:**
```json
{
  "name": "Retirement at 60",
  "category": "retirement",
  "targetAmount": 2000000,
  "targetDate": "2040-06-01",
  "priority": "essential",
  "successThreshold": 0.85,
  "description": "Retire at 60 with $80,000 annual income",
  "inflationAdjusted": true
}
```

**Response:** `201 Created`
```json
{
  "id": "goal_123",
  "name": "Retirement at 60",
  "category": "retirement",
  "targetAmount": 2000000,
  "currentFunding": 450000,
  "percentFunded": 0.225,
  "successProbability": 0.78,
  "requiredMonthlySavings": 2150,
  "createdAt": "2025-10-28T10:10:00Z"
}
```

---

### GET /goals
Retrieve all goals for user

**Query Parameters:**
- `category` (optional): Filter by category
- `priority` (optional): Filter by priority
- `status` (optional): "on_track", "at_risk", "off_track"

**Response:** `200 OK`
```json
{
  "goals": [
    {
      "id": "goal_123",
      "name": "Retirement at 60",
      "category": "retirement",
      "targetAmount": 2000000,
      "currentFunding": 450000,
      "percentFunded": 0.225,
      "successProbability": 0.78,
      "status": "on_track",
      "dueDate": "2040-06-01"
    }
  ]
}
```

---

### GET /goals/{goalId}
Retrieve detailed goal information

**Path Parameters:**
- `goalId`: Goal identifier

**Response:** `200 OK`
```json
{
  "id": "goal_123",
  "name": "Retirement at 60",
  "category": "retirement",
  "targetAmount": 2000000,
  "currentFunding": 450000,
  "percentFunded": 0.225,
  "successProbability": 0.78,
  "requiredMonthlySavings": 2150,
  "timeline": {
    "startDate": "2025-10-28",
    "targetDate": "2040-06-01",
    "yearsRemaining": 14.6
  },
  "fundingSource": {
    "accounts": ["acc_401k_123", "acc_ira_456"],
    "allocatedAmount": 450000
  },
  "projections": {
    "10thPercentile": 1200000,
    "50thPercentile": 2100000,
    "90thPercentile": 3500000
  }
}
```

---

### PATCH /goals/{goalId}
Update goal parameters

**Path Parameters:**
- `goalId`: Goal identifier

**Request Body:**
```json
{
  "targetAmount": 2200000,
  "targetDate": "2041-06-01"
}
```

**Response:** `200 OK`
```json
{
  "id": "goal_123",
  "updatedFields": ["targetAmount", "targetDate"],
  "successProbability": 0.82,
  "requiredMonthlySavings": 2050,
  "updatedAt": "2025-10-28T10:15:00Z"
}
```

---

### DELETE /goals/{goalId}
Delete goal

**Path Parameters:**
- `goalId`: Goal identifier

**Response:** `200 OK`
```json
{
  "id": "goal_123",
  "deletedAt": "2025-10-28T10:20:00Z"
}
```

---

## Portfolio Operations

### POST /portfolio/optimize
Run portfolio optimization

**Request Body:**
```json
{
  "goalIds": ["goal_123", "goal_456"],
  "riskTolerance": 0.6,
  "timeHorizon": 15,
  "constraints": {
    "minStocks": 0.4,
    "maxStocks": 0.8,
    "minBonds": 0.2,
    "maxBonds": 0.6,
    "excludeSectors": ["tobacco", "weapons"],
    "esgMinimum": 7
  },
  "optimizationObjective": "max_return" // or "min_risk", "max_sharpe"
}
```

**Response:** `200 OK`
```json
{
  "optimizationId": "opt_789",
  "recommendedAllocation": {
    "US_LargeCap": 0.25,
    "US_SmallCap": 0.15,
    "International_Developed": 0.15,
    "Emerging_Markets": 0.05,
    "US_Bonds": 0.25,
    "International_Bonds": 0.10,
    "REITs": 0.05
  },
  "expectedReturn": 0.078,
  "expectedVolatility": 0.142,
  "sharpeRatio": 0.52,
  "efficientFrontierPosition": "optimal",
  "timestamp": "2025-10-28T10:25:00Z"
}
```

---

### GET /portfolio/current
Retrieve current portfolio holdings

**Response:** `200 OK`
```json
{
  "totalValue": 875000,
  "allocation": {
    "stocks": 0.65,
    "bonds": 0.30,
    "cash": 0.05
  },
  "accounts": [
    {
      "id": "acc_401k_123",
      "name": "401(k) - Employer",
      "type": "tax_deferred",
      "value": 450000,
      "holdings": [
        {
          "symbol": "VTI",
          "name": "Vanguard Total Stock Market ETF",
          "shares": 1200,
          "value": 280000,
          "costBasis": 245000
        }
      ]
    }
  ],
  "performance": {
    "ytd": 0.12,
    "oneYear": 0.15,
    "threeYear": 0.08,
    "inception": 0.09
  }
}
```

---

### POST /portfolio/rebalance
Get rebalancing recommendations

**Request Body:**
```json
{
  "targetAllocation": {
    "US_LargeCap": 0.30,
    "Bonds": 0.35,
    "International": 0.20,
    "REITs": 0.10,
    "Cash": 0.05
  },
  "taxAware": true,
  "minimizeTransactions": true
}
```

**Response:** `200 OK`
```json
{
  "rebalanceId": "reb_456",
  "recommendations": [
    {
      "action": "sell",
      "symbol": "VTI",
      "currentValue": 320000,
      "targetValue": 262500,
      "adjustment": -57500,
      "taxImpact": 8625,
      "account": "acc_taxable_789"
    },
    {
      "action": "buy",
      "symbol": "BND",
      "currentValue": 240000,
      "targetValue": 306250,
      "adjustment": 66250,
      "account": "acc_taxable_789"
    }
  ],
  "estimatedTaxCost": 8625,
  "estimatedTransactionCosts": 45,
  "totalCost": 8670
}
```

---

## Tax Optimization

### GET /tax/optimization
Get tax optimization recommendations

**Query Parameters:**
- `year` (optional): Tax year (default: current year)
- `include` (optional): Comma-separated list: "asset_location", "tax_loss_harvesting", "withdrawal_strategy"

**Response:** `200 OK`
```json
{
  "year": 2025,
  "recommendations": {
    "assetLocation": {
      "estimatedSavings": 4250,
      "changes": [
        {
          "asset": "REITs",
          "currentAccount": "acc_taxable_789",
          "recommendedAccount": "acc_ira_456",
          "reason": "REITs generate ordinary income taxed at high rates"
        }
      ]
    },
    "taxLossHarvesting": {
      "opportunities": [
        {
          "symbol": "VWO",
          "unrealizedLoss": 3200,
          "replacementSecurity": "IEMG",
          "taxSavings": 768,
          "washSaleRisk": false
        }
      ],
      "totalPotentialSavings": 768
    },
    "withdrawalStrategy": {
      "recommendedSequence": ["taxable", "tax_deferred", "roth"],
      "estimatedLifetimeSavings": 125000
    }
  },
  "totalEstimatedAnnualSavings": 5018
}
```

---

### POST /tax/loss-harvesting
Execute tax-loss harvesting

**Request Body:**
```json
{
  "opportunityIds": ["opp_123", "opp_456"],
  "confirmTrade": true
}
```

**Response:** `200 OK`
```json
{
  "harvestId": "harvest_789",
  "trades": [
    {
      "sellSymbol": "VWO",
      "sellQuantity": 500,
      "sellValue": 18700,
      "buySymbol": "IEMG",
      "buyQuantity": 450,
      "buyValue": 18700,
      "realizedLoss": 3200,
      "taxSavings": 768
    }
  ],
  "totalRealizedLoss": 3200,
  "totalTaxSavings": 768,
  "executedAt": "2025-10-28T10:35:00Z"
}
```

---

### GET /tax/projection
Get multi-year tax projections

**Query Parameters:**
- `startYear`: Starting year for projection
- `endYear`: Ending year for projection
- `scenario` (optional): "baseline", "optimized"

**Response:** `200 OK`
```json
{
  "projections": [
    {
      "year": 2025,
      "scenario": "baseline",
      "income": {
        "wages": 120000,
        "dividends": 8500,
        "capitalGains": 12000,
        "socialSecurity": 0
      },
      "deductions": 28900,
      "taxableIncome": 111600,
      "federalTax": 18256,
      "stateTax": 5580,
      "totalTax": 23836,
      "effectiveRate": 0.199
    },
    {
      "year": 2026,
      "scenario": "optimized",
      "totalTax": 21450,
      "savings": 2386
    }
  ]
}
```

---

## Risk Analysis

### POST /risk/assess
Assess portfolio risk

**Request Body:**
```json
{
  "portfolioId": "portfolio_123",
  "includeStressTests": true,
  "includeVaR": true
}
```

**Response:** `200 OK`
```json
{
  "riskAssessment": {
    "volatility": 0.142,
    "beta": 0.95,
    "sharpeRatio": 0.52,
    "sortinoRatio": 0.68,
    "maxDrawdown": 0.38,
    "valueAtRisk": {
      "95": 0.16,
      "99": 0.24
    },
    "conditionalVaR": {
      "95": 0.21,
      "99": 0.31
    }
  },
  "stressTests": [
    {
      "scenario": "2008_financial_crisis",
      "portfolioDecline": 0.34,
      "recoveryYears": 4.2
    },
    {
      "scenario": "2000_dotcom_bust",
      "portfolioDecline": 0.28,
      "recoveryYears": 3.8
    }
  ],
  "diversification": {
    "score": 82,
    "concentrationRisks": [
      {
        "type": "single_stock",
        "symbol": "AAPL",
        "percentage": 0.08,
        "warning": "Single stock >5% of portfolio"
      }
    ]
  }
}
```

---

### POST /risk/hedging
Get hedging recommendations

**Request Body:**
```json
{
  "portfolioId": "portfolio_123",
  "protectionLevel": 0.15,
  "maxCost": 0.02,
  "timeHorizon": 12
}
```

**Response:** `200 OK`
```json
{
  "strategies": [
    {
      "type": "protective_put",
      "cost": 0.018,
      "protection": 0.15,
      "implementation": {
        "index": "SPY",
        "strike": 520,
        "expiration": "2026-06-19",
        "contracts": 15,
        "premium": 18750
      },
      "breakeven": -0.16,
      "recommendation": "Recommended - Cost-effective downside protection"
    },
    {
      "type": "collar",
      "cost": 0.005,
      "protection": 0.10,
      "upside_cap": 0.15,
      "recommendation": "Alternative - Lower cost but caps gains"
    }
  ]
}
```

---

## Monte Carlo Simulations

### POST /simulations/run
Run Monte Carlo simulation

**Request Body:**
```json
{
  "goalIds": ["goal_123"],
  "iterations": 5000,
  "timeHorizon": 30,
  "assumptions": {
    "inflationRate": 0.03,
    "lifeExpectancy": 90,
    "withdrawalStrategy": "dynamic",
    "includeSequenceRisk": true
  },
  "scenarios": {
    "marketCrash": {
      "enabled": true,
      "year": 1,
      "magnitude": -0.30
    }
  }
}
```

**Response:** `202 Accepted` (simulation runs asynchronously)
```json
{
  "simulationId": "sim_abc123",
  "status": "running",
  "estimatedDuration": 25,
  "statusUrl": "/api/simulations/sim_abc123/status"
}
```

---

### GET /simulations/{simulationId}/status
Check simulation status

**Path Parameters:**
- `simulationId`: Simulation identifier

**Response:** `200 OK`
```json
{
  "simulationId": "sim_abc123",
  "status": "complete",
  "progress": 100,
  "startedAt": "2025-10-28T10:40:00Z",
  "completedAt": "2025-10-28T10:40:28Z",
  "resultUrl": "/api/simulations/sim_abc123/result"
}
```

---

### GET /simulations/{simulationId}/result
Get simulation results

**Path Parameters:**
- `simulationId`: Simulation identifier

**Response:** `200 OK`
```json
{
  "simulationId": "sim_abc123",
  "iterations": 5000,
  "successProbability": 0.85,
  "depletionRisk": {
    "age85": 0.05,
    "age90": 0.12,
    "age95": 0.18
  },
  "portfolioValues": {
    "percentiles": {
      "10": [450000, 520000, 590000],
      "50": [950000, 1250000, 1580000],
      "90": [1800000, 2400000, 3200000]
    },
    "years": [1, 10, 20, 30]
  },
  "statistics": {
    "medianFinalValue": 1580000,
    "meanFinalValue": 1720000,
    "worstCase": 0,
    "bestCase": 5200000
  }
}
```

---

## Account Integration

### POST /accounts/connect
Initiate Plaid account connection

**Request Body:**
```json
{
  "publicToken": "public-sandbox-abc123",
  "institutionId": "ins_12345",
  "accounts": [
    {
      "accountId": "acc_abc123",
      "accountName": "Checking",
      "accountType": "depository"
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "connectionId": "conn_789",
  "accounts": [
    {
      "id": "acc_abc123",
      "externalId": "plaid_acc_123",
      "name": "Checking",
      "type": "depository",
      "balance": 12500,
      "connectedAt": "2025-10-28T10:50:00Z"
    }
  ]
}
```

---

### GET /accounts
List all connected accounts

**Response:** `200 OK`
```json
{
  "accounts": [
    {
      "id": "acc_401k_123",
      "name": "401(k) - Employer",
      "type": "retirement",
      "institution": "Fidelity",
      "balance": 450000,
      "lastSynced": "2025-10-28T06:00:00Z",
      "connectionStatus": "healthy"
    },
    {
      "id": "acc_checking_456",
      "name": "Checking",
      "type": "depository",
      "institution": "Chase",
      "balance": 12500,
      "lastSynced": "2025-10-28T06:00:00Z",
      "connectionStatus": "authentication_required"
    }
  ]
}
```

---

### POST /accounts/{accountId}/sync
Manually trigger account sync

**Path Parameters:**
- `accountId`: Account identifier

**Response:** `202 Accepted`
```json
{
  "syncId": "sync_123",
  "status": "syncing",
  "estimatedDuration": 10
}
```

---

### DELETE /accounts/{accountId}
Disconnect account

**Path Parameters:**
- `accountId`: Account identifier

**Response:** `200 OK`
```json
{
  "id": "acc_checking_456",
  "disconnectedAt": "2025-10-28T11:00:00Z"
}
```

---

## User Profile

### GET /user/profile
Get user profile

**Response:** `200 OK`
```json
{
  "userId": "usr_abc123",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1980-05-15",
  "currentAge": 45,
  "country": "US",
  "state": "CA",
  "maritalStatus": "married",
  "dependents": 2,
  "riskProfile": {
    "riskTolerance": 0.6,
    "riskCapacity": 0.7,
    "assessedAt": "2025-10-15T14:00:00Z"
  },
  "preferences": {
    "currency": "USD",
    "timezone": "America/Los_Angeles",
    "notifications": {
      "email": true,
      "push": true,
      "sms": false
    }
  }
}
```

---

### PATCH /user/profile
Update user profile

**Request Body:**
```json
{
  "maritalStatus": "single",
  "dependents": 0,
  "preferences": {
    "notifications": {
      "email": false
    }
  }
}
```

**Response:** `200 OK`
```json
{
  "userId": "usr_abc123",
  "updatedFields": ["maritalStatus", "dependents", "preferences.notifications.email"],
  "updatedAt": "2025-10-28T11:10:00Z"
}
```

---

### POST /user/risk-assessment
Complete risk tolerance assessment

**Request Body:**
```json
{
  "responses": [
    {
      "questionId": "q1",
      "answer": "Moderate growth with some volatility"
    },
    {
      "questionId": "q2",
      "answer": "Hold and wait for recovery"
    }
  ]
}
```

**Response:** `200 OK`
```json
{
  "assessmentId": "assess_123",
  "riskTolerance": 0.6,
  "riskProfile": "Moderate Aggressive",
  "recommendedAllocation": {
    "stocks": 0.65,
    "bonds": 0.30,
    "alternatives": 0.05
  },
  "completedAt": "2025-10-28T11:15:00Z"
}
```

---

## Analysis History

### GET /analyses
Retrieve analysis history

**Query Parameters:**
- `threadId` (optional): Filter by thread
- `type` (optional): Filter by type: "portfolio", "goal", "tax", "risk", "simulation"
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `limit` (optional): Results per page (default: 20, max: 100)
- `offset` (optional): Pagination offset

**Response:** `200 OK`
```json
{
  "analyses": [
    {
      "id": "analysis_123",
      "queryId": "qry_abc123",
      "threadId": "thd_uuid_123",
      "query": "What if I retire at 62 instead of 60?",
      "type": "simulation",
      "results": [
        {
          "resultId": "res_xyz789",
          "type": "retirement_analysis",
          "summary": "Retiring at 62 is feasible with 78% success probability"
        },
        {
          "resultId": "res_xyz790",
          "type": "visualization",
          "visualizationType": "fan_chart"
        }
      ],
      "timestamp": "2025-10-28T10:00:40Z"
    }
  ],
  "total": 45,
  "limit": 20,
  "offset": 0
}
```

---

### GET /analyses/{analysisId}
Get detailed analysis

**Path Parameters:**
- `analysisId`: Analysis identifier

**Response:** `200 OK`
```json
{
  "id": "analysis_123",
  "queryId": "qry_abc123",
  "query": "What if I retire at 62 instead of 60?",
  "type": "simulation",
  "agents": ["orchestrator", "retirement_planner", "monte_carlo_simulator"],
  "results": {
    "retirement_analysis": {
      "retirementAge": 62,
      "requiredMonthlySavings": 2150,
      "successProbability": 0.78,
      "projectedIncome": 80000
    },
    "monte_carlo": {
      "simulationId": "sim_abc123",
      "iterations": 5000,
      "successProbability": 0.78
    }
  },
  "visualizations": [
    {
      "id": "viz_123",
      "type": "fan_chart",
      "componentUrl": "/api/visualizations/viz_123/component"
    }
  ],
  "timestamp": "2025-10-28T10:00:40Z"
}
```

---

### GET /visualizations/{visualizationId}/component
Get React visualization component

**Path Parameters:**
- `visualizationId`: Visualization identifier

**Response:** `200 OK` with `application/javascript` content type
```javascript
// Self-contained React component with embedded data
export default function FanChartVisualization() {
  const data = {"percentiles": {...}};
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        // ... chart implementation with embedded data
      </LineChart>
    </ResponsiveContainer>
  );
}
```

---

### DELETE /analyses/{analysisId}
Delete analysis

**Path Parameters:**
- `analysisId`: Analysis identifier

**Response:** `200 OK`
```json
{
  "id": "analysis_123",
  "deletedAt": "2025-10-28T11:20:00Z"
}
```

---

## Webhooks

### POST /webhooks
Register webhook endpoint

**Request Body:**
```json
{
  "url": "https://your-app.com/webhooks/wealthnavigator",
  "events": [
    "account.synced",
    "goal.at_risk",
    "portfolio.rebalance_needed",
    "tax.opportunity_identified"
  ],
  "secret": "webhook_secret_123"
}
```

**Response:** `201 Created`
```json
{
  "webhookId": "webhook_456",
  "url": "https://your-app.com/webhooks/wealthnavigator",
  "events": ["account.synced", "goal.at_risk", "portfolio.rebalance_needed"],
  "createdAt": "2025-10-28T11:25:00Z"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {},
    "timestamp": "2025-10-28T11:30:00Z",
    "requestId": "req_abc123"
  }
}
```

### Common Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Request body validation failed |
| 401 | UNAUTHORIZED | Missing or invalid authentication token |
| 403 | FORBIDDEN | User lacks permission for resource |
| 404 | NOT_FOUND | Resource does not exist |
| 409 | CONFLICT | Resource conflict (e.g., duplicate goal) |
| 422 | UNPROCESSABLE_ENTITY | Valid request but business logic error |
| 429 | RATE_LIMIT_EXCEEDED | Too many requests |
| 500 | INTERNAL_SERVER_ERROR | Server error |
| 503 | SERVICE_UNAVAILABLE | Temporary service disruption |

### Financial-Specific Error Codes

| Code | Description |
|------|-------------|
| PORTFOLIO_OPTIMIZATION_FAILED | Unable to find feasible portfolio |
| MARKET_DATA_UNAVAILABLE | Price data temporarily unavailable |
| SIMULATION_TIMEOUT | Monte Carlo simulation took too long |
| ACCOUNT_SYNC_FAILED | Bank/brokerage sync failed |
| TAX_CALCULATION_ERROR | Tax projection calculation error |
| INVALID_GOAL_PARAMETERS | Goal parameters create unsolvable scenario |

---

## Rate Limits

| Endpoint Category | Rate Limit |
|-------------------|-----------|
| Authentication | 10 requests/minute |
| Read Operations (GET) | 100 requests/minute |
| Write Operations (POST/PATCH/DELETE) | 60 requests/minute |
| Streaming (SSE) | 5 concurrent streams |
| Simulations | 10 runs/hour |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1698505800
```

---

## Versioning

API version specified in URL: `/v1/`

Breaking changes will increment the major version: `/v2/`

Deprecation notices provided 6 months before removal.

---

**Document Owner:** API Team  
**Last Updated:** October 28, 2025  
**Next Review:** January 28, 2026
