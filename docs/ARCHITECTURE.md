# WealthNavigator AI - Technical Architecture

**Version 1.0**
**Last Updated**: October 31, 2025

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [System Components](#system-components)
3. [Multi-Agent Architecture](#multi-agent-architecture)
4. [Data Flow](#data-flow)
5. [Database Schema](#database-schema)
6. [API Architecture](#api-architecture)
7. [Frontend Architecture](#frontend-architecture)
8. [Security Architecture](#security-architecture)
9. [Scalability & Performance](#scalability--performance)
10. [Deployment Architecture](#deployment-architecture)
11. [Technology Decisions](#technology-decisions)

---

## Architecture Overview

WealthNavigator AI uses a modern, scalable architecture combining:

- **Frontend**: React SPA with TypeScript
- **Backend**: FastAPI microservices
- **AI**: Multi-agent system with LangChain + Claude
- **Database**: PostgreSQL (primary) + Redis (cache)
- **Communication**: REST APIs + Server-Sent Events (SSE)

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              User Layer                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐             │
│  │   Browser    │    │  iOS App     │    │ Android App  │             │
│  │   (React)    │    │  (Swift)     │    │  (Kotlin)    │             │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘             │
└─────────┼────────────────────┼────────────────────┼─────────────────────┘
          │                    │                    │
          └────────────────────┴────────────────────┘
                               │ HTTPS / WSS
┌──────────────────────────────┼──────────────────────────────────────────┐
│                         API Gateway Layer                                │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Nginx / Caddy / AWS API Gateway                                 │  │
│  │  • SSL/TLS Termination                                           │  │
│  │  • Rate Limiting                                                 │  │
│  │  • Request Routing                                               │  │
│  │  • Load Balancing                                                │  │
│  └────────────────────────┬──────────────────────────────────────────┘  │
└───────────────────────────┼─────────────────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────────────────┐
│                    Application Layer (FastAPI)                          │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                   API Routes Layer                               │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │   │
│  │  │ Threads  │  │   Chat   │  │  Goals   │  │Portfolio │       │   │
│  │  │   API    │  │   API    │  │   API    │  │   API    │       │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │   │
│  └───────┼─────────────┼─────────────┼─────────────┼──────────────┘   │
│          │             │             │             │                   │
│  ┌───────┴─────────────┴─────────────┴─────────────┴──────────────┐   │
│  │                    Business Logic Layer                          │   │
│  │  ┌──────────────────────────────────────────────────────────┐  │   │
│  │  │         Financial Planning Orchestrator                   │  │   │
│  │  │         (LangChain Agent Coordinator)                     │  │   │
│  │  └────────────────────┬─────────────────────────────────────┘  │   │
│  │                       │                                         │   │
│  │  ┌────────────────────┴─────────────────────────────────────┐  │   │
│  │  │              Specialist Agent Layer                       │  │   │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │  │   │
│  │  │  │  Goal    │ │Portfolio │ │   Tax    │ │   Risk   │   │  │   │
│  │  │  │ Planner  │ │Architect │ │Strategist│ │ Manager  │   │  │   │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │  │   │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │  │   │
│  │  │  │Budgeting │ │Retirement│ │  Monte   │ │  Visual  │   │  │   │
│  │  │  │  Agent   │ │ Planner  │ │  Carlo   │ │  Agent   │   │  │   │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │  │   │
│  │  └──────────────────────┬───────────────────────────────────┘  │   │
│  │                         │                                       │   │
│  │  ┌──────────────────────┴───────────────────────────────────┐  │   │
│  │  │               Financial Tools Layer                       │  │   │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │  │   │
│  │  │  │Portfolio │ │  Monte   │ │   Goal   │ │   Tax    │   │  │   │
│  │  │  │Optimizer │ │  Carlo   │ │ Analyzer │ │Calculator│   │  │   │
│  │  │  │ (SciPy)  │ │  Engine  │ │          │ │          │   │  │   │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │  │   │
│  │  └────────────────────────────────────────────────────────────┘  │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                     Data Access Layer                             │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │  │
│  │  │  SQLAlchemy  │  │   Alembic    │  │    Redis     │           │  │
│  │  │     ORM      │  │  Migrations  │  │    Client    │           │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘           │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────────────────┐
│                       Data Layer                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │  PostgreSQL  │  │    Redis     │  │   Anthropic  │                  │
│  │  (Primary)   │  │   (Cache)    │  │  Claude API  │                  │
│  │              │  │              │  │              │                  │
│  │  • Users     │  │  • Sessions  │  │  • Sonnet    │                  │
│  │  • Threads   │  │  • Results   │  │    4.5       │                  │
│  │  • Goals     │  │  • Temp Data │  │  • Streaming │                  │
│  │  • Portfolios│  │              │  │              │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │   RabbitMQ   │  │     Plaid    │  │    Alpha     │                  │
│  │   (Queue)    │  │     API      │  │   Vantage    │                  │
│  │              │  │              │  │              │                  │
│  │  • Async     │  │  • Accounts  │  │  • Market    │                  │
│  │    Tasks     │  │  • Balances  │  │    Data      │                  │
│  │  • Sims      │  │  • Trans     │  │              │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## System Components

### Frontend Components

#### React Application
- **Framework**: React 18+ with Concurrent Mode
- **Language**: TypeScript 5+
- **Build Tool**: Vite 4+
- **State Management**:
  - Zustand (Global state)
  - React Query (Server state)
  - LocalStorage (Persistence)

#### Component Architecture
```
src/
├── components/
│   ├── conversation/      # Chat interface
│   │   ├── ChatInterface.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageBubble.tsx
│   │   └── InputArea.tsx
│   ├── goals/            # Goal management
│   │   ├── GoalDashboard.tsx
│   │   ├── GoalCard.tsx
│   │   ├── GoalForm.tsx
│   │   └── GoalProgress.tsx
│   ├── portfolio/        # Portfolio displays
│   │   ├── PortfolioOverview.tsx
│   │   ├── AllocationChart.tsx
│   │   ├── EfficientFrontier.tsx
│   │   └── PerformanceMetrics.tsx
│   ├── simulation/       # Monte Carlo UI
│   │   ├── MonteCarloSetup.tsx
│   │   ├── SimulationProgress.tsx
│   │   ├── FanChart.tsx
│   │   └── WhatIfSliders.tsx
│   └── common/           # Shared components
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── LoadingSpinner.tsx
│       └── ErrorBoundary.tsx
├── hooks/                # Custom hooks
│   ├── useThread.ts
│   ├── useSSEStream.ts
│   ├── useSimulation.ts
│   └── usePortfolio.ts
├── services/             # API clients
│   ├── api.ts
│   ├── streaming.ts
│   └── storage.ts
└── types/                # TypeScript types
    ├── thread.ts
    ├── goal.ts
    └── portfolio.ts
```

### Backend Components

#### FastAPI Application
- **Framework**: FastAPI 0.100+
- **Language**: Python 3.11+
- **Server**: Uvicorn (ASGI)
- **Validation**: Pydantic 2+

#### Service Architecture
```
app/
├── agents/               # AI agents
│   ├── orchestrator.py   # Main coordinator
│   ├── goal_planner.py
│   ├── portfolio_architect.py
│   ├── tax_strategist.py
│   ├── risk_manager.py
│   ├── budgeting_agent.py
│   ├── retirement_planner.py
│   ├── monte_carlo_simulator.py
│   └── visualization_agent.py
├── tools/                # Financial tools
│   ├── portfolio_optimizer.py
│   ├── monte_carlo_engine.py
│   ├── goal_analyzer.py
│   ├── tax_calculator.py
│   └── risk_assessor.py
├── api/                  # API routes
│   ├── threads.py
│   ├── chat.py
│   ├── goals.py
│   ├── portfolio.py
│   ├── simulations.py
│   └── budget.py
├── models/               # Database models
│   ├── user.py
│   ├── thread.py
│   ├── goal.py
│   ├── portfolio.py
│   └── simulation.py
├── schemas/              # Pydantic schemas
│   ├── thread.py
│   ├── goal.py
│   └── portfolio.py
├── db/                   # Database layer
│   ├── base.py
│   └── session.py
└── core/                 # Configuration
    ├── config.py
    ├── security.py
    └── cache.py
```

---

## Multi-Agent Architecture

### Agent Orchestration Pattern

```python
class FinancialPlanningOrchestrator:
    """
    Coordinates specialist agents to solve complex financial planning tasks.

    Flow:
    1. User query received
    2. Orchestrator analyzes intent
    3. Activates relevant specialist agents
    4. Agents use tools to perform calculations
    5. Results aggregated and returned to user
    """

    def __init__(self):
        self.agents = {
            'goal_planner': GoalPlannerAgent(),
            'portfolio_architect': PortfolioArchitectAgent(),
            'tax_strategist': TaxStrategistAgent(),
            'risk_manager': RiskManagerAgent(),
            'budgeting': BudgetingAgent(),
            'retirement': RetirementPlannerAgent(),
            'monte_carlo': MonteCarloSimulatorAgent(),
            'visualization': VisualizationAgent()
        }

    async def process_query(self, query: str, context: dict) -> dict:
        # 1. Analyze intent
        intent = await self.analyze_intent(query)

        # 2. Select agents
        agents_needed = self.select_agents(intent)

        # 3. Execute agents (sequential or parallel)
        results = await self.execute_agents(agents_needed, query, context)

        # 4. Aggregate results
        final_result = self.aggregate_results(results)

        return final_result
```

### Agent Responsibilities

#### 1. Goal Planner Agent
```
Responsibilities:
- Parse natural language goal descriptions
- Structure goals with proper parameters
- Calculate required savings rates
- Estimate preliminary success probability
- Validate goal feasibility

Tools Used:
- goal_analyzer
- present_value_calculator
- savings_rate_calculator
```

#### 2. Portfolio Architect Agent
```
Responsibilities:
- Design optimal asset allocations
- Calculate efficient frontier
- Recommend rebalancing strategies
- Analyze risk/return trade-offs
- Asset location optimization

Tools Used:
- portfolio_optimizer (SciPy)
- efficient_frontier_calculator
- rebalancing_analyzer
- asset_location_optimizer
```

#### 3. Tax Strategist Agent
```
Responsibilities:
- Asset location recommendations
- Tax-loss harvesting opportunities
- Withdrawal sequencing optimization
- Tax projection (multi-year)
- RMD planning

Tools Used:
- tax_calculator
- asset_location_optimizer
- withdrawal_sequencer
- rmd_calculator
```

#### 4. Risk Manager Agent
```
Responsibilities:
- Risk assessment (VaR, Sharpe, etc.)
- Stress testing
- Hedging strategy recommendations
- Correlation analysis
- Downside protection

Tools Used:
- risk_assessor
- stress_tester
- correlation_analyzer
- hedge_optimizer
```

#### 5. Budgeting Agent
```
Responsibilities:
- Cash flow analysis
- Expense categorization
- Savings capacity calculation
- Budget recommendations
- Multi-year projections

Tools Used:
- cash_flow_analyzer
- budget_optimizer
- projection_calculator
```

#### 6. Retirement Planner Agent
```
Responsibilities:
- Retirement income modeling
- Social Security optimization
- Withdrawal strategy design
- Longevity risk assessment
- Healthcare cost planning

Tools Used:
- retirement_income_calculator
- social_security_optimizer
- longevity_modeler
- withdrawal_strategist
```

#### 7. Monte Carlo Simulator Agent
```
Responsibilities:
- Run probabilistic simulations (5,000+ iterations)
- Calculate success probability
- Generate percentile projections
- What-if scenario analysis
- Sensitivity analysis

Tools Used:
- monte_carlo_engine (NumPy)
- scenario_generator
- percentile_calculator
- sensitivity_analyzer
```

#### 8. Visualization Agent
```
Responsibilities:
- Generate chart configurations
- Select appropriate chart types
- Format data for visualization
- Create interactive elements
- Export visual reports

Tools Used:
- chart_generator
- data_formatter
- export_generator
```

---

## Data Flow

### 1. User Query Flow

```
User Input
    ↓
Frontend (React)
    ↓ [POST /chat/stream/{thread_id}]
API Gateway
    ↓
FastAPI Route Handler
    ↓
Orchestrator.process_query()
    ↓
[Intent Analysis]
    ↓
[Agent Selection]
    ↓
Specialist Agents (parallel/sequential)
    ↓
Financial Tools (calculations)
    ↓
[Result Aggregation]
    ↓
SSE Stream → Frontend
    ↓
User sees response
```

### 2. Portfolio Optimization Flow

```
Goal Definition
    ↓
Portfolio Architect Agent
    ↓
portfolio_optimizer.optimize()
    ↓
SciPy: Mean-Variance Optimization
    ↓
Calculate Efficient Frontier
    ↓
Select Optimal Allocation
    ↓
Risk Metrics Calculation
    ↓
Return to User
```

### 3. Monte Carlo Simulation Flow

```
Goal + Portfolio Input
    ↓
Monte Carlo Simulator Agent
    ↓
monte_carlo_engine.run()
    ↓
[Generate Return Scenarios]
    ↓
[Parallel Processing - NumPy]
    ↓
5,000 Simulations
    ↓
[Calculate Statistics]
    ↓
Success Probability
    ↓
Percentile Projections
    ↓
Return to User + Cache Results
```

### 4. Real-Time Streaming Flow

```
User sends message
    ↓
Frontend establishes SSE connection
    ↓
Backend starts processing
    ↓
[Stream Events]:
    • connected
    • agent_activated
    • message (incremental)
    • agent_result
    • visualization
    • done
    ↓
Frontend updates UI in real-time
    ↓
Connection closes on completion
```

---

## Database Schema

### Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    Users     │       │   Threads    │       │   Messages   │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │───┐   │ id (PK)      │───┐   │ id (PK)      │
│ email        │   │   │ user_id (FK) │   │   │ thread_id(FK)│
│ name         │   └──▶│ title        │   └──▶│ role         │
│ created_at   │       │ created_at   │       │ content      │
└──────────────┘       │ updated_at   │       │ created_at   │
                       │ deleted_at   │       └──────────────┘
                       └──────────────┘
                              │
                              │
                       ┌──────┴──────┐
                       │             │
                ┌──────▼──────┐ ┌───▼──────────┐
                │    Goals    │ │   Budgets    │
                ├─────────────┤ ├──────────────┤
                │ id (PK)     │ │ id (PK)      │
                │ thread_id(FK)│ │ thread_id(FK)│
                │ category    │ │ income       │
                │ priority    │ │ expenses     │
                │ target_amt  │ │ savings      │
                │ target_date │ │ created_at   │
                │ success_prob│ └──────────────┘
                │ created_at  │
                └─────────────┘
                       │
                       │
                ┌──────┴──────┐
                │             │
         ┌──────▼─────┐ ┌─────▼────────┐
         │ Portfolios │ │ Simulations  │
         ├────────────┤ ├──────────────┤
         │ id (PK)    │ │ id (PK)      │
         │ goal_id(FK)│ │ goal_id (FK) │
         │ allocation │ │ iterations   │
         │ risk_metrics│ │ results      │
         │ created_at │ │ success_prob │
         └────────────┘ │ created_at   │
                        │ completed_at │
                        └──────────────┘
```

### Key Tables

#### Users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email);
```

#### Threads
```sql
CREATE TABLE threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_threads_user_id ON threads(user_id);
CREATE INDEX idx_threads_created_at ON threads(created_at DESC);
CREATE INDEX idx_threads_deleted_at ON threads(deleted_at) WHERE deleted_at IS NULL;
```

#### Goals
```sql
CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL, -- retirement, education, etc.
    priority VARCHAR(50) NOT NULL,  -- essential, important, aspirational
    target_amount DECIMAL(15,2) NOT NULL,
    target_date DATE NOT NULL,
    current_savings DECIMAL(15,2),
    monthly_contribution DECIMAL(10,2),
    risk_tolerance DECIMAL(3,2),    -- 0.0 to 1.0
    success_threshold DECIMAL(3,2), -- 0.0 to 1.0
    success_probability DECIMAL(3,2),
    required_monthly_savings DECIMAL(10,2),
    funding_status VARCHAR(50),     -- on_track, at_risk, off_track
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_goals_thread_id ON goals(thread_id);
CREATE INDEX idx_goals_category ON goals(category);
```

#### Simulations
```sql
CREATE TABLE simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    iterations INTEGER NOT NULL DEFAULT 5000,
    success_probability DECIMAL(3,2),
    results JSONB,  -- Stores percentile data, etc.
    status VARCHAR(50) NOT NULL, -- queued, running, complete, failed
    progress DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_simulations_goal_id ON simulations(goal_id);
CREATE INDEX idx_simulations_status ON simulations(status);
```

---

## API Architecture

### RESTful Design Principles

1. **Resource-Oriented URLs**
   - `/threads` - Collection
   - `/threads/{id}` - Specific resource

2. **HTTP Methods**
   - GET - Retrieve
   - POST - Create
   - PUT - Update (full)
   - PATCH - Update (partial)
   - DELETE - Remove

3. **Status Codes**
   - 200 OK, 201 Created, 204 No Content
   - 400 Bad Request, 401 Unauthorized, 404 Not Found
   - 422 Unprocessable Entity
   - 500 Internal Server Error

### Server-Sent Events (SSE)

```python
@router.post("/chat/stream/{thread_id}")
async def stream_chat(
    thread_id: str,
    message: ChatMessage,
    db: AsyncSession = Depends(get_db)
):
    async def event_generator():
        # Send connected event
        yield {
            "event": "connected",
            "data": json.dumps({"status": "connected"})
        }

        # Process with orchestrator
        async for event in orchestrator.process_streaming(message):
            yield {
                "event": event["type"],
                "data": json.dumps(event["data"])
            }

        # Send done event
        yield {
            "event": "done",
            "data": json.dumps({"status": "complete"})
        }

    return EventSourceResponse(event_generator())
```

---

## Frontend Architecture

### State Management Strategy

#### Global State (Zustand)
```typescript
interface AppState {
  user: User | null;
  threads: Thread[];
  currentThread: Thread | null;
  setUser: (user: User) => void;
  setThreads: (threads: Thread[]) => void;
  setCurrentThread: (thread: Thread) => void;
}

const useAppStore = create<AppState>((set) => ({
  user: null,
  threads: [],
  currentThread: null,
  setUser: (user) => set({ user }),
  setThreads: (threads) => set({ threads }),
  setCurrentThread: (currentThread) => set({ currentThread }),
}));
```

#### Server State (React Query)
```typescript
// Fetch threads with caching
const { data: threads, isLoading } = useQuery({
  queryKey: ['threads'],
  queryFn: fetchThreads,
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// Mutations with optimistic updates
const createThreadMutation = useMutation({
  mutationFn: createThread,
  onMutate: async (newThread) => {
    // Optimistic update
    await queryClient.cancelQueries({ queryKey: ['threads'] });
    const previous = queryClient.getQueryData(['threads']);
    queryClient.setQueryData(['threads'], (old) => [...old, newThread]);
    return { previous };
  },
  onError: (err, newThread, context) => {
    // Rollback on error
    queryClient.setQueryData(['threads'], context.previous);
  },
});
```

### Component Patterns

#### Error Boundary
```typescript
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error:', error, errorInfo);
    // Send to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

---

## Security Architecture

### Authentication Flow

```
1. User submits credentials
   ↓
2. Backend validates
   ↓
3. Generate JWT token
   ↓
4. Return access_token + refresh_token
   ↓
5. Frontend stores in memory (access) + httpOnly cookie (refresh)
   ↓
6. Include access_token in Authorization header
   ↓
7. Refresh when access_token expires
```

### Data Encryption

- **In Transit**: TLS 1.3
- **At Rest**: AES-256 encryption for sensitive fields
- **Passwords**: bcrypt with salt rounds = 12
- **API Keys**: Environment variables, never in code

### Input Validation

```python
# Pydantic validation
class GoalCreate(BaseModel):
    target_amount: float = Field(gt=0, le=1e9)
    target_date: datetime = Field(...)

    @validator('target_date')
    def validate_future_date(cls, v):
        if v <= datetime.now():
            raise ValueError('Date must be in future')
        return v
```

---

## Scalability & Performance

### Caching Strategy

```
┌─────────────────────────────────────┐
│         Cache Layers                │
├─────────────────────────────────────┤
│ 1. Browser Cache (LocalStorage)    │
│    - Threads, User preferences      │
│    - TTL: 24 hours                  │
├─────────────────────────────────────┤
│ 2. CDN Cache (Cloudflare)          │
│    - Static assets                  │
│    - TTL: 30 days                   │
├─────────────────────────────────────┤
│ 3. Redis Cache                      │
│    - API responses                  │
│    - Simulation results             │
│    - TTL: 1 hour - 24 hours        │
├─────────────────────────────────────┤
│ 4. Database Query Cache             │
│    - SQLAlchemy query cache         │
│    - TTL: 5 minutes                 │
└─────────────────────────────────────┘
```

### Performance Optimizations

#### Backend
- **Async I/O**: FastAPI with async/await
- **Connection Pooling**: PostgreSQL pool (min=10, max=20)
- **Query Optimization**: Proper indexes, eager loading
- **Result Caching**: Redis for expensive calculations
- **Parallel Processing**: NumPy for Monte Carlo

#### Frontend
- **Code Splitting**: React.lazy() for routes
- **Memoization**: React.memo, useMemo, useCallback
- **Virtual Scrolling**: For long lists
- **Debouncing**: User input (300ms)
- **Image Optimization**: WebP format, lazy loading

---

## Deployment Architecture

### Production Infrastructure (AWS Example)

```
┌────────────────────────────────────────────┐
│            CloudFront (CDN)                │
│         Static Assets Distribution         │
└──────────────┬─────────────────────────────┘
               │
┌──────────────┴─────────────────────────────┐
│              Route 53 (DNS)                │
└──────────────┬─────────────────────────────┘
               │
┌──────────────┴─────────────────────────────┐
│     Application Load Balancer (ALB)       │
│         SSL/TLS Termination                │
└──────┬───────────────────┬─────────────────┘
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│  ECS/Fargate│     │  ECS/Fargate│
│  (Backend)  │     │  (Backend)  │
│  Instance 1 │     │  Instance 2 │
└──────┬──────┘     └──────┬──────┘
       │                   │
       └────────┬──────────┘
                │
        ┌───────┴────────┐
        │                │
        ▼                ▼
┌──────────────┐  ┌──────────────┐
│  RDS Postgres│  │ ElastiCache  │
│  (Primary)   │  │    Redis     │
│              │  │              │
│  ┌─────────┐ │  └──────────────┘
│  │RDS Read │ │
│  │Replica  │ │
│  └─────────┘ │
└──────────────┘
```

### Environment Configuration

**Development:**
- Local Docker Compose
- PostgreSQL + Redis containers
- Hot reload enabled

**Staging:**
- Smaller instance sizes
- Mirrors production architecture
- Automated deployments from `develop` branch

**Production:**
- Auto-scaling (2-10 instances)
- Multi-AZ deployment
- Automated deployments from `main` branch
- Blue-green deployment strategy

---

## Technology Decisions

### Why React?
- ✅ Large ecosystem, extensive documentation
- ✅ Concurrent mode for better UX
- ✅ Strong TypeScript support
- ✅ Large hiring pool

### Why FastAPI?
- ✅ Modern async support (crucial for SSE)
- ✅ Automatic OpenAPI docs
- ✅ Type hints with Pydantic
- ✅ High performance

### Why PostgreSQL?
- ✅ ACID compliance (financial data integrity)
- ✅ JSON support (flexible schemas)
- ✅ Mature, battle-tested
- ✅ Strong ecosystem

### Why LangChain + Claude?
- ✅ Agent orchestration out-of-the-box
- ✅ Claude excels at reasoning
- ✅ Strong safety guardrails
- ✅ Cost-effective (vs GPT-4)

---

## Monitoring & Observability

### Metrics Collection

```
Application Metrics:
- API response times (p50, p95, p99)
- Error rates by endpoint
- Active users (concurrent)
- Cache hit rates
- Database query times

Business Metrics:
- Goals created per day
- Simulations run per day
- Average success probability
- User retention (7-day, 30-day)
- Feature adoption rates
```

### Logging Strategy

```python
import logging
import structlog

# Structured logging
logger = structlog.get_logger()

logger.info(
    "portfolio_optimized",
    goal_id=goal_id,
    allocation=allocation,
    sharpe_ratio=sharpe_ratio,
    duration_ms=duration
)
```

---

**For detailed implementation guides, see:**
- [Developer Guide](DEVELOPER_GUIDE.md)
- [API Documentation](API_DOCUMENTATION.md)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)

---

**Last Updated**: October 31, 2025
