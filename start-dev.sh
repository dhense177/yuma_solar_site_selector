#!/bin/bash

# Start Development Servers
# This script starts both the backend (FastAPI) and frontend (Next.js) servers

echo "🚀 Starting Solar Site Selector Development Servers..."
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "⚠️  Virtual environment not found. Creating one..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
    echo "📦 Installing dependencies..."
    source venv/bin/activate
    pip install -e .
    echo "✅ Dependencies installed"
fi

# Activate virtual environment
source venv/bin/activate

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local not found!"
    echo "Please create .env.local with required environment variables."
    echo "See LOCAL_DEPLOYMENT.md for details."
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit
}

# Trap Ctrl+C
trap cleanup INT

# Start backend
echo "🔧 Starting backend server on http://localhost:8000..."
# Set PYTHONPATH to include backend directory for imports
export PYTHONPATH="${PYTHONPATH}:$(pwd)/backend:$(pwd)"
cd backend
python api_server.py > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Check if backend started successfully
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Backend failed to start. Check backend.log for errors."
    exit 1
fi

echo "✅ Backend started (PID: $BACKEND_PID)"

# Start frontend
echo "🎨 Starting frontend server on http://localhost:3000..."
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 3

# Check if frontend started successfully
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "❌ Frontend failed to start. Check frontend.log for errors."
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "✅ Frontend started (PID: $FRONTEND_PID)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Development servers are running!"
echo ""
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "   Backend logs: tail -f backend.log"
echo "   Frontend logs: tail -f frontend.log"
echo ""
echo "   Press Ctrl+C to stop both servers"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Wait for user interrupt
wait
