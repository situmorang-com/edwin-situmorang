#!/bin/bash

# Edwin's Feeding Tracker - Startup Script

echo "🍼 Starting Edwin's Feeding Tracker..."
echo ""

# Check if .env files exist
if [ ! -f backend/.env ]; then
    echo "⚠️  backend/.env not found!"
    echo "   Please run: cp backend/.env.example backend/.env"
    echo "   Then edit it with your Google OAuth credentials"
    exit 1
fi

if [ ! -f frontend/.env ]; then
    echo "⚠️  frontend/.env not found!"
    echo "   Please run: cp frontend/.env.example frontend/.env"
    echo "   Then edit it with your Google OAuth credentials"
    exit 1
fi

# Start backend
echo "📡 Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 2

# Start frontend
echo "🎨 Starting frontend..."
cd frontend
npm run dev

# Cleanup on exit
trap "kill $BACKEND_PID" EXIT
