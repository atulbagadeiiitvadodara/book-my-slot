const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const { nanoid } = require('../utils/nanoid');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || `${process.env.BACKEND_URL}/auth/google/callback`,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      const slug = await generateUniqueSlug(profile.displayName);
      user = await User.create({
        googleId: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
        avatar: profile.photos[0]?.value || '',
        timezone: 'Asia/Kolkata',
        publicSlug: slug,
      });
    }
    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

passport.use('google-calendar', new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALENDAR_CALLBACK_URL || `${process.env.BACKEND_URL}/auth/google/calendar/callback`,
}, (accessToken, refreshToken, profile, done) => {
  return done(null, {
    email: profile.emails?.[0]?.value || '',
    refreshToken: refreshToken || '',
  });
}));

async function generateUniqueSlug(name) {
  const base = name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '').slice(0, 20);
  let slug = base;
  let count = 0;
  while (await User.findOne({ publicSlug: slug })) {
    count++;
    slug = base + count;
  }
  return slug || nanoid(8);
}
