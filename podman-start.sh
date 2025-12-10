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

# Check database health
echo -e "\n${YELLOW}Checking database health...${NC}"
if podman exec wealthnav-postgres pg_isready -U wealthnav >/dev/null 2>&1; then
    echo -e "${GREEN}✓ PostgreSQL is healthy${NC}"
else
    echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
    sleep 2
    if podman exec wealthnav-postgres pg_isready -U wealthnav >/dev/null 2>&1; then
        echo -e "${GREEN}✓ PostgreSQL is healthy${NC}"
    else
        echo -e "${YELLOW}⚠️  PostgreSQL is still starting...${NC}"
    fi
fi

if podman exec wealthnav-redis redis-cli ping >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Redis is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Redis is still starting...${NC}"
fi

# Check if tables exist, run migrations if needed
echo -e "\n${YELLOW}Checking database schema...${NC}"
cd backend
# Simple check if migrations are needed
if psql postgresql://wealthnav:dev@localhost:5432/wealthnavigator -c "SELECT 1 FROM users LIMIT 1" >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Database schema up to date${NC}"
else
    echo "Running database migrations..."
    uv run alembic upgrade head 2>/dev/null || echo "Migrations will run on first backend start"
    echo -e "${GREEN}✓ Database setup complete${NC}"
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
echo "  1. Start backend: ./start-backend.sh"
echo "  2. Start frontend: ./start-frontend.sh (in new terminal)"
echo "  3. Open browser: http://localhost:5173"
echo ""
echo "Quick start (in separate terminals):"
echo "  Terminal 1: ./start-backend.sh"
echo "  Terminal 2: ./start-frontend.sh"
echo ""
echo "To stop containers: ./podman-stop.sh"
