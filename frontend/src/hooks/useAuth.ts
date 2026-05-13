import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { getMe } from '../api/auth';

export function useAuth() {
  const { user, isLoading, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return { user, isLoading };
}
