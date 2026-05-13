import api from './client';
import { AvailabilityRecord } from '../types';

export const getAvailability = async (): Promise<AvailabilityRecord[]> => {
  const { data } = await api.get('/availability');
  return data;
};

export const saveAvailability = async (payload: {
  availability: AvailabilityRecord[];
  timezone: string;
}): Promise<AvailabilityRecord[]> => {
  const { data } = await api.put('/availability', payload);
  return data;
};
