const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { sendBookingConfirmation, sendCancellationEmails } = require('../lib/email');
const { createOwnerCalendarEvent, deleteOwnerCalendarEvent } = require('../lib/googleCalendar');

const router = express.Router();
const FRONTEND_URL = process.env.FRONTEND_URL;

// POST /bookings - create a booking (public)
router.post('/', async (req, res) => {
  try {
    const { ownerSlug, bookedByName, bookedByEmail, reason, startTimeUTC, endTimeUTC, timezone } = req.body;

    if (!ownerSlug || !bookedByName || !bookedByEmail || !reason || !startTimeUTC || !endTimeUTC || !timezone) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const owner = await User.findOne({ publicSlug: ownerSlug });
    if (!owner) return res.status(404).json({ error: 'Owner not found' });

    const start = new Date(startTimeUTC);
    const end = new Date(endTimeUTC);

    if (start <= new Date()) {
      return res.status(400).json({ error: 'Cannot book a past slot' });
    }

    // Check for double booking - atomic check
    const conflict = await Booking.findOne({
      ownerUserId: owner._id,
      status: 'confirmed',
      $or: [
        { startTimeUTC: { $lt: end }, endTimeUTC: { $gt: start } },
      ],
    });

    if (conflict) {
      return res.status(409).json({ error: 'This slot has already been booked' });
    }

    const cancelToken = uuidv4();
    const booking = await Booking.create({
      ownerUserId: owner._id,
      bookedByName,
      bookedByEmail,
      reason,
      startTimeUTC: start,
      endTimeUTC: end,
      timezone,
      cancelToken,
    });

    let calendarEventCreated = false;
    const cancelLink = `${FRONTEND_URL}/cancel/${booking.cancelToken}`;

    try {
      const googleCalendarEventId = await createOwnerCalendarEvent({
        booking,
        owner,
        cancelLink,
      });

      if (googleCalendarEventId) {
        booking.googleCalendarEventId = googleCalendarEventId;
        await booking.save();
        calendarEventCreated = true;
      }
    } catch (err) {
      console.error('Google Calendar create error:', err);
    }

    // Send emails (non-blocking)
    sendBookingConfirmation({
      booking,
      ownerName: owner.name,
      ownerEmail: owner.email,
      calendarEventCreated,
    }).catch(err => console.error('Email error:', err));

    res.status(201).json({ message: 'Booking confirmed', bookingId: booking._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// GET /bookings - authenticated owner's bookings
router.get('/', authenticate, async (req, res) => {
  try {
    const bookings = await Booking.find({ ownerUserId: req.user._id }).sort({ startTimeUTC: 1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// PATCH /bookings/:id/cancel - cancel by token (public, via cancel link)
router.patch('/:token/cancel', async (req, res) => {
  try {
    const booking = await Booking.findOne({ cancelToken: req.params.token });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status !== 'confirmed') {
      return res.status(400).json({ error: 'Booking is not active' });
    }

    const owner = await User.findById(booking.ownerUserId);

    if (owner && booking.googleCalendarEventId) {
      try {
        await deleteOwnerCalendarEvent({
          owner,
          eventId: booking.googleCalendarEventId,
        });
      } catch (err) {
        console.error('Google Calendar delete error:', err);
      }
    }

    booking.status = 'cancelled';
    await booking.save();

    sendCancellationEmails({
      booking,
      ownerName: owner?.name || 'the owner',
      ownerEmail: owner?.email,
    }).catch(err => console.error('Email error:', err));

    res.json({ message: 'Booking cancelled successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// GET /bookings/cancel/:token - get booking info for cancel page
router.get('/cancel/:token', async (req, res) => {
  try {
    const booking = await Booking.findOne({ cancelToken: req.params.token }).populate('ownerUserId', 'name');
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json({
      bookedByName: booking.bookedByName,
      ownerName: booking.ownerUserId?.name,
      startTimeUTC: booking.startTimeUTC,
      endTimeUTC: booking.endTimeUTC,
      timezone: booking.timezone,
      status: booking.status,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
