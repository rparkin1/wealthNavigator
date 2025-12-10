# WealthNavigator AI - Quick Test Guide

## ✅ System is READY - Test Now!

### 🚀 Quick Start (2 minutes)

1. **Open your browser:**
   ```
   http://localhost:5173
   ```

2. **Click "Start Planning"** button

3. **Type a financial planning question:**
   - "I want to retire at 60 with $80,000 per year"
   - "Help me save for college in 10 years"
   - "What's the best portfolio allocation?"

4. **Watch the AI agents work in real-time!**

## 🔍 What You Should See

### ✅ Homepage
- Clean interface with "WealthNavigator AI" branding
- "Start Planning" button
- Feature cards describing the system

### ✅ Chat Interface
- Message input at bottom
- "Connected" status indicator when sending message
- Agent progress updates streaming in
- AI responses appearing in real-time

### ✅ Agent Coordination
The multi-agent system will show:
1. **Orchestrator** - Analyzing your question
2. **Goal Planner** - Structuring your financial goals
3. **Portfolio Architect** - Recommending asset allocation
4. **Monte Carlo Simulator** - Calculating success probabilities
5. **Visualization** - Creating charts

## ⚠️ Known Behaviors

### First Message is Slow (5-10 seconds)
This is NORMAL! The system is:
- Initializing the LangGraph workflow
- Calling Anthropic Claude API
- Coordinating multiple AI agents
- Calculating financial projections

**Subsequent messages will be faster (2-5 seconds)**

### Connection Indicator
- 🟢 **Green = Connected** - SSE stream active
- 🔴 **Red = Error** - Check troubleshooting below

## 🐛 Quick Troubleshooting

### "Connection failed" error?

**Check backend is running:**
```bash
ps aux | grep uvicorn

# Should show:
# python3...uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**If not running, restart:**
```bash
cd backend
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Blank white screen?

**Check frontend:**
```bash
cd frontend
npm run dev

# Should show:
# VITE ready in X ms
# http://localhost:5173
```

### Database errors?

**Check PostgreSQL:**
```bash
lsof -i :5432

# Should show Docker containers on port 5432
```

**If not running:**
```bash
docker compose up -d
```

## 📊 System Components Status

Run these commands to verify everything:

```bash
# Backend running?
curl http://localhost:8000/docs
# Should return HTML (FastAPI Swagger UI)

# Frontend accessible?
curl http://localhost:5173
# Should return HTML

# Database running?
lsof -i :5432
# Should show postgres processes

# Test user exists?
cd backend && uv run python -c "from create_test_user import create_test_user; import asyncio; asyncio.run(create_test_user())"
# Should say "Test user already exists" or create it
```

## 🎯 Test Scenarios

### Scenario 1: Retirement Planning
**Input:** "I want to retire at 65 with $100,000 per year. I'm 35 now and have $50,000 saved."

**Expected:** Agents will analyze your goals, recommend portfolio allocation, and calculate required monthly savings.

### Scenario 2: College Savings
**Input:** "Help me save $200,000 for my child's college in 15 years"

**Expected:** Goal planner structures the education goal, portfolio architect suggests 529 plan allocation.

### Scenario 3: Portfolio Analysis
**Input:** "What's the optimal portfolio for moderate risk and 30-year timeline?"

**Expected:** Portfolio architect recommends asset allocation, Monte Carlo simulates outcomes.

## 📝 What Gets Saved

Every conversation:
- ✅ Creates a unique thread (UUID)
- ✅ Saves all messages to database
- ✅ Persists user goals
- ✅ Stores analysis results
- ✅ Records Monte Carlo simulations

**View saved data:**
```bash
docker exec -it wealthnav-postgres psql -U wealthnav -d wealthnavigator

# List threads
SELECT id, title, created_at FROM threads;

# List messages
SELECT role, content, created_at FROM messages ORDER BY created_at DESC LIMIT 10;

# Exit
\q
```

## 🎉 Success Checklist

- [ ] Homepage loads at http://localhost:5173
- [ ] "Start Planning" button navigates to chat
- [ ] Can type and send messages
- [ ] See "Connected" status
- [ ] Agent updates appear in real-time
- [ ] AI responses stream into chat
- [ ] No error messages in browser console

## 🆘 Need Help?

1. **Check SYSTEM-STATUS.md** - Comprehensive troubleshooting
2. **Check START-SYSTEM.md** - Full setup instructions
3. **Check logs** - Backend terminal shows errors
4. **Restart everything:**
   ```bash
   # Kill backend
   pkill -f uvicorn

   # Restart backend
   cd backend
   uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

   # Restart frontend
   cd frontend
   npm run dev
   ```

---

## 🚀 Ready? GO!

**Open your browser now:** http://localhost:5173

Click "Start Planning" and ask your first financial planning question! 🎯
