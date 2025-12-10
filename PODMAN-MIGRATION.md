# WealthNavigator AI - Podman Migration Complete! 🎉

## ✅ Successfully Switched from Docker to Podman

Your WealthNavigator AI system is now running entirely on **Podman** instead of Docker!

### What Changed

- ✅ **PostgreSQL** now runs in Podman container
- ✅ **Redis** now runs in Podman container
- ✅ **Podman Machine** initialized and running
- ✅ **Database migrations** completed
- ✅ **Test user** recreated in new database
- ✅ **SSE endpoint** tested and working
- ✅ **Convenient scripts** created for management

### Why Podman?

Podman advantages over Docker:
- **Daemonless** - No background daemon required
- **Rootless** - Better security, runs as regular user
- **Pod support** - Native Kubernetes-style pod management
- **Docker compatible** - Drop-in replacement for most Docker commands
- **Open source** - Fully open source, no licensing concerns

## 🚀 Quick Start with Podman

### Start Everything

```bash
./podman-start.sh
```

This script automatically:
1. Starts Podman machine if needed
2. Creates/starts PostgreSQL container
3. Creates/starts Redis container
4. Runs database migrations
5. Creates test user if needed
6. Shows status of all services

### Stop Everything

```bash
./podman-stop.sh
```

Cleanly stops all containers while preserving data.

### Manual Management

```bash
# View running containers
podman ps

# View all containers (including stopped)
podman ps -a

# Check Podman machine status
podman machine list

# View logs
podman logs wealthnav-postgres
podman logs wealthnav-redis

# Restart a container
podman restart wealthnav-postgres

# Remove a container (careful - deletes data!)
podman rm -f wealthnav-postgres
```

## 📦 Container Details

### PostgreSQL Container
```
Name: wealthnav-postgres
Image: postgres:15-alpine
Port: 5432 (host) → 5432 (container)
Database: wealthnavigator
User: wealthnav
Password: dev
```

### Redis Container
```
Name: wealthnav-redis
Image: redis:7-alpine
Port: 6379 (host) → 6379 (container)
Persistence: AOF (Append Only File) enabled
```

## 🔄 Complete Workflow

### Daily Development

1. **Start containers:**
   ```bash
   ./podman-start.sh
   ```

2. **Start backend:**
   ```bash
   cd backend
   uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

3. **Start frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

4. **Open browser:**
   ```
   http://localhost:5173
   ```

5. **When done, stop containers:**
   ```bash
   ./podman-stop.sh
   ```

### First Time Setup (Already Done!)

These steps were already completed during migration:

```bash
# 1. Initialize Podman machine
podman machine init
podman machine start

# 2. Start containers
./podman-start.sh

# 3. Run migrations (script does this automatically)
cd backend && uv run alembic upgrade head

# 4. Create test user (script does this automatically)
cd backend && uv run python create_test_user.py
```

## 🎯 Testing the System

```bash
# Test database connection
podman exec -it wealthnav-postgres psql -U wealthnav -d wealthnavigator -c "SELECT COUNT(*) FROM users;"

# Test Redis
podman exec -it wealthnav-redis redis-cli ping
# Should respond: PONG

# Test API endpoint
curl http://localhost:8000/docs
# Should return Swagger UI

# Test SSE streaming
curl -N "http://localhost:8000/api/v1/chat/stream?thread_id=&message=hello&user_id=test-user-123"
# Should stream SSE events
```

## 🔧 Advanced Podman Features

### Inspect Containers

```bash
# Detailed container info
podman inspect wealthnav-postgres

# Resource usage
podman stats

# Network info
podman network ls
podman port wealthnav-postgres
```

### Backup and Restore

```bash
# Backup PostgreSQL data
podman exec wealthnav-postgres pg_dump -U wealthnav wealthnavigator > backup.sql

# Restore from backup
cat backup.sql | podman exec -i wealthnav-postgres psql -U wealthnav wealthnavigator
```

### Volume Management

```bash
# List volumes
podman volume ls

# Inspect volume
podman volume inspect <volume_name>

# Create named volume for persistence
podman volume create wealthnav-postgres-data
podman volume create wealthnav-redis-data
```

## 🚨 Troubleshooting

### Podman Machine Issues

**Problem:** "Cannot connect to Podman socket"

```bash
# Check machine status
podman machine list

# Start machine
podman machine start

# If stuck, restart machine
podman machine stop
podman machine start
```

### Container Won't Start

**Problem:** Port already in use

```bash
# Find process using port
lsof -i :5432
lsof -i :6379

# Kill conflicting process or change port
podman run -d --name wealthnav-postgres -p 5433:5432 ...
```

**Problem:** Container exists but won't start

```bash
# Remove and recreate
podman rm -f wealthnav-postgres
./podman-start.sh
```

### Database Connection Errors

**Problem:** Backend can't connect to database

```bash
# Check if PostgreSQL is running
podman ps | grep postgres

# Check logs
podman logs wealthnav-postgres

# Verify port mapping
podman port wealthnav-postgres

# Test connection
podman exec -it wealthnav-postgres psql -U wealthnav -d wealthnavigator
```

### Permission Issues

**Problem:** Permission denied errors

```bash
# Podman runs rootless, check user permissions
podman unshare ls -la /path/to/volume

# Reset Podman
podman system reset  # WARNING: Deletes all data!
podman machine init
podman machine start
```

## 📊 Migration Summary

### What Was Migrated

1. **PostgreSQL Database**
   - All schema and tables recreated
   - Test user recreated
   - Alembic migration history maintained

2. **Redis Cache**
   - Fresh instance (cache data is ephemeral)
   - AOF persistence enabled

3. **Configuration**
   - Backend `.env` unchanged (same connection strings)
   - Frontend configuration unchanged
   - All code works identically

### Data Status

- ✅ **Database schema** - Complete (all tables created)
- ✅ **Test user** - Recreated with same ID and credentials
- ⚠️  **Previous threads/messages** - Not migrated (fresh database)
- ℹ️  **Redis cache** - Empty (cache is ephemeral)

If you need to migrate old data from Docker:

```bash
# Export from Docker (before stopping)
docker exec wealthnav-postgres pg_dump -U wealthnav wealthnavigator > docker-backup.sql

# Import to Podman
cat docker-backup.sql | podman exec -i wealthnav-postgres psql -U wealthnav wealthnavigator
```

## 🎨 Podman vs Docker Commands

For reference, here's the command comparison:

| Task | Docker | Podman |
|------|--------|--------|
| Run container | `docker run` | `podman run` |
| List containers | `docker ps` | `podman ps` |
| Stop container | `docker stop` | `podman stop` |
| Remove container | `docker rm` | `podman rm` |
| View logs | `docker logs` | `podman logs` |
| Execute command | `docker exec` | `podman exec` |
| Pull image | `docker pull` | `podman pull` |
| Build image | `docker build` | `podman build` |
| Compose (v2) | `docker compose` | `podman compose`* |

*Podman compose requires podman-compose plugin

## 📝 Updated Documentation

All documentation has been updated to reference Podman:

- ✅ **QUICK-TEST.md** - Updated for Podman
- ✅ **SYSTEM-STATUS.md** - Includes Podman instructions
- ✅ **START-SYSTEM.md** - Podman startup guide
- ✅ **podman-start.sh** - Automated startup script
- ✅ **podman-stop.sh** - Automated stop script

## 🎉 You're All Set!

Your system is now running on Podman and everything is working:

1. ✅ Podman machine running
2. ✅ PostgreSQL container running
3. ✅ Redis container running
4. ✅ Database schema created
5. ✅ Test user created
6. ✅ Backend can connect
7. ✅ SSE streaming tested

### Next Steps

1. **Test the application:**
   ```bash
   # Start backend
   cd backend && uv run uvicorn app.main:app --reload

   # Start frontend (new terminal)
   cd frontend && npm run dev

   # Open browser
   open http://localhost:5173
   ```

2. **Try a financial planning query:**
   - Click "Start Planning"
   - Type: "I want to retire at 60"
   - Watch the AI agents work!

3. **Stop containers when done:**
   ```bash
   ./podman-stop.sh
   ```

---

**Migration Complete! 🚀** Your WealthNavigator AI is now powered by Podman!
