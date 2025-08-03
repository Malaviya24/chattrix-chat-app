#!/bin/bash

echo "🚀 Starting ChatTrix development environment..."

# Function to cleanup background processes
cleanup() {
    echo "🛑 Stopping all processes..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start backend
echo "🔧 Starting backend server..."
cd server
npm start &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "🌐 Starting frontend development server..."
npm start &
FRONTEND_PID=$!

echo "✅ Both servers are starting..."
echo "📱 Frontend will be available at: http://localhost:3000"
echo "🔧 Backend will be available at: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for both processes
wait 