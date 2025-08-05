# 🔍 ChatTrix Debugging Guide

## Quick Connection Test

### 1. **Test Backend Health**
```bash
# Test if backend is running
curl http://localhost:5000/api/health

# Expected response:
{
  "status": "OK",
  "message": "Chat server is running",
  "database": "Connected" or "In-Memory Mode",
  "activeConnections": 0
}
```

### 2. **Test API Endpoint**
```bash
curl http://localhost:5000/api/test

# Expected response:
{
  "message": "Backend is working!",
  "cors": "enabled",
  "socket": "ready"
}
```

## Browser Console Debugging

### **Expected Console Messages**

**✅ Successful Connection:**
```
Using Socket URL: http://localhost:5000
Creating new socket connection to: http://localhost:5000
✅ Connected to Socket.IO server with ID: [socket-id]
🔄 Attempting to join room: {roomId, nickname, sessionId}
✅ Room joined successfully: {roomId, nickname, maxUsers, currentUsers}
```

**❌ Connection Errors:**
```
❌ Socket connection error: [error details]
Connection details: {url, error, type}
❌ Failed to join room: [error message]
```

### **Browser Network Tab Checks**

1. **WebSocket Connection:**
   - Look for `ws://localhost:5000/socket.io/`
   - Status should be 101 (Switching Protocols)

2. **HTTP Requests:**
   - `GET /api/health` → 200 OK
   - `GET /api/test` → 200 OK

3. **Socket.IO Polling:**
   - `GET /socket.io/?EIO=4&transport=polling` → 200 OK

## Server Console Debugging

### **Expected Server Messages**

**✅ Successful Connection:**
```
🚀 Chat server running on port 5000
📡 Socket.IO server ready
🔌 User connected: [socket-id]
🔄 Join room attempt: {roomId, nickname, sessionId}
✅ [nickname] joined room [roomId]
```

**❌ Server Errors:**
```
❌ MongoDB connection error: [error]
❌ Join room error: [error]
❌ Socket error for [socket-id]: [error]
```

## Common Issues & Solutions

### **1. CORS Errors**
**Problem:** `Access to fetch at 'http://localhost:5000' from origin 'http://localhost:3000' has been blocked by CORS policy`

**Solution:**
- Check that CORS is properly configured in server
- Verify `CORS_ORIGIN` in backend .env matches frontend URL
- Ensure `credentials: true` is set

### **2. Socket Connection Timeout**
**Problem:** `Socket connection error: timeout`

**Solution:**
- Check if backend is running on port 5000
- Verify firewall isn't blocking the connection
- Try different transport methods

### **3. Room Join Failures**
**Problem:** `Failed to join room: Room not found`

**Solution:**
- Verify room was created successfully
- Check if room has expired (24-hour limit)
- Ensure password is correct
- Check database connection

### **4. Database Connection Issues**
**Problem:** `MongoDB connection error`

**Solution:**
- App works in in-memory mode without database
- For persistent data, set up MongoDB Atlas
- Check `MONGODB_URI` in backend .env

## Step-by-Step Debugging

### **Step 1: Backend Health Check**
```bash
# Terminal 1: Start backend
cd server
npm start

# Terminal 2: Test backend
curl http://localhost:5000/api/health
```

### **Step 2: Frontend Connection Test**
```bash
# Terminal 3: Start frontend
npm start

# Open browser console (F12)
# Look for connection messages
```

### **Step 3: Socket.IO Test**
```javascript
// In browser console, test socket connection:
const socket = io('http://localhost:5000');
socket.on('connect', () => console.log('✅ Connected:', socket.id));
socket.on('connect_error', (err) => console.error('❌ Error:', err));
```

### **Step 4: Room Creation Test**
```javascript
// Test room creation via API
fetch('http://localhost:5000/api/rooms', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nickname: 'testuser',
    password: 'testpass',
    maxUsers: 10
  })
})
.then(res => res.json())
.then(data => console.log('Room created:', data))
.catch(err => console.error('Error:', err));
```

## Environment Variables Checklist

### **Frontend (.env)**
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
```

### **Backend (.env)**
```env
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/chattrix
SESSION_SECRET=your-secret-key-here
```

## Debug Mode

Enable detailed logging:

**Frontend:**
```javascript
// Add to your .env
REACT_APP_DEBUG=true

// Or in console
localStorage.setItem('debug', 'socket.io-client:*');
```

**Backend:**
```bash
# Add to your .env
DEBUG=true

# Or start with debug
DEBUG=* npm start
```

## Performance Monitoring

### **Connection Metrics**
- Active socket connections: `io.engine.clientsCount`
- Room occupancy: Check database or in-memory store
- Message throughput: Monitor socket events

### **Error Tracking**
- Connection failures: Socket.IO error events
- Room join failures: Server-side validation errors
- Message delivery: Client acknowledgment

## Troubleshooting Commands

### **Check Port Usage**
```bash
# Windows
netstat -ano | findstr :5000

# Mac/Linux
lsof -i :5000
```

### **Kill Process**
```bash
# Windows
taskkill /PID <PID> /F

# Mac/Linux
kill -9 <PID>
```

### **Test Network**
```bash
# Test if port is reachable
telnet localhost 5000

# Or use curl
curl -v http://localhost:5000/api/health
```

## Still Having Issues?

1. **Check the logs** - Both browser console and server console
2. **Verify environment** - All variables set correctly
3. **Test step by step** - Backend → Frontend → Socket → Room
4. **Try in-memory mode** - Disable database temporarily
5. **Check network** - Firewall, proxy, VPN issues

**Your code is production-ready!** The improvements I made add better error handling and debugging capabilities while maintaining your robust architecture. 