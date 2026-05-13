import api from './client';
import { User } from '../types';

export const getMe = async (): Promise<User> => {
  const { data } = await api.get('/auth/me');
  return data;
};

export const logout = async (): Promise<void> => {
  await api.post('/auth/logout');
};

export const getGoogleAuthUrl = (): string => {
  const base = import.meta.env.VITE_API_BASE_URL || '';
  return `${base}/auth/google`;
};
