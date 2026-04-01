const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

/* ─── POST /api/users/register ─── */
router.post('/register', async (req, res) => {
  try {
    const { name, department, rollNumber, username, password } = req.body;

    if (!name || !department || !rollNumber || !username || !password)
      return res.status(400).json({ error: 'All fields are required' });

    // Username validation: only letters + exactly one underscore
    const usernameRegex = /^[a-zA-Z_]+$/;
    const underscoreCount = (username.match(/_/g) || []).length;
    if (!usernameRegex.test(username) || underscoreCount !== 1)
      return res.status(400).json({ error: 'Username must contain exactly one underscore and no numbers' });

    // Password: min 8 chars, uppercase, lowercase, number, underscore
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*_).{8,}$/;
    if (!passwordRegex.test(password))
      return res.status(400).json({ error: 'Password must contain uppercase, lowercase, number and underscore (min 8 chars)' });

    const existingUser = await User.findOne({ $or: [{ username }, { rollNumber }] });
    if (existingUser) {
      if (existingUser.username === username)
        return res.status(400).json({ error: 'Username already taken' });
      return res.status(400).json({ error: 'Roll number already registered' });
    }

    const user = await User.create({ name, department, rollNumber, username, password });
    res.status(201).json({ message: 'Registration successful', username: user.username });
  } catch (e) {
    console.error('Register error:', e.message);
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

/* ─── POST /api/users/login ─── */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: 'Username and password required' });

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    if (!user.isActive) return res.status(403).json({ error: 'Account deactivated. Contact admin.' });

    const match = await user.matchPassword(password);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });

    res.json({
      message: 'Login successful',
      user: {
        username: user.username,
        name: user.name,
        role: user.role,
        department: user.department,
        rollNumber: user.rollNumber
      }
    });
  } catch (e) {
    console.error('Login error:', e.message);
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

/* ─── POST /api/users/admin-login ─── */
router.post('/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const adminUser = await User.findOne({ username, role: 'admin' });
    if (!adminUser) return res.status(400).json({ error: 'Invalid admin credentials' });

    const match = await adminUser.matchPassword(password);
    if (!match) return res.status(400).json({ error: 'Invalid admin credentials' });

    res.json({
      message: 'Admin login successful',
      user: { username: adminUser.username, name: adminUser.name, role: 'admin' }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ─── GET /api/users/profile ─── */
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ─── GET /api/users/all  (admin) ─── */
router.get('/all', adminOnly, async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ─── DELETE /api/users/:id  (admin) ─── */
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ─── PATCH /api/users/:id/toggle  (admin) ─── */
router.patch('/:id/toggle', adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    user.isActive = !user.isActive;
    await user.save();
    res.json({ message: 'User status updated', isActive: user.isActive });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;