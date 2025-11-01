# WealthNavigator AI Developer Guide

**Version 1.0**

Complete guide for developers working on WealthNavigator AI.

---

## Table of Contents

1. [Development Environment Setup](#development-environment-setup)
2. [Architecture Overview](#architecture-overview)
3. [Frontend Development](#frontend-development)
4. [Backend Development](#backend-development)
5. [Database Management](#database-management)
6. [Testing](#testing)
7. [Code Style Guide](#code-style-guide)
8. [Git Workflow](#git-workflow)
9. [Debugging](#debugging)
10. [Performance Optimization](#performance-optimization)
11. [Security Best Practices](#security-best-practices)

---

## Development Environment Setup

### Prerequisites

**Required:**
- **Node.js** 18.x or higher
- **Python** 3.11 or higher
- **PostgreSQL** 15+
- **Redis** 7+
- **Docker** and Docker Compose
- **Git** 2.x+

**Recommended:**
- **VS Code** with extensions:
  - ESLint
  - Prettier
  - Python
  - Docker
  - GitLens
- **16GB RAM** minimum (32GB recommended)
- **50GB** available disk space

### Initial Setup

#### 1. Clone Repository

```bash
git clone https://github.com/yourusername/wealthNavigator.git
cd wealthNavigator
```

#### 2. Set Up Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure environment variables
# Edit .env and set:
# VITE_API_BASE_URL=http://localhost:8000
```

#### 3. Set Up Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env

# Configure environment variables
# Edit .env and set:
# DATABASE_URL=postgresql://postgres:dev@localhost:5432/wealthnav
# REDIS_URL=redis://localhost:6379
# ANTHROPIC_API_KEY=your_api_key_here
# SECRET_KEY=your_secret_key_here
```

#### 4. Set Up Databases

**Using Docker (Recommended):**

```bash
# Start PostgreSQL
docker run --name wealthnav-postgres \
  -e POSTGRES_DB=wealthnav \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=dev \
  -p 5432:5432 \
  -d postgres:15

# Start Redis
docker run --name wealthnav-redis \
  -p 6379:6379 \
  -d redis:7
```

**Or use Docker Compose:**

```bash
docker-compose up -d postgres redis
```

#### 5. Run Database Migrations

```bash
cd backend
source venv/bin/activate
alembic upgrade head
```

#### 6. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Access:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Redoc: http://localhost:8000/redoc

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User's Browser                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   React UI   │  │ LocalStorage │  │   Zustand    │      │
│  └──────┬───────┘  └──────────────┘  └──────────────┘      │
└─────────┼──────────────────────────────────────────────────┘
          │ HTTPS/SSE
┌─────────┼──────────────────────────────────────────────────┐
│         │              FastAPI Backend                      │
│  ┌──────┴──────────────────────────────────────┐           │
│  │    Financial Planning Orchestrator          │           │
│  │         (LangChain Coordinator)              │           │
│  └──────┬──────────────────────────────────────┘           │
│         │                                                    │
│  ┌──────┴───────┐                      ┌──────────────┐    │
│  │   Agents     │ ◄──────────────────► │    Tools     │    │
│  │              │                      │              │    │
│  │ • Goal       │                      │ • Portfolio  │    │
│  │   Planner    │                      │   Optimizer  │    │
│  │ • Portfolio  │                      │ • Monte      │    │
│  │   Architect  │                      │   Carlo      │    │
│  │ • Simulator  │                      │   Engine     │    │
│  └──────────────┘                      └──────────────┘    │
└────────────────────────┬─────────────────────────────────────┘
                         │
┌────────────────────────┼─────────────────────────────────────┐
│  ┌──────────────┐  ┌───┴──────┐  ┌──────────────┐           │
│  │  PostgreSQL  │  │  Redis   │  │   Anthropic  │           │
│  └──────────────┘  └──────────┘  └──────────────┘           │
└──────────────────────────────────────────────────────────────┘
```

### Key Components

**Frontend:**
- **React Components**: UI building blocks
- **Custom Hooks**: Reusable logic (useThread, useSSEStream)
- **Services**: API communication layer
- **State Management**: Zustand (global), React Query (server)

**Backend:**
- **Orchestrator**: Coordinates specialist agents
- **Agents**: Domain-specific AI agents (Goal, Portfolio, Tax, etc.)
- **Tools**: Pre-built calculation functions
- **API Routes**: RESTful endpoints + SSE streaming

**Data Layer:**
- **PostgreSQL**: Persistent storage (threads, goals, analyses)
- **Redis**: Caching and session management
- **LocalStorage**: Client-side persistence

---

## Frontend Development

### Project Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── conversation/    # Chat interface
│   │   ├── goals/          # Goal management
│   │   ├── portfolio/      # Portfolio displays
│   │   ├── simulation/     # Monte Carlo UI
│   │   └── common/         # Shared components
│   ├── hooks/              # Custom React hooks
│   │   ├── useThread.ts
│   │   ├── useSSEStream.ts
│   │   └── useSimulation.ts
│   ├── services/           # API clients
│   │   ├── api.ts
│   │   ├── streaming.ts
│   │   └── storage.ts
│   ├── types/              # TypeScript interfaces
│   ├── utils/              # Helper functions
│   ├── App.tsx             # Root component
│   └── main.tsx            # Entry point
├── public/                 # Static assets
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### Key Technologies

**Core:**
- React 18.2+ (Concurrent features)
- TypeScript 5.0+
- Vite 4.x (Build tool)

**State Management:**
- Zustand (Global state)
- React Query / TanStack Query (Server state)
- LocalStorage (Persistence)

**UI:**
- Tailwind CSS 3.x
- shadcn/ui (Component library)
- Headless UI (Accessible primitives)

**Charts:**
- Recharts (Standard charts)
- D3.js (Custom visualizations)

### Creating New Components

**Component Template:**

```typescript
// src/components/example/ExampleComponent.tsx
import React from 'react';

interface ExampleComponentProps {
  title: string;
  onAction?: () => void;
}

export const ExampleComponent: React.FC<ExampleComponentProps> = ({
  title,
  onAction
}) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      {onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Action
        </button>
      )}
    </div>
  );
};
```

### Custom Hooks Pattern

```typescript
// src/hooks/useExample.ts
import { useState, useEffect } from 'react';
import { api } from '../services/api';

export const useExample = (id: string) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await api.getExample(id);
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  return { data, loading, error };
};
```

### API Client Pattern

```typescript
// src/services/api.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle errors globally
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const api = {
  // Threads
  getThreads: () => apiClient.get('/threads'),
  createThread: (title: string) => apiClient.post('/threads', { title }),

  // Goals
  createGoal: (data: GoalCreate) => apiClient.post('/goals', data),

  // Simulations
  runSimulation: (goalId: string) => apiClient.post(`/simulations/${goalId}`),
};
```

### SSE Streaming Pattern

```typescript
// src/hooks/useSSEStream.ts
import { useState, useEffect, useCallback } from 'react';

export const useSSEStream = (threadId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    const eventSource = new EventSource(
      `${API_BASE_URL}/chat/stream/${threadId}`
    );

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, data]);
    });

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();
      // Retry logic
      setTimeout(connect, 5000);
    };

    return eventSource;
  }, [threadId]);

  useEffect(() => {
    const eventSource = connect();
    return () => eventSource.close();
  }, [connect]);

  return { messages, isConnected };
};
```

### Common Commands

```bash
# Development
npm run dev                 # Start dev server
npm run build              # Production build
npm run preview            # Preview build

# Code Quality
npm run lint               # Run ESLint
npm run lint:fix           # Fix ESLint issues
npm run format             # Run Prettier
npm run type-check         # TypeScript check

# Testing
npm run test               # Unit tests (Vitest)
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage
npm run test:e2e           # E2E tests (Playwright)
```

---

## Backend Development

### Project Structure

```
backend/
├── app/
│   ├── agents/              # AI agents
│   │   ├── orchestrator.py
│   │   ├── goal_planner.py
│   │   ├── portfolio_architect.py
│   │   └── monte_carlo_simulator.py
│   ├── tools/              # Calculation tools
│   │   ├── portfolio_optimizer.py
│   │   ├── monte_carlo_engine.py
│   │   └── goal_analyzer.py
│   ├── api/                # FastAPI routes
│   │   ├── threads.py
│   │   ├── chat.py
│   │   ├── goals.py
│   │   └── portfolio.py
│   ├── models/             # SQLAlchemy models
│   │   ├── thread.py
│   │   ├── goal.py
│   │   └── user.py
│   ├── schemas/            # Pydantic schemas
│   │   ├── thread.py
│   │   ├── goal.py
│   │   └── portfolio.py
│   ├── db/                 # Database
│   │   ├── base.py
│   │   └── session.py
│   ├── core/               # Configuration
│   │   ├── config.py
│   │   └── security.py
│   └── main.py             # FastAPI app
├── tests/                  # Tests
│   ├── unit/
│   ├── integration/
│   └── conftest.py
├── alembic/                # Migrations
├── requirements.txt
└── pyproject.toml
```

### Key Technologies

**Core:**
- FastAPI 0.100+
- Python 3.11+
- Pydantic 2.x
- Uvicorn (ASGI server)

**Database:**
- SQLAlchemy 2.x (ORM)
- Alembic (Migrations)
- asyncpg (PostgreSQL driver)
- Redis-py (Redis client)

**AI:**
- LangChain 0.1.x
- Anthropic Claude SDK
- NumPy (Numerical computing)
- SciPy (Optimization)

### Creating New Endpoints

**Route Template:**

```python
# app/api/example.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.example import ExampleCreate, ExampleResponse

router = APIRouter(prefix="/examples", tags=["examples"])

@router.post("/", response_model=ExampleResponse)
async def create_example(
    example: ExampleCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new example."""
    # Implementation
    return {"id": "123", "data": example.data}

@router.get("/{example_id}", response_model=ExampleResponse)
async def get_example(
    example_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get an example by ID."""
    # Implementation
    pass
```

### Agent Pattern

```python
# app/agents/example_agent.py
from langchain.agents import AgentExecutor
from langchain.tools import Tool
from app.tools.example_tool import example_calculation

class ExampleAgent:
    """Agent for example domain logic."""

    def __init__(self, llm):
        self.llm = llm
        self.tools = self._create_tools()

    def _create_tools(self):
        return [
            Tool(
                name="example_calculation",
                func=example_calculation,
                description="Performs example calculation"
            )
        ]

    async def execute(self, query: str) -> dict:
        """Execute agent with given query."""
        executor = AgentExecutor.from_agent_and_tools(
            agent=self.create_agent(),
            tools=self.tools,
            verbose=True
        )

        result = await executor.arun(query)
        return result
```

### Tool Pattern

```python
# app/tools/example_tool.py
import numpy as np
from typing import Dict, Any

def example_calculation(
    inputs: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Example calculation tool.

    Args:
        inputs: Dictionary with calculation parameters

    Returns:
        Dictionary with calculation results
    """
    # Extract parameters
    value = inputs.get('value', 0)

    # Perform calculation
    result = np.sqrt(value)

    # Return results
    return {
        'result': result,
        'metadata': {
            'input_value': value,
            'calculation': 'square_root'
        }
    }
```

### Database Models

```python
# app/models/example.py
from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.sql import func
from app.db.base import Base

class Example(Base):
    __tablename__ = "examples"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    value = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
```

### Pydantic Schemas

```python
# app/schemas/example.py
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class ExampleBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    value: int = Field(default=0, ge=0)

class ExampleCreate(ExampleBase):
    pass

class ExampleUpdate(BaseModel):
    name: Optional[str] = None
    value: Optional[int] = None

class ExampleResponse(ExampleBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
```

### Common Commands

```bash
# Development
uvicorn app.main:app --reload        # Start dev server
uvicorn app.main:app --reload --port 8001  # Custom port

# Testing
pytest                                # All tests
pytest tests/unit                     # Unit tests
pytest tests/integration              # Integration tests
pytest --cov=app                      # With coverage
pytest -v -s                          # Verbose output

# Code Quality
black .                               # Format code
black . --check                       # Check formatting
ruff check .                          # Lint code
ruff check . --fix                    # Auto-fix
mypy app                              # Type checking

# Database
alembic revision --autogenerate -m "message"  # Create migration
alembic upgrade head                          # Apply migrations
alembic downgrade -1                          # Rollback one
alembic history                               # Migration history
```

---

## Database Management

### Creating Migrations

```bash
# Auto-generate migration from model changes
alembic revision --autogenerate -m "add user table"

# Create empty migration
alembic revision -m "custom changes"

# Edit the generated file in alembic/versions/
```

### Migration File Example

```python
# alembic/versions/xxx_add_user_table.py
from alembic import op
import sqlalchemy as sa

def upgrade():
    op.create_table(
        'users',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('email', sa.String(), unique=True, nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now())
    )

def downgrade():
    op.drop_table('users')
```

### Database Seeding

```python
# scripts/seed_database.py
from app.db.session import SessionLocal
from app.models.user import User

async def seed_data():
    db = SessionLocal()

    # Create test user
    user = User(
        email="test@example.com",
        name="Test User"
    )
    db.add(user)
    await db.commit()

if __name__ == "__main__":
    import asyncio
    asyncio.run(seed_data())
```

---

## Testing

### Frontend Testing

**Unit Tests (Vitest):**

```typescript
// src/components/Example.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExampleComponent } from './ExampleComponent';

describe('ExampleComponent', () => {
  it('renders title correctly', () => {
    render(<ExampleComponent title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('calls onAction when button clicked', async () => {
    const mockAction = vi.fn();
    render(<ExampleComponent title="Test" onAction={mockAction} />);

    const button = screen.getByRole('button');
    await userEvent.click(button);

    expect(mockAction).toHaveBeenCalledOnce();
  });
});
```

**E2E Tests (Playwright):**

```typescript
// e2e/goal-creation.spec.ts
import { test, expect } from '@playwright/test';

test('create retirement goal', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Click new thread
  await page.click('[data-testid="new-thread"]');

  // Type goal
  await page.fill('[data-testid="chat-input"]',
    'I want to retire at 60 with $80,000 per year');
  await page.press('[data-testid="chat-input"]', 'Enter');

  // Wait for response
  await page.waitForSelector('[data-testid="goal-summary"]');

  // Verify goal created
  expect(await page.textContent('[data-testid="goal-amount"]'))
    .toContain('$80,000');
});
```

### Backend Testing

**Unit Tests:**

```python
# tests/unit/test_portfolio_optimizer.py
import pytest
from app.tools.portfolio_optimizer import optimize_portfolio

def test_portfolio_optimization():
    """Test portfolio optimization returns valid allocation."""
    result = optimize_portfolio({
        'risk_tolerance': 0.6,
        'time_horizon': 15,
        'constraints': {'stocks_min': 0.4, 'stocks_max': 0.8}
    })

    assert 'allocation' in result
    assert sum(result['allocation'].values()) == pytest.approx(1.0)
    assert all(v >= 0 for v in result['allocation'].values())
```

**Integration Tests:**

```python
# tests/integration/test_goal_api.py
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_create_goal():
    """Test goal creation endpoint."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post("/goals", json={
            "category": "retirement",
            "target_amount": 1000000,
            "target_date": "2040-01-01"
        })

    assert response.status_code == 201
    data = response.json()
    assert data['target_amount'] == 1000000
```

---

## Code Style Guide

### Frontend (TypeScript/React)

**Component Naming:**
- PascalCase for components: `GoalCard`, `PortfolioChart`
- camelCase for variables/functions: `calculateReturn`, `userAge`
- UPPER_SNAKE_CASE for constants: `MAX_GOALS`, `API_TIMEOUT`

**File Structure:**
- One component per file
- Co-locate tests: `Component.tsx` + `Component.test.tsx`
- Use index.ts for barrel exports

**Example:**
```typescript
// ✅ Good
export const PortfolioChart: React.FC<Props> = ({ data }) => {
  const [isLoading, setIsLoading] = useState(false);

  return <div>{/* ... */}</div>;
};

// ❌ Bad
export const portfolio_chart = (props) => {
  // ...
};
```

### Backend (Python)

**Naming:**
- snake_case for functions/variables: `calculate_return`, `user_age`
- PascalCase for classes: `GoalPlanner`, `PortfolioOptimizer`
- UPPER_SNAKE_CASE for constants: `MAX_ITERATIONS`, `API_TIMEOUT`

**Docstrings:**
```python
def calculate_required_savings(
    target_amount: float,
    years: int,
    return_rate: float
) -> float:
    """
    Calculate required monthly savings.

    Args:
        target_amount: Goal amount in dollars
        years: Time horizon in years
        return_rate: Annual return rate (e.g., 0.07 for 7%)

    Returns:
        Required monthly savings amount

    Raises:
        ValueError: If inputs are invalid
    """
    pass
```

**Type Hints:**
- Always use type hints
- Use `typing` module for complex types
- Return type must be specified

---

## Git Workflow

### Branch Naming

```
feature/short-description     # New features
bugfix/issue-number          # Bug fixes
hotfix/critical-issue        # Production hotfixes
refactor/component-name      # Code refactoring
docs/update-readme           # Documentation
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add Monte Carlo simulation visualization
fix: correct portfolio optimization calculation
docs: update API documentation
refactor: simplify goal creation flow
test: add unit tests for portfolio optimizer
chore: update dependencies
```

### Pull Request Process

1. Create feature branch from `main`
2. Make changes with clear commits
3. Write/update tests
4. Ensure all tests pass
5. Update documentation
6. Create PR with description
7. Address review comments
8. Merge when approved

---

## Debugging

### Frontend Debugging

**React DevTools:**
- Install browser extension
- Inspect component hierarchy
- Check props and state

**Redux DevTools (if using Redux):**
- Time-travel debugging
- Action history

**Console Logging:**
```typescript
console.log('Debug:', { variable, state });
console.table(arrayData);
console.group('Section');
// logs
console.groupEnd();
```

### Backend Debugging

**Print Debugging:**
```python
print(f"Debug: {variable=}, {state=}")
```

**Logging:**
```python
import logging

logger = logging.getLogger(__name__)
logger.debug("Debug message")
logger.info("Info message")
logger.error("Error message")
```

**PDB (Python Debugger):**
```python
import pdb; pdb.set_trace()  # Breakpoint
```

**VS Code Debugging:**
- Set breakpoints in editor
- Use Debug panel (F5)
- Step through code

---

## Performance Optimization

### Frontend Optimization

**Code Splitting:**
```typescript
// Lazy load routes
const GoalDashboard = lazy(() => import('./components/goals/GoalDashboard'));
```

**Memoization:**
```typescript
const MemoizedChart = React.memo(PortfolioChart);

const expensiveCalculation = useMemo(
  () => calculateSomething(data),
  [data]
);
```

**Debouncing:**
```typescript
const debouncedSearch = useDebounce(searchTerm, 300);
```

### Backend Optimization

**Database Query Optimization:**
```python
# Use eager loading
query = query.options(joinedload(Thread.messages))

# Use select_in loading for collections
query = query.options(selectinload(User.goals))

# Add indexes
Index('idx_thread_user', 'user_id')
```

**Caching:**
```python
from redis import Redis

cache = Redis()

@cache_result(ttl=3600)
async def expensive_calculation(params):
    # ...
    pass
```

---

## Security Best Practices

### Input Validation

```python
# Backend - Pydantic validation
class GoalCreate(BaseModel):
    target_amount: float = Field(gt=0, le=1000000000)
    target_date: datetime = Field(...)

    @validator('target_date')
    def validate_future_date(cls, v):
        if v <= datetime.now():
            raise ValueError('Date must be in future')
        return v
```

### SQL Injection Prevention

```python
# ✅ Good - Use ORM
result = await db.execute(
    select(User).where(User.email == email)
)

# ❌ Bad - Raw SQL with string formatting
query = f"SELECT * FROM users WHERE email = '{email}'"
```

### XSS Prevention

```typescript
// ✅ Good - React escapes by default
<div>{userInput}</div>

// ❌ Bad - dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{__html: userInput}} />
```

### Authentication

```python
# Use secure password hashing
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

hashed = pwd_context.hash(plain_password)
is_valid = pwd_context.verify(plain_password, hashed)
```

---

## Additional Resources

- **[Architecture Guide](ARCHITECTURE.md)** - Detailed architecture
- **[API Documentation](API_DOCUMENTATION.md)** - API reference
- **[Testing Guide](TESTING_GUIDE.md)** - Testing strategies
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Production deployment

---

**Questions?** Contact the dev team or check our [FAQ](FAQ.md).
