#!/bin/bash

# Storytopia Setup Script
# Run this to set up both backend and frontend

set -e

echo "🎨 Storytopia Setup"
echo "==================="
echo ""

# Check if we're in the right directory
if [ ! -f "README.md" ]; then
    echo "❌ Error: Please run this script from the Storytopia root directory"
    exit 1
fi

# Backend Setup
echo "📦 Setting up Backend (agents_service)..."
cd agents_service

if [ ! -d ".venv" ]; then
    echo "  Creating Python virtual environment..."
    python3 -m venv .venv
fi

echo "  Activating virtual environment..."
source .venv/bin/activate

echo "  Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

if [ ! -f ".env" ]; then
    echo "  Creating .env file from template..."
    cp .env.example .env
    echo "  ⚠️  Please edit agents_service/.env with your credentials"
fi

cd ..

# Frontend Setup
echo ""
echo "🌐 Setting up Frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "  Installing Node.js dependencies..."
    npm install
else
    echo "  Node modules already installed"
fi

if [ ! -f ".env.local" ]; then
    echo "  Creating .env.local file from template..."
    cp .env.local.example .env.local
    echo "  ⚠️  Please edit frontend/.env.local with your API URL"
fi

cd ..

echo ""
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Edit agents_service/.env with your Google Cloud credentials"
echo "2. Edit frontend/.env.local with your backend API URL"
echo ""
echo "To run the backend:"
echo "  cd agents_service"
echo "  source .venv/bin/activate"
echo "  python main.py"
echo ""
echo "To run the frontend:"
echo "  cd frontend"
echo "  npm run dev"
echo ""
