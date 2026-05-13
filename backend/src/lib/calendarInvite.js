function toIcsDate(date) {
  return new Date(date).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeIcsText(value = '') {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

function foldIcsLine(line) {
  const chunks = [];
  let remaining = line;
  while (remaining.length > 75) {
    chunks.push(remaining.slice(0, 75));
    remaining = ` ${remaining.slice(75)}`;
  }
  chunks.push(remaining);
  return chunks.join('\r\n');
}

function buildIcs({ booking, ownerName, ownerEmail, method }) {
  const isCancel = method === 'CANCEL';
  const uid = `bookmyslot-${booking._id}@bookmyslot`;
  const summary = `Booking with ${ownerName}`;
  const description = [
    `Requester: ${booking.bookedByName}`,
    `Requester email: ${booking.bookedByEmail}`,
    `Reason: ${booking.reason}`,
  ].join('\\n');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BookMySlot//Booking//EN',
    'CALSCALE:GREGORIAN',
    `METHOD:${method}`,
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(booking.startTimeUTC)}`,
    `DTEND:${toIcsDate(booking.endTimeUTC)}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `ORGANIZER;CN=${escapeIcsText(ownerName)}:MAILTO:${ownerEmail}`,
    `ATTENDEE;CN=${escapeIcsText(booking.bookedByName)};ROLE=REQ-PARTICIPANT;PARTSTAT=${isCancel ? 'DECLINED' : 'NEEDS-ACTION'};RSVP=${isCancel ? 'FALSE' : 'TRUE'}:MAILTO:${booking.bookedByEmail}`,
    `STATUS:${isCancel ? 'CANCELLED' : 'CONFIRMED'}`,
    `SEQUENCE:${isCancel ? 1 : 0}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return lines.map(foldIcsLine).join('\r\n');
}

function buildCalendarAttachment({ booking, ownerName, ownerEmail, method = 'REQUEST' }) {
  const content = buildIcs({ booking, ownerName, ownerEmail, method });
  return {
    filename: method === 'CANCEL' ? 'booking-cancelled.ics' : 'booking.ics',
    content: Buffer.from(content).toString('base64'),
  };
}

module.exports = { buildCalendarAttachment };
