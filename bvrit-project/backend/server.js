require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const path     = require('path');

const app = express();

// ─── CORS — allow frontend (Netlify or local file) to call this API ─────────
app.use(cors({
  origin: '*',         // change to your Netlify URL in production e.g. 'https://your-app.netlify.app'
  methods: ['GET','POST','PUT','PATCH','DELETE'],
  allowedHeaders: ['Content-Type','x-username']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── MongoDB ─────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅  MongoDB connected →', process.env.MONGODB_URI))
  .catch(err  => { console.error('❌  MongoDB error:', err.message); process.exit(1); });

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/users',  require('./routes/users'));
app.use('/api/events', require('./routes/events'));
app.use('/api/seed',   require('./routes/seed'));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'OK', time: new Date() }));

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀  Backend API running  →  http://localhost:${PORT}`);
  console.log(`📦  Seed data:           →  http://localhost:${PORT}/api/seed`);
});