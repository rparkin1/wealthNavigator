# WealthNavigator AI

Goal-based financial planning and portfolio management platform powered by AI.

## Project Structure

```
wealthNavigator/
├── frontend/          # React + TypeScript frontend
├── backend/           # Python + FastAPI backend
├── docs/              # Additional documentation
├── ProductDescription/ # Product specifications
└── plans/             # Planning documents
```

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- Redis 7+

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Backend Development
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Database Setup
```bash
docker run --name wealthnav-postgres -e POSTGRES_PASSWORD=dev -p 5432:5432 -d postgres:15
docker run --name wealthnav-redis -p 6379:6379 -d redis:7
```

## Documentation

- [Development Plan](DEVELOPMENT_PLAN.md)
- [Claude Code Guidance](CLAUDE.md)
- [Product Requirements](ProductDescription/PRD.md)
- [API Specification](ProductDescription/api-specification.md)
- [User Stories](ProductDescription/user-stories.md)

## Technology Stack

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Recharts, D3.js
**Backend:** Python 3.11, FastAPI, LangChain, NumPy, SciPy
**Database:** PostgreSQL, Redis
**AI:** Anthropic Claude Sonnet 4.5

## MVP Features (Phase 1)

- Thread-based conversation management
- Budget analysis and cash flow forecasting
- Single goal planning (retirement focus)
- Portfolio optimization (3-5 asset classes)
- Monte Carlo simulation (5,000 iterations)
- Basic visualizations

## License

Proprietary - All rights reserved

## Contact

For questions, see DEVELOPMENT_PLAN.md
