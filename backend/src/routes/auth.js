const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

router.get('/google/calendar', authenticate, passport.authorize('google-calendar', {
  scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar.events'],
  accessType: 'offline',
  prompt: 'consent',
  session: false,
}));

router.get('/google/calendar/callback',
  authenticate,
  passport.authorize('google-calendar', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/dashboard?calendar=failed`,
  }),
  async (req, res) => {
    if (req.account?.refreshToken) {
      req.user.googleRefreshToken = req.account.refreshToken;
      req.user.googleCalendarEmail = req.account.email || req.user.email;
      req.user.googleCalendarEnabled = true;
      req.user.googleCalendarConnectedAt = new Date();
      await req.user.save();
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard?calendar=connected`);
    }

    return res.redirect(`${process.env.FRONTEND_URL}/dashboard?calendar=missing_refresh_token`);
  }
);

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed` }),
  (req, res) => {
    const token = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  }
);

router.get('/me', authenticate, (req, res) => {
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    avatar: req.user.avatar,
    timezone: req.user.timezone,
    publicSlug: req.user.publicSlug,
    calendarConnected: Boolean(req.user.googleCalendarEnabled && req.user.googleRefreshToken),
    calendarEmail: req.user.googleCalendarEmail,
  });
});

router.post('/google/calendar/disconnect', authenticate, async (req, res) => {
  req.user.googleRefreshToken = '';
  req.user.googleCalendarEmail = '';
  req.user.googleCalendarEnabled = false;
  req.user.googleCalendarConnectedAt = undefined;
  await req.user.save();
  res.json({ message: 'Google Calendar disconnected' });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
  res.json({ message: 'Logged out' });
});

module.exports = router;
