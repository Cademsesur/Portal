'use client';

import { useQuery } from '@tanstack/react-query';
import { getDocumentAvailability } from '../api/requests.api';

export function useDocumentAvailability(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ['document-availability', id],
    queryFn: () => getDocumentAvailability(id),
    enabled,
    staleTime: 30_000,
  });
}
