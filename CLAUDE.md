# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**WealthNavigator AI** is a goal-based financial planning and portfolio management platform that combines conversational AI with institutional-grade wealth management tools. The platform uses a multi-agent architecture to help users plan for retirement, education funding, home purchases, and other major financial goals.

**Current Status:** Planning phase with comprehensive documentation. Implementation not yet started.

## Core Architecture

### Multi-Agent System
The platform uses 8 specialized AI agents coordinated by an orchestrator:
- **Budgeting Agent** - Cash flow analysis and expense categorization
- **Goal Planner Agent** - Goal structuring and funding calculations
- **Portfolio Architect Agent** - Modern Portfolio Theory optimization
- **Tax Strategist Agent** - Asset location and tax-loss harvesting
- **Risk Manager Agent** - Risk assessment and hedging strategies
- **Retirement Planner Agent** - Retirement income and withdrawal modeling
- **Monte Carlo Simulator Agent** - Probabilistic simulations (5,000+ iterations)
- **Visualization Agent** - React-based charts and dashboards

### Technology Stack

**Frontend (Planned):**
- React 18+ with TypeScript
- State: Zustand (global), React Query (server)
- UI: Tailwind CSS + shadcn/ui
- Charts: Recharts + D3.js
- Streaming: Server-Sent Events (SSE)
- Storage: LocalStorage (versioned schemas), IndexedDB (large datasets)

**Backend (Planned):**
- Python 3.11+ with FastAPI
- AI: Anthropic Claude Sonnet 4.5 via LangChain
- Database: PostgreSQL (user data), Redis (cache)
- Queue: RabbitMQ (async tasks)
- Calculations: NumPy/SciPy (portfolio optimization), custom Monte Carlo engine

**External Services:**
- Plaid - Account aggregation
- Alpha Vantage/Yahoo Finance - Market data
- IRS API - Tax tables

## Key Product Concepts

### Thread-Based Conversations
- UUID-based conversation threads for organizing planning sessions
- LocalStorage persistence with auto-save every 5 seconds
- Automatic categorization: "Today," "Yesterday," "Past 7 Days," etc.
- Max 100 active threads per user
- Soft delete with 30-day recovery

### Goal-Based Planning
- Natural language goal creation: "I want to retire at 60 with $80,000 per year"
- Categories: Retirement, Education, Home Purchase, Major Expense, Emergency Fund, Legacy
- Priority levels: Essential, Important, Aspirational
- Success probability thresholds (e.g., "90% confidence for retirement")
- Mental accounting: separate allocation per goal

### Portfolio Optimization
- Mean-variance optimization for efficient frontier
- 50+ asset classes supported
- Multi-level optimization: Goal-level, Account-level, Household-level
- Time-based glide paths (reduce risk as goals approach)
- Tax-aware rebalancing

### Tax Optimization
- **Asset Location:** Tax-inefficient assets → tax-deferred accounts, growth assets → Roth
- **Tax-Loss Harvesting:** Daily monitoring with wash sale compliance
- **Withdrawal Sequencing:** Multi-account optimization, RMD planning, Roth conversions
- **Tax Projections:** Multi-year forecasting, IRMAA threshold management

### Monte Carlo Simulations
- 5,000+ iterations in <30 seconds (requirement)
- Success probability per goal
- Portfolio value distributions at percentiles
- Sequence of returns risk modeling
- Interactive what-if scenarios with instant recalculation

### Query-Based Analysis History
- Each analysis generates unique query ID
- Results linked to specific planning questions
- Categorization: Portfolio Analysis, Goal Planning, Tax Strategy, Risk Assessment
- Side-by-side scenario comparison
- Full export functionality

## Implementation Requirements

### Performance Targets
- Dashboard load: <1 second
- Thread list render: <100ms
- Account sync: <10 seconds
- Portfolio optimization: <5 seconds
- Monte Carlo simulation: <30 seconds
- Chart generation: <500ms
- Search results: <200ms

### Error Handling Strategy
- 3 retry attempts with exponential backoff (1s, 2s, 4s)
- SSE stream interruption recovery with resume capability
- Component-level error boundaries with graceful fallback UI
- Context-aware error messages for financial operations
- Progress preservation during errors

### Financial-Specific Error Scenarios
- Market data unavailable → Use cached data with disclaimer
- Portfolio optimization fails → Suggest simplified allocation
- Monte Carlo timeout → Return partial results with note
- Bank connection lost → Queue sync for retry
- Tax calculation error → Flag for manual review

## Data Models (TypeScript)

### Core Entities
```typescript
interface Thread {
  id: string;  // UUID
  title: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
  goalTypes: GoalCategory[];
  messages: Message[];
  analyses: Analysis[];
}

interface Goal {
  id: string;
  category: 'retirement' | 'education' | 'home' | 'major_expense' | 'emergency' | 'legacy';
  priority: 'essential' | 'important' | 'aspirational';
  targetAmount: number;
  targetDate: string; // ISO date
  successThreshold: number; // 0.0-1.0
  successProbability: number;
  requiredMonthlySavings: number;
}

interface Portfolio {
  allocation: AssetAllocation;  // { [assetClass]: percentage }
  accounts: Account[];
  riskMetrics: RiskMetrics;
  lastRebalanced: number;
}

interface Account {
  type: 'taxable' | 'tax_deferred' | 'tax_exempt' | 'depository' | 'credit';
  connectionStatus: ConnectionStatus;
  holdings: Holding[];
}

interface MonteCarloSimulation {
  iterations: number;  // Target: 5,000+
  successProbability: number;
  status: 'running' | 'complete' | 'failed';
  progress: number;
}

interface Analysis {
  queryId: string;  // Links to specific planning question
  type: 'portfolio_optimization' | 'goal_planning' | 'tax_strategy' | 'risk_assessment' | 'monte_carlo';
  agents: string[];  // Which agents contributed
  results: AnalysisResult[];
  visualizations: Visualization[];
}
```

## Component Structure (When Implementing)

```
src/
├── components/
│   ├── conversation/     # ChatInterface, MessageList, ThreadList
│   ├── agents/          # TeamView, AgentCard (multi-agent visualization)
│   ├── goals/           # GoalDashboard, GoalCard, GoalProgress
│   ├── portfolio/       # PortfolioOverview, AllocationChart, EfficientFrontier
│   ├── analysis/        # AnalysisHistory, QuerySelector, ComparisonView
│   ├── simulation/      # MonteCarloSetup, FanChart, WhatIfSliders
│   ├── tax/             # TaxDashboard, AssetLocationOptimizer, TaxLossHarvester
│   ├── risk/            # RiskDashboard, StressTestResults
│   └── visualizations/  # PieChart, LineChart, ScatterChart, FanChart
├── hooks/
│   ├── useThread.ts         # Thread management with LocalStorage
│   ├── useSSEStream.ts      # Server-Sent Events connection
│   ├── useSimulation.ts     # Monte Carlo operations
│   └── useErrorHandler.ts   # Error handling with retry logic
├── services/
│   ├── api.ts           # API client
│   ├── streaming.ts     # SSE service
│   ├── storage.ts       # LocalStorage service
│   └── calculations.ts  # Client-side financial calculations
└── types/
    └── [domain].ts      # TypeScript interfaces
```

## Backend Tool Structure (When Implementing)

```python
# backend/tools/
portfolio_optimizer.py   # MPT optimization, efficient frontier
monte_carlo_engine.py    # Simulation engine (5,000+ iterations)
tax_calculator.py        # Asset location, harvesting, withdrawal sequencing
goal_analyzer.py         # Goal structuring, funding calculations
risk_assessor.py         # VaR, Sharpe, beta, stress testing
market_data.py          # Market data fetching and caching

# Tools are PRE-BUILT. Agents import and use them directly.
# Example:
from tools.portfolio_optimizer import optimize_portfolio
result = await optimize_portfolio({
    "goalIds": goal_ids,
    "riskTolerance": 0.6,
    "timeHorizon": 15
})
```

## Development Phases

### MVP (Phase 1) - Months 1-4
Focus: Basic retirement planning with single goal
- Conversation management with thread persistence
- Budget analysis and cash flow
- Single goal planning (retirement only)
- Basic portfolio optimization (3-5 asset classes)
- Simple Monte Carlo simulation
- Essential error handling

### Enhanced (Phase 2) - Months 5-8
Focus: Multi-goal planning with tax optimization
- Multi-goal support (retirement + education + home)
- Tax-aware optimization and asset location
- Advanced portfolio optimization (10+ asset classes)
- Risk management and hedging
- Enhanced Monte Carlo with scenarios
- Query-based history tracking

### Advanced (Phase 3) - Months 9-12
Focus: Professional-grade features
- Estate planning module
- Insurance optimization
- Advanced tax strategies (Roth conversions)
- Direct indexing
- Social Security optimization
- Advisor collaboration

## Financial Planning Concepts

### Modern Portfolio Theory (MPT)
- Mean-variance optimization for efficient frontier calculation
- Risk-return trade-off analysis
- Rebalancing with tax-aware execution
- Multi-level optimization (Goal, Account, Household)

### Tax-Aware Strategies
- **Asset Location:** Place tax-inefficient assets (bonds, REITs) in tax-deferred accounts
- **Tax-Loss Harvesting:** Sell losses to offset gains, avoid wash sales (30-day rule)
- **Withdrawal Sequencing:** Optimize order of account withdrawals to minimize lifetime taxes
- **Roth Conversions:** Convert traditional IRA to Roth in low-income years

### Risk Management
- **Diversification:** Correlation matrix, concentration risk, sector/geographic exposure
- **Hedging:** Protective puts, collar strategies, inverse ETFs, tail risk hedging
- **Risk Metrics:** VaR (95%, 99%), Sharpe ratio, Sortino ratio, max drawdown

### Monte Carlo Methodology
- Simulate 5,000+ market scenarios using historical return distributions
- Model portfolio value over time with contributions, withdrawals, and market volatility
- Calculate success probability (% of scenarios meeting goal)
- Sequence of returns risk: early losses have bigger impact than later losses

## Security & Compliance

**Data Security:**
- End-to-end encryption (TLS 1.3)
- Encryption at rest (AES-256)
- Multi-factor authentication required
- OAuth tokens for account access (never store credentials)

**Regulatory:**
- Investment Adviser Act compliance (if providing advice)
- Gramm-Leach-Bliley Act (GLBA) financial privacy
- Clear disclaimers: educational vs. advisory content
- Potential RIA registration required

**Privacy:**
- GDPR compliant (EU users)
- CCPA compliant (California users)
- User data export/deletion on request

## Testing Strategy (When Implementing)

**Financial Calculation Tests:**
- Portfolio optimization within 0.1% of true efficient frontier
- Tax calculations accurate to $1
- Monte Carlo confidence intervals verified against statistical standards
- Asset allocation recommendations match industry best practices

**Integration Tests:**
- Agent coordination (sequential and parallel execution)
- SSE streaming with interruption recovery
- Error retry logic with exponential backoff
- LocalStorage persistence and migration

**Performance Tests:**
- Monte Carlo: 5,000 iterations in <30 seconds
- Portfolio optimization: <5 seconds
- Dashboard load: <1 second
- Load testing: 10,000 concurrent users

## Key Documentation Files

- `development_docs/ProductDescription/PRD.md` - 170+ requirements, full feature specifications
- `development_docs/ProductDescription/user-stories.md` - 40+ user stories with acceptance criteria
- `development_docs/ProductDescription/api-specification.md` - 50+ API endpoints fully documented
- `development_docs/ProductDescription/PROJECT-SUMMARY.md` - High-level overview, implementation roadmap
- `development_docs/ProductDescription/financial_planning_requirements.md` - Original requirements
- `development_docs/plans/mvp-development/plan.md` - MVP implementation plan

## Glossary

**Asset Allocation:** Distribution of investments across asset classes (stocks, bonds, cash)

**Efficient Frontier:** Set of optimal portfolios offering highest return for given risk level

**Modern Portfolio Theory (MPT):** Framework for constructing portfolios that maximize expected return for given risk level (Markowitz 1952)

**Monte Carlo Simulation:** Statistical technique using random sampling to model probability of outcomes

**Tax-Loss Harvesting:** Selling securities at a loss to offset capital gains

**Wash Sale Rule:** IRS rule preventing claiming losses on securities repurchased within 30 days

**Required Minimum Distribution (RMD):** Mandatory withdrawal from tax-deferred accounts starting at age 73/75

**Sharpe Ratio:** Risk-adjusted return measure (excess return ÷ standard deviation)

**Sequence of Returns Risk:** Risk that order of investment returns impacts portfolio longevity in retirement

**Asset Location:** Placing investments in appropriate account types to minimize taxes
