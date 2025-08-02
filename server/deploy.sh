#!/bin/bash

# Backend Deployment Script
echo "🚀 Deploying Chat Room Backend..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Start the server
echo "🌐 Starting server..."
npm start

echo "✅ Backend deployment complete!" 