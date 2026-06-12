'use client';

import { useQuery } from '@tanstack/react-query';
import { listPendingRequests } from '../api/requests.api';

export function usePendingRequests(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['requests', 'pending'],
    queryFn: listPendingRequests,
    enabled: options.enabled ?? true,
  });
}
