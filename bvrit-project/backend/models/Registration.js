const mongoose = require('mongoose');

const RegistrationSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event:     { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  eventId:   { type: String, required: true },
  eventName: { type: String },
  status:    { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  attended:  { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Registration', RegistrationSchema);