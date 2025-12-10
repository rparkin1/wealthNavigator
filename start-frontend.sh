#!/bin/bash
# Start WealthNavigator AI Frontend

echo "🚀 Starting WealthNavigator AI Frontend..."
echo ""

cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "🎨 Starting Vite dev server..."
echo "📍 Frontend will be available at: http://localhost:5173"
echo ""
npm run dev
