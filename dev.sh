#!/bin/bash

# Clean up any lingering Node.js processes
echo "🧹 Cleaning up any lingering Node.js processes..."
killall -9 node 2>/dev/null || echo "   No lingering Node processes found"
sleep 1

# Start the dev server (Next.js will auto-select an available port)
echo "🚀 Starting Next.js dev server..."
echo "   (Next.js will use port 3000, or the next available port if 3000 is busy)"
npm run dev

