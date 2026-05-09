#!/bin/bash
set -e

echo "🚀 AppForge Setup Script"
echo "========================"

# Check Node
if ! command -v node &> /dev/null; then
  echo "❌ Node.js is required. Install from https://nodejs.org"
  exit 1
fi
echo "✅ Node.js $(node --version)"

# Check psql
if ! command -v psql &> /dev/null; then
  echo "❌ PostgreSQL is required."
  exit 1
fi
echo "✅ PostgreSQL found"

# Install deps
echo ""
echo "📦 Installing dependencies..."
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Setup env files
echo ""
echo "⚙️  Setting up environment files..."
if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  echo "✅ Created backend/.env — PLEASE edit DATABASE_URL and JWT_SECRET"
else
  echo "ℹ️  backend/.env already exists"
fi

if [ ! -f frontend/.env.local ]; then
  cp frontend/.env.example frontend/.env.local
  echo "✅ Created frontend/.env.local"
else
  echo "ℹ️  frontend/.env.local already exists"
fi

echo ""
echo "📋 Next steps:"
echo "  1. Edit backend/.env with your PostgreSQL credentials"
echo "  2. Create the database: psql -U postgres -c 'CREATE DATABASE appgenerator;'"
echo "  3. Run migrations: cd backend && npm run db:migrate"
echo "  4. Start dev servers: npm run dev"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔌 Backend:  http://localhost:4000"
