# BVRIT Event Campus Hub

A full-stack web application for BVRIT college events.

## Project Structure

```
bvrit-project/
├── frontend/            ← Deploy to Netlify (HTML/CSS/JS)
│   ├── index.html
│   ├── user-portal.html
│   ├── admin-portal.html
│   ├── css/style.css
│   ├── js/
│   │   ├── config.js        ← API URL config
│   │   ├── script.js
│   │   ├── user-portal.js
│   │   └── admin-portal.js
│   └── assets/              ← Your images and videos
├── backend/             ← Deploy to Render.com (Node.js API)
│   ├── server.js
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── .env
│   └── package.json
└── netlify.toml
```

## Local Setup

### 1. Start Backend
```bash
cd backend
npm install
node server.js
```

### 2. Seed the database (first time only)
Open browser: http://localhost:5000/api/seed

Default admin: username=admin_bvrit  password=Admin@1234_

### 3. Open Frontend
Open frontend/index.html in browser (or use Live Server in VS Code)

## Deploy to GitHub + Netlify + Render

See DEPLOYMENT.md for full instructions.