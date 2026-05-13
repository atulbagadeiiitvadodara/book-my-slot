const express = require('express');
const { authenticate } = require('../middleware/auth');
const Availability = require('../models/Availability');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const records = await Availability.find({ userId: req.user._id }).sort('weekday');
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

router.put('/', authenticate, async (req, res) => {
  try {
    const { availability, timezone } = req.body;

    if (!Array.isArray(availability)) {
      return res.status(400).json({ error: 'availability must be an array' });
    }

    // Update timezone on user
    if (timezone) {
      await req.user.updateOne({ timezone });
    }

    // Replace all availability for this user
    await Availability.deleteMany({ userId: req.user._id });

    const docs = availability.map(a => ({
      userId: req.user._id,
      weekday: a.weekday,
      startTime: a.startTime,
      endTime: a.endTime,
      slotDuration: a.slotDuration || 30,
    }));

    if (docs.length > 0) {
      await Availability.insertMany(docs);
    }

    const saved = await Availability.find({ userId: req.user._id }).sort('weekday');
    res.json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save availability' });
  }
});

module.exports = router;
