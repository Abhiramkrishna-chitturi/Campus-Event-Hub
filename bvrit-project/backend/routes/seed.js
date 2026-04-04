const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const Event   = require('../models/Event');

/* ─── GET /api/seed  — seeds admin + default events (run once) ─── */
router.get('/', async (req, res) => {
  try {
    // Create admin user
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      await User.create({
        name: 'Admin',
        department: 'Admin',
        rollNumber: 'ADMIN001',
        username: 'admin_bvrit',
        password: 'Admin@1234_',
        role: 'admin'
      });
    }

    // Seed default events
    const defaultEvents = [
      { eventId:'athenes', name:'ATHENES', description:"BVRIT's most celebrated annual cultural fest", date:'April 20, 2026', time:'10:00 AM', location:'BVRIT Main Campus', capacity:500, category:'Cultural', isDefault: true },
      { eventId:'avirbhav', name:'AVIRBHAV', description:'Traditional day celebration at BVRIT', date:'March 10, 2026', time:'9:00 AM', location:'BVRIT Auditorium', capacity:300, category:'Cultural', isDefault: true },
      { eventId:'baja', name:'BAJA', description:"India's leading ATV motorsports competition", date:'March 15, 2026', time:'8:00 AM', location:'BVRIT Ground', capacity:200, category:'Sports', isDefault: true },
      { eventId:'canoe', name:'CONCRETE CANOE COMPETITION', description:'Engineering marvel on water', date:'April 5, 2026', time:'8:00 AM', location:'BVRIT Water Tank', capacity:100, category:'Technical', isDefault: true },
      { eventId:'autoexpo', name:'AUTO-EXPO', description:'Exhibition of the fastest and wildest vehicles', date:'April 18, 2026', time:'10:00 AM', location:'BVRIT Parking Lot', capacity:400, category:'Sports', isDefault: true }
    ];

    for (const ev of defaultEvents) {
      const exists = await Event.findOne({ eventId: ev.eventId });
      if (!exists) await Event.create(ev);
    }

    res.json({ message: 'Seeded! Admin: username=admin_bvrit  password=Admin@1234_' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;