#!/bin/bash

echo "🚀 Supabase Setup Script"
echo "========================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    echo "   Download from: https://docs.docker.com/desktop/"
    exit 1
fi

echo "✅ Docker is running"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found. Please create it first."
    exit 1
fi

echo "✅ .env.local file found"

# Start Supabase
echo "🔄 Starting Supabase..."
supabase start

# Get status and show credentials
echo "📋 Supabase Status:"
supabase status

echo ""
echo "🎉 Setup complete! Copy the credentials above to your .env.local file"
echo "   Then run: npm run dev"

