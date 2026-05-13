const { google } = require('googleapis');

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';

function isCalendarEnabled() {
  return process.env.GOOGLE_CALENDAR_ENABLED !== 'false';
}

function getOAuthClient(refreshToken) {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALENDAR_CALLBACK_URL || `${process.env.BACKEND_URL}/auth/google/calendar/callback`
  );

  client.setCredentials({ refresh_token: refreshToken });
  return client;
}

function buildEventDescription({ booking, cancelLink }) {
  return [
    `Requester: ${booking.bookedByName}`,
    `Requester email: ${booking.bookedByEmail}`,
    `Reason: ${booking.reason}`,
    `Cancel link: ${cancelLink}`,
  ].join('\n');
}

async function createOwnerCalendarEvent({ booking, owner, cancelLink }) {
  if (!isCalendarEnabled() || !owner.googleCalendarEnabled || !owner.googleRefreshToken) return null;

  const calendar = google.calendar({ version: 'v3', auth: getOAuthClient(owner.googleRefreshToken) });
  const response = await calendar.events.insert({
    calendarId: CALENDAR_ID,
    sendUpdates: 'none',
    requestBody: {
      summary: `Booking with ${booking.bookedByName}`,
      description: buildEventDescription({ booking, cancelLink }),
      start: {
        dateTime: new Date(booking.startTimeUTC).toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: new Date(booking.endTimeUTC).toISOString(),
        timeZone: 'UTC',
      },
      attendees: [
        {
          email: booking.bookedByEmail,
          displayName: booking.bookedByName,
        },
      ],
      extendedProperties: {
        private: {
          bookingId: String(booking._id),
        },
      },
      guestsCanModify: false,
      reminders: {
        useDefault: true,
      },
    },
  });

  return response.data.id;
}

async function deleteOwnerCalendarEvent({ owner, eventId }) {
  if (!isCalendarEnabled() || !owner.googleCalendarEnabled || !owner.googleRefreshToken || !eventId) return false;

  const calendar = google.calendar({ version: 'v3', auth: getOAuthClient(owner.googleRefreshToken) });

  try {
    await calendar.events.delete({
      calendarId: CALENDAR_ID,
      eventId,
      sendUpdates: 'none',
    });
    return true;
  } catch (err) {
    if (err.code === 404 || err.code === 410) return false;
    throw err;
  }
}

module.exports = {
  createOwnerCalendarEvent,
  deleteOwnerCalendarEvent,
};
