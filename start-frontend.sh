#!/bin/bash
# Start WealthNavigator AI Frontend

echo "🚀 Starting WealthNavigator AI Frontend..."
echo ""

cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if backend is running
if ! curl -s http://localhost:8000/api/v1/portfolio/health >/dev/null 2>&1; then
    echo "⚠️  Backend API is not running"
    echo "💡 Start it with: ./start-backend.sh"
    echo ""
fi

echo "🎨 Starting Vite dev server..."
echo "📍 Frontend will be available at: http://localhost:5173 (or next available port)"
echo "🔗 Backend API: http://localhost:8000"
echo ""
echo "💡 Press Ctrl+C to stop"
echo ""
npm run dev
