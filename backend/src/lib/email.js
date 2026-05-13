const { Resend } = require('resend');
const { toZonedTime, format } = require('date-fns-tz');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || 'noreply@slotsync.app';
const FRONTEND_URL = process.env.FRONTEND_URL;

function formatDT(utcDate, timezone) {
  const zoned = toZonedTime(new Date(utcDate), timezone);
  return format(zoned, 'EEEE, MMMM d yyyy · h:mm a zzz', { timeZone: timezone });
}

async function sendBookingConfirmation({ booking, ownerName, ownerEmail }) {
  const ownerDT = formatDT(booking.startTimeUTC, booking.timezone);
  const cancelLink = `${FRONTEND_URL}/cancel/${booking.cancelToken}`;

  await resend.emails.send({
    from: FROM,
    to: ownerEmail,
    subject: `New booking from ${booking.bookedByName}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#1a1a2e;">
        <h2 style="color:#6c63ff;">New booking confirmed</h2>
        <p><strong>${booking.bookedByName}</strong> (${booking.bookedByEmail}) has booked a slot with you.</p>
        <p><strong>When:</strong> ${ownerDT}</p>
        <p><strong>Reason:</strong> ${booking.reason}</p>
        <hr style="border:none;border-top:1px solid #eee;"/>
        <p style="color:#888;font-size:13px;">The slot has been reserved in your calendar.</p>
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
        <p>Your meeting with <strong>${ownerName}</strong> is confirmed.</p>
        <p><strong>When:</strong> ${ownerDT}</p>
        <p><strong>Reason:</strong> ${booking.reason}</p>
        <hr style="border:none;border-top:1px solid #eee;"/>
        <p>Need to cancel? <a href="${cancelLink}" style="color:#6c63ff;">Click here to cancel this booking</a>.</p>
        <p style="color:#888;font-size:12px;">Cancellation link: ${cancelLink}</p>
      </div>
    `,
  });
}

async function sendCancellationEmails({ booking, ownerName, ownerEmail }) {
  const ownerDT = formatDT(booking.startTimeUTC, booking.timezone);

  await resend.emails.send({
    from: FROM,
    to: ownerEmail,
    subject: `Booking cancelled by ${booking.bookedByName}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#1a1a2e;">
        <h2 style="color:#e74c3c;">Booking cancelled</h2>
        <p><strong>${booking.bookedByName}</strong> has cancelled their booking.</p>
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
        <p>Your meeting with <strong>${ownerName}</strong> has been cancelled.</p>
        <p><strong>Was scheduled for:</strong> ${ownerDT}</p>
        <p>Feel free to book another slot anytime.</p>
      </div>
    `,
  });
}

module.exports = { sendBookingConfirmation, sendCancellationEmails };
