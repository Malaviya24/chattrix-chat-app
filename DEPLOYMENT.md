# 🚀 Deployment Guide - ChatTrix Backend

## 📋 Prerequisites

1. **GitHub Account** - For repository hosting
2. **Render Account** - For backend hosting (free tier available)
3. **MongoDB Atlas** - For database (free tier available)

## 🔧 Step 1: GitHub Repository Setup

### 1.1 Create GitHub Repository
1. Go to [GitHub](https://github.com)
2. Click "New repository"
3. Name it: `chattrix-chat-app`
4. Make it **Public** (for free Render deployment)
5. Don't initialize with README (we already have one)

### 1.2 Push Code to GitHub
```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "🚀 Complete chat room app with backend and frontend"

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/chattrix-chat-app.git

# Push to GitHub
git push -u origin main
```

## 🌐 Step 2: MongoDB Atlas Setup

### 2.1 Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://mongodb.com/atlas)
2. Sign up for free account
3. Create a new project

### 2.2 Create Database Cluster
1. Click "Build a Database"
2. Choose "FREE" tier (M0)
3. Select your preferred cloud provider and region
4. Click "Create"

### 2.3 Configure Database Access
1. Go to "Database Access"
2. Click "Add New Database User"
3. Username: `chattrix-admin`
4. Password: Generate a strong password
5. Role: "Atlas admin"
6. Click "Add User"

### 2.4 Configure Network Access
1. Go to "Network Access"
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for Render deployment)
4. Click "Confirm"

### 2.5 Get Connection String
1. Go to "Database" → "Connect"
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database user password
5. Replace `<dbname>` with `chattrix`

**Example connection string:**
```
mongodb+srv://chattrix-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/chattrix?retryWrites=true&w=majority
```

## 🚀 Step 3: Render Deployment

### 3.1 Create Render Account
1. Go to [Render](https://render.com)
2. Sign up with your GitHub account
3. Authorize Render to access your repositories

### 3.2 Create Web Service
1. Click "New" → "Web Service"
2. Connect your GitHub repository: `chattrix-chat-app`
3. Configure the service:

**Basic Settings:**
- **Name:** `chattrix-backend`
- **Environment:** `Node`
- **Region:** Choose closest to your users
- **Branch:** `main`
- **Root Directory:** `server` (important!)

**Build Settings:**
- **Build Command:** `npm install`
- **Start Command:** `npm start`

### 3.3 Set Environment Variables
Click "Environment" tab and add these variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Production environment |
| `PORT` | `10000` | Render's default port |
| `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB connection string |
| `SESSION_SECRET` | `your-super-secret-key-here` | Random secret for sessions |
| `CORS_ORIGIN` | `https://chattrix-chat-app.netlify.app` | Frontend URL |

### 3.4 Deploy
1. Click "Create Web Service"
2. Wait for deployment (usually 2-3 minutes)
3. Copy your service URL (e.g., `https://chattrix-backend.onrender.com`)

## 🔗 Step 4: Update Frontend Configuration

### 4.1 Update API URLs
Edit `src/services/api.js`:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://YOUR_RENDER_URL.onrender.com';
```

Edit `src/services/socket.js`:
```javascript
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'https://YOUR_RENDER_URL.onrender.com';
```

### 4.2 Redeploy Frontend
```bash
npm run build
npx netlify-cli deploy --prod --dir=build
```

## ✅ Step 5: Test Your Deployment

### 5.1 Test Backend Health
Visit: `https://YOUR_RENDER_URL.onrender.com/api/health`
Should return: `{"status":"OK","message":"Chat server is running"}`

### 5.2 Test Frontend
Visit: https://chattrix-chat-app.netlify.app
1. Create a room
2. Join the room
3. Send messages
4. Test all features

## 🔧 Troubleshooting

### Backend Not Starting
- Check Render logs for errors
- Verify MongoDB connection string
- Ensure all environment variables are set

### Frontend Can't Connect
- Check CORS settings
- Verify API URLs are correct
- Check browser console for errors

### MongoDB Connection Issues
- Verify network access allows all IPs
- Check username/password in connection string
- Ensure database name is correct

## 📊 Monitoring

### Render Dashboard
- Monitor service health
- View logs
- Check resource usage

### MongoDB Atlas
- Monitor database performance
- Check connection metrics
- View storage usage

## 🔒 Security Checklist

- ✅ HTTPS enabled (Render provides automatically)
- ✅ Environment variables secured
- ✅ CORS properly configured
- ✅ Rate limiting enabled
- ✅ CSRF protection active
- ✅ Password hashing with bcrypt
- ✅ Session management secure

## 🎉 Success!

Your ChatTrix app is now fully deployed with:
- **Frontend:** https://chattrix-chat-app.netlify.app
- **Backend:** https://YOUR_RENDER_URL.onrender.com
- **Database:** MongoDB Atlas (managed)

**Features working:**
- ✅ Real-time messaging
- ✅ Password protection
- ✅ Dark/light mode
- ✅ QR code sharing
- ✅ Invisible mode
- ✅ Panic mode
- ✅ Self-destructing messages
- ✅ Mobile responsive

---

**Need help?** Check the logs in Render dashboard or MongoDB Atlas for detailed error messages. 