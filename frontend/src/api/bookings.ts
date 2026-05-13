import api from './client';
import { Booking, Slot } from '../types';

export const getBookings = async (): Promise<Booking[]> => {
  const { data } = await api.get('/bookings');
  return data;
};

export const createBooking = async (payload: {
  ownerSlug: string;
  bookedByName: string;
  bookedByEmail: string;
  reason: string;
  startTimeUTC: string;
  endTimeUTC: string;
  timezone: string;
}): Promise<{ message: string; bookingId: string }> => {
  const { data } = await api.post('/bookings', payload);
  return data;
};

export const cancelBooking = async (token: string): Promise<{ message: string }> => {
  const { data } = await api.patch(`/bookings/${token}/cancel`);
  return data;
};

export const getCancelBookingInfo = async (token: string) => {
  const { data } = await api.get(`/bookings/cancel/${token}`);
  return data;
};

export const getPublicProfile = async (slug: string) => {
  const { data } = await api.get(`/u/${slug}`);
  return data;
};

export const getSlots = async (slug: string, date: string, timezone: string): Promise<Slot[]> => {
  const { data } = await api.get(`/u/${slug}/slots`, { params: { date, timezone } });
  return data;
};
