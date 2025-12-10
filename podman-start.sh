#!/bin/bash
# Start WealthNavigator AI with Podman
# Replaces Docker with Podman for container management

set -e

echo "🚀 Starting WealthNavigator AI with Podman..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Podman machine is running
echo -e "${YELLOW}Checking Podman machine...${NC}"
if ! podman machine list | grep -q "Currently running"; then
    echo "Starting Podman machine..."
    podman machine start
    echo -e "${GREEN}✓ Podman machine started${NC}"
else
    echo -e "${GREEN}✓ Podman machine already running${NC}"
fi

# Start PostgreSQL
echo -e "\n${YELLOW}Starting PostgreSQL...${NC}"
if podman ps -a | grep -q wealthnav-postgres; then
    if podman ps | grep -q wealthnav-postgres; then
        echo -e "${GREEN}✓ PostgreSQL already running${NC}"
    else
        podman start wealthnav-postgres
        echo -e "${GREEN}✓ PostgreSQL started${NC}"
    fi
else
    podman run -d \
      --name wealthnav-postgres \
      -e POSTGRES_USER=wealthnav \
      -e POSTGRES_PASSWORD=dev \
      -e POSTGRES_DB=wealthnavigator \
      -p 5432:5432 \
      postgres:15-alpine
    echo -e "${GREEN}✓ PostgreSQL container created and started${NC}"
fi

# Start Redis
echo -e "\n${YELLOW}Starting Redis...${NC}"
if podman ps -a | grep -q wealthnav-redis; then
    if podman ps | grep -q wealthnav-redis; then
        echo -e "${GREEN}✓ Redis already running${NC}"
    else
        podman start wealthnav-redis
        echo -e "${GREEN}✓ Redis started${NC}"
    fi
else
    podman run -d \
      --name wealthnav-redis \
      -p 6379:6379 \
      redis:7-alpine \
      redis-server --appendonly yes
    echo -e "${GREEN}✓ Redis container created and started${NC}"
fi

# Wait for services to be ready
echo -e "\n${YELLOW}Waiting for services to be ready...${NC}"
sleep 3

# Check if tables exist, run migrations if needed
echo -e "\n${YELLOW}Checking database schema...${NC}"
cd backend
if ! uv run python -c "import asyncio; from app.core.database import AsyncSessionLocal; from sqlalchemy import text; async def check(): async with AsyncSessionLocal() as db: await db.execute(text('SELECT 1 FROM users LIMIT 1')); asyncio.run(check())" 2>/dev/null; then
    echo "Running database migrations..."
    uv run alembic upgrade head
    echo -e "${GREEN}✓ Migrations completed${NC}"

    echo -e "\n${YELLOW}Creating test user...${NC}"
    uv run python create_test_user.py
else
    echo -e "${GREEN}✓ Database schema up to date${NC}"
fi
cd ..

# Show status
echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ WealthNavigator AI is ready!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Running containers:"
podman ps --format "  {{.Names}}: {{.Status}}"
echo ""
echo "Database ports:"
echo "  PostgreSQL: localhost:5432"
echo "  Redis: localhost:6379"
echo ""
echo "Next steps:"
echo "  1. Start backend: cd backend && uv run uvicorn app.main:app --reload"
echo "  2. Start frontend: cd frontend && npm run dev"
echo "  3. Open browser: http://localhost:5173"
echo ""
echo "To stop containers: ./podman-stop.sh"
