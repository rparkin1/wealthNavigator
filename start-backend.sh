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

# Check if Docker services are running
echo "🐳 Checking Docker services..."
if ! docker ps | grep -q wealthnav-postgres; then
    echo "📦 Starting Docker services..."
    docker-compose up -d
    echo "⏳ Waiting for database to be ready..."
    sleep 5
fi

echo "✅ Docker services running"
echo ""

# Start backend
cd backend
echo "🔧 Starting FastAPI server..."
echo "📍 Backend will be available at: http://localhost:8000"
echo "📚 API docs will be available at: http://localhost:8000/docs"
echo ""
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
