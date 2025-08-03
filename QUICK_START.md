# 🚀 Quick Start Guide - ChatTrix

Get your secure chat app running in minutes!

## ⚡ Quick Setup (No Database Required)

### 1. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Start the Application
```bash
# Start backend server (Terminal 1)
cd server
npm start

# Start frontend (Terminal 2)
npm start
```

### 3. Access the App
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:5000

## 🔧 Advanced Setup (With Database)

### Option 1: Local MongoDB
1. Install MongoDB locally
2. Update `server/.env`:
   ```
   MONGODB_URI=mongodb://localhost:27017/chattrix
   ```

### Option 2: MongoDB Atlas (Cloud)
1. Create free account at [MongoDB Atlas](https://mongodb.com/atlas)
2. Create cluster and get connection string
3. Update `server/.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chattrix
   ```

## 🛠️ Environment Variables

Create `server/.env`:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chattrix
SESSION_SECRET=your-secret-key-here
CORS_ORIGIN=http://localhost:3000
```

Create `.env` (frontend):
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
NODE_ENV=development
```

## 🎯 Features Working

✅ **Real-time messaging** - Instant message delivery  
✅ **Password protection** - Secure room access  
✅ **Dark/Light mode** - Beautiful theme toggle  
✅ **QR code sharing** - Easy room sharing  
✅ **Mobile responsive** - Works on all devices  
✅ **Anonymous users** - No registration required  
✅ **Self-destructing messages** - Auto-delete after 5 minutes  
✅ **Invisible mode** - Blur messages from others  
✅ **Panic mode** - Clear all messages instantly  

## 🔍 Troubleshooting

### Connection Issues
- Check if both servers are running
- Verify ports 3000 and 5000 are available
- Check browser console for errors

### Database Issues
- App works without database (in-memory mode)
- For persistent data, set up MongoDB

### CORS Errors
- Backend is configured to allow localhost:3000
- Check browser console for CORS errors

## 🚀 Production Deployment

See `DEPLOYMENT.md` for detailed deployment instructions to:
- **Frontend:** Netlify
- **Backend:** Render
- **Database:** MongoDB Atlas

---

**Need help?** Check the main README.md for detailed documentation. 