'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchCurrentUser } from '../api/auth.api';

export function useCurrentUser() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
