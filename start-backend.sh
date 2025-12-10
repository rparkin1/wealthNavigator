#!/bin/bash
# Start WealthNavigator AI Backend

echo "🚀 Starting WealthNavigator AI Backend..."
echo ""

# Check if .env exists
if [ ! -f backend/.env ]; then
    echo "❌ Error: backend/.env file not found"
    echo "📝 Please create backend/.env and add your ANTHROPIC_API_KEY"
    exit 1
fi

# Check if API key is set
if ! grep -q "ANTHROPIC_API_KEY=sk-" backend/.env; then
    echo "⚠️  Warning: ANTHROPIC_API_KEY not set in backend/.env"
    echo "📝 Please add your Anthropic API key to backend/.env"
    echo ""
    echo "Get your API key from: https://console.anthropic.com/"
    echo ""
fi

# Check if Podman services are running
echo "🐳 Checking Podman services..."
if ! podman ps | grep -q wealthnav-postgres; then
    echo "📦 PostgreSQL not running. Starting containers..."
    echo "💡 Run './podman-start.sh' to start all services"
    echo ""

    # Try to start existing containers
    if podman ps -a | grep -q wealthnav-postgres; then
        echo "Starting existing containers..."
        podman start wealthnav-postgres wealthnav-redis 2>/dev/null || true
        echo "⏳ Waiting for database to be ready..."
        sleep 3
    else
        echo "⚠️  No containers found. Please run './podman-start.sh' first"
        exit 1
    fi
fi

# Verify services are healthy
if podman exec wealthnav-postgres pg_isready -U wealthnav >/dev/null 2>&1; then
    echo "✅ PostgreSQL is ready"
else
    echo "⚠️  PostgreSQL is not ready yet. Waiting..."
    sleep 2
fi

if podman exec wealthnav-redis redis-cli ping >/dev/null 2>&1; then
    echo "✅ Redis is ready"
else
    echo "⚠️  Redis is not ready yet"
fi

echo ""

# Start backend
cd backend
echo "🔧 Starting FastAPI server..."
echo "📍 Backend will be available at: http://localhost:8000"
echo "📚 API docs will be available at: http://localhost:8000/docs"
echo "📊 Portfolio API: http://localhost:8000/api/v1/portfolio/health"
echo ""
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
