#!/bin/bash

echo "🚀 Setting up ChatTrix for local development..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd chat-room-app
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd server
npm install
cd ..

# Create .env file for frontend
echo "🔧 Creating environment configuration..."
cat > .env << EOF
# Frontend Environment Variables
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
NODE_ENV=development
EOF

echo "✅ Environment file created"

# Create .env file for backend
echo "🔧 Creating backend environment configuration..."
cat > server/.env << EOF
# Backend Environment Variables
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chattrix
SESSION_SECRET=your-secret-key-here
CORS_ORIGIN=http://localhost:3000
EOF

echo "✅ Backend environment file created"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo "1. Start the backend: cd server && npm start"
echo "2. Start the frontend: npm start"
echo ""
echo "The app will be available at:"
echo "- Frontend: http://localhost:3000"
echo "- Backend: http://localhost:5000"
echo ""
echo "Note: Make sure MongoDB is running locally or update the MONGODB_URI in server/.env" 