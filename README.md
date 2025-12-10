# WealthNavigator AI

**AI-Powered Goal-Based Financial Planning Platform**

WealthNavigator AI combines conversational AI with institutional-grade portfolio management tools to help you plan for retirement, education funding, home purchases, and other major financial goals.

[![Status: Beta](https://img.shields.io/badge/Status-Beta-yellow.svg)]()

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Documentation](#documentation)
- [Development Status](#development-status)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

WealthNavigator AI is a comprehensive financial planning platform that uses advanced AI agents to provide personalized guidance for your financial goals. Unlike traditional robo-advisors, WealthNavigator focuses on goal-based planning with Monte Carlo simulations, tax optimization, and risk management.

### What Makes WealthNavigator Different?

- **Goal-Based Planning**: Define goals in natural language ("I want to retire at 60 with $80,000 per year")
- **Multi-Agent Architecture**: 8 specialized AI agents working together for comprehensive analysis
- **Institutional-Grade Tools**: Modern Portfolio Theory, Monte Carlo simulation, tax optimization
- **Conversational Interface**: Natural language interaction with real-time streaming responses
- **Transparent Calculations**: See exactly how recommendations are generated

---

## Key Features

### 🎯 Intelligent Goal Planning

- Natural language goal definition
- Support for multiple goal types: Retirement, Education, Home Purchase, Emergency Fund
- Priority-based funding optimization
- Success probability tracking with Monte Carlo simulation

### 💼 Advanced Portfolio Management

- Mean-variance optimization for efficient frontier
- 50+ asset classes supported
- Tax-aware asset location
- Automated rebalancing recommendations
- Multi-level optimization (Goal, Account, Household)

### 📊 Monte Carlo Simulation

- 5,000+ iteration simulations in under 30 seconds
- Probabilistic success analysis
- Portfolio value distributions at multiple percentiles
- Sequence of returns risk modeling
- Interactive what-if scenarios

### 💰 Tax Optimization

- Smart asset location (tax-efficient account placement)
- Tax-loss harvesting with wash sale compliance
- Withdrawal sequencing optimization
- Multi-year tax projections
- RMD planning and Roth conversion analysis

### 🤖 Multi-Agent AI System

Eight specialized agents working together:

1. **Budgeting Agent** - Cash flow analysis and expense categorization
2. **Goal Planner Agent** - Goal structuring and funding calculations
3. **Portfolio Architect Agent** - Modern Portfolio Theory optimization
4. **Tax Strategist Agent** - Asset location and tax-loss harvesting
5. **Risk Manager Agent** - Risk assessment and hedging strategies
6. **Retirement Planner Agent** - Retirement income and withdrawal modeling
7. **Monte Carlo Simulator Agent** - Probabilistic simulations
8. **Visualization Agent** - React-based charts and dashboards

### 💬 Conversational Interface

- Thread-based conversation management
- Real-time streaming responses via Server-Sent Events
- Conversation history with categorization
- Query-based analysis tracking
- Export and comparison capabilities

---

## Technology Stack

### Frontend

- **Framework**: React 18+ with TypeScript
- **State Management**: Zustand (global) + React Query (server state)
- **UI Components**: Tailwind CSS + shadcn/ui
- **Visualizations**: Recharts + D3.js
- **Build Tool**: Vite

### Backend

- **Framework**: FastAPI (Python 3.11+)
- **AI Engine**: Anthropic Claude Sonnet 4.5 via LangChain
- **Database**: PostgreSQL + Redis
- **Financial Calculations**: NumPy/SciPy
- **Queue System**: RabbitMQ (async tasks)

### External Services

- **Plaid** - Account aggregation (planned)
- **Alpha Vantage** - Market data
- **IRS API** - Tax tables

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+
- **Docker** and Docker Compose
- **PostgreSQL** 15+
- **Redis** 7+

### Quick Start (Development)

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/wealthNavigator.git
   cd wealthNavigator
   ```

2. **Set up environment variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Edit backend/.env and add your Anthropic API key

   # Frontend
   cp frontend/.env.example frontend/.env
   ```

3. **Start with Docker Compose**
   ```bash
   docker-compose up
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Manual Setup

#### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up database
docker run --name wealthnav-postgres -e POSTGRES_PASSWORD=dev -p 5432:5432 -d postgres:15
docker run --name wealthnav-redis -p 6379:6379 -d redis:7

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Frontend API Base URL & Dev Proxy

- The frontend calls the backend API using either:
  - `VITE_API_BASE_URL` (e.g., `http://localhost:8000`), or
  - A development proxy for relative `/api/*` requests.

- Configure environment (recommended):
  - Create/update `frontend/.env` with:
    - `VITE_API_BASE_URL=http://localhost:8000`
  - Alternatively set in your shell before `npm run dev`:
    - macOS/Linux: `export VITE_API_BASE_URL=http://localhost:8000`
    - Windows (PowerShell): `$env:VITE_API_BASE_URL='http://localhost:8000'`

- Dev proxy is enabled in `frontend/vite.config.ts`:
  - Requests to `/api/*` during `npm run dev` are proxied to `VITE_API_BASE_URL`.
  - Example: frontend calls `/api/v1/life-events/events` → proxied to `http://localhost:8000/api/v1/life-events/events`.

- If you see `Unexpected token '<'` when loading pages:
  - It means the frontend received HTML (e.g., index.html) instead of JSON.
  - Fix by ensuring the backend is running on `VITE_API_BASE_URL`, or use the relative `/api/*` path so the dev proxy forwards the request correctly.

---

## Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[User Guide](docs/USER_GUIDE.md)** - How to use WealthNavigator AI
- **[Developer Guide](docs/DEVELOPER_GUIDE.md)** - Development setup and architecture
- **[API Documentation](docs/API_DOCUMENTATION.md)** - API endpoints and usage
- **[Product Roadmap](docs/PRODUCT_ROADMAP.md)** - Feature development timeline
- **[Architecture Guide](docs/ARCHITECTURE.md)** - Technical architecture details

### Additional Resources

- **[CLAUDE.md](CLAUDE.md)** - Claude Code development guidance
- **[DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md)** - Detailed development plan
- **[ProductDescription/PRD.md](ProductDescription/PRD.md)** - Product requirements
- **[ProductDescription/user-stories.md](ProductDescription/user-stories.md)** - User stories

---

## Development Status

**Current Phase**: MVP Development (Phase 1)
**Target MVP Completion**: 16-20 weeks

### MVP Features (Planned)

- ✅ Thread-based conversation management
- ✅ Budget analysis and cash flow forecasting
- ✅ Single goal planning (retirement)
- ✅ Basic portfolio optimization (3-5 asset classes)
- ✅ Monte Carlo simulation (5,000 iterations)
- ✅ Basic visualizations
- ✅ Error handling and retry logic

### Post-MVP Features (Planned)

- Multi-goal planning
- Tax-aware optimization
- Advanced portfolio features (10+ asset classes)
- Risk management and hedging
- Estate planning
- Insurance optimization
- Advisor collaboration

### Performance Targets

- Dashboard load: <1 second
- Monte Carlo simulation: <30 seconds
- Portfolio optimization: <5 seconds
- API error rate: <0.5%
- System uptime: 99%+

---

## Project Structure

```
wealthNavigator/
├── frontend/                   # React + TypeScript frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API clients
│   │   └── types/            # TypeScript interfaces
│   └── package.json
│
├── backend/                   # Python + FastAPI backend
│   ├── app/
│   │   ├── agents/           # Financial planning agents
│   │   ├── tools/            # Financial calculation tools
│   │   ├── api/              # FastAPI routes
│   │   └── models/           # Pydantic models
│   └── requirements.txt
│
├── docs/                      # Documentation
├── ProductDescription/        # Product specifications
├── CLAUDE.md                  # Claude Code guidance
└── README.md                  # This file
```

---

## Testing

### Frontend Tests

```bash
cd frontend
npm run test              # Unit tests (Vitest)
npm run test:e2e          # E2E tests (Playwright)
npm run type-check        # TypeScript validation
```

### Backend Tests

```bash
cd backend
pytest                    # All tests
pytest tests/unit         # Unit tests only
pytest --cov=app          # With coverage
```

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test` and `pytest`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Quality Standards

- **Frontend**: ESLint + Prettier + TypeScript
- **Backend**: Black + Ruff + mypy
- **Testing**: 80% coverage for critical paths
- **Documentation**: All features must be documented

---

## Security

WealthNavigator AI takes security seriously:

- **Encryption**: TLS 1.3 for data in transit, AES-256 at rest
- **Authentication**: Multi-factor authentication required
- **Compliance**: GLBA financial privacy compliance
- **Data Privacy**: GDPR and CCPA compliant

**Found a security issue?** Please email security@wealthnavigator.ai (do not open a public issue).

---

## License

Proprietary - All rights reserved

---

## Disclaimer

WealthNavigator AI provides educational information and tools to help you make informed financial decisions. This is **not financial advice**. The platform does not provide investment, legal, or tax advice. Please consult with qualified professionals for personalized advice.

Past performance does not guarantee future results. All investments carry risk, including possible loss of principal.

---

**Built with ❤️ by the WealthNavigator team**
