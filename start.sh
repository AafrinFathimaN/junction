#!/bin/bash

echo "Starting Junction Genius Railway Control System..."
echo

echo "[1/3] Installing frontend dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "Failed to install frontend dependencies"
    exit 1
fi

echo
echo "[2/3] Installing backend dependencies..."
cd backend
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "Failed to install backend dependencies"
    exit 1
fi

echo
echo "[3/3] Starting services..."
echo "Starting backend server on http://localhost:8000"
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

echo "Waiting for backend to start..."
sleep 3

echo "Starting frontend server on http://localhost:8080"
cd ..
npm run dev &
FRONTEND_PID=$!

echo
echo "✅ Junction Genius is starting up!"
echo
echo "🌐 Frontend: http://localhost:8080"
echo "🔧 Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo
echo "Press Ctrl+C to stop all services"

# Wait for user interrupt
trap "echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
