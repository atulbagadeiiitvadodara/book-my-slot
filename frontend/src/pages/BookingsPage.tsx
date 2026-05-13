import { useQuery } from '@tanstack/react-query';
import { getBookings } from '../api/bookings';
import { useAuthStore } from '../store/authStore';
import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const STATUS_STYLES: Record<string, string> = {
  confirmed: 'bg-[#1e2a1e] border-[#2a4030] text-success',
  cancelled: 'bg-[#2a1e1e] border-[#4a2020] text-danger',
  completed: 'bg-[#1e2035] border-[#2a3060] text-[#7ac0f8]',
};

export default function BookingsPage() {
  const { user } = useAuthStore();
  const { data: bookings = [], isLoading } = useQuery({ queryKey: ['bookings'], queryFn: getBookings });

  if (isLoading) return <div className="p-6 text-text-muted text-sm">Loading...</div>;

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-medium text-text-primary">Bookings</h1>
        <p className="text-sm text-text-faint mt-0.5">{bookings.length} total bookings</p>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-bg-secondary border border-border-light rounded-xl p-8 text-center">
          <p className="text-text-muted text-sm">No bookings yet. Share your link to get started.</p>
        </div>
      ) : (
        <div className="bg-bg-secondary border border-border-light rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1.2fr_1fr_1fr_80px] text-[11px] text-text-faint px-4 py-2.5 border-b border-border-light bg-bg-primary uppercase tracking-wide">
            <span>Guest</span>
            <span>When</span>
            <span>Reason</span>
            <span>Status</span>
          </div>
          {bookings.map((b, i) => {
            const dt = toZonedTime(parseISO(b.startTimeUTC), user?.timezone || 'UTC');
            return (
              <div
                key={b._id}
                className={`grid grid-cols-[1.2fr_1fr_1fr_80px] px-4 py-3 text-sm ${
                  i < bookings.length - 1 ? 'border-b border-border-light' : ''
                }`}
              >
                <div>
                  <p className="text-text-secondary font-medium text-xs">{b.bookedByName}</p>
                  <p className="text-text-faint text-[11px]">{b.bookedByEmail}</p>
                </div>
                <div>
                  <p className="text-text-secondary text-xs font-mono">{format(dt, 'MMM d, yyyy')}</p>
                  <p className="text-text-faint text-[11px] font-mono">{format(dt, 'h:mm a')}</p>
                </div>
                <p className="text-text-muted text-xs truncate pr-2 self-center">{b.reason}</p>
                <div className="self-center">
                  <span className={`text-[10px] border rounded-md px-2 py-0.5 ${STATUS_STYLES[b.status]}`}>
                    {b.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
