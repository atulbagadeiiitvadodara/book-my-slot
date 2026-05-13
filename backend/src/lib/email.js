const { Resend } = require('resend');
const { toZonedTime, format } = require('date-fns-tz');
const { buildCalendarAttachment } = require('./calendarInvite');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM;
const FRONTEND_URL = process.env.FRONTEND_URL;

function formatDT(utcDate, timezone) {
  const zoned = toZonedTime(new Date(utcDate), timezone);
  return format(zoned, 'EEEE, MMMM d yyyy · h:mm a zzz', { timeZone: timezone });
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function sendBookingConfirmation({ booking, ownerName, ownerEmail, calendarEventCreated = false }) {
  const ownerDT = formatDT(booking.startTimeUTC, booking.timezone);
  const cancelLink = `${FRONTEND_URL}/cancel/${booking.cancelToken}`;
  const bookingInvite = buildCalendarAttachment({
    booking,
    ownerName,
    ownerEmail,
    method: 'REQUEST',
  });

  await resend.emails.send({
    from: FROM,
    to: ownerEmail,
    subject: `New booking from ${booking.bookedByName}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#1a1a2e;">
        <h2 style="color:#6c63ff;">New booking confirmed</h2>
        <p><strong>${escapeHtml(booking.bookedByName)}</strong> (${escapeHtml(booking.bookedByEmail)}) has booked a slot with you.</p>
        <p><strong>When:</strong> ${ownerDT}</p>
        <p><strong>Reason:</strong> ${escapeHtml(booking.reason)}</p>
        <hr style="border:none;border-top:1px solid #eee;"/>
        <p style="color:#888;font-size:13px;">${calendarEventCreated ? 'The slot has been reserved in your Google Calendar.' : 'The booking is confirmed, but your Google Calendar could not be updated automatically.'}</p>
      </div>
    `,
  });

  await resend.emails.send({
    from: FROM,
    to: booking.bookedByEmail,
    subject: `Your booking with ${ownerName} is confirmed`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#1a1a2e;">
        <h2 style="color:#6c63ff;">Booking confirmed!</h2>
        <p>Your meeting with <strong>${escapeHtml(ownerName)}</strong> is confirmed.</p>
        <p><strong>When:</strong> ${ownerDT}</p>
        <p><strong>Reason:</strong> ${escapeHtml(booking.reason)}</p>
        <hr style="border:none;border-top:1px solid #eee;"/>
        <p>Need to cancel? <a href="${cancelLink}" style="color:#6c63ff;">Click here to cancel this booking</a>.</p>
        <p style="color:#888;font-size:12px;">Cancellation link: ${cancelLink}</p>
      </div>
    `,
    attachments: [bookingInvite],
  });
}

async function sendCancellationEmails({ booking, ownerName, ownerEmail }) {
  const ownerDT = formatDT(booking.startTimeUTC, booking.timezone);
  const cancellationInvite = buildCalendarAttachment({
    booking,
    ownerName,
    ownerEmail,
    method: 'CANCEL',
  });

  await resend.emails.send({
    from: FROM,
    to: ownerEmail,
    subject: `Booking cancelled by ${booking.bookedByName}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#1a1a2e;">
        <h2 style="color:#e74c3c;">Booking cancelled</h2>
        <p><strong>${escapeHtml(booking.bookedByName)}</strong> has cancelled their booking.</p>
        <p><strong>Was scheduled for:</strong> ${ownerDT}</p>
        <p>The slot is now available again.</p>
      </div>
    `,
  });

  await resend.emails.send({
    from: FROM,
    to: booking.bookedByEmail,
    subject: `Your booking with ${ownerName} has been cancelled`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#1a1a2e;">
        <h2 style="color:#e74c3c;">Booking cancelled</h2>
        <p>Your meeting with <strong>${escapeHtml(ownerName)}</strong> has been cancelled.</p>
        <p><strong>Was scheduled for:</strong> ${ownerDT}</p>
        <p>Feel free to book another slot anytime.</p>
      </div>
    `,
    attachments: [cancellationInvite],
  });
}

module.exports = { sendBookingConfirmation, sendCancellationEmails };
