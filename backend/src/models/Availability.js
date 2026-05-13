const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  weekday: { type: Number, required: true, min: 0, max: 6 }, // 0=Sun, 1=Mon...
  startTime: { type: String, required: true }, // "09:00"
  endTime: { type: String, required: true },   // "17:00"
  slotDuration: { type: Number, required: true, default: 30 }, // minutes
});

availabilitySchema.index({ userId: 1, weekday: 1 }, { unique: true });

module.exports = mongoose.model('Availability', availabilitySchema);
