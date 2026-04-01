const mongoose = require('mongoose');

const RegistrationSchema = new mongoose.Schema({
  user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:         { type: String },
  rollNumber:   { type: String },
  department:   { type: String },
  registeredAt: { type: Date, default: Date.now },
  attended:     { type: Boolean, default: false }
});

const EventSchema = new mongoose.Schema({
  eventId:      { type: String, required: true, unique: true },  // e.g. "athenes", "baja"
  name:         { type: String, required: true },
  description:  { type: String, required: true },
  date:         { type: String, required: true },
  time:         { type: String, required: true },
  location:     { type: String, required: true },
  capacity:     { type: Number, default: 200 },
  category:     { type: String, enum: ['Sports','Cultural','Technical','Other'], default: 'Other' },
  status:       { type: String, enum: ['active','inactive','completed'], default: 'active' },
  registrations: [RegistrationSchema]
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);