const { toZonedTime, fromZonedTime, format } = require('date-fns-tz');
const { addMinutes, isBefore, isAfter, parseISO, startOfDay, endOfDay } = require('date-fns');
const Booking = require('../models/Booking');
const Availability = require('../models/Availability');

/**
 * Generate available slots for a given date (YYYY-MM-DD) in a viewer's timezone.
 * Availability is defined in the owner's timezone but we compute in UTC.
 */
async function getSlotsForDate(owner, dateStr, viewerTimezone) {
  const ownerTimezone = owner.timezone;

  // Parse the requested date in the viewer's timezone
  const [year, month, day] = dateStr.split('-').map(Number);

  // Get weekday in owner's timezone for that date
  // We use noon to avoid DST edge cases
  const noonInViewer = fromZonedTime(
    new Date(year, month - 1, day, 12, 0, 0),
    viewerTimezone
  );
  const noonInOwner = toZonedTime(noonInViewer, ownerTimezone);
  const weekday = noonInOwner.getDay(); // 0=Sun

  const avail = await Availability.findOne({ userId: owner._id, weekday });
  if (!avail) return [];

  // Build slots in owner's timezone
  const [startH, startM] = avail.startTime.split(':').map(Number);
  const [endH, endM] = avail.endTime.split(':').map(Number);

  // Start/end in owner's local time on the date corresponding to noonInOwner's date
  const ownerDate = noonInOwner;
  const slotStart = fromZonedTime(
    new Date(ownerDate.getFullYear(), ownerDate.getMonth(), ownerDate.getDate(), startH, startM, 0),
    ownerTimezone
  );
  const slotEnd = fromZonedTime(
    new Date(ownerDate.getFullYear(), ownerDate.getMonth(), ownerDate.getDate(), endH, endM, 0),
    ownerTimezone
  );

  const now = new Date();
  const slots = [];
  let cursor = slotStart;

  while (isBefore(cursor, slotEnd)) {
    const slotEndTime = addMinutes(cursor, avail.slotDuration);
    if (isAfter(slotEndTime, slotEnd)) break;

    // Skip past slots
    if (isAfter(cursor, now) || cursor.getTime() === now.getTime()) {
      slots.push({
        startUTC: cursor.toISOString(),
        endUTC: slotEndTime.toISOString(),
        startLocal: format(toZonedTime(cursor, viewerTimezone), 'HH:mm', { timeZone: viewerTimezone }),
        endLocal: format(toZonedTime(slotEndTime, viewerTimezone), 'HH:mm', { timeZone: viewerTimezone }),
        duration: avail.slotDuration,
      });
    }
    cursor = slotEndTime;
  }

  // Remove booked slots
  const bookings = await Booking.find({
    ownerUserId: owner._id,
    status: 'confirmed',
    startTimeUTC: { $gte: slotStart },
    endTimeUTC: { $lte: slotEnd },
  });

  const bookedTimes = new Set(bookings.map(b => b.startTimeUTC.toISOString()));
  return slots.filter(s => !bookedTimes.has(s.startUTC));
}

module.exports = { getSlotsForDate };
