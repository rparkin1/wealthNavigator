# WealthNavigator AI - API Documentation

**Version 1.0 - Beta**

Complete REST API reference for WealthNavigator AI.

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base URL](#base-url)
4. [Common Patterns](#common-patterns)
5. [Threads API](#threads-api)
6. [Chat API](#chat-api)
7. [Goals API](#goals-api)
8. [Portfolio API](#portfolio-api)
9. [Simulations API](#simulations-api)
10. [Budget API](#budget-api)
11. [Error Handling](#error-handling)
12. [Rate Limiting](#rate-limiting)
13. [Webhooks](#webhooks)

---

## Overview

The WealthNavigator AI API is organized around REST principles. It uses predictable resource-oriented URLs, accepts JSON-encoded request bodies, returns JSON-encoded responses, and uses standard HTTP response codes.

### Key Features

- **RESTful Design**: Standard HTTP methods (GET, POST, PUT, DELETE)
- **JSON Format**: All requests and responses use JSON
- **Server-Sent Events**: Real-time streaming for chat responses
- **Comprehensive Errors**: Detailed error messages with codes
- **Pagination**: Cursor-based pagination for list endpoints
- **Versioning**: API versioning via URL path

---

## Authentication

All API requests require authentication using JWT (JSON Web Tokens).

### Obtaining a Token

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### Using the Token

Include the token in the Authorization header:

```http
GET /threads
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Refresh

```http
POST /auth/refresh
Authorization: Bearer {refresh_token}
```

---

## Base URL

**Development:** `http://localhost:8000`
**Staging:** `https://staging-api.wealthnavigator.ai`
**Production:** `https://api.wealthnavigator.ai`

All endpoints are prefixed with `/api/v1`.

**Full URL Example:**
```
https://api.wealthnavigator.ai/api/v1/threads
```

---

## Common Patterns

### Timestamps

All timestamps are in ISO 8601 format (UTC):

```json
{
  "created_at": "2025-10-31T10:30:00Z",
  "updated_at": "2025-10-31T11:45:00Z"
}
```

### Pagination

List endpoints return paginated results:

**Request:**
```http
GET /threads?limit=20&cursor=abc123
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "next_cursor": "xyz789",
    "has_more": true,
    "total_count": 142
  }
}
```

### Error Format

All errors follow this structure:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Target amount must be positive",
    "details": {
      "field": "target_amount",
      "value": -1000
    }
  }
}
```

---

## Threads API

Threads represent conversation sessions with the AI.

### List Threads

```http
GET /threads
```

**Query Parameters:**
- `limit` (integer, optional): Number of results (default: 20, max: 100)
- `cursor` (string, optional): Pagination cursor
- `search` (string, optional): Search query

**Response:**
```json
{
  "data": [
    {
      "id": "thread_abc123",
      "title": "Retirement Planning Discussion",
      "created_at": "2025-10-31T10:00:00Z",
      "updated_at": "2025-10-31T11:30:00Z",
      "message_count": 12,
      "goal_types": ["retirement"],
      "last_message_preview": "Based on your inputs, you'll need..."
    }
  ],
  "pagination": {
    "next_cursor": "xyz789",
    "has_more": true,
    "total_count": 45
  }
}
```

### Create Thread

```http
POST /threads
Content-Type: application/json

{
  "title": "Retirement Planning"
}
```

**Response:**
```json
{
  "id": "thread_abc123",
  "title": "Retirement Planning",
  "created_at": "2025-10-31T10:00:00Z",
  "updated_at": "2025-10-31T10:00:00Z",
  "message_count": 0,
  "goal_types": []
}
```

### Get Thread

```http
GET /threads/{thread_id}
```

**Response:**
```json
{
  "id": "thread_abc123",
  "title": "Retirement Planning",
  "created_at": "2025-10-31T10:00:00Z",
  "updated_at": "2025-10-31T11:30:00Z",
  "message_count": 12,
  "goal_types": ["retirement"],
  "messages": [
    {
      "id": "msg_001",
      "role": "user",
      "content": "I want to retire at 60",
      "created_at": "2025-10-31T10:05:00Z"
    },
    {
      "id": "msg_002",
      "role": "assistant",
      "content": "Great! Let's plan for your retirement...",
      "created_at": "2025-10-31T10:05:15Z",
      "agents_used": ["goal_planner", "portfolio_architect"]
    }
  ]
}
```

### Update Thread

```http
PUT /threads/{thread_id}
Content-Type: application/json

{
  "title": "Updated Retirement Plan"
}
```

### Delete Thread

```http
DELETE /threads/{thread_id}
```

**Response:**
```json
{
  "id": "thread_abc123",
  "deleted": true,
  "deleted_at": "2025-10-31T12:00:00Z"
}
```

---

## Chat API

Real-time conversational interface using Server-Sent Events (SSE).

### Send Message (Streaming)

```http
POST /chat/stream/{thread_id}
Content-Type: application/json

{
  "message": "I want to retire at 60 with $80,000 per year"
}
```

**Response (SSE Stream):**

```
event: connected
data: {"status": "connected", "thread_id": "thread_abc123"}

event: agent_activated
data: {"agent": "goal_planner", "status": "analyzing"}

event: message
data: {"content": "Based on your retirement goal", "delta": true}

event: message
data: {"content": ", I'll help you create a comprehensive plan.", "delta": true}

event: agent_result
data: {
  "agent": "goal_planner",
  "result": {
    "goal_id": "goal_xyz789",
    "target_amount": 2000000,
    "required_monthly_savings": 2500
  }
}

event: done
data: {"status": "complete", "message_id": "msg_003"}
```

**Event Types:**

- `connected`: Connection established
- `agent_activated`: Agent starts working
- `message`: Text chunk (streaming)
- `agent_result`: Agent completed analysis
- `visualization`: Chart or data visualization
- `error`: Error occurred
- `done`: Response complete

### Send Message (Non-Streaming)

```http
POST /chat/messages/{thread_id}
Content-Type: application/json

{
  "message": "What's my success probability?"
}
```

**Response:**
```json
{
  "id": "msg_004",
  "thread_id": "thread_abc123",
  "role": "assistant",
  "content": "Your retirement plan has a 78% success probability...",
  "created_at": "2025-10-31T10:30:00Z",
  "agents_used": ["monte_carlo_simulator"],
  "metadata": {
    "success_probability": 0.78,
    "simulations_run": 5000
  }
}
```

---

## Goals API

Financial goals management.

### Create Goal

```http
POST /goals
Content-Type: application/json

{
  "thread_id": "thread_abc123",
  "category": "retirement",
  "priority": "essential",
  "target_amount": 2000000,
  "target_date": "2045-01-01",
  "current_savings": 50000,
  "monthly_contribution": 2000,
  "risk_tolerance": 0.6,
  "success_threshold": 0.85
}
```

**Goal Categories:**
- `retirement`
- `education`
- `home_purchase`
- `major_expense`
- `emergency_fund`
- `legacy`

**Priority Levels:**
- `essential` - Must achieve (target 85-90% success)
- `important` - Should achieve (target 75-85% success)
- `aspirational` - Nice to have (target 60-75% success)

**Response:**
```json
{
  "id": "goal_xyz789",
  "thread_id": "thread_abc123",
  "category": "retirement",
  "priority": "essential",
  "target_amount": 2000000,
  "target_date": "2045-01-01",
  "current_savings": 50000,
  "monthly_contribution": 2000,
  "risk_tolerance": 0.6,
  "success_threshold": 0.85,
  "success_probability": 0.78,
  "required_monthly_savings": 2500,
  "funding_status": "at_risk",
  "created_at": "2025-10-31T10:10:00Z",
  "updated_at": "2025-10-31T10:10:00Z"
}
```

### Get Goal

```http
GET /goals/{goal_id}
```

### Update Goal

```http
PUT /goals/{goal_id}
Content-Type: application/json

{
  "monthly_contribution": 2500
}
```

### Delete Goal

```http
DELETE /goals/{goal_id}
```

### List Goals

```http
GET /goals?thread_id={thread_id}
```

---

## Portfolio API

Portfolio optimization and management.

### Get Portfolio Recommendation

```http
GET /portfolio/{goal_id}
```

**Response:**
```json
{
  "goal_id": "goal_xyz789",
  "allocation": {
    "us_stocks": 0.50,
    "international_stocks": 0.20,
    "bonds": 0.25,
    "cash": 0.05
  },
  "risk_metrics": {
    "expected_return": 0.078,
    "volatility": 0.142,
    "sharpe_ratio": 0.48
  },
  "efficient_frontier": [
    {
      "risk": 0.10,
      "return": 0.055,
      "allocation": {...}
    },
    {
      "risk": 0.15,
      "return": 0.08,
      "allocation": {...}
    }
  ],
  "rebalancing_needed": false,
  "last_rebalanced": "2025-09-01T00:00:00Z"
}
```

### Optimize Portfolio

```http
POST /portfolio/optimize
Content-Type: application/json

{
  "goal_id": "goal_xyz789",
  "risk_tolerance": 0.6,
  "constraints": {
    "stocks_min": 0.4,
    "stocks_max": 0.8,
    "exclude_assets": ["commodities"]
  }
}
```

### Get Asset Classes

```http
GET /portfolio/asset-classes
```

**Response:**
```json
{
  "asset_classes": [
    {
      "id": "us_stocks",
      "name": "US Stocks",
      "expected_return": 0.09,
      "volatility": 0.18,
      "category": "equity"
    },
    {
      "id": "bonds",
      "name": "US Investment Grade Bonds",
      "expected_return": 0.04,
      "volatility": 0.06,
      "category": "fixed_income"
    }
  ]
}
```

---

## Simulations API

Monte Carlo simulations.

### Run Simulation

```http
POST /simulations
Content-Type: application/json

{
  "goal_id": "goal_xyz789",
  "iterations": 5000,
  "years": 25,
  "include_social_security": true
}
```

**Response:**
```json
{
  "simulation_id": "sim_aaa111",
  "status": "running",
  "progress": 0.0,
  "estimated_completion": "2025-10-31T10:11:00Z"
}
```

### Get Simulation Status

```http
GET /simulations/{simulation_id}/status
```

**Response:**
```json
{
  "simulation_id": "sim_aaa111",
  "status": "complete",
  "progress": 1.0,
  "completed_at": "2025-10-31T10:10:45Z"
}
```

**Status Values:**
- `queued` - Waiting to run
- `running` - In progress
- `complete` - Finished successfully
- `failed` - Error occurred

### Get Simulation Results

```http
GET /simulations/{simulation_id}/results
```

**Response:**
```json
{
  "simulation_id": "sim_aaa111",
  "goal_id": "goal_xyz789",
  "iterations": 5000,
  "success_probability": 0.78,
  "results": {
    "percentiles": {
      "p10": [50000, 55000, 60000, ...],
      "p50": [50000, 58000, 67000, ...],
      "p90": [50000, 62000, 75000, ...]
    },
    "final_values": {
      "min": 1200000,
      "p10": 1650000,
      "p25": 1850000,
      "median": 2100000,
      "p75": 2400000,
      "p90": 2750000,
      "max": 3500000
    },
    "depletion_risk": 0.22,
    "shortfall_years": {
      "median": null,
      "worst_case": 5
    }
  },
  "completed_at": "2025-10-31T10:10:45Z"
}
```

### Delete Simulation

```http
DELETE /simulations/{simulation_id}
```

---

## Budget API

Budget and cash flow management.

### Create Budget

```http
POST /budget
Content-Type: application/json

{
  "thread_id": "thread_abc123",
  "income": {
    "salary": 8000,
    "bonus": 1000,
    "other": 500
  },
  "expenses": {
    "housing": 2500,
    "transportation": 800,
    "food": 1000,
    "utilities": 300,
    "insurance": 600,
    "entertainment": 400,
    "other": 800
  },
  "savings": {
    "retirement_401k": 1000,
    "ira": 500,
    "taxable": 600
  }
}
```

**Response:**
```json
{
  "id": "budget_bbb222",
  "thread_id": "thread_abc123",
  "total_income": 9500,
  "total_expenses": 6400,
  "total_savings": 2100,
  "net_cash_flow": 1000,
  "savings_rate": 0.22,
  "recommendations": [
    "Your savings rate of 22% is excellent",
    "Consider increasing retirement contributions"
  ],
  "created_at": "2025-10-31T10:15:00Z"
}
```

### Get Budget

```http
GET /budget/{budget_id}
```

### Update Budget

```http
PUT /budget/{budget_id}
```

### Cash Flow Projection

```http
GET /budget/{budget_id}/projection?years=10
```

**Response:**
```json
{
  "budget_id": "budget_bbb222",
  "projections": [
    {
      "year": 2025,
      "income": 114000,
      "expenses": 76800,
      "savings": 25200,
      "net": 12000
    },
    {
      "year": 2026,
      "income": 117420,
      "expenses": 79104,
      "savings": 25956,
      "net": 12360
    }
  ],
  "assumptions": {
    "income_growth": 0.03,
    "expense_inflation": 0.03,
    "savings_growth": 0.03
  }
}
```

---

## Error Handling

### HTTP Status Codes

- `200 OK` - Request succeeded
- `201 Created` - Resource created
- `204 No Content` - Success with no response body
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation failed
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Temporary outage

### Error Response Format

```json
{
  "error": {
    "code": "validation_error",
    "message": "Target amount must be positive",
    "details": {
      "field": "target_amount",
      "value": -1000,
      "constraint": "must be > 0"
    },
    "request_id": "req_xyz123"
  }
}
```

### Common Error Codes

- `authentication_failed` - Invalid credentials
- `authorization_failed` - Insufficient permissions
- `validation_error` - Input validation failed
- `resource_not_found` - Requested resource doesn't exist
- `rate_limit_exceeded` - Too many requests
- `simulation_timeout` - Simulation took too long
- `calculation_error` - Financial calculation failed
- `external_service_error` - Third-party service failed

---

## Rate Limiting

API requests are rate-limited to ensure fair usage.

### Limits

- **Authenticated requests**: 1000 requests per hour
- **Simulation requests**: 10 per hour
- **Streaming connections**: 5 concurrent connections

### Rate Limit Headers

All responses include rate limit information:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1698753600
```

### Exceeding Limits

When rate limit is exceeded:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 3600

{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Rate limit of 1000 requests per hour exceeded",
    "retry_after": 3600
  }
}
```

---

## Webhooks

Register webhooks to receive real-time notifications.

### Register Webhook

```http
POST /webhooks
Content-Type: application/json

{
  "url": "https://your-app.com/webhook",
  "events": ["goal.created", "simulation.completed"],
  "secret": "your_webhook_secret"
}
```

### Webhook Events

- `thread.created`
- `thread.updated`
- `goal.created`
- `goal.updated`
- `simulation.completed`
- `portfolio.rebalance_needed`

### Webhook Payload

```json
{
  "event": "simulation.completed",
  "timestamp": "2025-10-31T10:11:00Z",
  "data": {
    "simulation_id": "sim_aaa111",
    "goal_id": "goal_xyz789",
    "success_probability": 0.78
  },
  "signature": "sha256=..."
}
```

---

## SDKs and Libraries

Official SDKs available:

- **JavaScript/TypeScript**: `npm install @wealthnavigator/sdk`
- **Python**: `pip install wealthnavigator`

### Example Usage (TypeScript)

```typescript
import { WealthNavigatorClient } from '@wealthnavigator/sdk';

const client = new WealthNavigatorClient({
  apiKey: 'your_api_key'
});

// Create thread
const thread = await client.threads.create({
  title: 'Retirement Planning'
});

// Send message
const response = await client.chat.sendMessage(thread.id, {
  message: 'I want to retire at 60'
});
```

---

## Interactive API Explorer

Test API endpoints interactively:

- **Swagger UI**: https://api.wealthnavigator.ai/docs
- **ReDoc**: https://api.wealthnavigator.ai/redoc

---

## Support

Need help with the API?

- **Documentation**: https://docs.wealthnavigator.ai/api
- **Support Email**: api-support@wealthnavigator.ai
- **Discord**: https://discord.gg/wealthnavigator
- **Status Page**: https://status.wealthnavigator.ai

---

**API Version**: 1.0
**Last Updated**: October 31, 2025
