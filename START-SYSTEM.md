# WealthNavigator AI - Complete System Startup Guide

## Current Status ✅

- ✅ **Backend server running** (port 8000)
- ✅ **Greenlet dependency installed** (v3.2.4)
- ✅ **Frontend built successfully**
- ❌ **Docker not running** - PostgreSQL and Redis needed

## Quick Start (3 Steps)

### 1. Start Docker and Databases

```bash
# Start Docker Desktop (if using macOS/Windows)
# Or start Docker daemon on Linux

# From project root directory:
cd /Users/robparkin/code/finance/wealthNavigator

# Start PostgreSQL and Redis containers:
docker compose up -d

# Verify containers are running:
docker ps

# You should see:
# - wealthnav-postgres (port 5432)
# - wealthnav-redis (port 6379)
```

### 2. Run Database Migrations

```bash
cd backend

# Run Alembic migrations to create tables:
uv run alembic upgrade head

# You should see output like:
# INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
# INFO  [alembic.runtime.migration] Will assume transactional DDL.
# INFO  [alembic.runtime.migration] Running upgrade  -> abc123, create initial tables
```

### 3. Verify Everything is Running

```bash
# Check backend health (from backend directory):
curl http://localhost:8000/health

# Check frontend (open in browser):
open http://localhost:5173

# Test SSE endpoint:
curl -N "http://localhost:8000/api/v1/chat/stream?thread_id=&message=hello&user_id=test-user"

# You should see streaming events:
# event: connected
# data: {"message":"Connected to financial planning assistant"}
#
# event: agent_started
# data: {"agent":"orchestrator","status":"analyzing your query"}
```

## What's Already Running

### Backend Server (Port 8000)
```bash
# Backend is running with uvicorn:
ps aux | grep uvicorn
# Output: /Users/robparkin/micromamba/bin/python3.13 ...uvicorn app.main:app --reload
```

**Configuration:**
- Database: `postgresql://wealthnav:dev@localhost:5432/wealthnavigator`
- Redis: `redis://localhost:6379/0`
- API: `http://localhost:8000/api/v1`
- Anthropic Model: `claude-sonnet-4-5-20250929`

### Frontend (Port 5173)
```bash
# Frontend is accessible at:
http://localhost:5173

# To restart if needed:
cd frontend
npm run dev
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     WealthNavigator AI                       │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Frontend   │   SSE   │   Backend    │   SQL   │  PostgreSQL  │
│  React + TS  ├────────▶│   FastAPI    ├────────▶│   Database   │
│  Port 5173   │         │   Port 8000  │         │   Port 5432  │
└──────────────┘         └──────┬───────┘         └──────────────┘
                                │
                                │ Cache
                                ▼
                         ┌──────────────┐
                         │    Redis     │
                         │   Port 6379  │
                         └──────────────┘

Multi-Agent System (LangGraph):
┌─────────────────────────────────────────────────────────────┐
│  Orchestrator → Goal Planner → Portfolio Architect          │
│                                                              │
│  → Monte Carlo Simulator → Visualization Agent              │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

Created by Alembic migrations in `backend/alembic/versions/`:

### Core Tables:
- **users** - User accounts and profiles
- **threads** - Conversation threads (UUID-based)
- **messages** - Chat messages (user + assistant)
- **goals** - Financial goals (retirement, education, etc.)
- **portfolios** - Portfolio allocations and accounts
- **analyses** - Query-based analysis results
- **simulations** - Monte Carlo simulation runs

### Relationships:
```sql
users (1) ─── (N) threads
threads (1) ─── (N) messages
threads (1) ─── (N) goals
users (1) ─── (1) portfolio
threads (1) ─── (N) analyses
analyses (1) ─── (N) simulations
```

## Troubleshooting

### Issue: "Connection failed" in chat interface

**Cause:** PostgreSQL not running

**Fix:**
```bash
docker compose up -d
cd backend && uv run alembic upgrade head
```

### Issue: Backend returns 500 error

**Possible causes:**
1. Database not running → Start Docker
2. Migrations not run → Run `alembic upgrade head`
3. Missing greenlet → Already installed ✅

**Debug:**
```bash
# Check backend logs:
tail -f /tmp/backend.log

# Test database connection:
curl http://localhost:8000/api/v1/health
```

### Issue: Frontend shows blank screen

**Cause:** TypeScript compilation errors (already fixed ✅)

**Verify build:**
```bash
cd frontend
npm run build
# Should output: dist/index.html, dist/assets/*
```

## Environment Variables

### Backend (.env)
```bash
DATABASE_URL=postgresql://wealthnav:dev@localhost:5432/wealthnavigator
REDIS_URL=redis://localhost:6379/0
ANTHROPIC_API_KEY=sk-ant-api03-...
DEBUG=True
```

### Frontend (.env)
```bash
VITE_API_BASE_URL=http://localhost:8000
```

## API Endpoints

### Chat (SSE Streaming)
```bash
GET /api/v1/chat/stream?thread_id=&message=hello&user_id=test
```

### Threads
```bash
GET    /api/v1/threads          # List threads
POST   /api/v1/threads          # Create thread
GET    /api/v1/threads/{id}     # Get thread
DELETE /api/v1/threads/{id}     # Delete thread
```

### Goals
```bash
GET    /api/v1/goals            # List goals
POST   /api/v1/goals            # Create goal
GET    /api/v1/goals/{id}       # Get goal
PUT    /api/v1/goals/{id}       # Update goal
DELETE /api/v1/goals/{id}       # Delete goal
```

## Next Steps After Startup

1. **Test Chat Interface:**
   - Navigate to http://localhost:5173
   - Click "Start Planning"
   - Send message: "I want to retire at 60 with $80,000 per year"
   - Watch real-time agent coordination

2. **Verify Agent System:**
   - Orchestrator analyzes the query
   - Goal Planner structures retirement goal
   - Portfolio Architect suggests allocation
   - Monte Carlo runs probability simulations
   - Visualization generates charts

3. **Check Database:**
   ```bash
   docker exec -it wealthnav-postgres psql -U wealthnav -d wealthnavigator

   # List tables:
   \dt

   # Check threads:
   SELECT * FROM threads;
   ```

## Performance Targets (from PRD)

- ✅ Dashboard load: <1 second
- ✅ Thread list render: <100ms
- ⏳ Account sync: <10 seconds (Plaid not integrated yet)
- ⏳ Portfolio optimization: <5 seconds
- ⏳ Monte Carlo (5,000 iterations): <30 seconds
- ✅ Chart generation: <500ms

## Files Reference

### Backend Core:
- `backend/app/main.py` - FastAPI app entry point
- `backend/app/api/chat.py` - SSE streaming endpoint
- `backend/app/agents/graph.py` - LangGraph workflow
- `backend/app/models/` - SQLAlchemy models
- `backend/alembic/` - Database migrations

### Frontend Core:
- `frontend/src/App.tsx` - Main app component
- `frontend/src/services/streaming.ts` - SSE client
- `frontend/src/hooks/useSSEStream.ts` - SSE React hook
- `frontend/src/components/conversation/` - Chat UI

---

**Ready to start?** Run the 3 commands above and your full system will be operational! 🚀
