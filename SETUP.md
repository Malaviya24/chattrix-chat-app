# 🔧 ChatTrix Setup Guide

## Quick Start

### 1. **Environment Setup**

**Frontend (.env file in root directory):**
```env
# Development
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000

# Production (uncomment when deploying)
# REACT_APP_API_URL=https://chattrix-chat-app.onrender.com
# REACT_APP_SOCKET_URL=https://chattrix-chat-app.onrender.com
```

**Backend (.env file in server directory):**
```env
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/chattrix
SESSION_SECRET=your-secret-key-here
```

### 2. **Installation**

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
```

### 3. **Starting the Servers**

**Option 1: Two terminals**
```bash
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend
npm start
```

**Option 2: Create a start script**
```bash
# Create start-dev.bat (Windows) or start-dev.sh (Linux/Mac)
# Add to package.json scripts:
"dev": "concurrently \"cd server && npm start\" \"npm start\""
```

## Connection Testing

### 1. **Test Backend Health**
```bash
curl http://localhost:5000/api/health
# Should return: {"status":"OK","message":"Chat server is running"}
```

### 2. **Test Socket Connection**
Open browser console and check for:
- ✅ "Connected to Socket.IO server"
- ❌ No CORS errors
- ❌ No connection timeouts

### 3. **Browser Console Checks**
Press F12 and look for:
- ✅ Socket connection successful
- ✅ API requests returning 200 status
- ❌ CORS errors
- ❌ Connection refused errors

## Common Issues & Solutions

### **Backend Not Starting**
```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000  # Windows
lsof -i :5000                 # Mac/Linux

# Kill process if needed
taskkill /PID <PID> /F        # Windows
kill -9 <PID>                 # Mac/Linux
```

### **Frontend Can't Connect**
1. Check environment variables are set correctly
2. Verify backend is running on port 5000
3. Check browser console for specific errors
4. Try refreshing the page

### **CORS Errors**
- Ensure CORS_ORIGIN in backend .env matches frontend URL
- Check that credentials are enabled
- Verify all origins are listed in server CORS config

### **Socket Connection Issues**
- Check REACT_APP_SOCKET_URL is correct
- Verify backend Socket.IO server is running
- Check network connectivity
- Try different transport methods

## Development vs Production

### **Development Mode**
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`
- Database: Local MongoDB or in-memory

### **Production Mode**
- Frontend: Deployed to Netlify/Vercel
- Backend: Deployed to Render/Railway
- Database: MongoDB Atlas or cloud database

## Database Setup

### **Option 1: Local MongoDB**
```bash
# Install MongoDB locally
# Start MongoDB service
mongod

# Create database
mongo
use chattrix
```

### **Option 2: MongoDB Atlas**
1. Create free cluster at mongodb.com
2. Get connection string
3. Add to MONGODB_URI in backend .env

### **Option 3: In-Memory (No Setup)**
- App works without database
- Data is lost on server restart
- Good for testing

## Security Features

- ✅ CSRF Protection (temporarily disabled for debugging)
- ✅ Rate Limiting
- ✅ Input Sanitization
- ✅ Session Management
- ✅ Message Encryption
- ✅ Self-Destructing Messages

## Troubleshooting Checklist

- [ ] Backend server running on port 5000
- [ ] Frontend running on port 3000
- [ ] Environment variables set correctly
- [ ] No CORS errors in browser console
- [ ] Socket.IO connecting successfully
- [ ] API endpoints responding
- [ ] Database connection established (optional)
- [ ] No port conflicts
- [ ] Network connectivity working

## Debug Mode

Enable debug logging by adding to your .env files:
```env
REACT_APP_DEBUG=true  # Frontend
DEBUG=true            # Backend
```

This will show detailed connection logs in the console. 