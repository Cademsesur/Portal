'use client';

import { useQuery } from '@tanstack/react-query';
import { getMySignature } from '@/features/profile/api/signature.api';

/** Indique si l'utilisateur courant a enregistré une signature. */
export function useHasSignature(enabled = true) {
  return useQuery({
    queryKey: ['users', 'me', 'has-signature'],
    queryFn: async () => (await getMySignature()) !== null,
    enabled,
    staleTime: 60_000,
  });
}
