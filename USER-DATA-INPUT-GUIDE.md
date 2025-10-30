# WealthNavigator AI: User Data Input Guide

**Date**: October 29, 2025
**Version**: 1.0
**Status**: Current Implementation

---

## Executive Summary

WealthNavigator AI uses **TWO primary methods** for users to input portfolio and budget data:

1. **Conversational AI Interface** (Primary) - Natural language input via chat
2. **Structured Forms** (Secondary) - Direct data entry for goals

**Current Status**: The application currently uses **sample/demo data** for portfolio holdings but has full infrastructure for real data input through conversation and forms.

---

## Table of Contents

1. [Primary Method: Conversational AI Input](#1-primary-method-conversational-ai-input)
2. [Secondary Method: Structured Forms](#2-secondary-method-structured-forms)
3. [Current Implementation Status](#3-current-implementation-status)
4. [Data Flow Architecture](#4-data-flow-architecture)
5. [Missing Features & Roadmap](#5-missing-features--roadmap)

---

## 1. Primary Method: Conversational AI Input

### Overview

Users interact with WealthNavigator AI through natural language conversation. The AI agents extract financial data from user messages and structure it automatically.

### How It Works

#### Step 1: User Starts Conversation

**Location**: ChatInterface component (`frontend/src/components/conversation/ChatInterface.tsx`)

**User Experience**:
```
User: "I want to retire at 65 with $2 million. I currently have $500,000
       in my 401k and can save $2,000 per month."
```

#### Step 2: AI Extracts Structured Data

**Backend Processing**:
- Message sent to `/api/v1/chat/stream` endpoint
- Financial Planning Orchestrator analyzes intent
- Routes to Goal Planner Agent or Portfolio Architect Agent
- Agents extract key financial parameters

**Extracted Data**:
```json
{
  "goal": {
    "category": "retirement",
    "target_amount": 2000000,
    "target_date": "2040-01-01",  // Calculated from "at 65"
    "current_funding": 500000,
    "monthly_contribution": 2000
  }
}
```

#### Step 3: AI Confirmation & Refinement

**AI Response**:
```
Assistant: "I understand you're planning for retirement! Let me confirm:

- Retirement Goal: $2,000,000 by age 65
- Current 401k: $500,000
- Monthly Savings: $2,000

Based on this, I'll analyze if you're on track and recommend
an optimal portfolio allocation. Is this correct?"
```

#### Step 4: Data Persistence

**Automatic Actions**:
1. Goal automatically created in database via `/api/v1/goals` API
2. User profile updated with risk tolerance (if mentioned)
3. Portfolio analysis queued if holdings mentioned

### Conversational Input Examples

#### Example 1: Retirement Planning
```
User: "I'm 45 and want to retire at 62. I need $80,000 per year in
       retirement income."

AI Extracts:
- Current age: 45
- Retirement age: 62
- Income need: $80,000/year
- Implied target: ~$2M (using 4% withdrawal rule)

AI Creates:
- Retirement goal with calculated target amount
- Retirement income assumptions
- Social Security estimate prompt
```

#### Example 2: Portfolio Holdings
```
User: "I have $100,000 in VTI, $50,000 in BND, and $25,000 in VXUS"

AI Extracts:
- Holding: VTI (Vanguard Total Stock) = $100,000
- Holding: BND (Vanguard Total Bond) = $50,000
- Holding: VXUS (Vanguard International) = $25,000
- Total portfolio: $175,000
- Current allocation: 57% stocks, 29% bonds, 14% international

AI Analyzes:
- Risk assessment
- Allocation optimization recommendations
- Tax efficiency analysis
```

#### Example 3: Budget/Cash Flow
```
User: "I make $120,000 per year and can save about 15% of my income
       after expenses"

AI Extracts:
- Annual income: $120,000
- Savings rate: 15%
- Monthly savings capacity: $1,500 ($120k × 0.15 ÷ 12)

AI Uses For:
- Goal feasibility analysis
- Required vs. actual savings comparison
- Budget recommendations
```

#### Example 4: Multiple Goals
```
User: "I need to save for my daughter's college in 10 years ($200k)
       and also buy a house in 3 years (need $80k down payment)"

AI Extracts:
Goal 1: Education
- Target: $200,000
- Timeline: 10 years
- Category: Education
- Priority: Essential

Goal 2: Home Purchase
- Target: $80,000
- Timeline: 3 years
- Category: Home
- Priority: Important

AI Coordinates:
- Multi-goal portfolio optimization
- Savings allocation across goals
- Timeline conflict analysis
```

### Supported Data Types via Conversation

| Data Type | Example Input | AI Extraction |
|-----------|---------------|---------------|
| **Goals** | "Save $500k for retirement" | Amount, category, timeline |
| **Portfolio Holdings** | "I own 100 shares of SPY" | Ticker, quantity, value |
| **Income** | "I earn $100k annually" | Annual/monthly income |
| **Expenses** | "My expenses are $5k/month" | Monthly expenses |
| **Savings Rate** | "I save 20% of income" | Percentage, dollar amount |
| **Risk Tolerance** | "I'm moderate/aggressive" | Risk score (0.0-1.0) |
| **Time Horizon** | "I need this in 5 years" | Timeline calculation |
| **Tax Situation** | "I'm in 24% tax bracket" | Tax rate, account types |
| **Account Types** | "401k has $100k, Roth has $50k" | Account categorization |
| **Life Events** | "Getting married next year" | Timeline adjustments |

### Conversational Input Advantages

✅ **Natural & Intuitive** - No forms to fill out
✅ **Context-Aware** - AI remembers previous conversation
✅ **Flexible** - Users can describe financial situation in their own words
✅ **Intelligent Parsing** - AI handles ambiguity and asks clarifying questions
✅ **Multi-Turn Dialogue** - Can refine data through conversation
✅ **Educational** - AI explains what data is needed and why

---

## 2. Secondary Method: Structured Forms

### Goal Creation Form

**Location**: `frontend/src/components/goals/GoalForm.tsx`

**Type**: Multi-step wizard (3 steps)

#### Step 1: Goal Type Selection

**User Interface**:
```
Choose Your Goal Type:

🏖️ Retirement          🎓 Education
Plan for financial     Save for college,
independence           tuition, education

🏠 Home Purchase       💰 Major Expense
Save for down          Car, wedding,
payment                vacation

🚨 Emergency Fund      🌟 Legacy Planning
Build safety net       Estate, charitable
                       giving
```

**Fields**:
- Goal category (required): Select from 6 categories

#### Step 2: Amounts & Dates

**User Interface**:
```
Goal Details

Goal Name: [e.g., "Early Retirement at 60"]

Target Amount: $[______] (e.g., $2,000,000)

Target Date: [MM/DD/YYYY]

Current Amount: $[______] (optional, default: $0)
```

**Fields**:
- `title`: string (required, 1-255 chars)
- `target_amount`: number (required, > 0)
- `target_date`: date (required)
- `current_amount`: number (optional, ≥ 0)

#### Step 3: Funding & Priority

**User Interface**:
```
How Will You Fund This Goal?

Monthly Contribution: $[______] (optional)

Priority Level:

○ Essential          ○ Important        ○ Aspirational
Critical for         Significant        Nice to have
security             life goals         goals
(Emergency, Ret.)    (Home, Education)  (Vacation, Luxury)

Description (optional):
[Text area for additional notes]
```

**Fields**:
- `monthly_contribution`: number (optional, ≥ 0)
- `priority`: enum (essential, important, aspirational)
- `description`: text (optional)

#### Form Validation

**Real-time Validation**:
- Target amount must be positive
- Target date must be in future
- Current amount cannot exceed target
- Monthly contribution must be reasonable (warns if > target/12)

**API Endpoint**: `POST /api/v1/goals`

**Request Example**:
```json
{
  "title": "Retirement at 60",
  "category": "retirement",
  "priority": "essential",
  "target_amount": 2000000,
  "target_date": "2040-01-01",
  "current_amount": 500000,
  "monthly_contribution": 2000,
  "description": "Early retirement goal with travel budget"
}
```

**Response**:
```json
{
  "id": "goal-uuid-123",
  "title": "Retirement at 60",
  "category": "retirement",
  "targetAmount": 2000000,
  "currentAmount": 500000,
  "targetDate": "2040-01-01",
  "monthlyContribution": 2000,
  "successProbability": 0.87,
  "status": "on_track"
}
```

### Account Creation (API Only - No UI Form Yet)

**API Endpoint**: `POST /api/v1/portfolio/accounts` (theoretical)

**Request Schema**:
```json
{
  "account_type": "tax_deferred",  // taxable, tax_deferred, tax_exempt, depository
  "institution": "Vanguard",
  "account_name": "401(k) - My Company",
  "balance": 150000
}
```

**Account Types Supported**:
1. **Taxable** - Brokerage accounts, regular savings
2. **Tax-Deferred** - 401(k), Traditional IRA
3. **Tax-Exempt** - Roth IRA, Roth 401(k)
4. **Depository** - Checking, savings accounts
5. **Credit** - Credit cards, loans

**Note**: Account creation form UI is **not yet implemented**. Currently only accessible via API or conversational input.

---

## 3. Current Implementation Status

### ✅ Fully Implemented

#### Conversational Input
- ✅ **Chat Interface** - Full SSE streaming implementation
- ✅ **Natural Language Processing** - Claude Sonnet 4.5 with LangChain
- ✅ **Goal Extraction** - AI extracts goals from conversation
- ✅ **Multi-Agent Coordination** - Orchestrator routes to specialist agents
- ✅ **Data Persistence** - Goals saved automatically
- ✅ **Confirmation & Refinement** - AI confirms understanding

#### Structured Forms
- ✅ **Goal Creation Form** - 3-step wizard fully functional
- ✅ **Goal Editing** - Update existing goals
- ✅ **Goal Deletion** - Remove goals
- ✅ **Form Validation** - Real-time input validation

#### Backend APIs
- ✅ **Goal CRUD** - `/api/v1/goals` (Create, Read, Update, Delete)
- ✅ **Account Models** - Database schema for accounts
- ✅ **Portfolio Models** - Database schema for portfolios
- ✅ **Chat Streaming** - `/api/v1/chat/stream` with SSE

### ⚠️ Partially Implemented (Using Sample Data)

#### Portfolio Holdings
- ⚠️ **Current Status**: Uses hardcoded sample data
- ⚠️ **Location**: `backend/app/api/portfolio.py` - `get_sample_holdings()`
- ⚠️ **Data Source**: Returns demo holdings (SPY, VTI, QQQ)
- ✅ **API Endpoints**: Exist but use sample data
- ❌ **User Input UI**: No form to manually enter holdings yet

**Sample Data Example**:
```python
def get_sample_holdings(user_id: str) -> list:
    """Get sample holdings for demonstration."""
    return [
        Holding(
            ticker="SPY",
            cost_basis=45000,
            current_value=42000,
            shares=100,
            purchase_date="2024-01-15"
        ),
        # More sample holdings...
    ]
```

**Impact**:
- Users cannot currently input their actual portfolio holdings directly
- Portfolio analysis uses demo data
- Tax-loss harvesting, rebalancing use sample portfolios

### ❌ Not Yet Implemented

#### Portfolio Input UI
- ❌ **Holdings Entry Form** - No UI to add individual holdings
- ❌ **Account Creation Form** - No UI to create accounts
- ❌ **Transaction Import** - No CSV/file upload
- ❌ **Plaid Integration** - No automatic account syncing (planned post-MVP)

#### Budget Input UI
- ❌ **Expense Categorization** - No detailed budget breakdown UI
- ❌ **Income Entry Form** - No explicit income form (done via conversation)
- ❌ **Recurring Expenses** - No recurring expense tracking

#### Bulk Import
- ❌ **CSV Import** - No file upload for holdings
- ❌ **Brokerage Integration** - No direct brokerage connections
- ❌ **Tax Document Import** - No 1099 import

---

## 4. Data Flow Architecture

### Conversational Input Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER INPUT                                                   │
│    Chat: "I have $100k in VTI and want to retire with $2M"     │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. CHAT INTERFACE (Frontend)                                    │
│    - MessageInput component captures text                       │
│    - Sends to SSE streaming endpoint                            │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. CHAT API (Backend)                                           │
│    POST /api/v1/chat/stream                                     │
│    - Receives user message                                      │
│    - Initiates LangGraph workflow                               │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. ORCHESTRATOR AGENT                                           │
│    - Analyzes user intent                                       │
│    - Detects: Portfolio holdings + Retirement goal              │
│    - Routes to: Goal Planner + Portfolio Architect              │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ├─────────────────┬─────────────────┐
                     ▼                 ▼                 ▼
         ┌───────────────┐  ┌──────────────┐  ┌─────────────┐
         │ GOAL PLANNER  │  │  PORTFOLIO   │  │  MONTE      │
         │    AGENT      │  │  ARCHITECT   │  │  CARLO      │
         └───────┬───────┘  └──────┬───────┘  └──────┬──────┘
                 │                 │                 │
                 ▼                 ▼                 ▼
         Extract goal      Extract holdings    Run simulation
         parameters        & allocation
                 │                 │                 │
                 └─────────────────┴─────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. DATA PERSISTENCE                                             │
│    - Goal saved: POST /api/v1/goals                             │
│    - Portfolio saved: POST /api/v1/portfolio (currently sample) │
│    - User profile updated                                       │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. SSE RESPONSE STREAM                                          │
│    - agent_started: "Goal Planner analyzing..."                 │
│    - agent_progress: "Calculating required savings..."          │
│    - message: "You'll need to save $X/month"                    │
│    - visualization: Chart data for goal progress                │
│    - done: Workflow complete                                    │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. FRONTEND UPDATE                                              │
│    - ChatInterface displays AI response                         │
│    - GoalDashboard shows new goal                               │
│    - PortfolioView shows analysis (with sample data)            │
└─────────────────────────────────────────────────────────────────┘
```

### Form Input Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER CLICKS "New Goal"                                       │
│    GoalDashboard → Opens GoalForm modal                         │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. GOAL FORM (3 Steps)                                          │
│    Step 1: Select category (retirement, education, etc.)        │
│    Step 2: Enter amounts and dates                              │
│    Step 3: Set priority and monthly contribution                │
│    - Real-time validation on each field                         │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. FORM SUBMISSION                                              │
│    onClick "Create Goal"                                        │
│    → POST /api/v1/goals                                         │
│    Request body: {                                              │
│      title, category, priority,                                 │
│      target_amount, target_date,                                │
│      current_amount, monthly_contribution                       │
│    }                                                             │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. BACKEND PROCESSING                                           │
│    - Validate input data                                        │
│    - Create Goal database record                                │
│    - Run goal_analyzer tool                                     │
│    - Calculate required_monthly_savings                         │
│    - Assess success_probability                                 │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. RESPONSE                                                     │
│    201 Created                                                  │
│    {                                                             │
│      id, title, category,                                       │
│      targetAmount, currentAmount,                               │
│      successProbability: 0.87,                                  │
│      status: "on_track"                                         │
│    }                                                             │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. FRONTEND UPDATE                                              │
│    - GoalForm closes                                            │
│    - GoalDashboard refreshes                                    │
│    - New GoalCard appears with progress bar                     │
│    - Success notification displayed                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Missing Features & Roadmap

### Critical Missing Features (Should Add Before Beta)

#### 1. Portfolio Holdings Entry UI

**Current Gap**: No UI to manually enter portfolio holdings

**Impact**: Users cannot input actual portfolios, all analysis uses demo data

**Proposed Solution**:
Create `PortfolioHoldingsForm.tsx` with fields:
- Ticker symbol (with autocomplete)
- Number of shares OR dollar amount
- Purchase date
- Cost basis
- Account (which account holds this)

**API**: Already exists - just needs UI

**Priority**: **HIGH** - Critical for real portfolio analysis

---

#### 2. Account Creation UI

**Current Gap**: Accounts can only be created via API, no UI

**Impact**: Users cannot organize holdings by account type

**Proposed Solution**:
Create `AccountForm.tsx` with fields:
- Account name (e.g., "My 401k")
- Account type (dropdown: Taxable, Tax-Deferred, Tax-Exempt, etc.)
- Institution (e.g., "Vanguard", "Fidelity")
- Initial balance
- Account number (optional, encrypted)

**API**: Already exists - needs UI only

**Priority**: **HIGH** - Needed for tax-aware optimization

---

#### 3. Budget/Expense Tracking UI

**Current Gap**: No detailed budget breakdown, only implicit via conversation

**Impact**: Limited cash flow analysis, no expense categorization

**Proposed Solution**:
Create `BudgetForm.tsx` or enhance conversational extraction:
- Monthly income (salary, bonuses, other)
- Fixed expenses (rent, utilities, insurance)
- Variable expenses (food, entertainment, shopping)
- Debt payments
- Savings goals

**Alternative**: Enhance AI to better extract budget from conversation

**Priority**: **MEDIUM** - Can be handled via conversation

---

### Post-MVP Enhancements

#### 4. CSV/File Import

**Feature**: Upload brokerage statements or CSV files

**Benefits**:
- Faster bulk data entry
- Direct import from brokerages
- Historical transaction data

**Implementation**:
- File upload component
- CSV parser
- Data mapping/validation
- Duplicate detection

**Priority**: **MEDIUM** - Nice to have, not essential

---

#### 5. Plaid Integration

**Feature**: Connect bank/brokerage accounts automatically

**Benefits**:
- Automatic balance updates
- Real-time portfolio tracking
- No manual entry needed
- Transaction categorization

**Implementation**:
- Plaid Link integration
- Account aggregation
- Data sync scheduler
- Security/compliance

**Priority**: **LOW** - Post-MVP (mentioned in DEVELOPMENT_PLAN)

---

#### 6. Recurring Transactions

**Feature**: Set up recurring income/expenses

**Benefits**:
- More accurate cash flow projections
- Automatic budget tracking
- Better savings recommendations

**Implementation**:
- Recurring transaction model
- Frequency settings (weekly, monthly, etc.)
- Auto-categorization
- Edit/delete functionality

**Priority**: **LOW** - Enhancement

---

### Recommended Implementation Order

**For Beta Launch (Next 2-4 weeks)**:

1. **Portfolio Holdings Entry Form** (Week 1)
   - Critical for real portfolio analysis
   - Replaces sample data
   - Enables tax-loss harvesting with real data

2. **Account Creation Form** (Week 1)
   - Enables tax-aware optimization
   - Organizes holdings properly
   - Required for multi-account rebalancing

3. **Enhanced Conversational Extraction** (Week 2)
   - Improve AI's ability to extract budget data
   - Better portfolio holdings parsing
   - Confirm extracted data with user

4. **Data Import/Export** (Week 3-4)
   - CSV import for bulk holdings
   - Data export for backup
   - Migration from other platforms

**Post-Beta**:
- Plaid integration (automatic syncing)
- Recurring transactions
- Expense categorization
- Bill tracking

---

## Summary

### Current User Input Methods

| Data Type | Conversational Input | Form Input | API Only | Status |
|-----------|---------------------|------------|----------|--------|
| **Goals** | ✅ Yes (extracts from chat) | ✅ Yes (GoalForm) | ✅ Yes | **Complete** |
| **Portfolio Holdings** | ⚠️ Yes (but uses sample) | ❌ No | ✅ Yes | **Partial** |
| **Accounts** | ⚠️ Yes (but uses sample) | ❌ No | ✅ Yes | **Partial** |
| **Budget/Income** | ✅ Yes (extracts from chat) | ❌ No | ❌ No | **Partial** |
| **Expenses** | ⚠️ Limited | ❌ No | ❌ No | **Minimal** |
| **Risk Tolerance** | ✅ Yes (conversation) | ❌ No | ✅ Yes | **Complete** |

### Key Insights

✅ **Conversational input is working well** - Users can describe their financial situation naturally

✅ **Goal creation is fully functional** - Both conversational and form-based entry work

⚠️ **Portfolio holdings need UI** - Currently using sample data, limiting real analysis

⚠️ **Account management needs UI** - Can't organize holdings by account type

❌ **Budget tracking is basic** - Relies on conversation, no detailed breakdown

### Immediate Action Items

**Before Beta Launch**:
1. Build Portfolio Holdings Entry Form
2. Build Account Creation Form
3. Replace sample data with user data
4. Add CSV import for bulk entry
5. Enhance conversational data extraction

---

**Document Version**: 1.0
**Last Updated**: October 29, 2025
**Status**: Active Development - MVP Phase
