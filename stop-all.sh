#!/bin/bash
# Stop all WealthNavigator AI services

echo "🛑 Stopping WealthNavigator AI..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Stop backend
if [ -f .backend.pid ]; then
    BACKEND_PID=$(cat .backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}Stopping backend (PID: $BACKEND_PID)...${NC}"
        kill $BACKEND_PID 2>/dev/null || true
        echo -e "${GREEN}✓ Backend stopped${NC}"
    fi
    rm .backend.pid
else
    echo "Stopping any running backend..."
    pkill -f "uvicorn app.main:app" 2>/dev/null || true
fi

# Stop frontend
if [ -f .frontend.pid ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}Stopping frontend (PID: $FRONTEND_PID)...${NC}"
        kill $FRONTEND_PID 2>/dev/null || true
        echo -e "${GREEN}✓ Frontend stopped${NC}"
    fi
    rm .frontend.pid
else
    echo "Stopping any running frontend..."
    pkill -f "vite" 2>/dev/null || true
fi

# Stop Podman containers
echo -e "${YELLOW}Stopping Podman containers...${NC}"
./podman-stop.sh

echo ""
echo -e "${GREEN}✅ All services stopped${NC}"
echo ""
echo "To start again: ./start-all.sh"
