import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getPublicProfile, getSlots, createBooking } from '../api/bookings';
import { format, addDays, startOfDay, parseISO, isBefore } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Slot } from '../types';

const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function detectTimezone() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return 'UTC'; }
}

export default function PublicBookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const timezone = detectTimezone();

  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [form, setForm] = useState({ name: '', email: '', reason: '' });
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState('');

  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['public-profile', slug],
    queryFn: () => getPublicProfile(slug!),
    enabled: !!slug,
  });

  const { data: slots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ['slots', slug, selectedDate, timezone],
    queryFn: () => getSlots(slug!, selectedDate!, timezone),
    enabled: !!selectedDate && !!slug,
  });

  const bookMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: () => setBooked(true),
    onError: (err: any) => setError(err.response?.data?.error || 'Failed to book. Please try again.'),
  });

  // Build 14 days starting from today
  const today = startOfDay(new Date());
  const weekStart = addDays(today, weekOffset * 7);
  const days = Array.from({ length: 14 }, (_, i) => addDays(weekStart, i));

  const availableWeekdays = new Set(profile?.availability?.map((a: any) => a.weekday) || []);

  const isDayAvailable = (d: Date) => {
    if (isBefore(d, today)) return false;
    return availableWeekdays.has(d.getDay());
  };

  const handleBook = () => {
    if (!selectedSlot || !form.name || !form.email || !form.reason) return;
    setError('');
    bookMutation.mutate({
      ownerSlug: slug!,
      bookedByName: form.name,
      bookedByEmail: form.email,
      reason: form.reason,
      startTimeUTC: selectedSlot.startUTC,
      endTimeUTC: selectedSlot.endUTC,
      timezone,
    });
  };

  if (profileLoading) return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="text-text-muted text-sm">Loading...</div>
    </div>
  );

  if (profileError || !profile) return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="text-center">
        <p className="text-text-primary text-lg font-medium mb-2">Page not found</p>
        <p className="text-text-muted text-sm">This booking link doesn't exist.</p>
      </div>
    </div>
  );

  if (booked) return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="bg-bg-secondary border border-border rounded-2xl p-8 max-w-sm w-full text-center">
        <div className="w-12 h-12 bg-[#1e2a1e] border border-[#2a4030] rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-success text-xl">✓</span>
        </div>
        <h2 className="text-lg font-medium text-text-primary mb-2">Booking confirmed!</h2>
        <p className="text-sm text-text-muted leading-relaxed mb-1">
          You've booked a slot with <strong className="text-text-secondary">{profile.name}</strong>.
        </p>
        <p className="text-sm text-text-muted">
          Check your email for confirmation and a cancellation link.
        </p>
        {selectedSlot && (
          <div className="mt-4 bg-bg-tertiary border border-border-light rounded-xl p-3">
            <p className="text-xs text-text-faint">
              {selectedDate && format(parseISO(selectedDate), 'EEEE, MMMM d')}
            </p>
            <p className="text-sm font-mono text-text-secondary mt-0.5">
              {selectedSlot.startLocal} – {selectedSlot.endLocal}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-primary py-8 px-4">
      <div
        className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#6c63ff 1px, transparent 1px), linear-gradient(90deg, #6c63ff 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="max-w-3xl mx-auto relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center text-white font-mono font-bold text-xs">S</div>
          <span className="font-medium text-text-secondary text-sm">BookMySlot</span>
        </div>

        <div className="grid md:grid-cols-[220px_1fr] gap-4">
          {/* Profile */}
          <div className="bg-bg-secondary border border-border-light rounded-2xl p-5">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.name} className="w-14 h-14 rounded-full mb-3" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-white text-xl font-medium mb-3">
                {profile.name[0]}
              </div>
            )}
            <h1 className="text-base font-medium text-text-primary">{profile.name}</h1>
            <p className="text-xs text-accent mb-3">@{slug}</p>

            <div className="space-y-2 text-xs text-text-muted">
              <div className="flex items-center gap-2">
                <span className="text-text-faint">⏱</span>
                <span>
                  {profile.availability?.[0]?.slotDuration || 30} min meeting
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-text-faint">🌐</span>
                <span>Showing in your timezone</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-text-faint">📍</span>
                <span className="text-[11px] text-text-faint">{timezone}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border-light text-xs text-text-faint leading-relaxed">
              Book a slot and receive a confirmation email with a cancellation link.
            </div>
          </div>

          {/* Calendar + slots */}
          <div className="flex flex-col gap-3">
            {/* Week navigation */}
            <div className="bg-bg-secondary border border-border-light rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => { setWeekOffset(w => Math.max(0, w - 1)); setSelectedDate(null); setSelectedSlot(null); }}
                  disabled={weekOffset === 0}
                  className="text-xs px-3 py-1.5 bg-bg-tertiary border border-border rounded-lg text-text-muted hover:text-text-secondary disabled:opacity-30 transition-colors"
                >
                  ←
                </button>
                <span className="text-sm font-medium text-text-secondary">
                  {format(weekStart, 'MMMM yyyy')}
                </span>
                <button
                  onClick={() => { setWeekOffset(w => w + 1); setSelectedDate(null); setSelectedSlot(null); }}
                  className="text-xs px-3 py-1.5 bg-bg-tertiary border border-border rounded-lg text-text-muted hover:text-text-secondary transition-colors"
                >
                  →
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {WEEKDAYS_SHORT.map(d => (
                  <div key={d} className="text-[10px] text-text-faint text-center py-1">{d}</div>
                ))}
              </div>

              {/* 2 rows of 7 days */}
              <div className="grid grid-cols-7 gap-1">
                {days.map(d => {
                  const dateStr = format(d, 'yyyy-MM-dd');
                  const avail = isDayAvailable(d);
                  const sel = selectedDate === dateStr;
                  return (
                    <button
                      key={dateStr}
                      disabled={!avail}
                      onClick={() => { setSelectedDate(dateStr); setSelectedSlot(null); }}
                      className={`rounded-lg py-2 text-xs transition-colors ${
                        sel
                          ? 'bg-accent text-white font-medium'
                          : avail
                          ? 'bg-bg-tertiary border border-border-light text-text-secondary hover:border-accent'
                          : 'text-[#2a3045] cursor-not-allowed'
                      }`}
                    >
                      {format(d, 'd')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slots */}
            {selectedDate && (
              <div className="bg-bg-secondary border border-border-light rounded-2xl p-4">
                <p className="text-xs text-text-faint mb-3">
                  {format(parseISO(selectedDate), 'EEEE, MMMM d')} · {slotsLoading ? 'Loading...' : `${slots.length} slots`}
                </p>
                {slotsLoading ? (
                  <div className="text-text-faint text-xs">Fetching available slots...</div>
                ) : slots.length === 0 ? (
                  <div className="text-text-faint text-xs">No slots available for this day.</div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map(slot => {
                      const sel = selectedSlot?.startUTC === slot.startUTC;
                      return (
                        <button
                          key={slot.startUTC}
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2 rounded-lg text-xs font-mono transition-colors ${
                            sel
                              ? 'bg-accent text-white'
                              : 'bg-bg-tertiary border border-border-light text-text-secondary hover:border-accent'
                          }`}
                        >
                          {slot.startLocal}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Booking form */}
            {selectedSlot && (
              <div className="bg-bg-secondary border border-[#3040a0] rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-medium text-text-primary">Confirm your booking</h2>
                  <button onClick={() => setSelectedSlot(null)} className="text-text-faint hover:text-text-muted text-xs">
                    ✕ Clear
                  </button>
                </div>

                <div className="bg-bg-tertiary border border-border-light rounded-lg px-3 py-2 mb-3 flex items-center gap-2 text-xs">
                  <span className="text-text-faint">⏰</span>
                  <span className="text-accent font-mono">
                    {selectedDate && format(parseISO(selectedDate), 'MMM d')} · {selectedSlot.startLocal} – {selectedSlot.endLocal}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-text-faint block mb-1">Your name *</label>
                    <input
                      type="text"
                      placeholder="Jane Smith"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-secondary placeholder-text-faint focus:border-accent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-text-faint block mb-1">Email address *</label>
                    <input
                      type="email"
                      placeholder="jane@example.com"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-secondary placeholder-text-faint focus:border-accent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-text-faint block mb-1">Reason for meeting *</label>
                    <textarea
                      placeholder="What would you like to discuss?"
                      value={form.reason}
                      onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                      rows={2}
                      className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-secondary placeholder-text-faint focus:border-accent transition-colors resize-none"
                    />
                  </div>
                </div>

                {error && <p className="text-danger text-xs mt-2">{error}</p>}

                <button
                  onClick={handleBook}
                  disabled={bookMutation.isPending || !form.name || !form.email || !form.reason}
                  className="mt-3 w-full bg-accent hover:bg-accent-hover text-white rounded-xl py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {bookMutation.isPending ? 'Confirming...' : 'Confirm booking'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
