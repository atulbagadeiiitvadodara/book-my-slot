import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { getBookings } from '../api/bookings';
import { getAvailability } from '../api/availability';
import { format, parseISO, isAfter } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { disconnectGoogleCalendar, getGoogleCalendarConnectUrl, getMe } from '../api/auth';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function DashboardPage() {
  const { user, setUser } = useAuthStore();
  const [copied, setCopied] = useState(false);
  const [isDisconnectingCalendar, setIsDisconnectingCalendar] = useState(false);

  const { data: bookings = [] } = useQuery({ queryKey: ['bookings'], queryFn: getBookings });
  const { data: availability = [] } = useQuery({ queryKey: ['availability'], queryFn: getAvailability });

  const confirmed = bookings.filter(b => b.status === 'confirmed');
  const upcoming = confirmed.filter(b => isAfter(parseISO(b.startTimeUTC), new Date()));
  const bookingLink = `${window.location.origin}/u/${user?.publicSlug}`;

  const copyLink = () => {
    navigator.clipboard.writeText(bookingLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const connectCalendar = () => {
    window.location.href = getGoogleCalendarConnectUrl();
  };

  const disconnectCalendar = async () => {
    setIsDisconnectingCalendar(true);
    try {
      await disconnectGoogleCalendar();
      const updatedUser = await getMe();
      setUser(updatedUser);
    } finally {
      setIsDisconnectingCalendar(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-faint mt-0.5">{user?.timezone}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Total bookings', val: bookings.length },
          { label: 'Upcoming', val: upcoming.length },
          { label: 'Confirmed', val: confirmed.length },
        ].map(s => (
          <div key={s.label} className="bg-bg-secondary border border-border-light rounded-xl p-4">
            <p className="text-xs text-text-faint mb-1">{s.label}</p>
            <p className="text-2xl font-medium text-text-primary font-mono">{s.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Availability summary */}
        <div className="bg-bg-secondary border border-border-light rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-text-secondary">Weekly availability</h2>
            <Link to="/dashboard/availability" className="text-xs text-accent hover:underline">Edit</Link>
          </div>
          {availability.length === 0 ? (
            <p className="text-xs text-text-faint py-2">No availability set yet. <Link to="/dashboard/availability" className="text-accent hover:underline">Set it up →</Link></p>
          ) : (
            <div className="space-y-1.5">
              {WEEKDAYS.map((day, idx) => {
                const a = availability.find(av => av.weekday === idx);
                return (
                  <div key={day} className="flex items-center gap-2 text-xs">
                    <span className="text-text-faint w-8">{day}</span>
                    {a ? (
                      <>
                        <span className="flex-1 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                          <span className="block h-full bg-accent rounded-full" style={{ width: '70%' }} />
                        </span>
                        <span className="text-text-muted font-mono text-[11px]">{a.startTime}–{a.endTime}</span>
                      </>
                    ) : (
                      <span className="text-[#2a3045] flex-1 text-[11px]">unavailable</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {availability[0] && (
            <div className="mt-3 pt-3 border-t border-border-light flex items-center gap-2">
              <span className="text-[11px] text-text-faint">Slot duration</span>
              <span className="text-[11px] bg-bg-tertiary border border-border-light rounded-md px-2 py-0.5 text-text-muted font-mono">
                {availability[0].slotDuration} min
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {/* Calendar sync */}
          <div className="bg-bg-secondary border border-border-light rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-sm font-medium text-text-secondary mb-1">Calendar sync</h2>
                {user?.calendarConnected ? (
                  <p className="text-xs text-text-faint truncate">Connected as {user.calendarEmail || user.email}</p>
                ) : (
                  <p className="text-xs text-text-faint">Add confirmed bookings to your Google Calendar.</p>
                )}
              </div>
              {user?.calendarConnected ? (
                <button
                  onClick={disconnectCalendar}
                  disabled={isDisconnectingCalendar}
                  className="text-[11px] bg-bg-tertiary border border-border-light rounded-md px-2.5 py-1.5 text-text-muted hover:text-danger disabled:opacity-60 transition-colors shrink-0"
                >
                  {isDisconnectingCalendar ? 'Disconnecting' : 'Disconnect'}
                </button>
              ) : (
                <button
                  onClick={connectCalendar}
                  className="text-[11px] bg-accent rounded-md px-2.5 py-1.5 text-white hover:opacity-90 transition-opacity shrink-0"
                >
                  Connect
                </button>
              )}
            </div>
          </div>

          {/* Booking link */}
          <div className="bg-bg-secondary border border-border-light rounded-xl p-4">
            <h2 className="text-sm font-medium text-text-secondary mb-3">Your booking link</h2>
            <div className="flex items-center gap-2 bg-bg-tertiary border border-border-light rounded-lg px-3 py-2">
              <span className="text-xs text-accent font-mono flex-1 truncate">{bookingLink}</span>
              <button
                onClick={copyLink}
                className="text-[11px] bg-bg-secondary border border-border rounded-md px-2 py-1 text-text-muted hover:text-text-secondary transition-colors shrink-0"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Upcoming bookings */}
          <div className="bg-bg-secondary border border-border-light rounded-xl p-4 flex-1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-text-secondary">Upcoming bookings</h2>
              <Link to="/dashboard/bookings" className="text-xs text-accent hover:underline">View all</Link>
            </div>
            {upcoming.length === 0 ? (
              <p className="text-xs text-text-faint">No upcoming bookings.</p>
            ) : (
              <div className="space-y-2">
                {upcoming.slice(0, 5).map(b => {
                  const dt = toZonedTime(parseISO(b.startTimeUTC), user?.timezone || 'UTC');
                  return (
                    <div key={b._id} className="flex items-center gap-2 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />
                      <span className="text-text-faint font-mono w-24 shrink-0">
                        {format(dt, 'MMM d · h:mm a')}
                      </span>
                      <span className="text-text-secondary truncate">{b.bookedByName}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
