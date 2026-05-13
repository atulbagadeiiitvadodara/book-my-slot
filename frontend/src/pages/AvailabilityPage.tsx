import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAvailability, saveAvailability } from '../api/availability';
import { useAuthStore } from '../store/authStore';
import { AvailabilityRecord } from '../types';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DURATIONS = [15, 30, 45, 60];
const TIMEZONES = [
  'Asia/Kolkata', 'America/New_York', 'America/Los_Angeles', 'America/Chicago',
  'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Singapore', 'Australia/Sydney',
  'UTC',
];

const DEFAULT_AVAIL: AvailabilityRecord = { weekday: 0, startTime: '09:00', endTime: '17:00', slotDuration: 30 };

export default function AvailabilityPage() {
  const { user, setUser } = useAuthStore();
  const qc = useQueryClient();
  const { data: existing, isLoading } = useQuery({ queryKey: ['availability'], queryFn: getAvailability });

  const [days, setDays] = useState<Record<number, AvailabilityRecord | null>>({});
  const [timezone, setTimezone] = useState(user?.timezone || 'Asia/Kolkata');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (existing) {
      const map: Record<number, AvailabilityRecord | null> = {};
      for (let i = 0; i < 7; i++) {
        const found = existing.find(a => a.weekday === i);
        map[i] = found || null;
      }
      setDays(map);
    }
  }, [existing]);

  const mutation = useMutation({
    mutationFn: saveAvailability,
    onSuccess: (data) => {
      qc.setQueryData(['availability'], data);
      if (user) setUser({ ...user, timezone });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const toggleDay = (idx: number) => {
    setDays(prev => ({
      ...prev,
      [idx]: prev[idx] ? null : { ...DEFAULT_AVAIL, weekday: idx },
    }));
  };

  const updateDay = (idx: number, field: keyof AvailabilityRecord, value: string | number) => {
    setDays(prev => {
      if (!prev[idx]) return prev;
      return { ...prev, [idx]: { ...prev[idx]!, [field]: value } };
    });
  };

  const handleSave = () => {
    const availability = Object.values(days).filter(Boolean) as AvailabilityRecord[];
    mutation.mutate({ availability, timezone });
  };

  if (isLoading) return (
    <div className="p-6">
      <div className="text-text-muted text-sm">Loading...</div>
    </div>
  );

  // Use the slot duration from the first active day, or default 30
  const firstActive = Object.values(days).find(Boolean);
  const globalDuration = firstActive?.slotDuration ?? 30;

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-medium text-text-primary">Availability</h1>
        <p className="text-sm text-text-faint mt-0.5">Set your weekly schedule for bookings.</p>
      </div>

      {/* Timezone + Duration */}
      <div className="bg-bg-secondary border border-border-light rounded-xl p-4 mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-text-faint block mb-1.5">Your timezone</label>
            <select
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-secondary focus:border-accent transition-colors"
            >
              {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-text-faint block mb-1.5">Default slot duration</label>
            <div className="flex gap-2">
              {DURATIONS.map(d => (
                <button
                  key={d}
                  onClick={() => {
                    Object.keys(days).forEach(idx => {
                      const i = Number(idx);
                      if (days[i]) updateDay(i, 'slotDuration', d);
                    });
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-mono transition-colors ${
                    globalDuration === d
                      ? 'bg-accent text-white'
                      : 'bg-bg-primary border border-border text-text-muted hover:border-accent'
                  }`}
                >
                  {d}m
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Days */}
      <div className="bg-bg-secondary border border-border-light rounded-xl overflow-hidden mb-4">
        {WEEKDAYS.map((name, idx) => {
          const a = days[idx];
          return (
            <div key={name} className={`flex items-center gap-4 px-4 py-3 ${idx < 6 ? 'border-b border-border-light' : ''}`}>
              {/* Toggle */}
              <button
                onClick={() => toggleDay(idx)}
                className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${a ? 'bg-accent' : 'bg-bg-tertiary border border-border'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow ${a ? 'right-0.5' : 'left-0.5'}`} />
              </button>

              <span className={`text-sm w-24 ${a ? 'text-text-secondary' : 'text-text-faint'}`}>{name}</span>

              {a ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={a.startTime}
                    onChange={e => updateDay(idx, 'startTime', e.target.value)}
                    className="bg-bg-primary border border-border rounded-lg px-3 py-1.5 text-sm text-text-secondary font-mono focus:border-accent transition-colors"
                  />
                  <span className="text-text-faint text-xs">to</span>
                  <input
                    type="time"
                    value={a.endTime}
                    onChange={e => updateDay(idx, 'endTime', e.target.value)}
                    className="bg-bg-primary border border-border rounded-lg px-3 py-1.5 text-sm text-text-secondary font-mono focus:border-accent transition-colors"
                  />
                </div>
              ) : (
                <span className="text-xs text-[#2a3045] flex-1">Unavailable</span>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={handleSave}
        disabled={mutation.isPending}
        className="bg-accent hover:bg-accent-hover text-white rounded-xl px-6 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
      >
        {mutation.isPending ? 'Saving...' : saved ? '✓ Saved!' : 'Save availability'}
      </button>

      {mutation.isError && (
        <p className="text-danger text-xs mt-2">Failed to save. Please try again.</p>
      )}
    </div>
  );
}
