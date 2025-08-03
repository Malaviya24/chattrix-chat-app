# ✅ Deployment Checklist - ChatTrix

## 🚀 Step-by-Step Deployment Guide

### 1. Backend Deployment (Render)

#### ✅ Step 1: Create Render Account
- [ ] Go to [Render.com](https://render.com)
- [ ] Sign up/Login with GitHub
- [ ] Authorize Render to access repositories

#### ✅ Step 2: Deploy Backend Service
- [ ] Click "New" → "Web Service"
- [ ] Connect repository: `chattrix-chat-app`
- [ ] Configure settings:
  - **Name:** `chattrix-backend`
  - **Root Directory:** `server`
  - **Build Command:** `npm install`
  - **Start Command:** `npm start`
- [ ] Click "Create Web Service"

#### ✅ Step 3: Set Environment Variables in Render
Add these in your Render service settings:

| Variable | Value | Status |
|----------|-------|--------|
| `NODE_ENV` | `production` | ⏳ |
| `PORT` | `10000` | ⏳ |
| `SESSION_SECRET` | `chattrix-super-secret-key-2024` | ⏳ |
| `CORS_ORIGIN` | `https://chattrix-chat-app.netlify.app` | ⏳ |
| `MONGODB_URI` | `mongodb+srv://...` (optional) | ⏳ |

#### ✅ Step 4: Get Backend URL
- [ ] Wait for deployment to complete
- [ ] Copy your backend URL (e.g., `https://chattrix-backend.onrender.com`)
- [ ] Test health endpoint: `https://chattrix-backend.onrender.com/api/health`

### 2. Frontend Configuration (Netlify)

#### ✅ Step 1: Set Environment Variables in Netlify
- [ ] Go to [Netlify.com](https://netlify.com)
- [ ] Find your site: `chattrix-chat-app`
- [ ] Go to "Site settings" → "Environment variables"
- [ ] Add these variables:

| Variable | Value | Status |
|----------|-------|--------|
| `REACT_APP_API_URL` | `https://chattrix-backend.onrender.com` | ⏳ |
| `REACT_APP_SOCKET_URL` | `https://chattrix-backend.onrender.com` | ⏳ |

#### ✅ Step 2: Redeploy Frontend
- [ ] Go to "Deploys" tab
- [ ] Click "Trigger deploy" → "Deploy site"
- [ ] Wait for deployment to complete

### 3. Testing Your Deployment

#### ✅ Step 1: Test Backend
- [ ] Visit: `https://chattrix-backend.onrender.com/api/health`
- [ ] Should return: `{"status":"OK","message":"Chat server is running"}`

#### ✅ Step 2: Test Frontend
- [ ] Visit: https://chattrix-chat-app.netlify.app
- [ ] Create a room
- [ ] Join the room
- [ ] Send messages
- [ ] Test all features

#### ✅ Step 3: Test Real-time Features
- [ ] Open app in two browser tabs
- [ ] Join same room in both tabs
- [ ] Send messages - should appear in both tabs
- [ ] Test dark/light mode
- [ ] Test QR code sharing
- [ ] Test invisible mode
- [ ] Test panic mode

### 4. Troubleshooting

#### ❌ Backend Not Starting
- [ ] Check Render logs for errors
- [ ] Verify environment variables are set
- [ ] Check if MongoDB URI is correct (if using database)

#### ❌ Frontend Can't Connect
- [ ] Verify backend URL in Netlify environment variables
- [ ] Check browser console for CORS errors
- [ ] Ensure backend is running and accessible

#### ❌ Messages Not Sending
- [ ] Check Socket.IO connection in browser console
- [ ] Verify room creation/joining is successful
- [ ] Check if backend is receiving socket events

### 5. Final Verification

#### ✅ All Features Working
- [ ] ✅ Real-time messaging
- [ ] ✅ Password protection
- [ ] ✅ Dark/light mode
- [ ] ✅ QR code sharing
- [ ] ✅ Mobile responsive
- [ ] ✅ Anonymous users
- [ ] ✅ Self-destructing messages
- [ ] ✅ Invisible mode
- [ ] ✅ Panic mode

#### ✅ Performance Check
- [ ] Messages send instantly
- [ ] No connection errors in console
- [ ] App loads quickly
- [ ] Works on mobile devices

---

## 🎉 Success!

Once all checkboxes are marked ✅, your ChatTrix app is fully deployed and functional!

**Your URLs:**
- **Frontend:** https://chattrix-chat-app.netlify.app
- **Backend:** https://chattrix-backend.onrender.com

**Need help?** Check the logs in Render dashboard or Netlify dashboard for detailed error messages. 