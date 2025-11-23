#!/bin/bash

echo "🚀 Setting up Interview Marketplace Backend..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Navigate to backend directory
cd backend || exit 1

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Check if .env exists
if [ ! -f .env ]; then
    echo ""
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.example .env
    echo ""
    echo "📝 Please edit backend/.env with your credentials:"
    echo "   - FIREBASE_PROJECT_ID"
    echo "   - FIREBASE_PRIVATE_KEY"
    echo "   - FIREBASE_CLIENT_EMAIL"
    echo "   - STRIPE_SECRET_KEY"
    echo "   - STRIPE_WEBHOOK_SECRET"
    echo "   - DAILY_API_KEY"
    echo ""
fi

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

echo ""
echo "✅ Backend setup complete!"
echo ""
echo "To start the development server:"
echo "  cd backend"
echo "  npm run dev"
echo ""
echo "To start the production server:"
echo "  cd backend"
echo "  npm start"
echo ""
