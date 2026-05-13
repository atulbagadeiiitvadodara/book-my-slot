const express = require('express');
const User = require('../models/User');
const Availability = require('../models/Availability');
const { getSlotsForDate } = require('../services/slots');

const router = express.Router();

// GET /u/:slug - public profile info
router.get('/:slug', async (req, res) => {
  try {
    const user = await User.findOne({ publicSlug: req.params.slug });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const availability = await Availability.find({ userId: user._id }).sort('weekday');

    res.json({
      name: user.name,
      avatar: user.avatar,
      slug: user.publicSlug,
      timezone: user.timezone,
      availability: availability.map(a => ({
        weekday: a.weekday,
        startTime: a.startTime,
        endTime: a.endTime,
        slotDuration: a.slotDuration,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /u/:slug/slots?date=YYYY-MM-DD&timezone=America/New_York
router.get('/:slug/slots', async (req, res) => {
  try {
    const user = await User.findOne({ publicSlug: req.params.slug });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { date, timezone } = req.query;
    if (!date || !timezone) {
      return res.status(400).json({ error: 'date and timezone query params required' });
    }

    const slots = await getSlotsForDate(user, date, timezone);
    res.json(slots);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
