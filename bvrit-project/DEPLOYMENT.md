# Deployment Guide

## Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "BVRIT Event Hub"
git remote add origin https://github.com/YOUR_USERNAME/bvrit-event-hub.git
git push -u origin main
```

## Step 2 — Deploy Backend to Render.com (FREE)
1. Go to https://render.com → Sign up with GitHub
2. Click "New Web Service" → Connect your GitHub repo
3. Settings:
   - Root Directory: backend
   - Build Command: npm install
   - Start Command: node server.js
4. Add Environment Variables:
   - MONGODB_URI = (your MongoDB Atlas URI — see Step 3)
   - PORT = 5000
   - NODE_ENV = production
5. Click Deploy → Copy your Render URL (e.g. https://bvrit-api.onrender.com)

## Step 3 — MongoDB Atlas (FREE Cloud Database)
1. Go to https://cloud.mongodb.com → Sign up
2. Create a free cluster
3. Database Access → Add User → username + password
4. Network Access → Allow from Anywhere (0.0.0.0/0)
5. Connect → Drivers → Copy connection string
   Replace <password> with your DB password
   Example: mongodb+srv://user:pass@cluster.mongodb.net/bvrit_events

## Step 4 — Update Frontend API URL
Edit frontend/js/config.js:
```js
const API_BASE = 'https://your-app.onrender.com';  // Your Render URL
```
Commit and push this change.

## Step 5 — Deploy Frontend to Netlify (FREE)
1. Go to https://netlify.com → Sign up with GitHub
2. Click "Add new site" → "Import an existing project"
3. Connect GitHub → Select your repo
4. Settings:
   - Base directory: frontend
   - Build command: (leave empty)
   - Publish directory: frontend
5. Click Deploy
6. Your site will be live at https://your-site.netlify.app

## Step 6 — Seed the Database
After deploying backend, open:
https://your-app.onrender.com/api/seed

Admin login: username=admin_bvrit  password=Admin@1234_