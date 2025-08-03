# 🔍 How to Find Your Backend URL

## Step 1: Check Render Dashboard

1. **Go to [Render.com](https://render.com)**
2. **Login to your account**
3. **Click on "Dashboard"**
4. **Look for your backend service** (should be named something like `chattrix-backend`)

## Step 2: Get the Correct URL

In your Render dashboard, you should see:
- **Service Name:** `chattrix-backend` (or similar)
- **Status:** Should show "Live" or "Deployed"
- **URL:** Something like `https://your-service-name.onrender.com`

## Step 3: Test the URL

Once you find your backend URL, test it:

1. **Open your browser**
2. **Go to:** `https://YOUR-BACKEND-URL.onrender.com/api/health`
3. **You should see:** `{"status":"OK","message":"Chat server is running"}`

## Step 4: Update Environment Variables

### In Netlify:
1. Go to your Netlify dashboard
2. Find your site: `chattrix-chat-app`
3. Go to "Site settings" → "Environment variables"
4. Update these variables:

```
REACT_APP_API_URL=https://YOUR-BACKEND-URL.onrender.com
REACT_APP_SOCKET_URL=https://YOUR-BACKEND-URL.onrender.com
```

### In Render (if needed):
1. Go to your backend service in Render
2. Click "Environment"
3. Add/update these variables:

```
NODE_ENV=production
PORT=10000
SESSION_SECRET=chattrix-super-secret-key-2024
CORS_ORIGIN=https://chattrix-chat-app.netlify.app
```

## Step 5: Redeploy

### Frontend (Netlify):
1. Go to "Deploys" tab
2. Click "Trigger deploy" → "Deploy site"

### Backend (Render):
1. Go to your backend service
2. Click "Manual Deploy" → "Deploy latest commit"

## 🔍 Troubleshooting

### If Backend is Not Deployed:
1. **Create new Web Service** in Render
2. **Connect your GitHub repository:** `chattrix-chat-app`
3. **Configure:**
   - **Name:** `chattrix-backend`
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

### If Backend URL is Different:
1. **Copy the correct URL** from Render dashboard
2. **Update Netlify environment variables**
3. **Redeploy frontend**

### If Backend is Deployed but Not Working:
1. **Check Render logs** for errors
2. **Verify environment variables** are set
3. **Check if the service is running**

## 📞 Need Help?

If you can't find your backend URL or it's not working:

1. **Share your Render dashboard screenshot**
2. **Tell me the exact error message**
3. **Check if the service status is "Live"**

---

**Once you find the correct URL, update the environment variables and redeploy!** 