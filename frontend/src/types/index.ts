export interface User {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  timezone: string;
  publicSlug: string;
  calendarConnected: boolean;
  calendarEmail?: string;
}

export interface AvailabilityRecord {
  _id?: string;
  weekday: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
}

export interface Booking {
  _id: string;
  bookedByName: string;
  bookedByEmail: string;
  reason: string;
  startTimeUTC: string;
  endTimeUTC: string;
  timezone: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  cancelToken: string;
  createdAt: string;
}

export interface Slot {
  startUTC: string;
  endUTC: string;
  startLocal: string;
  endLocal: string;
  duration: number;
}

export interface PublicProfile {
  name: string;
  avatar: string;
  slug: string;
  timezone: string;
  availability: {
    weekday: number;
    startTime: string;
    endTime: string;
    slotDuration: number;
  }[];
}
