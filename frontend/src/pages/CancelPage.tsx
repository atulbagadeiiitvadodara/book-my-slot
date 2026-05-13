import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getCancelBookingInfo, cancelBooking } from '../api/bookings';
import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { useState } from 'react';

export default function CancelPage() {
  const { token } = useParams<{ token: string }>();
  const [cancelled, setCancelled] = useState(false);

  const { data: booking, isLoading, error } = useQuery({
    queryKey: ['cancel-info', token],
    queryFn: () => getCancelBookingInfo(token!),
    enabled: !!token,
  });

  const mutation = useMutation({
    mutationFn: () => cancelBooking(token!),
    onSuccess: () => setCancelled(true),
  });

  if (isLoading) return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="text-text-muted text-sm">Loading...</div>
    </div>
  );

  if (error || !booking) return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="text-center">
        <p className="text-text-primary text-lg font-medium mb-2">Booking not found</p>
        <p className="text-text-muted text-sm">This cancellation link is invalid or expired.</p>
      </div>
    </div>
  );

  const dt = toZonedTime(parseISO(booking.startTimeUTC), booking.timezone);

  if (cancelled) return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="bg-bg-secondary border border-border rounded-2xl p-8 max-w-sm w-full text-center">
        <div className="w-12 h-12 bg-[#2a1e1e] border border-[#4a2020] rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-danger text-xl">✕</span>
        </div>
        <h2 className="text-lg font-medium text-text-primary mb-2">Booking cancelled</h2>
        <p className="text-sm text-text-muted leading-relaxed">
          Your booking with <strong className="text-text-secondary">{booking.ownerName}</strong> has been cancelled.
          The slot is now available again.
        </p>
        <p className="text-xs text-text-faint mt-3">Both parties have been notified via email.</p>
      </div>
    </div>
  );

  if (booking.status === 'cancelled') return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="bg-bg-secondary border border-border rounded-2xl p-8 max-w-sm w-full text-center">
        <p className="text-text-primary font-medium mb-2">Already cancelled</p>
        <p className="text-sm text-text-muted">This booking was already cancelled.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-6">
          <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center text-white font-mono font-bold text-xs">S</div>
          <span className="font-medium text-text-secondary text-sm">BookMySlot</span>
        </div>

        <div className="bg-bg-secondary border border-border rounded-2xl p-6">
          <h1 className="text-lg font-medium text-text-primary mb-1">Cancel booking</h1>
          <p className="text-sm text-text-muted mb-5">Are you sure you want to cancel this meeting?</p>

          <div className="bg-bg-tertiary border border-border-light rounded-xl p-4 mb-5">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-faint text-xs">With</span>
                <span className="text-text-secondary text-xs font-medium">{booking.ownerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-faint text-xs">Booked by</span>
                <span className="text-text-secondary text-xs">{booking.bookedByName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-faint text-xs">Date</span>
                <span className="text-text-secondary text-xs font-mono">{format(dt, 'MMM d, yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-faint text-xs">Time</span>
                <span className="text-text-secondary text-xs font-mono">{format(dt, 'h:mm a')}</span>
              </div>
            </div>
          </div>

          {mutation.isError && (
            <p className="text-danger text-xs mb-3">Failed to cancel. Please try again.</p>
          )}

          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="w-full bg-danger hover:bg-red-700 text-white rounded-xl py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {mutation.isPending ? 'Cancelling...' : 'Yes, cancel this booking'}
          </button>

          <p className="text-center text-xs text-text-faint mt-3">
            Both you and {booking.ownerName} will be notified by email.
          </p>
        </div>
      </div>
    </div>
  );
}
