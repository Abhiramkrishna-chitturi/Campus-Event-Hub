const express      = require('express');
const router       = express.Router();
const Event        = require('../models/Event');
const Registration = require('../models/Registration');
const { protect, adminOnly } = require('../middleware/auth');

/* ─── GET /events  — public ─── */
router.get('/', async (req, res) => {
  try {
    const events = await Event.find({ status: 'active' })
      .select('-registrations')
      .sort({ createdAt: -1 });
    res.json(events);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ─── GET /events/all  — admin ─── */
router.get('/all', adminOnly, async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.json(events);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ─── GET /events/stats  — admin dashboard ─── */
router.get('/stats', adminOnly, async (req, res) => {
  try {
    const totalEvents = await Event.countDocuments();
    const totalUsers  = await require('../models/User').countDocuments({ role: 'user' });
    const totalRegs   = await Registration.countDocuments();
    const pending     = await Registration.countDocuments({ status: 'pending' });
    res.json({ totalEvents, totalUsers, totalRegistrations: totalRegs, pendingApprovals: pending });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ─── GET /events/user/my-registrations  — logged in user ─── */
router.get('/user/my-registrations', protect, async (req, res) => {
  try {
    const regs = await Registration.find({ user: req.user._id })
      .populate('event', 'name date location status')
      .sort({ createdAt: -1 });
    res.json(regs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});



/* ─── POST /events  — admin creates event ─── */
router.post('/', adminOnly, async (req, res) => {
  try {
    const { eventId, name, description, date, time, location, capacity, category } = req.body;
    if (!eventId || !name || !description || !date || !time || !location)
      return res.status(400).json({ error: 'All fields are required' });

    const exists = await Event.findOne({ eventId });
    if (exists) return res.status(400).json({ error: 'Event ID already exists' });

    const event = await Event.create({ eventId, name, description, date, time, location, capacity: capacity || 200, category: category || 'Other' });
    res.status(201).json({ message: 'Event created', event });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});



/* ─── POST /events/:eventId/register  — user registers ─── */
router.post('/:eventId/register', protect, async (req, res) => {
  try {
    const event = await Event.findOne({ eventId: req.params.eventId, status: 'active' });
    if (!event) return res.status(404).json({ error: 'Event not found or inactive' });

    if (event.registrations.length >= event.capacity)
      return res.status(400).json({ error: 'Event is full' });

    const alreadyIn = event.registrations.some(r => r.user.toString() === req.user._id.toString());
    if (alreadyIn) return res.status(400).json({ error: 'Already registered for this event' });

    event.registrations.push({
      user: req.user._id,
      name: req.user.name,
      rollNumber: req.user.rollNumber,
      department: req.user.department
    });
    await event.save();

    await Registration.create({
      user: req.user._id,
      event: event._id,
      eventId: event.eventId,
      eventName: event.name,
      status: 'approved'
    });

    res.json({ message: 'Successfully registered for ' + event.name });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});



/* ─── GET /events/:eventId/registrations  — admin ─── */
router.get('/:eventId/registrations', adminOnly, async (req, res) => {
  try {
    const event = await Event.findOne({ eventId: req.params.eventId })
      .populate('registrations.user', 'name rollNumber department username');
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event.registrations);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ─── PATCH /events/:eventId/attend/:userId  — admin marks attendance ─── */
router.patch('/:eventId/attend/:userId', adminOnly, async (req, res) => {
  try {
    await Event.updateOne(
      { eventId: req.params.eventId, 'registrations.user': req.params.userId },
      { $set: { 'registrations.$.attended': true } }
    );
    res.json({ message: 'Attendance marked' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ─── GET /events/:eventId  — public ─── */
router.get('/:eventId', async (req, res) => {
  try {
    const event = await Event.findOne({ eventId: req.params.eventId });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ─── PUT /events/:eventId  — admin updates event ─── */
router.put('/:eventId', adminOnly, async (req, res) => {
  try {
    const event = await Event.findOneAndUpdate(
      { eventId: req.params.eventId },
      req.body,
      { new: true }
    );
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ message: 'Event updated', event });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ─── DELETE /events/:eventId  — admin ─── */
router.delete('/:eventId', adminOnly, async (req, res) => {
  try {
    await Event.findOneAndDelete({ eventId: req.params.eventId });
    res.json({ message: 'Event deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ─── PATCH /events/:eventId/activate  — Activate an event ─── */
router.patch('/:eventId/activate', adminOnly, async (req, res) => {
  try {
    const event = await Event.findOneAndUpdate(
      { eventId: req.params.eventId },
      { status: 'active' },
      { new: true }
    );
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ message: 'Event activated', event });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;