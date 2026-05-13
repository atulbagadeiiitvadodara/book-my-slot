require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const connectDB = require('./config/db');

require('./config/passport');

const authRoutes = require('./routes/auth');
const availabilityRoutes = require('./routes/availability');
const publicRoutes = require('./routes/public');
const bookingRoutes = require('./routes/bookings');

const app = express();

connectDB();

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use('/auth', authRoutes);
app.use('/availability', availabilityRoutes);
app.use('/u', publicRoutes);
app.use('/bookings', bookingRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
