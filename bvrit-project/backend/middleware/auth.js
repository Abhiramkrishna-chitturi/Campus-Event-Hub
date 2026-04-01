const User = require('../models/User');

// Simple session-based auth check via username passed in header or body
exports.protect = async (req, res, next) => {
  try {
    const username = req.headers['x-username'];
    if (!username) return res.status(401).json({ error: 'Not authenticated' });

    const user = await User.findOne({ username });
    if (!user || !user.isActive) return res.status(401).json({ error: 'User not found or inactive' });

    req.user = user;
    next();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.adminOnly = async (req, res, next) => {
  try {
    const username = req.headers['x-username'];
    if (!username) return res.status(401).json({ error: 'Not authenticated' });

    const user = await User.findOne({ username, role: 'admin' });
    if (!user) return res.status(403).json({ error: 'Admin access only' });

    req.user = user;
    next();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};