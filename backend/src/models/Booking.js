const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookedByName: { type: String, required: true },
  bookedByEmail: { type: String, required: true },
  reason: { type: String, required: true },
  startTimeUTC: { type: Date, required: true },
  endTimeUTC: { type: Date, required: true },
  timezone: { type: String, required: true },
  status: { type: String, enum: ['confirmed', 'cancelled', 'completed'], default: 'confirmed' },
  cancelToken: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Booking', bookingSchema);
