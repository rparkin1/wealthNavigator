#!/bin/bash
# Start all WealthNavigator AI services
# This script starts Podman containers, backend, and frontend

set -e

echo "🚀 Starting Complete WealthNavigator AI Stack..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Start Podman containers
echo -e "${YELLOW}Step 1/3: Starting Podman containers...${NC}"
./podman-start.sh
echo ""

# Start backend in background
echo -e "${YELLOW}Step 2/3: Starting backend server...${NC}"
cd backend
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 > ../backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
echo "  Logs: tail -f backend.log"
cd ..

# Wait for backend to be ready
echo -e "${YELLOW}⏳ Waiting for backend to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:8000/api/v1/portfolio/health >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is ready${NC}"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo -e "${RED}⚠️  Backend did not start in time${NC}"
        exit 1
    fi
done

# Start frontend in background
echo -e "${YELLOW}Step 3/3: Starting frontend dev server...${NC}"
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"
echo "  Logs: tail -f frontend.log"
cd ..

# Wait for frontend to be ready
echo -e "${YELLOW}⏳ Waiting for frontend to be ready...${NC}"
sleep 5

# Show status
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ WealthNavigator AI is fully running!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Services:"
echo "  🐘 PostgreSQL: localhost:5432"
echo "  🔴 Redis: localhost:6379"
echo "  🔧 Backend API: http://localhost:8000"
echo "  📚 API Docs: http://localhost:8000/docs"
echo "  🎨 Frontend: http://localhost:5173 (check frontend.log for actual port)"
echo ""
echo "Process IDs:"
echo "  Backend: $BACKEND_PID"
echo "  Frontend: $FRONTEND_PID"
echo ""
echo "Logs:"
echo "  Backend: tail -f backend.log"
echo "  Frontend: tail -f frontend.log"
echo ""
echo "To stop all services:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo "  ./podman-stop.sh"
echo ""
echo "Or run: ./stop-all.sh"
echo ""

# Save PIDs for stop script
echo "$BACKEND_PID" > .backend.pid
echo "$FRONTEND_PID" > .frontend.pid

echo -e "${GREEN}🎉 Ready to use! Open http://localhost:5173 in your browser${NC}"
