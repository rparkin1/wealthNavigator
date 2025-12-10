# WealthNavigator AI - Startup Guide

Complete guide for starting and stopping all services using Podman.

---

## 🚀 Quick Start (Recommended)

### Option 1: Automatic Start (All Services)

Start everything with one command:

```bash
./start-all.sh
```

This will:
1. Start Podman containers (PostgreSQL, Redis)
2. Start backend API server
3. Start frontend dev server
4. Run all services in background with logging

**Access:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

**To stop everything:**
```bash
./stop-all.sh
```

---

### Option 2: Manual Start (Separate Terminals)

**Terminal 1 - Podman Containers:**
```bash
./podman-start.sh
```

**Terminal 2 - Backend:**
```bash
./start-backend.sh
```

**Terminal 3 - Frontend:**
```bash
./start-frontend.sh
```

---

## 📋 Available Scripts

### 🐳 Podman Management

#### `./podman-start.sh`
- Starts Podman containers (PostgreSQL + Redis)
- Checks/starts Podman machine if needed
- Creates containers if they don't exist
- Verifies database health
- Runs migrations if needed

**Usage:**
```bash
./podman-start.sh
```

**Output:**
```
🚀 Starting WealthNavigator AI with Podman...
✓ Podman machine already running
✓ PostgreSQL already running
✓ Redis already running
✓ PostgreSQL is healthy
✓ Redis is healthy
✅ WealthNavigator AI is ready!
```

#### `./podman-stop.sh`
- Stops Podman containers (PostgreSQL + Redis)
- Does NOT remove containers (data preserved)

**Usage:**
```bash
./podman-stop.sh
```

---

### 🔧 Backend Management

#### `./start-backend.sh`
- Checks for `.env` file and API key
- Verifies Podman containers are running
- Starts existing containers if stopped
- Launches FastAPI server with hot reload

**Usage:**
```bash
./start-backend.sh
```

**URLs:**
- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- Portfolio API: http://localhost:8000/api/v1/portfolio/health

**Press Ctrl+C to stop**

---

### 🎨 Frontend Management

#### `./start-frontend.sh`
- Checks if `node_modules` exist (installs if needed)
- Verifies backend is running
- Starts Vite dev server

**Usage:**
```bash
./start-frontend.sh
```

**URL:** http://localhost:5173 (or next available port)

**Press Ctrl+C to stop**

---

### 🎯 All-in-One Scripts

#### `./start-all.sh`
- Starts everything in background
- Logs to `backend.log` and `frontend.log`
- Saves PIDs for easy shutdown

**Usage:**
```bash
./start-all.sh
```

**View logs:**
```bash
# Backend logs
tail -f backend.log

# Frontend logs
tail -f frontend.log

# Both logs
tail -f backend.log frontend.log
```

#### `./stop-all.sh`
- Stops backend server
- Stops frontend server
- Stops Podman containers
- Cleans up PID files

**Usage:**
```bash
./stop-all.sh
```

---

## 🐘 Podman Commands Reference

### Container Status
```bash
# View all containers
podman ps -a

# View running containers only
podman ps

# View specific containers
podman ps --filter "name=wealthnav"
```

### Container Logs
```bash
# PostgreSQL logs
podman logs wealthnav-postgres

# Redis logs
podman logs wealthnav-redis

# Follow logs (real-time)
podman logs -f wealthnav-postgres
```

### Container Management
```bash
# Start containers
podman start wealthnav-postgres wealthnav-redis

# Stop containers
podman stop wealthnav-postgres wealthnav-redis

# Restart containers
podman restart wealthnav-postgres wealthnav-redis

# Remove containers (DESTRUCTIVE - loses data!)
podman rm wealthnav-postgres wealthnav-redis
```

### Database Access
```bash
# Connect to PostgreSQL
podman exec -it wealthnav-postgres psql -U wealthnav -d wealthnavigator

# Connect to Redis CLI
podman exec -it wealthnav-redis redis-cli

# Check PostgreSQL health
podman exec wealthnav-postgres pg_isready -U wealthnav

# Check Redis health
podman exec wealthnav-redis redis-cli ping
```

### Podman Machine
```bash
# View machine status
podman machine list

# Start machine
podman machine start

# Stop machine
podman machine stop

# SSH into machine
podman machine ssh
```

---

## 🔧 Configuration Files

### Backend Configuration

**File:** `backend/.env`

```bash
# Required
ANTHROPIC_API_KEY=sk-your-api-key-here

# Database (default values from Podman containers)
DATABASE_URL=postgresql+asyncpg://wealthnav:dev@localhost:5432/wealthnavigator

# Redis
REDIS_URL=redis://localhost:6379

# Optional
LOG_LEVEL=info
API_V1_PREFIX=/api/v1
```

### Frontend Configuration

**File:** `frontend/.env` (optional)

```bash
# API URL (defaults to http://localhost:8000/api/v1)
VITE_API_URL=http://localhost:8000/api/v1
```

---

## 🚨 Troubleshooting

### Issue: "Address already in use" (Port 8000)

**Cause:** Backend is already running

**Solution:**
```bash
# Find process using port 8000
lsof -ti:8000

# Kill process
kill $(lsof -ti:8000)

# Or use stop-all.sh
./stop-all.sh
```

### Issue: "Cannot connect to Podman"

**Cause:** Podman machine not running

**Solution:**
```bash
# Start Podman machine
podman machine start

# Verify
podman machine list
```

### Issue: "PostgreSQL not accepting connections"

**Cause:** Container starting or crashed

**Solution:**
```bash
# Check container status
podman ps -a

# View logs
podman logs wealthnav-postgres

# Restart container
podman restart wealthnav-postgres

# Wait for health check
podman exec wealthnav-postgres pg_isready -U wealthnav
```

### Issue: Frontend on unexpected port (5174 instead of 5173)

**Cause:** Port 5173 already in use

**Solution:** This is normal! Vite automatically finds next available port.
- Check terminal output for actual port
- Or check `frontend.log` if using `start-all.sh`

### Issue: Database migrations not running

**Cause:** Migrations need to be run manually

**Solution:**
```bash
cd backend
uv run alembic upgrade head
```

### Issue: Test user doesn't exist

**Cause:** Database needs initial user

**Solution:**
```bash
cd backend
uv run python create_test_user.py
```

---

## 📊 Service Health Checks

### Check All Services
```bash
# Podman containers
podman ps

# PostgreSQL
podman exec wealthnav-postgres pg_isready -U wealthnav

# Redis
podman exec wealthnav-redis redis-cli ping

# Backend API
curl http://localhost:8000/api/v1/portfolio/health

# Frontend (should return HTML)
curl http://localhost:5173
```

### Expected Outputs
```bash
# PostgreSQL
/var/run/postgresql:5432 - accepting connections

# Redis
PONG

# Backend API (JSON)
{
  "status": "healthy",
  "service": "portfolio-api",
  "version": "1.0.0",
  "features": [...]
}
```

---

## 🎯 Development Workflow

### Daily Workflow

**Morning (Start):**
```bash
# Option 1: All at once
./start-all.sh

# Option 2: Separate terminals
./podman-start.sh         # Terminal 1
./start-backend.sh        # Terminal 2
./start-frontend.sh       # Terminal 3
```

**During Development:**
- Backend: Auto-reloads on file changes (--reload flag)
- Frontend: Hot module replacement (HMR) via Vite
- Database: Data persists in Podman volumes

**Evening (Stop):**
```bash
# Stop everything
./stop-all.sh

# Or stop backend/frontend (keep database running)
# Press Ctrl+C in terminal windows
```

---

## 🗂️ Data Persistence

### Podman Volumes

Data is stored in Podman-managed volumes:
```bash
# List volumes
podman volume ls

# Inspect volume
podman volume inspect postgres_data
podman volume inspect redis_data
```

### Backup Database
```bash
# Create backup
podman exec wealthnav-postgres pg_dump -U wealthnav wealthnavigator > backup.sql

# Restore backup
cat backup.sql | podman exec -i wealthnav-postgres psql -U wealthnav -d wealthnavigator
```

### Reset Database (DESTRUCTIVE)
```bash
# Stop containers
podman stop wealthnav-postgres wealthnav-redis

# Remove containers
podman rm wealthnav-postgres wealthnav-redis

# Remove volumes
podman volume rm postgres_data redis_data

# Start fresh
./podman-start.sh
```

---

## 📝 Script Summary

| Script | Purpose | Foreground/Background | Logs |
|--------|---------|----------------------|------|
| `podman-start.sh` | Start containers | Foreground | Terminal |
| `podman-stop.sh` | Stop containers | Foreground | Terminal |
| `start-backend.sh` | Start backend | Foreground | Terminal |
| `start-frontend.sh` | Start frontend | Foreground | Terminal |
| `start-all.sh` | Start everything | Background | backend.log, frontend.log |
| `stop-all.sh` | Stop everything | Foreground | Terminal |

---

## 🎓 Best Practices

1. **Use `start-all.sh` for demos** - Quick, clean, everything works
2. **Use separate terminals for development** - See logs in real-time
3. **Keep Podman containers running** - Faster startup, data persists
4. **Stop services before sleeping** - Save resources
5. **Backup database before major changes** - Safety first
6. **Check health after starting** - Verify everything is working

---

## 🔗 URLs Reference

### Local Development
- **Frontend**: http://localhost:5173 (or 5174)
- **Backend API**: http://localhost:8000
- **API Docs (Swagger)**: http://localhost:8000/docs
- **Portfolio API Health**: http://localhost:8000/api/v1/portfolio/health
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### API Endpoints
- Health: `GET /api/v1/portfolio/health`
- Tax-Loss Harvesting: `POST /api/v1/portfolio/tax-loss-harvest`
- Rebalancing: `POST /api/v1/portfolio/rebalance`
- Performance: `POST /api/v1/portfolio/performance`
- Comprehensive: `POST /api/v1/portfolio/analyze`

---

## 📚 Additional Documentation

- `README.md` - Project overview
- `PORTFOLIO-API-COMPLETE.md` - Backend API documentation
- `PORTFOLIO-FRONTEND-COMPLETE.md` - Frontend component documentation
- `ADVANCED-PORTFOLIO-COMPLETE.md` - Full-stack implementation summary

---

**Last Updated:** 2025-10-29
**Version:** 1.0.0
**Container Manager:** Podman (not Docker)
