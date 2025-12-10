# 🚀 WealthNavigator AI - Quick Start Guide

## Prerequisites

✅ Docker Desktop running
✅ Python 3.11+ (via uv)
✅ Node.js 18+
✅ Anthropic API Key ([Get one here](https://console.anthropic.com/))

## Quick Start (3 Steps)

### 1️⃣ Add Your API Key

Edit `backend/.env` and add your Anthropic API key:

```bash
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
```

### 2️⃣ Start Backend

Open Terminal 1:

```bash
./start-backend.sh
```

**Or manually:**

```bash
docker-compose up -d
cd backend
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Wait for:
```
✅ Docker services running
🔧 Starting FastAPI server...
📍 Backend available at: http://localhost:8000
```

### 3️⃣ Start Frontend

Open Terminal 2:

```bash
./start-frontend.sh
```

**Or manually:**

```bash
cd frontend
npm run dev
```

Wait for:
```
🎨 Starting Vite dev server...
📍 Frontend available at: http://localhost:5173
```

### 4️⃣ Open Your Browser

Visit: **http://localhost:5173**

## ✨ What to Try

1. **Click "Start Planning"** on the home page
2. **Send a message** like:
   - "I want to retire at 60 with $80,000 per year"
   - "Help me save for my child's college education"
   - "Optimize my portfolio for retirement in 15 years"
3. **Watch the magic** ✨
   - Real-time agent progress updates
   - Multiple AI specialists working together
   - Live visualizations and recommendations

## 🐛 Troubleshooting

### "Connection failed" error in chat

**Problem:** Backend is not running

**Solution:**
```bash
# Check if backend is running
curl http://localhost:8000/health

# If not, start it:
./start-backend.sh
```

### "Database connection error"

**Problem:** PostgreSQL not running

**Solution:**
```bash
docker-compose up -d
sleep 5  # Wait for DB to start
```

### "ANTHROPIC_API_KEY not set"

**Problem:** API key missing in .env

**Solution:**
1. Get API key from https://console.anthropic.com/
2. Edit `backend/.env`
3. Add: `ANTHROPIC_API_KEY=sk-ant-your-key-here`
4. Restart backend

## 📚 Additional Resources

- **API Documentation:** http://localhost:8000/docs
- **Backend Health:** http://localhost:8000/health
- **Frontend Dev Mode:** http://localhost:5173

## 🎯 Key Features

- **Multi-Agent AI System** - 5 specialist agents working together
- **Real-Time Streaming** - Watch agents think and work
- **Goal-Based Planning** - Retirement, education, home purchase, etc.
- **Portfolio Optimization** - Modern Portfolio Theory (MPT)
- **Monte Carlo Simulation** - 5,000+ probabilistic scenarios
- **Tax Optimization** - Asset location, tax-loss harvesting

## 💡 Tech Stack

- **Backend:** FastAPI + Python + LangGraph + PostgreSQL + Redis
- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **AI:** Anthropic Claude Sonnet 4.5 via LangChain
- **Infrastructure:** Docker Compose

---

**Need help?** Check the logs in your terminal windows for error messages.

**Having fun?** Try asking complex financial planning questions! The AI agents can handle retirement planning, portfolio optimization, tax strategies, and more.

Happy Planning! 🎉
